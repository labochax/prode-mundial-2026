begin;

select no_plan();

select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.teams'::regclass
  ),
  'RLS is enabled on teams'
);
select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.stadiums'::regclass
  ),
  'RLS is enabled on stadiums'
);
select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.matches'::regclass
  ),
  'RLS is enabled on matches'
);

insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values (
  '80000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'match-rls-user@example.test',
  now(),
  now(),
  now()
);

insert into public.teams (id, name_es, tla)
values
  ('81000000-0000-0000-0000-000000000001', 'Argentina', 'ARG'),
  ('81000000-0000-0000-0000-000000000002', 'Mexico', 'MEX');

insert into public.stadiums (id, name, city, country)
values (
  '82000000-0000-0000-0000-000000000001',
  'Estadio RLS',
  'Ciudad RLS',
  'Pais RLS'
);

insert into public.matches (
  id,
  home_team_id,
  away_team_id,
  kickoff_at,
  stadium_id
)
values (
  '83000000-0000-0000-0000-000000000001',
  '81000000-0000-0000-0000-000000000001',
  '81000000-0000-0000-0000-000000000002',
  '2026-06-11 16:00:00+00',
  '82000000-0000-0000-0000-000000000001'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '80000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"80000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

select is(
  (
    select count(*)::int
    from public.teams
  ),
  2,
  'authenticated users can read teams'
);

select is(
  (
    select count(*)::int
    from public.stadiums
  ),
  1,
  'authenticated users can read stadiums'
);

select is(
  (
    select count(*)::int
    from public.matches
  ),
  1,
  'authenticated users can read matches'
);

select throws_ok(
  $$
    insert into public.teams (name_es)
    values ('Cliente no autorizado')
  $$,
  '42501',
  'new row violates row-level security policy for table "teams"',
  'authenticated users cannot insert teams'
);

select lives_ok(
  $$
    update public.matches
    set status = 'FINISHED'
    where id = '83000000-0000-0000-0000-000000000001'
  $$,
  'authenticated match update without policy is silently filtered'
);

reset role;

select is(
  (
    select status
    from public.matches
    where id = '83000000-0000-0000-0000-000000000001'
  ),
  'SCHEDULED',
  'authenticated users cannot change match rows'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '80000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"80000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

select lives_ok(
  $$
    delete from public.stadiums
    where id = '82000000-0000-0000-0000-000000000001'
  $$,
  'authenticated stadium delete without policy is silently filtered'
);

reset role;

select ok(
  exists (
    select 1
    from public.stadiums
    where id = '82000000-0000-0000-0000-000000000001'
  ),
  'authenticated users cannot delete stadium rows'
);

select * from finish();

rollback;
