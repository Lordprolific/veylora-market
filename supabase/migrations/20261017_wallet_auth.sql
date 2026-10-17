-- Wallet-backed sign-in for Veylora beta.
-- Apply in Supabase SQL Editor before enabling wallet-authenticated market actions.
create table if not exists public.wallet_auth_challenges (
  id text primary key check (id ~ '^[0-9a-fA-F]{32}$'),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  nonce_hash text not null check (nonce_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists wallet_auth_challenges_expiry_idx on public.wallet_auth_challenges (expires_at);

create table if not exists public.wallet_identities (
  user_id uuid primary key references auth.users(id) on delete cascade,
  identity_address text not null unique,
  network text not null check (network in ('mainnet', 'testnet')),
  verified_at timestamptz not null default now()
);

alter table public.wallet_auth_challenges enable row level security;
alter table public.wallet_identities enable row level security;
-- No client policies: only trusted server endpoints using the service role may read or write these tables.

drop policy if exists "authenticated users create markets" on public.markets;
create policy "wallet-verified users create markets" on public.markets for insert to authenticated
with check (
  auth.uid() = owner_id
  and exists (select 1 from public.wallet_identities wi where wi.user_id = auth.uid())
);

drop policy if exists "authenticated bidder submits own bid" on public.bids;
create policy "wallet-verified bidders submit own bid" on public.bids for insert to authenticated
with check (
  auth.uid() = bidder_id
  and exists (select 1 from public.wallet_identities wi where wi.user_id = auth.uid())
  and exists (
    select 1 from public.markets m
    where m.id = market_id and m.status = 'open' and m.closes_at > now() and m.owner_id <> auth.uid()
  )
);

-- Expired challenge cleanup can be run periodically; expired challenges cannot verify.
