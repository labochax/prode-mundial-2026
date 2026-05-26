-- Optional visual enrichment fields for TheSportsDB team assets.
-- Football-Data remains the source of truth for fixtures and results.

alter table public.teams
  add column if not exists logo_url text,
  add column if not exists jersey_url text,
  add column if not exists fanart_url text,
  add column if not exists thesportsdb_raw_json jsonb,
  add column if not exists assets_last_synced_at timestamptz,
  add column if not exists team_aliases text[] not null default '{}';

comment on column public.teams.logo_url is
  'Optional TheSportsDB logo URL for visual enrichment.';
comment on column public.teams.jersey_url is
  'Optional TheSportsDB jersey image URL for visual enrichment.';
comment on column public.teams.fanart_url is
  'Optional TheSportsDB fanart URL for visual enrichment.';
comment on column public.teams.thesportsdb_raw_json is
  'Raw TheSportsDB team payload for local visual enrichment debugging.';
comment on column public.teams.assets_last_synced_at is
  'Last local enrichment timestamp for optional team assets.';
comment on column public.teams.team_aliases is
  'Optional local aliases used to improve team asset matching.';
