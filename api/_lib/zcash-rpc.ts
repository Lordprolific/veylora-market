type RpcResponse<T> = { result?: T; error?: { code?: number; message?: string } | null }

export type RpcOutput = {
  value?: number
  n?: number
  scriptPubKey?: { address?: string; addresses?: string[] }
}
export type RpcTransaction = {
  txid?: string
  confirmations?: number
  blockhash?: string
  vout?: RpcOutput[]
}
export type BlockchainInfo = { chain?: string; blocks?: number; headers?: number; initial_block_download_complete?: boolean }

export class RpcConfigurationError extends Error {}
export class RpcRequestError extends Error {}\n\nconst requestBuckets = new Map<string, { startedAt: number; count: number }>()\n\n/** Best-effort per-instance throttle; deploy a durable edge/API rate limit before public beta. */\nexport function allowRequest(key: string, limit = 20, windowMs = 60_000): boolean {\n  const now = Date.now()\n  const current = requestBuckets.get(key)\n  if (!current || now - current.startedAt >= windowMs) {\n    requestBuckets.set(key, { startedAt: now, count: 1 })\n    if (requestBuckets.size > 1000) {\n      for (const [bucketKey, bucket] of requestBuckets) if (now - bucket.startedAt >= windowMs) requestBuckets.delete(bucketKey)\n    }\n    return true\n  }\n  if (current.count >= limit) return false\n  current.count += 1\n  return true\n}\n\nexport function clientKey(headers?: Record<string, string | string[] | undefined>): string {\n  const forwarded = headers?.['x-forwarded-for']\n  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded\n  return (value?.split(',')[0]?.trim() || 'unknown').slice(0, 80)\n}

function config() {
  const url = process.env.ZCASH_RPC_URL
  const username = process.env.ZCASH_RPC_USER
  const password = process.env.ZCASH_RPC_PASSWORD
  const network = process.env.ZCASH_NETWORK ?? 'testnet'
  if (network !== 'testnet') throw new RpcConfigurationError('Only Zcash testnet is enabled by this beta adapter.')
  if (!url || !username || !password) throw new RpcConfigurationError('Zcash testnet RPC is not configured on the server.')
  let parsed: URL
  try { parsed = new URL(url) } catch { throw new RpcConfigurationError('ZCASH_RPC_URL must be a valid URL.') }
  if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
    throw new RpcConfigurationError('Remote Zcash RPC must use HTTPS.')
  }
  return { url: parsed.toString(), username, password }
}

export async function zcashRpc<T>(method: string, params: unknown[] = []): Promise<T> {
  const c = config()
  const auth = Buffer.from(c.username + ':' + c.password).toString('base64')
  let response: Response
  try {
    response = await fetch(c.url, {
      method: 'POST',
      headers: { authorization: 'Basic ' + auth, 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '1.0', id: 'veylora-testnet', method, params }),
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    })
  } catch {
    throw new RpcRequestError('Could not reach the configured Zcash testnet node.')
  }
  if (!response.ok) throw new RpcRequestError('Zcash node returned HTTP ' + response.status + '.')
  let payload: RpcResponse<T>
  try { payload = await response.json() as RpcResponse<T> } catch { throw new RpcRequestError('Zcash node returned an unreadable response.') }
  if (payload.error) throw new RpcRequestError(payload.error.message || 'Zcash RPC request failed.')
  if (payload.result === undefined) throw new RpcRequestError('Zcash node returned no result.')
  return payload.result
}

export function sendJson(res: { status: (code: number) => { json: (body: unknown) => unknown } }, code: number, body: unknown) {
  return res.status(code).json(body)
}

export function errorResponse(error: unknown) {
  if (error instanceof RpcConfigurationError) return { status: 503, message: error.message }
  if (error instanceof RpcRequestError) return { status: 502, message: error.message }
  return { status: 500, message: 'Unexpected testnet verification error.' }
}
