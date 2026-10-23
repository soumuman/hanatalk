-- Apply once after c028-appearance.sql. Re-runnable; no data is reset.
begin;
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
  if new.deleted_at is not null or jsonb_typeof(new.value) is distinct from 'string' or not (new.value #>> '{}'=any(array['ume','suisen','sakura','tulip','nemophila','hydrangea','morning-glory','sunflower','cosmos','osmanthus','chrysanthemum','poinsettia','eu-snowdrop','eu-crocus','eu-garden-tulip','eu-iris','eu-peony','eu-delphinium','eu-lavender','eu-poppy','eu-dahlia','eu-anemone','eu-cyclamen','eu-hellebore','rose-ivory','rose-blush','rose-pink','rose-apricot','rose-yellow','rose-coral','rose-red','rose-lavender','rose-mauve','rose-tea','rose-burgundy','rose-white','kusa-horsetail','kusa-asparagus','kusa-bamboo','kusa-black-bamboo','kusa-scouring-rush','kusa-wheat','kusa-barley','kusa-rice','kusa-silver-grass','kusa-foxtail','kusa-sugarcane','kusa-corn'])) then raise exception 'invalid flower'; end if;
 end if;
 return new;
end; $$;
revoke all on function public.guard_flower_settings() from public,anon,authenticated;
commit;
