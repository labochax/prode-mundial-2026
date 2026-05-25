begin;

select no_plan();

select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.tournament_predictions'::regclass
  ),
  'RLS is enabled on tournament_predictions'
);

insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('c0000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'tournament-rls-a@example.test', now(), now(), now()),
  ('c0000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'tournament-rls-b@example.test', now(), now(), now()),
  ('c0000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'tournament-rls-c@example.test', now(), now(), now());

insert into public.profiles (id, email, display_name, avatar_kind)
values
  ('c0000000-0000-0000-0000-000000000001', 'tournament-rls-a@example.test', 'Usuario A', 'stitch'),
  ('c0000000-0000-0000-0000-000000000002', 'tournament-rls-b@example.test', 'Usuario B', 'stitch'),
  ('c0000000-0000-0000-0000-000000000003', 'tournament-rls-c@example.test', 'Usuario C', 'stitch');

insert into public.pools (id, name, slug, created_by, is_public)
values
  ('c1000000-0000-0000-0000-000000000001', 'Pool RLS Mundial A', 'pool-tournament-rls-a', 'c0000000-0000-0000-0000-000000000001', false),
  ('c1000000-0000-0000-0000-000000000002', 'Pool RLS Mundial B', 'pool-tournament-rls-b', 'c0000000-0000-0000-0000-000000000003', false);

insert into public.pool_memberships (pool_id, user_id, role)
values
  ('c1000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'owner'),
  ('c1000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'member'),
  ('c1000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'owner');

insert into public.teams (id, name_es, tla)
values
  ('c2000000-0000-0000-0000-000000000001', 'Equipo Uno', 'U1'),
  ('c2000000-0000-0000-0000-000000000002', 'Equipo Dos', 'U2'),
  ('c2000000-0000-0000-0000-000000000003', 'Equipo Tres', 'U3'),
  ('c2000000-0000-0000-0000-000000000004', 'Equipo Cuatro', 'U4');

insert into public.matches (
  id,
  football_data_id,
  home_team_id,
  away_team_id,
  kickoff_at
)
values (
  'c3000000-0000-0000-0000-000000000001',
  910001,
  'c2000000-0000-0000-0000-000000000001',
  'c2000000-0000-0000-0000-000000000002',
  now() + interval '10 hours'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c0000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"c0000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

select lives_ok(
  $$
    insert into public.tournament_predictions (
      id,
      pool_id,
      user_id,
      bracket_json,
      round_of_16_team_ids,
      quarterfinal_team_ids,
      semifinal_team_ids,
      champion_team_id,
      runner_up_team_id,
      third_place_team_id,
      fourth_place_team_id
    )
    values (
      'c4000000-0000-0000-0000-000000000001',
      'c1000000-0000-0000-0000-000000000001',
      'c0000000-0000-0000-0000-000000000001',
      '{"status":"complete"}'::jsonb,
      array['c2000000-0000-0000-0000-000000000001']::uuid[],
      array['c2000000-0000-0000-0000-000000000001']::uuid[],
      array['c2000000-0000-0000-0000-000000000001']::uuid[],
      'c2000000-0000-0000-0000-000000000001',
      'c2000000-0000-0000-0000-000000000002',
      'c2000000-0000-0000-0000-000000000003',
      'c2000000-0000-0000-0000-000000000004'
    )
  $$,
  'user can insert own tournament prediction before lock'
);

select is(
  (
    select count(*)::int
    from public.tournament_predictions
    where id = 'c4000000-0000-0000-0000-000000000001'
  ),
  1,
  'user can read own tournament prediction before lock'
);

select lives_ok(
  $$
    update public.tournament_predictions
    set bracket_json = '{"status":"updated"}'::jsonb
    where id = 'c4000000-0000-0000-0000-000000000001'
  $$,
  'user can update own tournament prediction before lock'
);

select throws_ok(
  $$
    insert into public.tournament_predictions (
      pool_id,
      user_id,
      bracket_json,
      champion_team_id,
      runner_up_team_id,
      third_place_team_id,
      fourth_place_team_id
    )
    values (
      'c1000000-0000-0000-0000-000000000001',
      'c0000000-0000-0000-0000-000000000002',
      '{}'::jsonb,
      'c2000000-0000-0000-0000-000000000001',
      'c2000000-0000-0000-0000-000000000002',
      'c2000000-0000-0000-0000-000000000003',
      'c2000000-0000-0000-0000-000000000004'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "tournament_predictions"',
  'user cannot insert tournament prediction for another user'
);

reset role;

insert into public.tournament_predictions (
  id,
  pool_id,
  user_id,
  locked_at,
  bracket_json,
  champion_team_id,
  runner_up_team_id,
  third_place_team_id,
  fourth_place_team_id
)
values
  (
    'c4000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    now() - interval '1 hour',
    '{"status":"locked"}'::jsonb,
    'c2000000-0000-0000-0000-000000000002',
    'c2000000-0000-0000-0000-000000000001',
    'c2000000-0000-0000-0000-000000000003',
    'c2000000-0000-0000-0000-000000000004'
  ),
  (
    'c4000000-0000-0000-0000-000000000003',
    'c1000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000003',
    now() - interval '1 hour',
    '{"status":"other-pool"}'::jsonb,
    'c2000000-0000-0000-0000-000000000003',
    'c2000000-0000-0000-0000-000000000001',
    'c2000000-0000-0000-0000-000000000002',
    'c2000000-0000-0000-0000-000000000004'
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c0000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"c0000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

select is(
  (
    select count(*)::int
    from public.tournament_predictions
    where id = 'c4000000-0000-0000-0000-000000000002'
  ),
  1,
  'same-pool member can read another tournament prediction after lock'
);

select is(
  (
    select count(*)::int
    from public.tournament_predictions
    where id = 'c4000000-0000-0000-0000-000000000003'
  ),
  0,
  'non-member cannot read private pool tournament prediction'
);

select lives_ok(
  $$
    update public.tournament_predictions
    set bracket_json = '{"status":"attempted-other-update"}'::jsonb
    where id = 'c4000000-0000-0000-0000-000000000002'
  $$,
  'user update against another user tournament prediction is ignored by RLS'
);

select isnt(
  (
    select bracket_json->>'status'
    from public.tournament_predictions
    where id = 'c4000000-0000-0000-0000-000000000002'
  ),
  'attempted-other-update',
  'user cannot edit another user tournament prediction'
);

reset role;

update public.tournament_predictions
set locked_at = now() - interval '1 hour'
where id = 'c4000000-0000-0000-0000-000000000001';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c0000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"c0000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

select throws_ok(
  $$
    update public.tournament_predictions
    set bracket_json = '{"status":"locked-update"}'::jsonb
    where id = 'c4000000-0000-0000-0000-000000000001'
  $$,
  'P0001',
  'tournament prediction is locked',
  'authenticated user cannot update after lock'
);

reset role;

select * from finish();

rollback;
