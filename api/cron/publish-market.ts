import { createClient } from '@supabase/supabase-js'

type Request = { method?: string; headers?: Record<string, string | string[] | undefined> }
type Response = { status: (code: number) => { json: (body: unknown) => unknown } }
const sendJson = (res: Response, code: number, body: unknown) => res.status(code).json(body)

const opportunities = [
  { title: 'Veylora Operating Desk: TAZ OTC buy-side discovery', quantity: '1,000-2,500 TAZ', description: 'A recurring testnet-only RFQ published by the Veylora Operating Desk to discover counterparties interested in a TAZ buy-side quote. This is an operator-posted market discovery request, not an external customer order, escrow commitment, or guaranteed trade. Responders may submit sealed quotes with a valid Zcash testnet transparent settlement address. No mainnet assets or real funds are involved.' },
  { title: 'Veylora Operating Desk: TAZ OTC sell-side discovery', quantity: '1,000-2,500 TAZ', description: 'A recurring testnet-only RFQ published by the Veylora Operating Desk to discover counterparties interested in a TAZ sell-side quote. This is an operator-posted market discovery request, not an external customer order, escrow commitment, or guaranteed trade. Responders may submit sealed quotes with a valid Zcash testnet transparent settlement address. No mainnet assets or real funds are involved.' },
  { title: 'Veylora Operating Desk: larger TAZ OTC buy-side quote', quantity: '2,500-5,000 TAZ', description: 'A recurring testnet-only RFQ from the Veylora Operating Desk seeking sealed buy-side quotes for a larger TAZ testnet amount. This is a genuine operator-run market discovery exercise, not an external customer order, escrow commitment, or guaranteed trade. Settlement must be independently verified on Zcash testnet before completion. No mainnet assets or real funds are involved.' },
  { title: 'Veylora Operating Desk: larger TAZ OTC sell-side quote', quantity: '2,500-5,000 TAZ', description: 'A recurring testnet-only RFQ from the Veylora Operating Desk seeking sealed sell-side quotes for a larger TAZ testnet amount. This is a genuine operator-run market discovery exercise, not an external customer order, inventory guarantee, or guaranteed trade. Settlement must be independently verified on Zcash testnet before completion. No mainnet assets or real funds are involved.' }
]

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') return sendJson(res, 405, { ok: false, error: 'Use GET.' })
  const secret = process.env.CRON_SECRET
  const auth = req.headers?.authorization
  const supplied = Array.isArray(auth) ? auth[0] : auth
  if (!secret || supplied !== `Bearer ${secret}`) return sendJson(res, 401, { ok: false, error: 'Unauthorized.' })
  const ownerId = process.env.VEYLORA_PUBLISHER_USER_ID
  if (!ownerId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(ownerId)) {
    return sendJson(res, 503, { ok: false, error: 'Publisher identity is not configured.' })
  }
  try {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Server-side market operations are not configured.')
    const now = new Date()
    const slotMs = 30 * 60 * 1000
    const slot = new Date(Math.floor(now.getTime() / slotMs) * slotMs)
    const slotNumber = Math.floor(slot.getTime() / slotMs)
    const item = opportunities[((slotNumber % opportunities.length) + opportunities.length) % opportunities.length]
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data, error } = await db.rpc('publish_market_slot', {
      p_slot_start: slot.toISOString(),
      p_owner_id: ownerId,
      p_title: item.title,
      p_description: item.description,
      p_quantity: item.quantity,
      p_closes_at: new Date(slot.getTime() + 2 * 60 * 60 * 1000).toISOString()
    })
    if (error) throw new Error(error.message)
    return sendJson(res, 200, { ok: true, marketId: data, slot: slot.toISOString(), note: 'Operator-posted Zcash testnet RFQ. No escrow, external customer demand, or completed trade is implied.' })
  } catch (error) {
    return sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : 'Market publishing failed.' })
  }
}
