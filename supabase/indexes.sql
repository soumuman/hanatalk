begin;
create index if not exists people_user_updated on public.people(user_id,updated_at);
create index if not exists daily_logs_user_updated on public.daily_logs(user_id,updated_at);
create index if not exists settings_user_updated on public.settings(user_id,updated_at);
commit;
