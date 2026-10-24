import { allowRequest, clientKey } from '../../server/zcash-rpc'
import { authenticatedUser, bearerToken, hasVerifiedTestnetWallet, sendJson, serviceClient, SupabaseConfigurationError, SupabaseRequestError } from '../../server/supabase'

type Request = { method?: string; body?: unknown; headers?: Record<string, string | string[] | undefined> }
type Response = { status: (code: number) => { json: (body: unknown) => unknown } }

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'Use POST.' })
  if (!allowRequest(clientKey(req.headers), 10)) return sendJson(res, 429, { ok: false, error: 'Too many completion attempts. Try again shortly.' })
  const body = req.body && typeof req.body === 'object' ? req.body as Record<string, unknown> : {}
  const marketId = typeof body.marketId === 'string' ? body.marketId.trim() : ''
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(marketId)) return sendJson(res, 400, { ok: false, error: 'A valid market ID is required.' })
  const token = bearerToken(req.headers)
  if (!token) return sendJson(res, 401, { ok: false, error: 'Sign in as the market owner to complete the trade.' })
  try {
    const db = serviceClient()
    const user = await authenticatedUser(db, token)
    if (!(await hasVerifiedTestnetWallet(db, user.id))) return sendJson(res, 403, { ok: false, error: 'A verified Zcash testnet wallet is required to confirm completion.' })
    const marketResult = await db.from('markets').select('id,owner_id,status').eq('id', marketId).maybeSingle()
    if (marketResult.error) throw new Error('Could not load the market.')
    const market = marketResult.data
    if (!market) return sendJson(res, 404, { ok: false, error: 'Market not found.' })
    if (market.owner_id !== user.id) return sendJson(res, 403, { ok: false, error: 'Only the market owner can confirm trade completion.' })
    if (market.status === 'completed') return sendJson(res, 200, { ok: true, status: 'completed', idempotent: true })
    if (market.status !== 'settlement_confirmed') return sendJson(res, 409, { ok: false, error: 'Trade cannot be completed until the payment is independently confirmed.' })
    const settlement = await db.from('settlements').select('status,network,txid').eq('market_id', marketId).maybeSingle()
    if (settlement.error) throw new Error('Could not load settlement evidence.')
    if (!settlement.data || settlement.data.status !== 'confirmed' || settlement.data.network !== 'zcash-testnet' || !settlement.data.txid) return sendJson(res, 409, { ok: false, error: 'Confirmed testnet settlement evidence is required before completion.' })
    const changed = await db.from('markets').update({ status: 'completed' }).eq('id', marketId).eq('status', 'settlement_confirmed').select('id,status').maybeSingle()
    if (changed.error) throw new Error('Could not record trade completion.')
    if (!changed.data) return sendJson(res, 409, { ok: false, error: 'Market state changed concurrently. Refresh before trying again.' })
    return sendJson(res, 200, { ok: true, marketId, status: 'completed', txid: settlement.data.txid, note: 'Completion was recorded after testnet confirmation and owner acknowledgement.' })
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) return sendJson(res, 503, { ok: false, error: error.message })
    if (error instanceof SupabaseRequestError) return sendJson(res, 401, { ok: false, error: error.message })
    return sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : 'Trade completion failed.' })
  }
}
