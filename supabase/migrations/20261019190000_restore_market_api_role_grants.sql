-- Restore the table privileges required by the existing RLS policies.
-- RLS remains enabled; these grants do not bypass row-level policies.
grant usage on schema public to anon, authenticated;
grant select on public.markets to anon, authenticated;
grant insert, delete on public.markets to authenticated;
grant select, insert on public.bids to authenticated;
grant select on public.settlements to authenticated;
grant insert on public.feedback to authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
