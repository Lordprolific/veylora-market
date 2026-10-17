import { allowRequest, clientKey } from '../../../server/zcash-rpc'
import { authenticatedUser, bearerToken, sendJson, serviceClient, SupabaseConfigurationError, SupabaseRequestError } from '../../../server/supabase'

type Request = { method?: string; headers?: Record<string, string | string[] | undefined> }
type Response = { status: (code: number) => { json: (body: unknown) => unknown } }

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') return sendJson(res, 405, { ok: false, error: 'Use GET.' })
  if (!allowRequest(clientKey(req.headers), 30)) return sendJson(res, 429, { ok: false, error: 'Too many wallet status checks. Try again shortly.' })
  const token = bearerToken(req.headers)
  if (!token) return sendJson(res, 401, { ok: false, error: 'A signed-in session is required.' })
  try {
    const db = serviceClient()
    const user = await authenticatedUser(db, token)
    const result = await db.from('wallet_identities').select('identity_address,network,verified_at').eq('user_id', user.id).maybeSingle()
    if (result.error) throw new Error('Could not check wallet verification status. Apply the wallet-auth migration first.')
    return sendJson(res, 200, { ok: true, verified: Boolean(result.data), identity: result.data ?? null })
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) return sendJson(res, 503, { ok: false, error: error.message })
    if (error instanceof SupabaseRequestError) return sendJson(res, 401, { ok: false, error: error.message })
    return sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : 'Wallet status check failed.' })
  }
}
