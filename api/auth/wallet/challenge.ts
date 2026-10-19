import { randomBytes, createHash } from 'node:crypto'
import { allowRequest, clientKey } from '../../../server/zcash-rpc.js'
import { authenticatedUser, bearerToken, sendJson, serviceClient, SupabaseConfigurationError, SupabaseRequestError } from '../../../server/supabase.js'

type Request = { method?: string; body?: unknown; headers?: Record<string, string | string[] | undefined> }
type Response = { status: (code: number) => { json: (body: unknown) => unknown } }

function header(headers: Request['headers'], name: string): string | null {
  const value = headers?.[name]
  return (Array.isArray(value) ? value[0] : value) ?? null
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'Use POST.' })
  if (!allowRequest(clientKey(req.headers), 8)) return sendJson(res, 429, { ok: false, error: 'Too many wallet sign-in attempts. Try again shortly.' })
  const token = bearerToken(req.headers)
  if (!token) return sendJson(res, 401, { ok: false, error: 'A Supabase session is required to begin wallet sign-in.' })

  const origin = header(req.headers, 'origin')
  const host = header(req.headers, 'host')
  if (!origin || !host) return sendJson(res, 400, { ok: false, error: 'A same-origin browser request is required.' })
  try {
    const parsedOrigin = new URL(origin)
    if (parsedOrigin.host.toLowerCase() !== host.toLowerCase() || !['https:', 'http:'].includes(parsedOrigin.protocol)) {
      return sendJson(res, 403, { ok: false, error: 'Wallet sign-in origin did not match this site.' })
    }
    const db = serviceClient()
    const user = await authenticatedUser(db, token)
    // Opportunistically remove expired challenges to prevent stale rows accumulating.
    await db.from('wallet_auth_challenges').delete().lt('expires_at', new Date().toISOString())
    const nonce = randomBytes(32).toString('hex')
    const id = randomBytes(16).toString('hex')
    const message = [
      'Veylora Market wallet sign-in',
      'This signature proves control of a Noir Wallet identity. It does not authorize a payment.',
      'Origin: ' + parsedOrigin.origin,
      'Account: ' + user.id,
      'Challenge: ' + id,
      'Nonce: ' + nonce,
      'Issued at: ' + new Date().toISOString(),
      'Expires in: 5 minutes',
    ].join('\n')
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
    const saved = await db.from('wallet_auth_challenges').insert({
      id,
      user_id: user.id,
      message,
      nonce_hash: createHash('sha256').update(nonce).digest('hex'),
      expires_at: expiresAt,
    })
    if (saved.error) throw new Error('Could not create a wallet sign-in challenge. Apply the wallet-auth migration and retry.')
    return sendJson(res, 200, { ok: true, challengeId: id, message, expiresAt })
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) return sendJson(res, 503, { ok: false, error: error.message })
    if (error instanceof SupabaseRequestError) return sendJson(res, 401, { ok: false, error: error.message })
    return sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : 'Could not create wallet sign-in challenge.' })
  }
}
