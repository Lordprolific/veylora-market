-- Veylora Market V2: category-aware Web3 requests and wallet-verified write access.
-- Additive category column keeps existing deployments compatible; old requests default to OTC.
alter table public.markets
  add column if not exists category text not null default 'otc'
  check (category in ('otc', 'dao-procurement', 'web3-services'));

-- Allow a session to read only its own verified identity so RLS can require
-- a server-verified testnet wallet before direct browser writes.
grant select on public.wallet_identities to authenticated;
drop policy if exists "users read own wallet identity" on public.wallet_identities;
create policy "users read own wallet identity"
  on public.wallet_identities for select to authenticated
  using ((select auth.uid()) = user_id);

-- A Supabase anonymous session is still role=authenticated. Require a verified
-- testnet identity in addition to auth.uid() for creating requests or offers.
drop policy if exists "authenticated users create markets" on public.markets;
create policy "verified wallet users create markets"
  on public.markets for insert to authenticated
  with check (
    (select auth.uid()) = owner_id
    and exists (
      select 1 from public.wallet_identities wi
      where wi.user_id = (select auth.uid())
        and wi.network = 'testnet'
    )
  );

drop policy if exists "authenticated bidder submits own bid" on public.bids;
create policy "verified wallet bidder submits own bid"
  on public.bids for insert to authenticated
  with check (
    (select auth.uid()) = bidder_id
    and exists (
      select 1 from public.wallet_identities wi
      where wi.user_id = (select auth.uid())
        and wi.network = 'testnet'
    )
    and exists (
      select 1 from public.markets m
      where m.id = market_id
        and m.status = 'open'
        and m.closes_at > now()
        and m.owner_id <> (select auth.uid())
    )
  );

create index if not exists markets_category_status_closes_idx
  on public.markets (category, status, closes_at);
