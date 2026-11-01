create table if not exists public.market_publisher_slots (slot_start timestamptz primary key, market_id uuid unique references public.markets(id) on delete set null, created_at timestamptz not null default now());
alter table public.market_publisher_slots enable row level security;
revoke all on public.market_publisher_slots from anon, authenticated;
grant select, insert, update, delete on public.market_publisher_slots to service_role;
