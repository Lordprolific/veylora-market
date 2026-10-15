import { allowRequest, clientKey, errorResponse, RpcOutput, RpcTransaction, sendJson, zcashRpc } from '../_lib/zcash-rpc'

type Request = { method?: string; body?: unknown; headers?: Record<string, string | string[] | undefined> }
type Response = { status: (code: number) => { json: (body: unknown) => unknown } }

function parseBody(body: unknown): { txid: string; recipient: string; amount: number; minConfirmations: number } | null {
  if (!body || typeof body !== 'object') return null
  const value = body as Record<string, unknown>
  const txid = typeof value.txid === 'string' ? value.txid.trim() : ''
  const recipient = typeof value.recipient === 'string' ? value.recipient.trim() : ''
  const amount = typeof value.amount === 'number' ? value.amount : Number(value.amount)
  const minConfirmations = value.minConfirmations === undefined ? 1 : Number(value.minConfirmations)
  if (!/^[0-9a-fA-F]{64}$/.test(txid)) return null
  if (recipient.length < 26 || recipient.length > 100 || /\s/.test(recipient)) return null
  if (!Number.isFinite(amount) || amount <= 0 || amount > 21000000) return null
  if (!Number.isInteger(minConfirmations) || minConfirmations < 1 || minConfirmations > 1000) return null
  return { txid, recipient, amount, minConfirmations }
}

function outputAddresses(output: RpcOutput): string[] {
  const script = output.scriptPubKey
  if (!script) return []
  return [...(script.address ? [script.address] : []), ...(Array.isArray(script.addresses) ? script.addresses : [])]
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'Use POST.' })
  if (!allowRequest(clientKey(req.headers), 12)) return sendJson(res, 429, { ok: false, verified: false, error: 'Too many verification attempts. Try again shortly.' })
  const input = parseBody(req.body)
  if (!input) return sendJson(res, 400, { ok: false, error: 'Provide a valid 64-character txid, transparent recipient address, positive amount, and confirmation threshold.' })
  try {
    const info = await zcashRpc<{ chain?: string }>('getblockchaininfo')
    if (info.chain !== 'test') return sendJson(res, 503, { ok: false, verified: false, error: 'Node network is not confirmed as Zcash testnet.' })
    let tx: RpcTransaction
    try {
      tx = await zcashRpc<RpcTransaction>('getrawtransaction', [input.txid, 1])
    } catch {
      return sendJson(res, 404, { ok: true, verified: false, network: 'testnet', state: 'not_found', error: 'Transaction was not found by this node. It may be unknown to the node or unavailable without transaction indexing.' })
    }
    if (!tx.txid || tx.txid.toLowerCase() !== input.txid.toLowerCase()) {
      return sendJson(res, 502, { ok: false, verified: false, error: 'Node response did not match the requested transaction ID.' })
    }
    const confirmations = typeof tx.confirmations === 'number' ? tx.confirmations : 0
    if (confirmations < 0) return sendJson(res, 200, { ok: true, verified: false, network: 'testnet', state: 'not_confirmed', confirmations: 0, error: 'Transaction is not in the active best chain.' })
    const outputs = Array.isArray(tx.vout) ? tx.vout : []
    const matchingOutput = outputs.find(output => outputAddresses(output).includes(input.recipient) && typeof output.value === 'number' && Math.abs(output.value - input.amount) < 0.000000005)
    const addressSeen = outputs.some(output => outputAddresses(output).includes(input.recipient))
    const state = confirmations === 0 ? 'pending' : confirmations < input.minConfirmations ? 'confirming' : matchingOutput ? 'confirmed' : 'payment_mismatch'
    const verified = Boolean(matchingOutput && confirmations >= input.minConfirmations)
    return sendJson(res, 200, {
      ok: true,
      verified,
      network: 'testnet',
      state,
      txid: tx.txid,
      confirmations,
      requiredConfirmations: input.minConfirmations,
      recipientMatched: addressSeen,
      amountMatched: Boolean(matchingOutput),
      checkedAt: new Date().toISOString(),
      message: verified
        ? 'The configured testnet node found a matching transparent output at the requested amount and confirmation depth.'
        : confirmations < input.minConfirmations
          ? 'Transaction exists but has not reached the required confirmation depth.'
          : addressSeen
            ? 'The recipient appears in the transaction, but no output matched the exact requested amount.'
            : 'No matching transparent output was found. Shielded payment verification requires a separate wallet-aware flow.',
      note: 'This checks transparent outputs only. It does not prove shielded payment details or independently guarantee recipient ownership.',
    })
  } catch (error) {
    const result = errorResponse(error)
    return sendJson(res, result.status, { ok: false, verified: false, network: 'testnet', error: result.message })
  }
}
