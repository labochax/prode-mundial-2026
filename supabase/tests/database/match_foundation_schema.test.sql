begin;

select no_plan();

select has_table('public', 'teams', 'teams table exists');
select has_table('public', 'stadiums', 'stadiums table exists');
select has_table('public', 'matches', 'matches table exists');

select has_column('public', 'teams', 'id', 'teams.id exists');
select has_column('public', 'teams', 'football_data_id', 'teams.football_data_id exists');
select has_column('public', 'teams', 'sportsdb_id', 'teams.sportsdb_id exists');
select has_column('public', 'teams', 'name_es', 'teams.name_es exists');
select has_column('public', 'teams', 'name_en', 'teams.name_en exists');
select has_column('public', 'teams', 'short_name', 'teams.short_name exists');
select has_column('public', 'teams', 'tla', 'teams.tla exists');
select has_column('public', 'teams', 'flag_url', 'teams.flag_url exists');
select has_column('public', 'teams', 'badge_url', 'teams.badge_url exists');
select has_column('public', 'teams', 'logo_url', 'teams.logo_url exists');
select has_column('public', 'teams', 'jersey_url', 'teams.jersey_url exists');
select has_column('public', 'teams', 'fanart_url', 'teams.fanart_url exists');
select has_column('public', 'teams', 'raw_json', 'teams.raw_json exists');
select has_column('public', 'teams', 'thesportsdb_raw_json', 'teams.thesportsdb_raw_json exists');
select has_column('public', 'teams', 'assets_last_synced_at', 'teams.assets_last_synced_at exists');
select has_column('public', 'teams', 'team_aliases', 'teams.team_aliases exists');
select has_column('public', 'teams', 'created_at', 'teams.created_at exists');
select has_column('public', 'teams', 'updated_at', 'teams.updated_at exists');

select has_column('public', 'stadiums', 'id', 'stadiums.id exists');
select has_column('public', 'stadiums', 'name', 'stadiums.name exists');
select has_column('public', 'stadiums', 'city', 'stadiums.city exists');
select has_column('public', 'stadiums', 'country', 'stadiums.country exists');
select has_column('public', 'stadiums', 'image_url', 'stadiums.image_url exists');
select has_column('public', 'stadiums', 'raw_json', 'stadiums.raw_json exists');
select has_column('public', 'stadiums', 'created_at', 'stadiums.created_at exists');
select has_column('public', 'stadiums', 'updated_at', 'stadiums.updated_at exists');

select has_column('public', 'matches', 'id', 'matches.id exists');
select has_column('public', 'matches', 'football_data_id', 'matches.football_data_id exists');
select has_column('public', 'matches', 'match_number', 'matches.match_number exists');
select has_column('public', 'matches', 'stage', 'matches.stage exists');
select has_column('public', 'matches', 'group_code', 'matches.group_code exists');
select has_column('public', 'matches', 'home_team_id', 'matches.home_team_id exists');
select has_column('public', 'matches', 'away_team_id', 'matches.away_team_id exists');
select has_column('public', 'matches', 'kickoff_at', 'matches.kickoff_at exists');
select has_column('public', 'matches', 'lock_at', 'matches.lock_at exists');
select has_column('public', 'matches', 'stadium_id', 'matches.stadium_id exists');
select has_column('public', 'matches', 'status', 'matches.status exists');
select has_column('public', 'matches', 'minute', 'matches.minute exists');
select has_column('public', 'matches', 'home_score', 'matches.home_score exists');
select has_column('public', 'matches', 'away_score', 'matches.away_score exists');
select has_column('public', 'matches', 'winner', 'matches.winner exists');
select has_column('public', 'matches', 'raw_json', 'matches.raw_json exists');
select has_column('public', 'matches', 'last_synced_at', 'matches.last_synced_at exists');
select has_column('public', 'matches', 'created_at', 'matches.created_at exists');
select has_column('public', 'matches', 'updated_at', 'matches.updated_at exists');

select ok(
  to_regprocedure('public.get_lock_minutes_before_kickoff()') is not null,
  'public.get_lock_minutes_before_kickoff() function exists'
);
select ok(
  to_regprocedure('public.compute_match_lock_at(timestamptz)') is not null,
  'public.compute_match_lock_at(timestamptz) function exists'
);
select ok(
  to_regprocedure('public.set_match_lock_at()') is not null,
  'public.set_match_lock_at() trigger function exists'
);

select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'teams_set_updated_at'
      and tgrelid = 'public.teams'::regclass
      and not tgisinternal
  ),
  'teams updated_at trigger exists'
);
select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'stadiums_set_updated_at'
      and tgrelid = 'public.stadiums'::regclass
      and not tgisinternal
  ),
  'stadiums updated_at trigger exists'
);
select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'matches_set_updated_at'
      and tgrelid = 'public.matches'::regclass
      and not tgisinternal
  ),
  'matches updated_at trigger exists'
);
select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'matches_set_lock_at'
      and tgrelid = 'public.matches'::regclass
      and not tgisinternal
  ),
  'matches lock_at trigger exists'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'matches_status_allowed'
      and conrelid = 'public.matches'::regclass
  ),
  'matches status check constraint exists'
);
select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'matches_winner_allowed'
      and conrelid = 'public.matches'::regclass
  ),
  'matches winner check constraint exists'
);
select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'matches_home_score_non_negative'
      and conrelid = 'public.matches'::regclass
  ),
  'matches home_score check constraint exists'
);
select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'matches_away_score_non_negative'
      and conrelid = 'public.matches'::regclass
  ),
  'matches away_score check constraint exists'
);
select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'matches_minute_non_negative'
      and conrelid = 'public.matches'::regclass
  ),
  'matches minute check constraint exists'
);

