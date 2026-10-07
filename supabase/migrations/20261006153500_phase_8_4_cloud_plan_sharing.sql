-- Phase 8.4 short-lived cloud sharing for routine/program blueprints.
-- Raw usable share codes are never stored. Only SHA-256 hashes are persisted.
create table public.plan_shares (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  code_hash text not null unique check (code_hash ~ '^[0-9a-f]{64}$'),
  share_kind text not null check (share_kind in ('routine','program')),
  share_name text not null check (char_length(share_name) between 1 and 160),
  format_version integer not null check (format_version between 1 and 100),
  payload_json jsonb not null,
  payload_bytes integer not null check (payload_bytes between 1 and 250000),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_accessed_at timestamptz,
  check (expires_at > created_at),
  check (expires_at <= created_at + interval '7 days 5 minutes')
);

alter table public.plan_shares enable row level security;

-- plan_shares is intentionally not exposed directly to app clients.
-- Creation and resolution happen only through the plan-share Edge Function.
revoke all on table public.plan_shares from anon, authenticated;
grant all on table public.plan_shares to service_role;

create index plan_shares_owner_created_idx
on public.plan_shares (owner_id, created_at desc);

create index plan_shares_expires_idx
on public.plan_shares (expires_at);
