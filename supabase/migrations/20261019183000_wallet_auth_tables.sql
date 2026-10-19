-- Wallet identity verification used by the Veylora Market server endpoints.
create table if not exists public.wallet_auth_challenges (
  id text primary key check (id ~ '^[0-9a-f]{32}$'),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  nonce_hash text not null check (nonce_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists wallet_auth_challenges_expires_at_idx
  on public.wallet_auth_challenges (expires_at);
alter table public.wallet_auth_challenges enable row level security;
revoke all on public.wallet_auth_challenges from anon, authenticated;

create table if not exists public.wallet_identities (
  user_id uuid primary key references auth.users(id) on delete cascade,
  identity_address text not null unique,
  network text not null check (network in ('testnet', 'mainnet')),
  verified_at timestamptz not null default now()
);
alter table public.wallet_identities enable row level security;
revoke all on public.wallet_identities from anon, authenticated;
