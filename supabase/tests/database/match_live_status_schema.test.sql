begin;

select no_plan();

insert into public.teams (id, football_data_id, name_es, name_en, short_name, tla)
values
  ('95000000-0000-0000-0000-000000000001', 9501, 'Equipo Live A', 'Live A', 'Live A', 'LVA'),
  ('95000000-0000-0000-0000-000000000002', 9502, 'Equipo Live B', 'Live B', 'Live B', 'LVB');

select lives_ok(
  $$
    insert into public.matches (
      football_data_id,
      home_team_id,
      away_team_id,
      kickoff_at,
      status
    )
    select
      9600 + row_number() over (),
      '95000000-0000-0000-0000-000000000001',
      '95000000-0000-0000-0000-000000000002',
      '2026-06-11 16:00:00+00'::timestamptz + ((row_number() over ())::text || ' minutes')::interval,
      status
    from unnest(array[
      'SCHEDULED',
      'TIMED',
      'IN_PLAY',
      'PAUSED',
      'EXTRA_TIME',
      'PENALTY_SHOOTOUT',
      'FINISHED',
      'SUSPENDED',
      'POSTPONED',
      'CANCELLED',
      'AWARDED'
    ]) as allowed_statuses(status)
  $$,
  'matches accepts all supported Football-Data match statuses'
);

select is(
  (
    select count(*)::int
    from public.matches
    where football_data_id between 9601 and 9611
  ),
  11,
  'all supported live/result statuses were inserted'
);

select * from finish();

rollback;
