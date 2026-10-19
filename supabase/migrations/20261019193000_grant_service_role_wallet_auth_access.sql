-- The wallet-auth API uses the Supabase service role from server-side functions.
-- Keep browser roles unprivileged; grant only the server role access to these tables.
grant select, insert, update, delete on table public.wallet_auth_challenges to service_role;
grant select, insert, update, delete on table public.wallet_identities to service_role;
