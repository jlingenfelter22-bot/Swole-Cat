-- Phase 8.3 record-level sync foundation.
-- Live schema was verified before this repository checkpoint.

create sequence if not exists public.swolecat_sync_change_seq as bigint;

create table if not exists public.devices (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  device_name text not null check (char_length(device_name) between 1 and 120),
  platform text not null check (char_length(platform) between 1 and 40),
  app_version text not null check (char_length(app_version) between 1 and 40),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.sync_records (
  owner_id uuid not null references auth.users(id) on delete cascade,
  record_type text not null check (
    record_type = any (array[
      'routine','program','session','custom_exercise','active_workout',
      'profile','settings','favorites','exercise_preferences','bodyweight','app_state'
    ]::text[])
  ),
  record_id text not null check (char_length(record_id) between 1 and 180),
  payload_json jsonb,
  record_version bigint not null default 1 check (record_version >= 1),
  server_change_seq bigint not null default nextval('public.swolecat_sync_change_seq'),
  source_device_id uuid references public.devices(id),
  client_updated_at timestamptz not null,
  server_updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  schema_version integer not null default 1 check (schema_version >= 1),
  last_mutation_id uuid,
  primary key (owner_id,record_type,record_id)
);

create unique index if not exists sync_records_owner_last_mutation_idx
on public.sync_records (owner_id,last_mutation_id)
where last_mutation_id is not null;

create index if not exists sync_records_owner_change_idx
on public.sync_records (owner_id,server_change_seq);

create or replace function public.swolecat_sync_record_server_fields()
returns trigger
language plpgsql
security invoker
set search_path=''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.owner_id is distinct from old.owner_id
       or new.record_type is distinct from old.record_type
       or new.record_id is distinct from old.record_id then
      raise exception 'sync record identity is immutable';
    end if;
    new.record_version := old.record_version + 1;
  else
    new.record_version := 1;
  end if;

  new.server_change_seq := nextval('public.swolecat_sync_change_seq');
  new.server_updated_at := now();
  return new;
end;
$$;

revoke execute on function public.swolecat_sync_record_server_fields() from public, anon, authenticated;

drop trigger if exists swolecat_sync_record_server_fields on public.sync_records;
create trigger swolecat_sync_record_server_fields
before insert or update on public.sync_records
for each row execute function public.swolecat_sync_record_server_fields();

alter table public.devices enable row level security;
alter table public.sync_records enable row level security;

revoke all on table public.devices from anon, authenticated;
grant select on table public.devices to authenticated;
grant insert (id,owner_id,device_name,platform,app_version,last_seen_at) on table public.devices to authenticated;
grant update (device_name,platform,app_version,last_seen_at) on table public.devices to authenticated;
grant all on table public.devices to service_role;

revoke all on table public.sync_records from anon, authenticated;
grant select on table public.sync_records to authenticated;
grant insert (
  owner_id,record_type,record_id,payload_json,source_device_id,
  client_updated_at,deleted_at,schema_version,last_mutation_id
) on table public.sync_records to authenticated;
grant update (
  payload_json,source_device_id,client_updated_at,deleted_at,schema_version,last_mutation_id
) on table public.sync_records to authenticated;
grant all on table public.sync_records to service_role;

revoke all on sequence public.swolecat_sync_change_seq from anon;
grant usage on sequence public.swolecat_sync_change_seq to authenticated;
grant all on sequence public.swolecat_sync_change_seq to service_role;

drop policy if exists "devices select own" on public.devices;
create policy "devices select own" on public.devices
for select to authenticated using ((select auth.uid()) = owner_id);

drop policy if exists "devices insert own" on public.devices;
create policy "devices insert own" on public.devices
for insert to authenticated with check ((select auth.uid()) = owner_id);

drop policy if exists "devices update own" on public.devices;
create policy "devices update own" on public.devices
for update to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists "sync records select own" on public.sync_records;
create policy "sync records select own" on public.sync_records
for select to authenticated using ((select auth.uid()) = owner_id);

drop policy if exists "sync records insert own" on public.sync_records;
create policy "sync records insert own" on public.sync_records
for insert to authenticated with check (
  (select auth.uid()) = owner_id
  and source_device_id is not null
  and exists (
    select 1 from public.devices d
    where d.id = source_device_id and d.owner_id = (select auth.uid())
  )
);

drop policy if exists "sync records update own" on public.sync_records;
create policy "sync records update own" on public.sync_records
for update to authenticated
using ((select auth.uid()) = owner_id)
with check (
  (select auth.uid()) = owner_id
  and source_device_id is not null
  and exists (
    select 1 from public.devices d
    where d.id = source_device_id and d.owner_id = (select auth.uid())
  )
);
