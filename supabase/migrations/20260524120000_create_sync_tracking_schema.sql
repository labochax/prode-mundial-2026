-- Sync observability foundation for local/manual provider imports.
-- This migration does not create cron jobs, Edge Functions, external API
-- clients, or production admin authorization.

create table public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  sync_type text not null,
  status text not null,
  started_at timestamptz default now() not null,
  finished_at timestamptz,
  summary jsonb,
  error_message text,
  created_at timestamptz default now() not null,
  constraint sync_runs_provider_allowed check (
    provider in ('football-data', 'thesportsdb', 'local-dev')
  ),
  constraint sync_runs_sync_type_allowed check (
    sync_type in ('dry_run', 'fixtures', 'results', 'assets')
  ),
  constraint sync_runs_status_allowed check (
    status in ('running', 'success', 'error')
  )
);

comment on table public.sync_runs is
  'Local/server-side audit trail for external provider sync attempts. Client writes are intentionally not granted.';
comment on column public.sync_runs.summary is
  'Sanitized operational summary. Never store provider tokens, cookies, or service credentials here.';

create table public.provider_errors (
  id uuid primary key default gen_random_uuid(),
  sync_run_id uuid references public.sync_runs(id) on delete cascade,
  provider text not null,
  context text,
  message text not null,
  details jsonb,
  created_at timestamptz default now() not null,
  constraint provider_errors_provider_allowed check (
    provider in ('football-data', 'thesportsdb', 'local-dev')
  )
);

comment on table public.provider_errors is
  'Sanitized provider error details linked to sync_runs. Do not store secrets or full request headers.';

create index sync_runs_provider_type_started_idx
on public.sync_runs (provider, sync_type, started_at desc);

create index sync_runs_status_idx
on public.sync_runs (status);

create index provider_errors_sync_run_id_idx
on public.provider_errors (sync_run_id);

create index provider_errors_provider_idx
on public.provider_errors (provider);

alter table public.sync_runs enable row level security;
alter table public.provider_errors enable row level security;

-- Authenticated read is allowed for the local admin diagnostics UI. No insert,
-- update, or delete grants are made to authenticated clients; writes are
-- reserved for server-only admin/service-role sync actions.
grant select on public.sync_runs to authenticated;
grant select on public.provider_errors to authenticated;

create policy "Authenticated users can read sync runs"
on public.sync_runs
for select
to authenticated
using (true);

create policy "Authenticated users can read provider errors"
on public.provider_errors
for select
to authenticated
using (true);
