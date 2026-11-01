create or replace function public.publish_market_slot(
  p_slot_start timestamptz,
  p_owner_id uuid,
  p_title text,
  p_description text,
  p_quantity text,
  p_closes_at timestamptz
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_market_id uuid;
  v_claimed_slot timestamptz;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service_role required';
  end if;
  if p_slot_start is null or p_owner_id is null or p_closes_at <= now() then
    raise exception 'Invalid publishing parameters';
  end if;
  insert into public.market_publisher_slots(slot_start)
  values (p_slot_start)
  on conflict (slot_start) do nothing
  returning slot_start into v_claimed_slot;
  if v_claimed_slot is null then
    select market_id into v_market_id from public.market_publisher_slots where slot_start = p_slot_start;
    return v_market_id;
  end if;
  insert into public.markets(owner_id,title,description,quantity,currency,category,closes_at,status,is_demo)
  values(p_owner_id,p_title,p_description,p_quantity,'TAZ','otc',p_closes_at,'open',false)
  returning id into v_market_id;
  update public.market_publisher_slots set market_id=v_market_id where slot_start=p_slot_start;
  return v_market_id;
end;
$$;
revoke all on function public.publish_market_slot(timestamptz,uuid,text,text,text,timestamptz) from public, anon, authenticated;
grant execute on function public.publish_market_slot(timestamptz,uuid,text,text,text,timestamptz) to service_role;
