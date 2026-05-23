begin;

select no_plan();

select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.predictions'::regclass
  ),
  'RLS is enabled on predictions'
);

insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('a0000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'pred-rls-a@example.test', now(), now(), now()),
  ('a0000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'pred-rls-b@example.test', now(), now(), now()),
  ('a0000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'pred-rls-c@example.test', now(), now(), now());

insert into public.profiles (id, email, display_name, avatar_kind)
values
  ('a0000000-0000-0000-0000-000000000001', 'pred-rls-a@example.test', 'Usuario A', 'stitch'),
  ('a0000000-0000-0000-0000-000000000002', 'pred-rls-b@example.test', 'Usuario B', 'stitch'),
  ('a0000000-0000-0000-0000-000000000003', 'pred-rls-c@example.test', 'Usuario C', 'stitch');

insert into public.pools (id, name, slug, created_by)
values
  ('a1000000-0000-0000-0000-000000000001', 'Pool RLS A', 'pool-pred-rls-a', 'a0000000-0000-0000-0000-000000000001'),
  ('a1000000-0000-0000-0000-000000000002', 'Pool RLS B', 'pool-pred-rls-b', 'a0000000-0000-0000-0000-000000000003');

insert into public.pool_memberships (pool_id, user_id, role)
values
  ('a1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'owner'),
  ('a1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'member'),
  ('a1000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', 'owner');

insert into public.teams (id, name_es, tla)
values
  ('a2000000-0000-0000-0000-000000000001', 'Argentina', 'ARG'),
  ('a2000000-0000-0000-0000-000000000002', 'Mexico', 'MEX');

insert into public.matches (id, home_team_id, away_team_id, kickoff_at, lock_at)
values
  (
    'a3000000-0000-0000-0000-000000000001',
    'a2000000-0000-0000-0000-000000000001',
    'a2000000-0000-0000-0000-000000000002',
    now() + interval '2 days',
    now() + interval '1 day'
  ),
  (
    'a3000000-0000-0000-0000-000000000002',
    'a2000000-0000-0000-0000-000000000001',
    'a2000000-0000-0000-0000-000000000002',
    now() + interval '3 days',
    now() + interval '2 days'
  ),
  (
    'a3000000-0000-0000-0000-000000000003',
    'a2000000-0000-0000-0000-000000000001',
    'a2000000-0000-0000-0000-000000000002',
    now() - interval '1 day',
    now() - interval '2 hours'
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"a0000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

select lives_ok(
  $$
    insert into public.predictions (
      id,
      pool_id,
      user_id,
      match_id,
      predicted_home_score,
      predicted_away_score
    )
    values (
      'a4000000-0000-0000-0000-000000000001',
      'a1000000-0000-0000-0000-000000000001',
      'a0000000-0000-0000-0000-000000000001',
      'a3000000-0000-0000-0000-000000000001',
      2,
      1
    )
  $$,
  'user can insert own prediction before lock'
);

select is(
  (
    select count(*)::int
    from public.predictions
    where id = 'a4000000-0000-0000-0000-000000000001'
  ),
  1,
  'own prediction is readable before lock'
);

select lives_ok(
  $$
    update public.predictions
    set predicted_home_score = 3
    where id = 'a4000000-0000-0000-0000-000000000001'
  $$,
  'user can update own prediction before lock'
);

select lives_ok(
  $$
    delete from public.predictions
    where id = 'a4000000-0000-0000-0000-000000000001'
  $$,
  'user can delete own prediction before lock'
);

select lives_ok(
  $$
    insert into public.predictions (
      id,
      pool_id,
      user_id,
      match_id,
      predicted_home_score,
      predicted_away_score
    )
    values (
      'a4000000-0000-0000-0000-000000000002',
      'a1000000-0000-0000-0000-000000000001',
      'a0000000-0000-0000-0000-000000000001',
      'a3000000-0000-0000-0000-000000000001',
      1,
      0
    )
  $$,
  'user can recreate own prediction before lock'
);

select throws_ok(
  $$
    insert into public.predictions (
      pool_id,
      user_id,
      match_id,
      predicted_home_score,
      predicted_away_score
    )
    values (
      'a1000000-0000-0000-0000-000000000001',
      'a0000000-0000-0000-0000-000000000002',
      'a3000000-0000-0000-0000-000000000002',
      0,
      0
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "predictions"',
  'user cannot insert prediction for another user'
);

select throws_ok(
  $$
    insert into public.predictions (
      pool_id,
      user_id,
      match_id,
      predicted_home_score,
      predicted_away_score
    )
    values (
      'a1000000-0000-0000-0000-000000000002',
      'a0000000-0000-0000-0000-000000000001',
      'a3000000-0000-0000-0000-000000000002',
      0,
      0
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "predictions"',
  'user cannot predict in a pool where they are not a member'
);

select throws_ok(
  $$
    insert into public.predictions (
      pool_id,
      user_id,
      match_id,
      predicted_home_score,
      predicted_away_score
    )
    values (
      'a1000000-0000-0000-0000-000000000001',
      'a0000000-0000-0000-0000-000000000001',
      'a3000000-0000-0000-0000-000000000003',
      1,
      1
    )
  $$,
  'P0001',
  'predictions are locked for this match',
  'user cannot insert own prediction after lock'
);

reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000002', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"a0000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);

insert into public.predictions (
  id,
  pool_id,
  user_id,
  match_id,
  predicted_home_score,
  predicted_away_score
)
values (
  'a4000000-0000-0000-0000-000000000003',
  'a1000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a3000000-0000-0000-0000-000000000001',
  2,
  2
);

reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"a0000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

select is(
  (
    select count(*)::int
    from public.predictions
    where id = 'a4000000-0000-0000-0000-000000000003'
  ),
  0,
  'other user prediction is not readable before lock'
);

reset role;

insert into public.predictions (
  id,
  pool_id,
  user_id,
  match_id,
  predicted_home_score,
  predicted_away_score
)
values
  (
    'a4000000-0000-0000-0000-000000000004',
    'a1000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002',
    'a3000000-0000-0000-0000-000000000003',
    1,
    0
  ),
  (
    'a4000000-0000-0000-0000-000000000005',
    'a1000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'a3000000-0000-0000-0000-000000000003',
    2,
    0
  ),
  (
    'a4000000-0000-0000-0000-000000000006',
    'a1000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000003',
    'a3000000-0000-0000-0000-000000000003',
    3,
    0
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"a0000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

select is(
  (
    select count(*)::int
    from public.predictions
    where id = 'a4000000-0000-0000-0000-000000000004'
  ),
  1,
  'other user prediction is readable after lock for same pool member'
);

select is(
  (
    select count(*)::int
    from public.predictions
    where id = 'a4000000-0000-0000-0000-000000000006'
  ),
  0,
  'other pool prediction is not readable'
);

select throws_ok(
  $$
    update public.predictions
    set predicted_home_score = 4
    where id = 'a4000000-0000-0000-0000-000000000005'
  $$,
  'P0001',
  'predictions are locked for this match',
  'user cannot update own prediction after lock'
);

select throws_ok(
  $$
    delete from public.predictions
    where id = 'a4000000-0000-0000-0000-000000000005'
  $$,
  'P0001',
  'predictions are locked for this match',
  'user cannot delete own prediction after lock'
);

reset role;

select * from finish();

rollback;
