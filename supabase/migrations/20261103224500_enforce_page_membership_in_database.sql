create or replace function private.enforce_landing_page_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  membership public.user_access_plans%rowtype;
  existing_count integer;
begin
  perform pg_advisory_xact_lock(hashtext(new.user_id::text));

  select * into membership
  from public.user_access_plans
  where user_id = new.user_id;

  if not found
     or (membership.expires_at is not null and membership.expires_at <= now()) then
    raise exception 'MEMBERSHIP_INACTIVE' using errcode = '42501';
  end if;

  if membership.plan_type = 'customer' and new.template = 'vip' then
    raise exception 'VIP_MEMBERSHIP_REQUIRED' using errcode = '42501';
  end if;

  if membership.plan_type = 'trial' then
    if new.template = 'vip' then
      select count(*) into existing_count
      from public.landing_pages
      where user_id = new.user_id
        and template = 'vip'
        and id is distinct from new.id;
    else
      select count(*) into existing_count
      from public.landing_pages
      where user_id = new.user_id
        and template is distinct from 'vip'
        and id is distinct from new.id;
    end if;

    if existing_count >= 1 then
      raise exception 'TRIAL_PAGE_LIMIT_REACHED' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_landing_page_membership() from public, anon, authenticated;

drop trigger if exists enforce_landing_page_membership on public.landing_pages;
create trigger enforce_landing_page_membership
  before insert or update on public.landing_pages
  for each row execute function private.enforce_landing_page_membership();