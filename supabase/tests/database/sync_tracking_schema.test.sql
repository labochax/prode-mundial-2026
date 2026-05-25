begin;

select no_plan();

select has_table('public', 'sync_runs', 'sync_runs table exists');
select has_table('public', 'provider_errors', 'provider_errors table exists');

select has_column('public', 'sync_runs', 'id', 'sync_runs.id exists');
select has_column('public', 'sync_runs', 'provider', 'sync_runs.provider exists');
select has_column('public', 'sync_runs', 'sync_type', 'sync_runs.sync_type exists');
select has_column('public', 'sync_runs', 'status', 'sync_runs.status exists');
select has_column('public', 'sync_runs', 'started_at', 'sync_runs.started_at exists');
select has_column('public', 'sync_runs', 'finished_at', 'sync_runs.finished_at exists');
select has_column('public', 'sync_runs', 'summary', 'sync_runs.summary exists');
select has_column('public', 'sync_runs', 'error_message', 'sync_runs.error_message exists');
select has_column('public', 'sync_runs', 'created_at', 'sync_runs.created_at exists');

select has_column('public', 'provider_errors', 'id', 'provider_errors.id exists');
select has_column('public', 'provider_errors', 'sync_run_id', 'provider_errors.sync_run_id exists');
select has_column('public', 'provider_errors', 'provider', 'provider_errors.provider exists');
select has_column('public', 'provider_errors', 'context', 'provider_errors.context exists');
select has_column('public', 'provider_errors', 'message', 'provider_errors.message exists');
select has_column('public', 'provider_errors', 'details', 'provider_errors.details exists');
select has_column('public', 'provider_errors', 'created_at', 'provider_errors.created_at exists');

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'sync_runs_provider_allowed'
      and conrelid = 'public.sync_runs'::regclass
  ),
  'sync_runs provider check constraint exists'
);
select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'sync_runs_sync_type_allowed'
      and conrelid = 'public.sync_runs'::regclass
  ),
  'sync_runs sync_type check constraint exists'
);
select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'sync_runs_status_allowed'
      and conrelid = 'public.sync_runs'::regclass
  ),
  'sync_runs status check constraint exists'
);
select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'provider_errors_provider_allowed'
      and conrelid = 'public.provider_errors'::regclass
  ),
  'provider_errors provider check constraint exists'
);
select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'provider_errors_sync_run_id_fkey'
      and conrelid = 'public.provider_errors'::regclass
  ),
  'provider_errors sync_run_id foreign key exists'
);

insert into public.sync_runs (
  id,
  provider,
  sync_type,
  status,
  summary
)
values (
  '91000000-0000-0000-0000-000000000001',
  'football-data',
  'fixtures',
  'running',
  '{"teams_upserted": 0, "matches_upserted": 0}'::jsonb
);

select lives_ok(
  $$
    update public.sync_runs
    set
      status = 'success',
      finished_at = now(),
      summary = '{"teams_upserted": 2, "matches_upserted": 4}'::jsonb
    where id = '91000000-0000-0000-0000-000000000001'
  $$,
  'sync_runs accepts valid success status and summary'
);

select lives_ok(
  $$
    insert into public.provider_errors (
      sync_run_id,
      provider,
      context,
      message,
      details
    )
    values (
      '91000000-0000-0000-0000-000000000001',
      'football-data',
      'fixture:123',
      'Error sanitizado de prueba',
      '{"status": 500}'::jsonb
    )
  $$,
  'provider_errors accepts valid linked sanitized error'
);

select throws_ok(
  $$
    insert into public.sync_runs (provider, sync_type, status)
    values ('otro', 'fixtures', 'running')
  $$,
  '23514',
  'new row for relation "sync_runs" violates check constraint "sync_runs_provider_allowed"',
  'sync_runs rejects unsupported provider'
);

select throws_ok(
  $$
    insert into public.sync_runs (provider, sync_type, status)
    values ('football-data', 'usuarios', 'running')
  $$,
  '23514',
  'new row for relation "sync_runs" violates check constraint "sync_runs_sync_type_allowed"',
  'sync_runs rejects unsupported sync_type'
);

select throws_ok(
  $$
    insert into public.sync_runs (provider, sync_type, status)
    values ('football-data', 'fixtures', 'partial')
  $$,
  '23514',
  'new row for relation "sync_runs" violates check constraint "sync_runs_status_allowed"',
  'sync_runs rejects unsupported status'
);

select throws_ok(
  $$
    insert into public.provider_errors (provider, message)
    values ('otro', 'Error con proveedor invalido')
  $$,
  '23514',
  'new row for relation "provider_errors" violates check constraint "provider_errors_provider_allowed"',
  'provider_errors rejects unsupported provider'
);

select * from finish();

rollback;
