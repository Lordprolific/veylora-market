import { verifyMessageSignature } from '@noir-wallet/sdk'
import { allowRequest, clientKey } from '../../../server/zcash-rpc.js'
import { authenticatedUser, bearerToken, sendJson, serviceClient, SupabaseConfigurationError, SupabaseRequestError } from '../../../server/supabase.js'

type Request = { method?: string; body?: unknown; headers?: Record<string, string | string[] | undefined> }
type Response = { status: (code: number) => { json: (body: unknown) => unknown } }

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'Use POST.' })
  if (!allowRequest(clientKey(req.headers), 8)) return sendJson(res, 429, { ok: false, error: 'Too many wallet verification attempts. Try again shortly.' })
  const token = bearerToken(req.headers)
  if (!token) return sendJson(res, 401, { ok: false, error: 'A Supabase session is required to verify a wallet.' })
  const body = req.body && typeof req.body === 'object' ? req.body as Record<string, unknown> : {}
  const challengeId = typeof body.challengeId === 'string' ? body.challengeId.trim() : ''
  const signature = typeof body.signature === 'string' ? body.signature : ''
  const pubkey = typeof body.pubkey === 'string' ? body.pubkey : ''
  const address = typeof body.address === 'string' ? body.address : ''
  if (!/^[0-9a-f]{32}$/i.test(challengeId) || !/^[0-9a-f]{130}$/i.test(signature.replace(/^0x/i, '')) || !/^(02|03|04)[0-9a-f]{64,128}$/i.test(pubkey.replace(/^0x/i, '')) || !address) {
    return sendJson(res, 400, { ok: false, error: 'A valid challenge, Noir Wallet signature, public key, and identity address are required.' })
  }
  const network = /^(tm|t2)/.test(address) ? 'testnet' : /^(t1|t3)/.test(address) ? 'mainnet' : null
  if (!network) return sendJson(res, 400, { ok: false, error: 'The signed Noir Wallet identity address did not match a supported transparent identity format.' })

  try {
    const db = serviceClient()
    const user = await authenticatedUser(db, token)
    const challengeResult = await db.from('wallet_auth_challenges')
      .select('id,user_id,message,expires_at')
      .eq('id', challengeId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (challengeResult.error) throw new Error('Could not load the wallet sign-in challenge.')
    const challenge = challengeResult.data
    if (!challenge || new Date(challenge.expires_at).getTime() <= Date.now()) {
      return sendJson(res, 401, { ok: false, error: 'Wallet sign-in challenge expired or was already used. Try connecting again.' })
    }
    const verified = verifyMessageSignature({
      message: challenge.message,
      signature,
      pubkey,
      address,
      network,
    })
    if (!verified.valid || !verified.addressMatch || !verified.pubkeyMatch) {
      return sendJson(res, 401, { ok: false, error: 'Noir Wallet signature could not be verified. No wallet identity was linked.' })
    }

    // Consume the challenge atomically. Concurrent replay attempts cannot both succeed.
    const consumed = await db.from('wallet_auth_challenges')
      .delete()
      .eq('id', challengeId)
      .eq('user_id', user.id)
      .gt('expires_at', new Date().toISOString())
      .select('id')
      .maybeSingle()
    if (consumed.error) throw new Error('Could not consume the wallet sign-in challenge.')
    if (!consumed.data) return sendJson(res, 401, { ok: false, error: 'Wallet sign-in challenge expired or was already used. Try again.' })

    const existing = await db.from('wallet_identities').select('user_id').eq('identity_address', address).maybeSingle()
    if (existing.error) throw new Error('Could not check whether this wallet identity is already linked.')
    if (existing.data && existing.data.user_id !== user.id) {
      return sendJson(res, 409, { ok: false, error: 'This Noir Wallet identity is already linked to another Veylora account.' })
    }
    const saved = await db.from('wallet_identities').upsert({
      user_id: user.id,
      identity_address: address,
      network,
      verified_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    if (saved.error) {
      if (saved.error.code === '23505') return sendJson(res, 409, { ok: false, error: 'This Noir Wallet identity is already linked to another Veylora account.' })
      throw new Error('Wallet signature was valid, but the identity could not be saved.')
    }
    return sendJson(res, 200, { ok: true, identityAddress: address, network, verifiedAt: new Date().toISOString(), message: 'Noir Wallet identity verified. Wallet access is now linked to this Veylora session.' })
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) return sendJson(res, 503, { ok: false, error: error.message })
    if (error instanceof SupabaseRequestError) return sendJson(res, 401, { ok: false, error: error.message })
    return sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : 'Wallet signature verification failed.' })
  }
}
