import { allowRequest, BlockchainInfo, clientKey, errorResponse, sendJson, zcashRpc } from '../../server/zcash-rpc.js'

export default async function handler(req: { method?: string; headers?: Record<string, string | string[] | undefined> }, res: { status: (code: number) => { json: (body: unknown) => unknown } }) {
  if (req.method !== 'GET') return sendJson(res, 405, { ok: false, error: 'Use GET.' })
  if (!allowRequest(clientKey(req.headers), 30)) return sendJson(res, 429, { ok: false, error: 'Too many testnet status checks. Try again shortly.' })
  try {
    const info = await zcashRpc<BlockchainInfo>('getblockchaininfo')
    if (info.chain !== 'test') return sendJson(res, 503, { ok: false, network: info.chain ?? 'unknown', error: 'Configured node did not identify itself as Zcash testnet. Verification is disabled.' })
    const synced = info.initial_block_download_complete === true || info.initialblockdownload === false
    return sendJson(res, 200, {
      ok: true,
      network: 'testnet',
      chain: info.chain,
      blocks: typeof info.blocks === 'number' ? info.blocks : null,
      headers: typeof info.headers === 'number' ? info.headers : null,
      synced,
      checkedAt: new Date().toISOString(),
    })
  } catch (error) {
    const result = errorResponse(error)
    return sendJson(res, result.status, { ok: false, network: 'testnet', error: result.message })
  }
}
