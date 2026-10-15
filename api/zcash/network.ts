import { BlockchainInfo, errorResponse, sendJson, zcashRpc } from '../_lib/zcash-rpc'

export default async function handler(req: { method?: string }, res: { status: (code: number) => { json: (body: unknown) => unknown } }) {
  if (req.method !== 'GET') return sendJson(res, 405, { ok: false, error: 'Use GET.' })
  try {
    const info = await zcashRpc<BlockchainInfo>('getblockchaininfo')
    if (info.chain !== 'test') return sendJson(res, 503, { ok: false, network: info.chain ?? 'unknown', error: 'Configured node did not identify itself as Zcash testnet. Verification is disabled.' })
    return sendJson(res, 200, {
      ok: true,
      network: 'testnet',
      chain: info.chain,
      blocks: typeof info.blocks === 'number' ? info.blocks : null,
      headers: typeof info.headers === 'number' ? info.headers : null,
      synced: info.initial_block_download_complete === true,
      checkedAt: new Date().toISOString(),
    })
  } catch (error) {
    const result = errorResponse(error)
    return sendJson(res, result.status, { ok: false, network: 'testnet', error: result.message })
  }
}
