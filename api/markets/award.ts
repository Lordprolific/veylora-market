import { allowRequest, clientKey } from '../_lib/zcash-rpc'
import { authenticatedUser, bearerToken, sendJson, serviceClient, SupabaseConfigurationError, SupabaseRequestError } from '../_lib/supabase'

type Request = { method?: string; body?: unknown; headers?: Record<string, string | string[] | undefined> }
type Response = { status: (code: number) => { json: (body: unknown) => unknown } }

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'Use POST.' })
  if (!allowRequest(clientKey(req.headers), 10)) return sendJson(res, 429, { ok: false, error: 'Too many award attempts. Try again shortly.' })
  const body = req.body && typeof req.body === 'object' ? req.body as Record<string, unknown> : {}
  const marketId = typeof body.marketId === 'string' ? body.marketId.trim() : ''
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(marketId)) {
    return sendJson(res, 400, { ok: false, error: 'A valid market ID is required.' })
  }
  const token = bearerToken(req.headers)
  if (!token) return sendJson(res, 401, { ok: false, error: 'Sign in as the market owner to close and award this request.' })
  try {
    const db = serviceClient()
    const user = await authenticatedUser(db, token)
    const marketResult = await db.from('markets').select('id,owner_id,closes_at,status,winner_bid_id').eq('id', marketId).maybeSingle()
    if (marketResult.error) throw new Error('Could not load the market record.')
    const market = marketResult.data
    if (!market) return sendJson(res, 404, { ok: false, error: 'Market not found.' })
    if (market.owner_id !== user.id) return sendJson(res, 403, { ok: false, error: 'Only the market owner can close and award this request.' })
    if (market.status !== 'open') return sendJson(res, 409, { ok: false, error: 'This market is no longer open.', status: market.status, winnerBidId: market.winner_bid_id })
    if (new Date(market.closes_at).getTime() > Date.now()) return sendJson(res, 409, { ok: false, error: 'The market deadline has not passed yet.' })

    const bidsResult = await db.from('bids').select('id,amount,committed_at,settlement_address').eq('market_id', marketId).not('settlement_address', 'is', null).order('amount', { ascending: true }).order('committed_at', { ascending: true }).limit(1)
    if (bidsResult.error) throw new Error('Could not evaluate eligible offers.')
    const winner = bidsResult.data?.[0] ?? null
    const nextStatus = winner ? 'awarded' : 'closed'
    const update = await db.from('markets').update({ status: nextStatus, winner_bid_id: winner?.id ?? null }).eq('id', marketId).eq('status', 'open').select('id,status,winner_bid_id').maybeSingle()
    if (update.error) throw new Error('Market state could not be committed.')
    if (!update.data) return sendJson(res, 409, { ok: false, error: 'Another request changed this market. Refresh before trying again.' })
    return sendJson(res, 200, { ok: true, marketId, status: update.data.status, winnerBidId: update.data.winner_bid_id, winningAmount: winner ? Number(winner.amount) : null, rule: 'lowest_amount_then_earliest_commit', note: 'This award is server-side. Payment and completion remain separate settlement states.' })
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) return sendJson(res, 503, { ok: false, error: error.message })
    if (error instanceof SupabaseRequestError) return sendJson(res, 401, { ok: false, error: error.message })
    return sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : 'Market award failed.' })
  }
}
