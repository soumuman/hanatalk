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
