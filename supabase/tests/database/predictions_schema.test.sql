begin;

select no_plan();

select has_table('public', 'predictions', 'predictions table exists');

select has_column('public', 'predictions', 'id', 'predictions.id exists');
select has_column('public', 'predictions', 'pool_id', 'predictions.pool_id exists');
select has_column('public', 'predictions', 'user_id', 'predictions.user_id exists');
select has_column('public', 'predictions', 'match_id', 'predictions.match_id exists');
select has_column('public', 'predictions', 'predicted_home_score', 'predictions.predicted_home_score exists');
select has_column('public', 'predictions', 'predicted_away_score', 'predictions.predicted_away_score exists');
select has_column('public', 'predictions', 'points', 'predictions.points exists');
select has_column('public', 'predictions', 'scored_at', 'predictions.scored_at exists');
select has_column('public', 'predictions', 'created_at', 'predictions.created_at exists');
select has_column('public', 'predictions', 'updated_at', 'predictions.updated_at exists');

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'predictions_pool_user_match_unique'
      and conrelid = 'public.predictions'::regclass
  ),
  'predictions unique pool/user/match constraint exists'
);
select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'predictions_pool_membership_fk'
      and conrelid = 'public.predictions'::regclass
  ),
  'predictions pool membership foreign key exists'
);
select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'predictions_home_score_non_negative'
      and conrelid = 'public.predictions'::regclass
  ),
  'predictions home score check exists'
);
select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'predictions_away_score_non_negative'
      and conrelid = 'public.predictions'::regclass
  ),
  'predictions away score check exists'
);
select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'predictions_points_allowed'
      and conrelid = 'public.predictions'::regclass
  ),
  'predictions points check exists'
);

select ok(
  to_regprocedure('public.get_match_outcome(int, int)') is not null,
  'public.get_match_outcome(int, int) exists'
);
select ok(
  to_regprocedure('public.calculate_prediction_points(int, int, int, int)') is not null,
  'public.calculate_prediction_points(int, int, int, int) exists'
);
select ok(
  to_regprocedure('public.is_match_locked(uuid)') is not null,
  'public.is_match_locked(uuid) exists'
);
select ok(
  to_regprocedure('public.is_prediction_visible(uuid, uuid)') is not null,
  'public.is_prediction_visible(uuid, uuid) exists'
);
select ok(
  to_regprocedure('public.score_match_predictions(uuid)') is not null,
  'public.score_match_predictions(uuid) exists'
);
select ok(
  to_regprocedure('public.get_pool_leaderboard(uuid)') is not null,
  'public.get_pool_leaderboard(uuid) exists'
);

select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'predictions_prevent_after_lock'
      and tgrelid = 'public.predictions'::regclass
      and not tgisinternal
  ),
  'predictions lock enforcement trigger exists'
);
select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'predictions_set_updated_at'
      and tgrelid = 'public.predictions'::regclass
      and not tgisinternal
  ),
  'predictions updated_at trigger exists'
);

insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('90000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'prediction-schema-1@example.test', now(), now(), now()),
  ('90000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'prediction-schema-2@example.test', now(), now(), now());

insert into public.profiles (id, email, display_name, avatar_kind)
values
  ('90000000-0000-0000-0000-000000000001', 'prediction-schema-1@example.test', 'Schema Uno', 'stitch'),
  ('90000000-0000-0000-0000-000000000002', 'prediction-schema-2@example.test', 'Schema Dos', 'stitch');

insert into public.pools (id, name, slug, created_by)
values (
  '91000000-0000-0000-0000-000000000001',
  'Pool schema predictions',
  'pool-schema-predictions',
  '90000000-0000-0000-0000-000000000001'
);

insert into public.pool_memberships (pool_id, user_id, role)
values
  ('91000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', 'owner'),
  ('91000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000002', 'member');

insert into public.teams (id, name_es, tla)
values
  ('92000000-0000-0000-0000-000000000001', 'Argentina', 'ARG'),
  ('92000000-0000-0000-0000-000000000002', 'Mexico', 'MEX');

insert into public.matches (id, home_team_id, away_team_id, kickoff_at, lock_at)
values (
  '93000000-0000-0000-0000-000000000001',
  '92000000-0000-0000-0000-000000000001',
  '92000000-0000-0000-0000-000000000002',
  now() + interval '2 days',
  now() + interval '1 day'
);

select lives_ok(
  $$
    insert into public.predictions (
      id,
      pool_id,
      user_id,
      match_id,
      predicted_home_score,
      predicted_away_score,
      points
    )
    values (
      '94000000-0000-0000-0000-000000000001',
      '91000000-0000-0000-0000-000000000001',
      '90000000-0000-0000-0000-000000000001',
      '93000000-0000-0000-0000-000000000001',
      2,
      1,
      null
    )
  $$,
  'predictions accepts valid row'
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
      '91000000-0000-0000-0000-000000000001',
      '90000000-0000-0000-0000-000000000002',
      '93000000-0000-0000-0000-000000000001',
      -1,
      0
    )
  $$,
  '23514',
  'new row for relation "predictions" violates check constraint "predictions_home_score_non_negative"',
  'predictions rejects negative home score'
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
      '91000000-0000-0000-0000-000000000001',
      '90000000-0000-0000-0000-000000000002',
      '93000000-0000-0000-0000-000000000001',
      0,
      -1
    )
  $$,
  '23514',
  'new row for relation "predictions" violates check constraint "predictions_away_score_non_negative"',
  'predictions rejects negative away score'
);

select throws_ok(
  $$
    insert into public.predictions (
      pool_id,
      user_id,
      match_id,
      predicted_home_score,
      predicted_away_score,
      points
    )
    values (
      '91000000-0000-0000-0000-000000000001',
      '90000000-0000-0000-0000-000000000002',
      '93000000-0000-0000-0000-000000000001',
      1,
      1,
      2
    )
  $$,
  '23514',
  'new row for relation "predictions" violates check constraint "predictions_points_allowed"',
  'predictions rejects unsupported points'
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
      '91000000-0000-0000-0000-000000000001',
      '90000000-0000-0000-0000-000000000001',
      '93000000-0000-0000-0000-000000000001',
      3,
      0
    )
  $$,
  '23505',
  'duplicate key value violates unique constraint "predictions_pool_user_match_unique"',
  'predictions rejects duplicate pool/user/match'
);

select * from finish();

rollback;
