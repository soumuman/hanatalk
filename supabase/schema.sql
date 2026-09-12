-- c013: apply to a NEW dedicated Supabase project. All creation and RLS are atomic.
begin;
create table public.profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.people (
 id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
 display_name text not null check(char_length(display_name) between 1 and 40),
 type text not null check(type in ('person','group')),
 sort_order integer not null default 0, is_active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null,
 mutation_id uuid not null, deleted_at timestamptz,
 unique(user_id,id)
);
create table public.daily_logs (
 id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
 date date not null, target_id uuid not null,
 count integer not null check(count>=1), record_type text not null default 'person' check(record_type in ('person','group')),
 created_at timestamptz not null default now(), updated_at timestamptz not null,
 mutation_id uuid not null, deleted_at timestamptz,
 unique(user_id,date,target_id),
 foreign key(user_id,target_id) references public.people(user_id,id) on delete restrict
);
create table public.settings (
 id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
 key text not null check(key in ('appStartedAt','soundEnabled','theme')),
 value jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null,
 mutation_id uuid not null, deleted_at timestamptz,
 unique(user_id,key)
);
alter table public.profiles enable row level security;
alter table public.profiles force row level security;
revoke all on public.profiles from public, anon, authenticated;
grant select,insert,update on public.profiles to authenticated;
alter table public.people enable row level security;
alter table public.people force row level security;
revoke all on public.people from public, anon, authenticated;
grant select,insert,update on public.people to authenticated;
alter table public.daily_logs enable row level security;
alter table public.daily_logs force row level security;
revoke all on public.daily_logs from public, anon, authenticated;
grant select,insert,update on public.daily_logs to authenticated;
alter table public.settings enable row level security;
alter table public.settings force row level security;
revoke all on public.settings from public, anon, authenticated;
grant select,insert,update on public.settings to authenticated;
-- Included in schema.sql in the same transaction; reference copy.
create policy profiles_select on public.profiles for select to authenticated using ((select auth.uid())=user_id);
create policy profiles_insert on public.profiles for insert to authenticated with check ((select auth.uid())=user_id);
create policy profiles_update on public.profiles for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy profiles_delete_denied on public.profiles for delete to authenticated using (false);
create policy people_select on public.people for select to authenticated using ((select auth.uid())=user_id);
create policy people_insert on public.people for insert to authenticated with check ((select auth.uid())=user_id);
create policy people_update on public.people for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy people_delete_denied on public.people for delete to authenticated using (false);
create policy daily_logs_select on public.daily_logs for select to authenticated using ((select auth.uid())=user_id);
create policy daily_logs_insert on public.daily_logs for insert to authenticated with check ((select auth.uid())=user_id);
create policy daily_logs_update on public.daily_logs for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy daily_logs_delete_denied on public.daily_logs for delete to authenticated using (false);
create policy settings_select on public.settings for select to authenticated using ((select auth.uid())=user_id);
create policy settings_insert on public.settings for insert to authenticated with check ((select auth.uid())=user_id);
create policy settings_update on public.settings for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy settings_delete_denied on public.settings for delete to authenticated using (false);

create function public.sync_people(payload jsonb) returns setof public.people
language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null or (payload->>'user_id')::uuid <> auth.uid() then raise exception 'not authorized' using errcode='42501'; end if;
 return query insert into public.people (id,user_id,display_name,type,sort_order,is_active,created_at,updated_at,mutation_id,deleted_at)
 select r.id,r.user_id,r.display_name,r.type,r.sort_order,r.is_active,r.created_at,r.updated_at,r.mutation_id,r.deleted_at from jsonb_populate_record(null::public.people,payload) r
 on conflict (id) do update set display_name=excluded.display_name,type=excluded.type,sort_order=excluded.sort_order,is_active=excluded.is_active,updated_at=excluded.updated_at,mutation_id=excluded.mutation_id,deleted_at=excluded.deleted_at
 where (excluded.updated_at,excluded.mutation_id)>(public.people.updated_at,public.people.mutation_id)
 returning *;
end; $$;
revoke all on function public.sync_people(jsonb) from public,anon;
grant execute on function public.sync_people(jsonb) to authenticated;

create function public.sync_daily_logs(payload jsonb) returns setof public.daily_logs
language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null or (payload->>'user_id')::uuid <> auth.uid() then raise exception 'not authorized' using errcode='42501'; end if;
 return query insert into public.daily_logs (id,user_id,date,target_id,count,record_type,created_at,updated_at,mutation_id,deleted_at)
 select r.id,r.user_id,r.date,r.target_id,r.count,r.record_type,r.created_at,r.updated_at,r.mutation_id,r.deleted_at from jsonb_populate_record(null::public.daily_logs,payload) r
 on conflict (user_id,date,target_id) do update set count=excluded.count,record_type=excluded.record_type,updated_at=excluded.updated_at,mutation_id=excluded.mutation_id,deleted_at=excluded.deleted_at
 where (excluded.updated_at,excluded.mutation_id)>(public.daily_logs.updated_at,public.daily_logs.mutation_id)
 returning *;
end; $$;
revoke all on function public.sync_daily_logs(jsonb) from public,anon;
grant execute on function public.sync_daily_logs(jsonb) to authenticated;

create function public.sync_settings(payload jsonb) returns setof public.settings
language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null or (payload->>'user_id')::uuid <> auth.uid() then raise exception 'not authorized' using errcode='42501'; end if;
 return query insert into public.settings (id,user_id,key,value,created_at,updated_at,mutation_id,deleted_at)
 select r.id,r.user_id,r.key,r.value,r.created_at,r.updated_at,r.mutation_id,r.deleted_at from jsonb_populate_record(null::public.settings,payload) r
 on conflict (user_id,key) do update set value=excluded.value,updated_at=excluded.updated_at,mutation_id=excluded.mutation_id,deleted_at=excluded.deleted_at
 where (excluded.updated_at,excluded.mutation_id)>(public.settings.updated_at,public.settings.mutation_id)
 returning *;
end; $$;
revoke all on function public.sync_settings(jsonb) from public,anon;
grant execute on function public.sync_settings(jsonb) to authenticated;
commit;
