-- Local development seed data for Prode Mundial 2026.
-- These rows are fake UI fixtures, not official FIFA World Cup matches.
-- Auth users, profiles, and predictions are intentionally not seeded.

insert into public.pools (
  id,
  name,
  slug,
  description,
  is_public
)
values (
  '00000000-0000-4000-8000-000000000001',
  'Prode Mundial 2026',
  'prode-mundial-2026',
  'Pool local de desarrollo para probar el MVP visual.',
  true
)
on conflict (id) do update
set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  is_public = excluded.is_public;

insert into public.teams (
  id,
  football_data_id,
  name_es,
  name_en,
  short_name,
  tla,
  flag_url
)
values
  (
    '00000000-0000-4000-8000-000000000101',
    900001,
    'Argentina',
    'Argentina',
    'Argentina',
    'ARG',
    '/stitch/flags/argentina.png'
  ),
  (
    '00000000-0000-4000-8000-000000000102',
    900002,
    'México',
    'Mexico',
    'México',
    'MEX',
    '/stitch/flags/mexico.png'
  ),
  (
    '00000000-0000-4000-8000-000000000103',
    900003,
    'Brasil',
    'Brazil',
    'Brasil',
    'BRA',
    '/stitch/flags/brasil.png'
  ),
  (
    '00000000-0000-4000-8000-000000000104',
    900004,
    'Alemania',
    'Germany',
    'Alemania',
    'GER',
    null
  ),
  (
    '00000000-0000-4000-8000-000000000105',
    900005,
    'España',
    'Spain',
    'España',
    'ESP',
    null
  ),
  (
    '00000000-0000-4000-8000-000000000106',
    900006,
    'Japón',
    'Japan',
    'Japón',
    'JPN',
    null
  ),
  (
    '00000000-0000-4000-8000-000000000107',
    900007,
    'Uruguay',
    'Uruguay',
    'Uruguay',
    'URU',
    null
  ),
  (
    '00000000-0000-4000-8000-000000000108',
    900008,
    'Francia',
    'France',
    'Francia',
    'FRA',
    '/stitch/flags/francia.png'
  )
on conflict (id) do update
set
  football_data_id = excluded.football_data_id,
  name_es = excluded.name_es,
  name_en = excluded.name_en,
  short_name = excluded.short_name,
  tla = excluded.tla,
  flag_url = excluded.flag_url;

insert into public.stadiums (
  id,
  name,
  city,
  country
)
values
  (
    '00000000-0000-4000-8000-000000000201',
    'Estadio Azteca',
    'Ciudad de México',
    'México'
  ),
  (
    '00000000-0000-4000-8000-000000000202',
    'SoFi Stadium',
    'Los Ángeles',
    'Estados Unidos'
  ),
  (
    '00000000-0000-4000-8000-000000000203',
    'BMO Field',
    'Toronto',
    'Canadá'
  ),
  (
    '00000000-0000-4000-8000-000000000204',
    'Hard Rock Stadium',
    'Miami',
    'Estados Unidos'
  )
on conflict (id) do update
set
  name = excluded.name,
  city = excluded.city,
  country = excluded.country;

insert into public.matches (
  id,
  match_number,
  stage,
  group_code,
  home_team_id,
  away_team_id,
  kickoff_at,
  stadium_id,
  status,
  raw_json
)
values
  (
    '00000000-0000-4000-8000-000000000301',
    1,
    'Fecha de muestra',
    'Grupo A',
    '00000000-0000-4000-8000-000000000101',
    '00000000-0000-4000-8000-000000000102',
    '2026-06-11 19:00:00+00',
    '00000000-0000-4000-8000-000000000201',
    'SCHEDULED',
    '{
      "seed_note": "Dato falso local para desarrollo visual.",
      "tendency": { "home": 58, "draw": 24, "away": 18 },
      "direct_history": { "home": 8, "draw": 3, "away": 4 }
    }'::jsonb
  ),
  (
    '00000000-0000-4000-8000-000000000302',
    2,
    'Fecha de muestra',
    'Grupo B',
    '00000000-0000-4000-8000-000000000103',
    '00000000-0000-4000-8000-000000000104',
    '2026-06-12 22:00:00+00',
    '00000000-0000-4000-8000-000000000202',
    'SCHEDULED',
    '{
      "seed_note": "Dato falso local para desarrollo visual.",
      "tendency": { "home": 44, "draw": 29, "away": 27 },
      "direct_history": { "home": 6, "draw": 4, "away": 5 }
    }'::jsonb
  ),
  (
    '00000000-0000-4000-8000-000000000303',
    3,
    'Fecha de muestra',
    'Grupo C',
    '00000000-0000-4000-8000-000000000105',
    '00000000-0000-4000-8000-000000000106',
    '2026-06-13 18:00:00+00',
    '00000000-0000-4000-8000-000000000203',
    'SCHEDULED',
    '{
      "seed_note": "Dato falso local para desarrollo visual.",
      "tendency": { "home": 49, "draw": 25, "away": 26 },
      "direct_history": { "home": 5, "draw": 2, "away": 3 }
    }'::jsonb
  ),
  (
    '00000000-0000-4000-8000-000000000304',
    4,
    'Fecha de muestra',
    'Grupo D',
    '00000000-0000-4000-8000-000000000107',
    '00000000-0000-4000-8000-000000000108',
    '2026-06-14 21:00:00+00',
    '00000000-0000-4000-8000-000000000204',
    'SCHEDULED',
    '{
      "seed_note": "Dato falso local para desarrollo visual.",
      "tendency": { "home": 31, "draw": 27, "away": 42 },
      "direct_history": { "home": 4, "draw": 5, "away": 7 }
    }'::jsonb
  )
on conflict (id) do update
set
  football_data_id = null,
  match_number = excluded.match_number,
  stage = excluded.stage,
  group_code = excluded.group_code,
  home_team_id = excluded.home_team_id,
  away_team_id = excluded.away_team_id,
  kickoff_at = excluded.kickoff_at,
  stadium_id = excluded.stadium_id,
  status = excluded.status,
  raw_json = excluded.raw_json;
