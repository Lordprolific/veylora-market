-- Veylora Market beta schema
-- Apply in Supabase SQL Editor only after reviewing the project and environment.
create extension if not exists pgcrypto;

create type public.market_status as enum ('open', 'closed', 'awarded', 'settlement_submitted', 'settlement_confirmed', 'completed');
create type public.settlement_status as enum ('not_started', 'submitted', 'confirmed', 'failed', 'simulated');

create table public.markets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 5 and 120),
  description text not null check (char_length(description) between 10 and 3000),
  quantity text not null check (char_length(quantity) between 1 and 120),
  currency text not null default 'ZEC',
  closes_at timestamptz not null,
  tie_break_rule text not null default 'earliest_valid_bid' check (tie_break_rule = 'earliest_valid_bid'),
  status public.market_status not null default 'open',
  is_demo boolean not null default false,
  winner_bid_id uuid,
  created_at timestamptz not null default now(),
  constraint future_close_on_insert check (closes_at > created_at)
);

create table public.bids (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets(id) on delete cascade,
  bidder_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(20, 8) not null check (amount > 0),
  note text check (note is null or char_length(note) <= 1000),
  settlement_address text check (settlement_address is null or settlement_address ~ '^(tm|t2)[a-km-zA-HJ-NP-Z1-9]{25,40}$'),
  committed_at timestamptz not null default now(),
  unique (market_id, bidder_id)
);

alter table public.markets add constraint markets_winner_bid_fk
  foreign key (winner_bid_id) references public.bids(id) on delete set null;

create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null unique references public.markets(id) on delete cascade,
  status public.settlement_status not null default 'not_started',
  network text not null default 'zcash-testnet',
  txid text,
  submitted_at timestamptz,
  confirmed_at timestamptz,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint txid_format check (txid is null or txid ~ '^[0-9a-fA-F]{64}$')
);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  category text not null check (category in ('bug', 'idea', 'other')),
  message text not null check (char_length(message) between 5 and 3000),
  created_at timestamptz not null default now()
);

alter table public.markets enable row level security;
alter table public.bids enable row level security;
alter table public.settlements enable row level security;
alter table public.feedback enable row level security;

-- Market discovery is public, but market edits belong to the creator.
create policy "markets readable" on public.markets for select using (true);
create policy "authenticated users create markets" on public.markets for insert to authenticated with check (auth.uid() = owner_id);
-- No client-side UPDATE policy: market closure and awards must be written by trusted server-side logic.
create policy "owners delete open markets" on public.markets for delete to authenticated using (auth.uid() = owner_id and status = 'open');

-- Important: bid rows are intentionally NOT readable to other participants.
create policy "bidder reads own bids" on public.bids for select to authenticated using (auth.uid() = bidder_id);
create policy "authenticated bidder submits own bid" on public.bids for insert to authenticated with check (
  auth.uid() = bidder_id
  and exists (select 1 from public.markets m where m.id = market_id and m.status = 'open' and m.closes_at > now() and m.owner_id <> auth.uid())
);
create policy "bidder cannot edit committed bid" on public.bids for update using (false);
create policy "bidder cannot delete committed bid" on public.bids for delete using (false);

-- Settlement details are visible to market creator and winner only; confirmation should be server-verified.
create policy "participants read settlement" on public.settlements for select to authenticated using (
  exists (select 1 from public.markets m where m.id = market_id and (m.owner_id = auth.uid() or exists (select 1 from public.bids b where b.id = m.winner_bid_id and b.bidder_id = auth.uid())))
);
create policy "authenticated feedback insert" on public.feedback for insert to authenticated with check (auth.uid() = user_id);

-- Beta warning:
-- This schema is a starting point and needs a security review. The trusted award and
-- settlement endpoints are implemented in api/, but still require server configuration,
-- concurrency testing and durable rate limiting before handling valuable trades.
-- RLS policies alone do not guarantee bid immutability or robust close-time concurrency.
