create table public.backup_metadata (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  object_path text not null,
  backup_format text not null default 'swole-cat-backup'
    check (backup_format = 'swole-cat-backup'),
  format_version integer not null check (format_version >= 1),
  schema_version integer not null check (schema_version >= 0),
  app_version text not null,
  exported_at timestamptz not null,
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  size_bytes bigint not null check (size_bytes >= 0),
  source_device text not null check (char_length(source_device) between 8 and 128),
  created_at timestamptz not null default now(),
  unique (owner_id, object_path)
);

alter table public.backup_metadata enable row level security;

revoke all on table public.backup_metadata from anon;
grant select, insert, delete on table public.backup_metadata to authenticated;
grant all on table public.backup_metadata to service_role;

create policy "backup metadata select own"
on public.backup_metadata
for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "backup metadata insert own"
on public.backup_metadata
for insert
to authenticated
with check (
  (select auth.uid()) = owner_id
  and object_path like (select auth.uid())::text || '/%'
);

create policy "backup metadata delete own"
on public.backup_metadata
for delete
to authenticated
using ((select auth.uid()) = owner_id);

create index backup_metadata_owner_created_idx
on public.backup_metadata (owner_id, created_at desc);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'swole-cat-backups',
  'swole-cat-backups',
  false,
  5000000,
  array['application/json']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "backup objects select own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'swole-cat-backups'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and owner_id = (select auth.uid())::text
);

create policy "backup objects insert own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'swole-cat-backups'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "backup objects delete own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'swole-cat-backups'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and owner_id = (select auth.uid())::text
);