insert into public.teams (id, football_data_id, name_es, name_en, short_name, tla)
values
  ('50000000-0000-0000-0000-000000000001', 101, 'Argentina', 'Argentina', 'Argentina', 'ARG'),
  ('50000000-0000-0000-0000-000000000002', 102, 'Mexico', 'Mexico', 'Mexico', 'MEX'),
  ('50000000-0000-0000-0000-000000000003', 103, 'Brasil', 'Brazil', 'Brasil', 'BRA');

insert into public.stadiums (id, name, city, country)
values (
  '60000000-0000-0000-0000-000000000001',
  'Estadio de prueba',
  'Ciudad de prueba',
  'Pais de prueba'
);

insert into public.matches (
  id,
  football_data_id,
  match_number,
  stage,
  group_code,
  home_team_id,
  away_team_id,
  kickoff_at,
  stadium_id
)
values (
  '70000000-0000-0000-0000-000000000001',
  9001,
  1,
  'GROUP_STAGE',
  'A',
  '50000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000002',
  '2026-06-11 16:00:00+00',
  '60000000-0000-0000-0000-000000000001'
);

select is(
  (
    select lock_at
    from public.matches
    where id = '70000000-0000-0000-0000-000000000001'
  ),
  '2026-06-11 15:50:00+00'::timestamptz,
  'lock_at defaults to kickoff_at minus 10 minutes'
);

update public.settings
set value = '15'::jsonb
where key = 'lock_minutes_before_kickoff';

insert into public.matches (
  id,
  home_team_id,
  away_team_id,
  kickoff_at
)
values (
  '70000000-0000-0000-0000-000000000002',
  '50000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000003',
  '2026-06-12 20:30:00+00'
);

select is(
  (
    select lock_at
    from public.matches
    where id = '70000000-0000-0000-0000-000000000002'
  ),
  '2026-06-12 20:15:00+00'::timestamptz,
  'lock_at uses changed lock_minutes_before_kickoff setting'
);

update public.matches
set kickoff_at = '2026-06-12 21:00:00+00'
where id = '70000000-0000-0000-0000-000000000002';

select is(
  (
    select lock_at
    from public.matches
    where id = '70000000-0000-0000-0000-000000000002'
  ),
  '2026-06-12 20:45:00+00'::timestamptz,
  'lock_at recalculates when kickoff_at changes and lock_at is not explicit'
);

insert into public.matches (
  id,
  home_team_id,
  away_team_id,
  kickoff_at,
  lock_at
)
values (
  '70000000-0000-0000-0000-000000000003',
  '50000000-0000-0000-0000-000000000002',
  '50000000-0000-0000-0000-000000000003',
  '2026-06-13 18:00:00+00',
  '2026-06-13 17:30:00+00'
);

select is(
  (
    select lock_at
    from public.matches
    where id = '70000000-0000-0000-0000-000000000003'
  ),
  '2026-06-13 17:30:00+00'::timestamptz,
  'explicit lock_at is honored on insert'
);

select throws_ok(
  $$
    insert into public.matches (home_team_id, away_team_id, kickoff_at, status)
    values (
      '50000000-0000-0000-0000-000000000001',
      '50000000-0000-0000-0000-000000000002',
      '2026-06-14 18:00:00+00',
      'UNKNOWN'
    )
  $$,
  '23514',
  'new row for relation "matches" violates check constraint "matches_status_allowed"',
  'matches rejects unsupported status'
);

select throws_ok(
  $$
    insert into public.matches (home_team_id, away_team_id, kickoff_at, winner)
    values (
      '50000000-0000-0000-0000-000000000001',
      '50000000-0000-0000-0000-000000000002',
      '2026-06-14 18:00:00+00',
      'PENALTIES'
    )
  $$,
  '23514',
  'new row for relation "matches" violates check constraint "matches_winner_allowed"',
  'matches rejects unsupported winner'
);

select throws_ok(
  $$
    insert into public.matches (home_team_id, away_team_id, kickoff_at, home_score)
    values (
      '50000000-0000-0000-0000-000000000001',
      '50000000-0000-0000-0000-000000000002',
      '2026-06-14 18:00:00+00',
      -1
    )
  $$,
  '23514',
  'new row for relation "matches" violates check constraint "matches_home_score_non_negative"',
  'matches rejects negative home_score'
);

select throws_ok(
  $$
    insert into public.matches (home_team_id, away_team_id, kickoff_at, away_score)
    values (
      '50000000-0000-0000-0000-000000000001',
      '50000000-0000-0000-0000-000000000002',
      '2026-06-14 18:00:00+00',
      -1
    )
  $$,
  '23514',
  'new row for relation "matches" violates check constraint "matches_away_score_non_negative"',
  'matches rejects negative away_score'
);

select throws_ok(
  $$
    insert into public.matches (home_team_id, away_team_id, kickoff_at, minute)
    values (
      '50000000-0000-0000-0000-000000000001',
      '50000000-0000-0000-0000-000000000002',
      '2026-06-14 18:00:00+00',
      -1
    )
  $$,
  '23514',
  'new row for relation "matches" violates check constraint "matches_minute_non_negative"',
  'matches rejects negative minute'
);

select lives_ok(
  $$
    insert into public.matches (
      home_team_id,
      away_team_id,
      kickoff_at,
      status,
      winner,
      home_score,
      away_score,
      minute
    )
    values (
      '50000000-0000-0000-0000-000000000001',
      '50000000-0000-0000-0000-000000000002',
      '2026-06-15 18:00:00+00',
      'FINISHED',
      'DRAW',
      1,
      1,
      90
    )
  $$,
  'matches accepts valid finished result values'
);

select * from finish();

rollback;
