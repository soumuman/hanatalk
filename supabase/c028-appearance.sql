-- Apply AFTER schema.sql to the existing HanaTalk project. Never rerun schema.sql on production.
begin;
create table if not exists public.entitlements (
 user_id uuid primary key references auth.users(id) on delete cascade,
 premium boolean not null default false,
 preserved_through text not null default '' check(preserved_through='' or preserved_through ~ '^\d{4}-(0[1-9]|1[0-2])$'),
 free_periods jsonb not null default '[]' check(jsonb_typeof(free_periods)='array'),
 updated_at timestamptz not null default now()
);
alter table public.entitlements enable row level security;
alter table public.entitlements force row level security;
revoke all on public.entitlements from public,anon,authenticated;
grant select on public.entitlements to authenticated;
drop policy if exists entitlement_self on public.entitlements;
create policy entitlement_self on public.entitlements for select to authenticated using ((select auth.uid())=user_id);
-- There are deliberately no client INSERT/UPDATE/DELETE grants or policies.
create or replace function public.freeze_premium_month() returns trigger language plpgsql set search_path='' as $$
declare first_free text; last_free text;
begin
 if TG_OP='UPDATE' and old.premium and not new.premium then
  new.preserved_through=greatest(old.preserved_through,to_char(now() at time zone 'Asia/Tokyo','YYYY-MM'));
 end if;
 if TG_OP='UPDATE' and not old.premium and new.premium and old.preserved_through<>'' then
  first_free=to_char((old.preserved_through||'-01')::date+interval '1 month','YYYY-MM');
  last_free=to_char((now() at time zone 'Asia/Tokyo')-interval '1 month','YYYY-MM');
  if first_free<=last_free then new.free_periods=old.free_periods||jsonb_build_array(jsonb_build_object('from',first_free,'to',last_free)); end if;
 end if;
 new.updated_at=now();return new;
end; $$;
drop trigger if exists freeze_premium_month on public.entitlements;
create trigger freeze_premium_month before update on public.entitlements for each row execute function public.freeze_premium_month();
revoke all on function public.freeze_premium_month() from public,anon,authenticated;
alter table public.settings drop constraint if exists settings_key_check;
alter table public.settings add constraint settings_key_check check(key in ('appStartedAt','soundEnabled','theme') or key ~ '^flowerMonth:\d{4}-(0[1-9]|1[0-2])$');
create or replace function public.guard_flower_settings() returns trigger language plpgsql security invoker set search_path='' as $$
declare month text; current_month text:=to_char(now() at time zone 'Asia/Tokyo','YYYY-MM');
begin
 if TG_OP='UPDATE' and (new.key<>old.key or new.user_id<>old.user_id) then raise exception 'immutable setting identity'; end if;
 if new.key like 'flowerMonth:%' then
  month=substring(new.key from 13);
  if auth.uid() is null or new.user_id<>auth.uid() or not exists(select 1 from public.entitlements where user_id=auth.uid() and premium) then
   raise exception 'premium required' using errcode='42501';
  end if;
  if month<current_month or substring(month from 1 for 4)::integer>extract(year from now() at time zone 'Asia/Tokyo')+2 then raise exception 'month is locked'; end if;
  if new.deleted_at is not null or jsonb_typeof(new.value) is distinct from 'string' or not (new.value #>> '{}'=any(array['ume','suisen','sakura','tulip','nemophila','hydrangea','morning-glory','sunflower','cosmos','osmanthus','chrysanthemum','poinsettia'])) then raise exception 'invalid flower'; end if;
 end if;
 return new;
end; $$;
drop trigger if exists guard_flower_settings on public.settings;
create trigger guard_flower_settings before insert or update on public.settings for each row execute function public.guard_flower_settings();
revoke all on function public.guard_flower_settings() from public,anon,authenticated;
create or replace function public.set_flower_months(months jsonb) returns setof public.settings
language plpgsql security invoker set search_path='' as $$
declare entry record;
begin
 if auth.uid() is null or not exists(select 1 from public.entitlements where user_id=auth.uid() and premium) then raise exception 'premium required' using errcode='42501'; end if;
 if jsonb_typeof(months)<>'object' then raise exception 'invalid months'; end if;
 if (select count(*) from jsonb_each(months)) not between 1 and 12 then raise exception 'invalid month count'; end if;
 for entry in select * from jsonb_each(months) loop
  return query insert into public.settings(id,user_id,key,value,updated_at,mutation_id)
   values(gen_random_uuid(),auth.uid(),'flowerMonth:'||entry.key,entry.value,now(),gen_random_uuid())
   on conflict(user_id,key) do update set value=excluded.value,updated_at=greatest(now(),public.settings.updated_at+interval '1 microsecond'),mutation_id=excluded.mutation_id
   returning *;
 end loop;
end; $$;
revoke all on function public.set_flower_months(jsonb) from public,anon;
grant execute on function public.set_flower_months(jsonb) to authenticated;
commit;
