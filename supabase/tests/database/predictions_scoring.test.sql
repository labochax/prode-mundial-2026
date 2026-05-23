begin;

select no_plan();

select is(
  public.get_match_outcome(2, 1),
  'HOME_TEAM',
  'get_match_outcome returns HOME_TEAM'
);
select is(
  public.get_match_outcome(1, 2),
  'AWAY_TEAM',
  'get_match_outcome returns AWAY_TEAM'
);
select is(
  public.get_match_outcome(1, 1),
  'DRAW',
  'get_match_outcome returns DRAW'
);

select is(
  public.calculate_prediction_points(2, 1, 2, 1),
  3,
  'exact score returns 3 points'
);
select is(
  public.calculate_prediction_points(1, 0, 2, 1),
  1,
  'same winner returns 1 point'
);
select is(
  public.calculate_prediction_points(2, 2, 1, 1),
  1,
  'same draw outcome returns 1 point when not exact'
);
select is(
  public.calculate_prediction_points(0, 1, 2, 1),
  0,
  'wrong outcome returns 0 points'
);
select is(
  public.calculate_prediction_points(1, 1, null, 1),
  null,
  'missing actual score returns null'
);

insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('b0000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'score-a@example.test', now(), now(), now()),
  ('b0000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'score-b@example.test', now(), now(), now()),
  ('b0000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'score-c@example.test', now(), now(), now()),
  ('b0000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'score-d@example.test', now(), now(), now()),
  ('b0000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'score-outsider@example.test', now(), now(), now());

insert into public.profiles (id, email, display_name, avatar_kind, avatar_value)
values
  ('b0000000-0000-0000-0000-000000000001', 'score-a@example.test', 'Ana Exacta', 'stitch', 'messi'),
  ('b0000000-0000-0000-0000-000000000002', 'score-b@example.test', 'Bruno Mixto', 'stitch', 'riquelme'),
  ('b0000000-0000-0000-0000-000000000003', 'score-c@example.test', 'Carla Cero', 'stitch', 'dibu'),
  ('b0000000-0000-0000-0000-000000000004', 'score-d@example.test', 'Diego Sin Puntos', 'stitch', 'alvarez'),
  ('b0000000-0000-0000-0000-000000000005', 'score-outsider@example.test', 'Externo', 'stitch', 'maradona');

insert into public.pools (id, name, slug, created_by)
values (
  'b1000000-0000-0000-0000-000000000001',
  'Pool scoring',
  'pool-scoring',
  'b0000000-0000-0000-0000-000000000001'
);

insert into public.pool_memberships (pool_id, user_id, role)
values
  ('b1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'owner'),
  ('b1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'member'),
  ('b1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'member'),
  ('b1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'member');

insert into public.teams (id, name_es, tla)
values
  ('b2000000-0000-0000-0000-000000000001', 'Argentina', 'ARG'),
  ('b2000000-0000-0000-0000-000000000002', 'Mexico', 'MEX');

insert into public.matches (
  id,
  home_team_id,
  away_team_id,
  kickoff_at,
  lock_at,
  status,
  home_score,
  away_score
)
values
  (
    'b3000000-0000-0000-0000-000000000001',
    'b2000000-0000-0000-0000-000000000001',
    'b2000000-0000-0000-0000-000000000002',
    now() - interval '2 days',
    now() - interval '3 days',
    'FINISHED',
    2,
    1
  ),
  (
    'b3000000-0000-0000-0000-000000000002',
    'b2000000-0000-0000-0000-000000000001',
    'b2000000-0000-0000-0000-000000000002',
    now() - interval '1 day',
    now() - interval '2 days',
    'FINISHED',
    1,
    1
  ),
  (
    'b3000000-0000-0000-0000-000000000003',
    'b2000000-0000-0000-0000-000000000001',
    'b2000000-0000-0000-0000-000000000002',
    now() + interval '1 day',
    now() + interval '12 hours',
    'SCHEDULED',
    null,
    null
  );

insert into public.predictions (
  pool_id,
  user_id,
  match_id,
  predicted_home_score,
  predicted_away_score
)
values
  ('b1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'b3000000-0000-0000-0000-000000000001', 2, 1),
  ('b1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'b3000000-0000-0000-0000-000000000001', 1, 0),
  ('b1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'b3000000-0000-0000-0000-000000000001', 0, 1),
  ('b1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'b3000000-0000-0000-0000-000000000002', 1, 1),
  ('b1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'b3000000-0000-0000-0000-000000000002', 2, 2),
  ('b1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'b3000000-0000-0000-0000-000000000002', 2, 1);

select is(
  public.score_match_predictions('b3000000-0000-0000-0000-000000000003'),
  0,
  'score_match_predictions does nothing for unplayed matches'
);

select is(
  public.score_match_predictions('b3000000-0000-0000-0000-000000000001'),
  3,
  'score_match_predictions scores all predictions for finished match'
);
select is(
  public.score_match_predictions('b3000000-0000-0000-0000-000000000002'),
  3,
  'score_match_predictions scores draw match predictions'
);

select is(
  (
    select sum(points)::int
    from public.predictions
    where user_id = 'b0000000-0000-0000-0000-000000000001'
  ),
  6,
  'exact user receives 6 total points'
);
select is(
  (
    select sum(points)::int
    from public.predictions
    where user_id = 'b0000000-0000-0000-0000-000000000002'
  ),
  2,
  'mixed user receives 2 total points'
);
select is(
  (
    select sum(points)::int
    from public.predictions
    where user_id = 'b0000000-0000-0000-0000-000000000003'
  ),
  0,
  'wrong user receives 0 total points'
);
select ok(
  exists (
    select 1
    from public.predictions
    where match_id = 'b3000000-0000-0000-0000-000000000001'
      and points is not null
      and scored_at is not null
  ),
  'scoring sets scored_at'
);

select is(
  public.score_match_predictions('b3000000-0000-0000-0000-000000000001'),
  3,
  'score_match_predictions is repeatable for already scored match'
);
select is(
  (
    select sum(points)::int
    from public.predictions
    where user_id = 'b0000000-0000-0000-0000-000000000001'
  ),
  6,
  'repeat scoring keeps same final point total'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"b0000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

select is(
  (
    select total_points
    from public.get_pool_leaderboard('b1000000-0000-0000-0000-000000000001')
    where user_id = 'b0000000-0000-0000-0000-000000000001'
  ),
  6,
  'leaderboard returns total points for member'
);
select is(
  (
    select exact_hits
    from public.get_pool_leaderboard('b1000000-0000-0000-0000-000000000001')
    where user_id = 'b0000000-0000-0000-0000-000000000001'
  ),
  2,
  'leaderboard returns exact hits'
);
select is(
  (
    select outcome_hits
    from public.get_pool_leaderboard('b1000000-0000-0000-0000-000000000001')
    where user_id = 'b0000000-0000-0000-0000-000000000002'
  ),
  2,
  'leaderboard returns outcome hits'
);
select is(
  (
    select predicted_matches_count
    from public.get_pool_leaderboard('b1000000-0000-0000-0000-000000000001')
    where user_id = 'b0000000-0000-0000-0000-000000000004'
  ),
  0,
  'leaderboard includes pool member with no scored predictions'
);
select is(
  (
    select rank
    from public.get_pool_leaderboard('b1000000-0000-0000-0000-000000000001')
    where user_id = 'b0000000-0000-0000-0000-000000000001'
  ),
  1::bigint,
  'leaderboard ranks top user first'
);

reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-000000000005', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"b0000000-0000-0000-0000-000000000005","role":"authenticated"}',
  true
);

select is(
  (
    select count(*)::int
    from public.get_pool_leaderboard('b1000000-0000-0000-0000-000000000001')
  ),
  0,
  'leaderboard returns no rows for non-member'
);

reset role;

select * from finish();

rollback;
