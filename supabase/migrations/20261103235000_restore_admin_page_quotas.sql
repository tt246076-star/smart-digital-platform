create or replace function private.enforce_landing_page_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  membership public.user_access_plans%rowtype;
  page_limits public.user_page_type_limits%rowtype;
  normal_limit integer;
  vip_limit integer;
  existing_count integer;
  check_quota boolean := false;
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

  if tg_op = 'INSERT' then
    check_quota := true;
  elsif tg_op = 'UPDATE' then
    check_quota := (old.template = 'vip') is distinct from (new.template = 'vip');
  end if;

  if check_quota then
    if membership.plan_type = 'trial' then
      normal_limit := 1;
      vip_limit := 1;
    else
      select * into page_limits
      from public.user_page_type_limits
      where user_id = new.user_id;

      normal_limit := coalesce(page_limits.normal_max_pages, 1);
      vip_limit := coalesce(
        page_limits.vip_max_pages,
        case when membership.plan_type = 'vip' then 1 else 0 end
      );
    end if;

    if new.template = 'vip' then
      select count(*) into existing_count
      from public.landing_pages
      where user_id = new.user_id
        and template = 'vip'
        and id is distinct from new.id;

      if existing_count >= vip_limit then
        raise exception 'VIP_PAGE_LIMIT_REACHED' using errcode = '42501';
      end if;
    else
      select count(*) into existing_count
      from public.landing_pages
      where user_id = new.user_id
        and template is distinct from 'vip'
        and id is distinct from new.id;

      if existing_count >= normal_limit then
        raise exception 'NORMAL_PAGE_LIMIT_REACHED' using errcode = '42501';
      end if;
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
