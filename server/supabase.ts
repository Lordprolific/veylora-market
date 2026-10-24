import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export class SupabaseConfigurationError extends Error {}
export class SupabaseRequestError extends Error {}

export function serviceClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new SupabaseConfigurationError('Server-side market operations are not configured.')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export function bearerToken(headers?: Record<string, string | string[] | undefined>): string | null {
  const raw = headers?.authorization
  const value = Array.isArray(raw) ? raw[0] : raw
  const match = value?.match(/^Bearer\s+(.+)$/i)
  return match?.[1] ?? null
}

export async function authenticatedUser(client: SupabaseClient, token: string) {
  const result = await client.auth.getUser(token)
  if (result.error || !result.data.user) throw new SupabaseRequestError('A valid signed-in session is required.')
  return result.data.user
}

export async function hasVerifiedTestnetWallet(client: SupabaseClient, userId: string): Promise<boolean> {
  const result = await client.from('wallet_identities')
    .select('network')
    .eq('user_id', userId)
    .maybeSingle()
  if (result.error) throw new Error('Could not verify the linked Zcash testnet wallet.')
  return result.data?.network === 'testnet'
}

export function sendJson(res: { status: (code: number) => { json: (body: unknown) => unknown } }, code: number, body: unknown) {
  return res.status(code).json(body)
}
