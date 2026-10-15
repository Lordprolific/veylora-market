-- Add a testnet transparent recipient to sealed offers for test settlement.
-- Existing bids remain NULL and cannot be used for automatic settlement verification.
alter table public.bids
  add column if not exists settlement_address text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'bids_settlement_address_testnet_format'
      and conrelid = 'public.bids'::regclass
  ) then
    alter table public.bids
      add constraint bids_settlement_address_testnet_format
      check (settlement_address is null or settlement_address ~ '^(tm|t2)[a-km-zA-HJ-NP-Z1-9]{25,40}$');
  end if;
end $$;
