import { allowRequest, clientKey, errorResponse, RpcOutput, RpcTransaction, sendJson as sendRpcJson, zcashRpc } from '../_lib/zcash-rpc'
import { authenticatedUser, bearerToken, sendJson, serviceClient, SupabaseConfigurationError, SupabaseRequestError } from '../_lib/supabase'

type Request = { method?: string; body?: unknown; headers?: Record<string, string | string[] | undefined> }
type Response = { status: (code: number) => { json: (body: unknown) => unknown } }

function outputAddresses(output: RpcOutput): string[] {
  const script = output.scriptPubKey
  if (!script) return []
  return [...(script.address ? [script.address] : []), ...(Array.isArray(script.addresses) ? script.addresses : [])]
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'Use POST.' })
  if (!allowRequest(clientKey(req.headers), 8)) return sendJson(res, 429, { ok: false, error: 'Too many settlement attempts. Try again shortly.' })
  const body = req.body && typeof req.body === 'object' ? req.body as Record<string, unknown> : {}
  const marketId = typeof body.marketId === 'string' ? body.marketId.trim() : ''
  const txid = typeof body.txid === 'string' ? body.txid.trim() : ''
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(marketId) || !/^[0-9a-fA-F]{64}$/.test(txid)) {
    return sendJson(res, 400, { ok: false, error: 'Provide a valid market ID and 64-character transaction ID.' })
  }
  const token = bearerToken(req.headers)
  if (!token) return sendJson(res, 401, { ok: false, error: 'Sign in as the market owner to submit settlement evidence.' })
  try {
    const db = serviceClient()
    const user = await authenticatedUser(db, token)
    const marketResult = await db.from('markets').select('id,owner_id,status,winner_bid_id').eq('id', marketId).maybeSingle()
    if (marketResult.error) throw new Error('Could not load the market.')
    const market = marketResult.data
    if (!market) return sendJson(res, 404, { ok: false, error: 'Market not found.' })
    if (market.owner_id !== user.id) return sendJson(res, 403, { ok: false, error: 'Only the market owner can submit payment evidence.' })
    if (!market.winner_bid_id || !['awarded', 'settlement_submitted'].includes(market.status)) {
      if (['settlement_confirmed', 'completed'].includes(market.status)) return sendJson(res, 200, { ok: true, verified: true, status: market.status, idempotent: true, message: 'Settlement was already confirmed.' })
      return sendJson(res, 409, { ok: false, error: 'Award the market before submitting settlement evidence.' })
    }
    const bidResult = await db.from('bids').select('id,bidder_id,amount,settlement_address').eq('id', market.winner_bid_id).eq('market_id', marketId).maybeSingle()
    if (bidResult.error) throw new Error('Could not load the winning offer.')
    const bid = bidResult.data
    if (!bid || typeof bid.settlement_address !== 'string' || !/^(tm|t2)[a-km-zA-HJ-NP-Z1-9]{25,40}$/.test(bid.settlement_address)) {
      return sendJson(res, 409, { ok: false, error: 'The winning offer has no valid transparent Zcash testnet recipient. Existing offers need to be resubmitted with a testnet address before settlement.' })
    }
    const info = await zcashRpc<{ chain?: string; initial_block_download_complete?: boolean }>('getblockchaininfo')
    if (info.chain !== 'test' || info.initial_block_download_complete !== true) return sendJson(res, 503, { ok: false, verified: false, error: 'Configured node must identify as Zcash testnet and report initial block download complete.' })
    let tx: RpcTransaction
    try {
      tx = await zcashRpc<RpcTransaction>('getrawtransaction', [txid, 1])
    } catch {
      return sendJson(res, 404, { ok: false, verified: false, state: 'not_found', error: 'The configured node could not find this transaction. No settlement status was changed.' })
    }
    if (!tx.txid || tx.txid.toLowerCase() !== txid.toLowerCase()) return sendJson(res, 502, { ok: false, verified: false, error: 'Node response did not match the requested transaction ID.' })
    const confirmations = typeof tx.confirmations === 'number' ? tx.confirmations : 0
    if (confirmations < 0) return sendJson(res, 409, { ok: false, verified: false, state: 'not_confirmed', error: 'Transaction is not in the active best chain. No settlement status was changed.' })
    const outputs = Array.isArray(tx.vout) ? tx.vout : []
    const addressMatched = outputs.some(output => outputAddresses(output).includes(bid.settlement_address))
    const amountMatched = outputs.some(output => outputAddresses(output).includes(bid.settlement_address) && typeof output.value === 'number' && Math.abs(output.value - Number(bid.amount)) < 0.000000005)
    const verified = addressMatched && amountMatched && confirmations >= 3
    const state = verified ? 'confirmed' : confirmations < 3 ? 'submitted' : 'failed'
    const checkedAt = new Date().toISOString()
    const evidence = { state, confirmations, requiredConfirmations: 3, recipientMatched: addressMatched, amountMatched, checkedAt, verifier: 'zcash-testnet-transparent-output' }
    const saved = await db.from('settlements').upsert({
      market_id: marketId,
      status: state,
      network: 'zcash-testnet',
      txid,
      submitted_at: checkedAt,
      confirmed_at: verified ? checkedAt : null,
      evidence,
    }, { onConflict: 'market_id' })
    if (saved.error) throw new Error('Settlement evidence could not be saved.')
    if (verified) {
      const changed = await db.from('markets').update({ status: 'settlement_confirmed' }).eq('id', marketId).in('status', ['awarded', 'settlement_submitted'])
      if (changed.error) throw new Error('Payment verified, but market status could not be updated. Retry the request.')
    } else if (confirmations < 3) {
      const changed = await db.from('markets').update({ status: 'settlement_submitted' }).eq('id', marketId).eq('status', 'awarded')
      if (changed.error) throw new Error('Payment evidence saved, but market status could not be updated.')
    }
    return sendJson(res, 200, { ok: true, verified, marketId, txid, state, status: verified ? 'settlement_confirmed' : state === 'submitted' ? 'settlement_submitted' : 'awarded', confirmations, requiredConfirmations: 3, recipientMatched: addressMatched, amountMatched, message: verified ? 'Matching transparent testnet payment confirmed. Trade completion still requires owner confirmation.' : state === 'submitted' ? 'Transaction found but it has not reached three confirmations or the payment conditions do not yet match.' : 'Confirmed transaction does not match the winning offer recipient and amount. Market is not marked confirmed.', note: 'Transparent outputs only. This does not verify shielded payments or recipient ownership.' })
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) return sendJson(res, 503, { ok: false, error: error.message })
    if (error instanceof SupabaseRequestError) return sendJson(res, 401, { ok: false, error: error.message })
    const result = errorResponse(error)
    if (result.status !== 500) return sendRpcJson(res, result.status, { ok: false, error: result.message })
    return sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : 'Settlement verification failed.' })
  }
}
