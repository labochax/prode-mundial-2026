begin;

select no_plan();

select has_table('public', 'tournament_predictions', 'tournament_predictions table exists');

select has_column('public', 'tournament_predictions', 'id', 'tournament_predictions.id exists');
select has_column('public', 'tournament_predictions', 'pool_id', 'tournament_predictions.pool_id exists');
select has_column('public', 'tournament_predictions', 'user_id', 'tournament_predictions.user_id exists');
select has_column('public', 'tournament_predictions', 'locked_at', 'tournament_predictions.locked_at exists');
select has_column('public', 'tournament_predictions', 'bracket_json', 'tournament_predictions.bracket_json exists');
select has_column('public', 'tournament_predictions', 'round_of_16_team_ids', 'tournament_predictions.round_of_16_team_ids exists');
select has_column('public', 'tournament_predictions', 'quarterfinal_team_ids', 'tournament_predictions.quarterfinal_team_ids exists');
select has_column('public', 'tournament_predictions', 'semifinal_team_ids', 'tournament_predictions.semifinal_team_ids exists');
select has_column('public', 'tournament_predictions', 'champion_team_id', 'tournament_predictions.champion_team_id exists');
select has_column('public', 'tournament_predictions', 'runner_up_team_id', 'tournament_predictions.runner_up_team_id exists');
select has_column('public', 'tournament_predictions', 'third_place_team_id', 'tournament_predictions.third_place_team_id exists');
select has_column('public', 'tournament_predictions', 'fourth_place_team_id', 'tournament_predictions.fourth_place_team_id exists');
select has_column('public', 'tournament_predictions', 'bonus_points', 'tournament_predictions.bonus_points exists');
select has_column('public', 'tournament_predictions', 'scored_at', 'tournament_predictions.scored_at exists');
select has_column('public', 'tournament_predictions', 'created_at', 'tournament_predictions.created_at exists');
select has_column('public', 'tournament_predictions', 'updated_at', 'tournament_predictions.updated_at exists');

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'tournament_predictions_pool_user_unique'
      and conrelid = 'public.tournament_predictions'::regclass
  ),
  'tournament_predictions unique pool/user constraint exists'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'tournament_predictions_pool_membership_fk'
      and conrelid = 'public.tournament_predictions'::regclass
  ),
  'tournament_predictions pool membership foreign key exists'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'tournament_predictions_bonus_points_non_negative'
      and conrelid = 'public.tournament_predictions'::regclass
  ),
  'tournament_predictions bonus points check exists'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'tournament_predictions_final_teams_distinct'
      and conrelid = 'public.tournament_predictions'::regclass
  ),
  'tournament_predictions distinct final teams check exists'
);

select ok(
  to_regprocedure('public.get_tournament_lock_at()') is not null,
  'public.get_tournament_lock_at() exists'
);

select ok(
  to_regprocedure('public.prevent_tournament_prediction_after_lock()') is not null,
  'public.prevent_tournament_prediction_after_lock() exists'
);

select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'tournament_predictions_prevent_after_lock'
      and tgrelid = 'public.tournament_predictions'::regclass
      and not tgisinternal
  ),
  'tournament_predictions lock enforcement trigger exists'
);

select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'tournament_predictions_set_updated_at'
      and tgrelid = 'public.tournament_predictions'::regclass
      and not tgisinternal
  ),
  'tournament_predictions updated_at trigger exists'
);

insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values ('b0000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'tournament-schema@example.test', now(), now(), now());

insert into public.profiles (id, email, display_name, avatar_kind)
values ('b0000000-0000-0000-0000-000000000001', 'tournament-schema@example.test', 'Schema Mundial', 'stitch');

insert into public.pools (id, name, slug, created_by)
values (
  'b1000000-0000-0000-0000-000000000001',
  'Pool schema Mi Mundial',
  'pool-schema-mi-mundial',
  'b0000000-0000-0000-0000-000000000001'
);

insert into public.pool_memberships (pool_id, user_id, role)
values ('b1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'owner');

insert into public.teams (id, name_es, tla)
values
  ('b2000000-0000-0000-0000-000000000001', 'Equipo Uno', 'U1'),
  ('b2000000-0000-0000-0000-000000000002', 'Equipo Dos', 'U2'),
  ('b2000000-0000-0000-0000-000000000003', 'Equipo Tres', 'U3'),
  ('b2000000-0000-0000-0000-000000000004', 'Equipo Cuatro', 'U4');

insert into public.matches (
  id,
  football_data_id,
  home_team_id,
  away_team_id,
  kickoff_at
)
values
  (
    'b3000000-0000-0000-0000-000000000001',
    900001,
    'b2000000-0000-0000-0000-000000000001',
    'b2000000-0000-0000-0000-000000000002',
    now() + interval '8 hours'
  ),
  (
    'b3000000-0000-0000-0000-000000000002',
    900002,
    'b2000000-0000-0000-0000-000000000003',
    'b2000000-0000-0000-0000-000000000004',
    now() + interval '1 day'
  ),
  (
    'b3000000-0000-0000-0000-000000000003',
    null,
    'b2000000-0000-0000-0000-000000000001',
    'b2000000-0000-0000-0000-000000000003',
    now() + interval '1 hour'
  );

select is(
  public.get_tournament_lock_at(),
  (
    select kickoff_at
    from public.matches
    where football_data_id = 900001
  ),
  'get_tournament_lock_at returns first official kickoff and ignores local seed fallback'
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
      'b4000000-0000-0000-0000-000000000001',
      'b1000000-0000-0000-0000-000000000001',
      'b0000000-0000-0000-0000-000000000001',
      '{"status":"complete"}'::jsonb,
      array['b2000000-0000-0000-0000-000000000001']::uuid[],
      array['b2000000-0000-0000-0000-000000000001']::uuid[],
      array['b2000000-0000-0000-0000-000000000001']::uuid[],
      'b2000000-0000-0000-0000-000000000001',
      'b2000000-0000-0000-0000-000000000002',
      'b2000000-0000-0000-0000-000000000003',
      'b2000000-0000-0000-0000-000000000004'
    )
  $$,
  'tournament_predictions accepts valid row'
);

select is(
  (
    select locked_at
    from public.tournament_predictions
    where id = 'b4000000-0000-0000-0000-000000000001'
  ),
  public.get_tournament_lock_at(),
  'tournament_predictions fills locked_at from tournament lock helper'
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
      'b1000000-0000-0000-0000-000000000001',
      'b0000000-0000-0000-0000-000000000001',
      '{}'::jsonb,
      'b2000000-0000-0000-0000-000000000001',
      'b2000000-0000-0000-0000-000000000002',
      'b2000000-0000-0000-0000-000000000003',
      'b2000000-0000-0000-0000-000000000004'
    )
  $$,
  '23505',
  'duplicate key value violates unique constraint "tournament_predictions_pool_user_unique"',
  'tournament_predictions rejects duplicate pool/user rows'
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
      fourth_place_team_id,
      bonus_points
    )
    values (
      'b1000000-0000-0000-0000-000000000001',
      'b0000000-0000-0000-0000-000000000001',
      '{}'::jsonb,
      'b2000000-0000-0000-0000-000000000001',
      'b2000000-0000-0000-0000-000000000002',
      'b2000000-0000-0000-0000-000000000003',
      'b2000000-0000-0000-0000-000000000004',
      -1
    )
  $$,
  '23514',
  'new row for relation "tournament_predictions" violates check constraint "tournament_predictions_bonus_points_non_negative"',
  'tournament_predictions rejects negative bonus points'
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
      'b1000000-0000-0000-0000-000000000001',
      'b0000000-0000-0000-0000-000000000001',
      '{}'::jsonb,
      'b2000000-0000-0000-0000-000000000001',
      'b2000000-0000-0000-0000-000000000001',
      'b2000000-0000-0000-0000-000000000003',
      'b2000000-0000-0000-0000-000000000004'
    )
  $$,
  '23514',
  'new row for relation "tournament_predictions" violates check constraint "tournament_predictions_final_teams_distinct"',
  'tournament_predictions rejects repeated final placement teams'
);

select * from finish();

rollback;
