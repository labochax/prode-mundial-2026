begin;

select no_plan();

select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.sync_runs'::regclass
  ),
  'RLS is enabled on sync_runs'
);

select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.provider_errors'::regclass
  ),
  'RLS is enabled on provider_errors'
);

insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values (
  '92000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'sync-rls-user@example.test',
  now(),
  now(),
  now()
);

insert into public.sync_runs (
  id,
  provider,
  sync_type,
  status,
  finished_at,
  summary
)
values (
  '93000000-0000-0000-0000-000000000001',
  'football-data',
  'fixtures',
  'success',
  now(),
  '{"teams_upserted": 2}'::jsonb
);

insert into public.provider_errors (
  id,
  sync_run_id,
  provider,
  context,
  message
)
values (
  '94000000-0000-0000-0000-000000000001',
  '93000000-0000-0000-0000-000000000001',
  'football-data',
  'fixture:9001',
  'Error sanitizado visible'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '92000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"92000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

select is(
  (
    select count(*)::int
    from public.sync_runs
    where id = '93000000-0000-0000-0000-000000000001'
  ),
  1,
  'authenticated users can read sync_runs'
);

select is(
  (
    select count(*)::int
    from public.provider_errors
    where id = '94000000-0000-0000-0000-000000000001'
  ),
  1,
  'authenticated users can read provider_errors'
);

select throws_ok(
  $$
    insert into public.sync_runs (provider, sync_type, status)
    values ('football-data', 'fixtures', 'running')
  $$,
  '42501',
  'new row violates row-level security policy for table "sync_runs"',
  'authenticated users cannot insert sync_runs'
);

select lives_ok(
  $$
    update public.sync_runs
    set status = 'error'
    where id = '93000000-0000-0000-0000-000000000001'
  $$,
  'authenticated sync_runs update without policy is silently filtered'
);

select lives_ok(
  $$
    delete from public.sync_runs
    where id = '93000000-0000-0000-0000-000000000001'
  $$,
  'authenticated sync_runs delete without policy is silently filtered'
);

select throws_ok(
  $$
    insert into public.provider_errors (provider, message)
    values ('football-data', 'Error no autorizado')
  $$,
  '42501',
  'new row violates row-level security policy for table "provider_errors"',
  'authenticated users cannot insert provider_errors'
);

select lives_ok(
  $$
    update public.provider_errors
    set message = 'No deberia cambiar'
    where id = '94000000-0000-0000-0000-000000000001'
  $$,
  'authenticated provider_errors update without policy is silently filtered'
);

select lives_ok(
  $$
    delete from public.provider_errors
    where id = '94000000-0000-0000-0000-000000000001'
  $$,
  'authenticated provider_errors delete without policy is silently filtered'
);

reset role;

select is(
  (
    select status
    from public.sync_runs
    where id = '93000000-0000-0000-0000-000000000001'
  ),
  'success',
  'sync_runs row remains unchanged after authenticated write attempts'
);

select is(
  (
    select message
    from public.provider_errors
    where id = '94000000-0000-0000-0000-000000000001'
  ),
  'Error sanitizado visible',
  'provider_errors row remains unchanged after authenticated write attempts'
);

select * from finish();

rollback;
