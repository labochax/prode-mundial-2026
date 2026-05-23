-- Match foundation for Prode Mundial 2026.
-- This migration intentionally excludes predictions, scoring, sync_runs,
-- Edge Functions, and external API calls.

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  football_data_id int unique,
  sportsdb_id text,
  name_es text not null,
  name_en text,
  short_name text,
  tla text,
  flag_url text,
  badge_url text,
  raw_json jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table public.teams is
  'National teams for fixtures. name_es is the UI-facing Spanish team name.';
comment on column public.teams.football_data_id is
  'Football-Data.org team id. Nullable until external sync exists.';
comment on column public.teams.sportsdb_id is
  'Optional TheSportsDB team id for visual enrichment.';

create table public.stadiums (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  country text,
  image_url text,
  raw_json jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table public.stadiums is
  'World Cup venue data and optional visual references.';

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  football_data_id int unique,
  match_number int,
  stage text,
  group_code text,
  home_team_id uuid references public.teams(id),
  away_team_id uuid references public.teams(id),
  kickoff_at timestamptz not null,
  lock_at timestamptz not null,
  stadium_id uuid references public.stadiums(id),
  status text not null default 'SCHEDULED',
  minute int,
  home_score int,
  away_score int,
  winner text,
  raw_json jsonb,
  last_synced_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint matches_home_score_non_negative check (
    home_score is null or home_score >= 0
  ),
  constraint matches_away_score_non_negative check (
    away_score is null or away_score >= 0
  ),
  constraint matches_minute_non_negative check (
    minute is null or minute >= 0
  ),
  constraint matches_status_allowed check (
    status in (
      'SCHEDULED',
      'TIMED',
      'IN_PLAY',
      'PAUSED',
      'FINISHED',
      'POSTPONED',
      'CANCELLED'
    )
  ),
  constraint matches_winner_allowed check (
    winner is null or winner in ('HOME_TEAM', 'AWAY_TEAM', 'DRAW')
  ),
  constraint matches_distinct_teams check (
    home_team_id is null
    or away_team_id is null
    or home_team_id <> away_team_id
  )
);

comment on table public.matches is
  'Fixture and result foundation. Predictions and scoring are created in later migrations.';
comment on column public.matches.lock_at is
  'Per-match prediction lock time. Defaults to kickoff_at minus settings.lock_minutes_before_kickoff.';
comment on column public.matches.home_team_id is
  'Left/home team from the data source. For World Cup UI, do not imply true home-field advantage.';
comment on column public.matches.away_team_id is
  'Right/away team from the data source. For World Cup UI, use team names instead of local/visitor labels.';

create index teams_name_es_idx on public.teams (name_es);
create index teams_tla_idx on public.teams (tla);
create index stadiums_name_idx on public.stadiums (name);
create index matches_kickoff_at_idx on public.matches (kickoff_at);
create index matches_status_idx on public.matches (status);
create index matches_home_team_id_idx on public.matches (home_team_id);
create index matches_away_team_id_idx on public.matches (away_team_id);
create index matches_stadium_id_idx on public.matches (stadium_id);

create or replace function public.get_lock_minutes_before_kickoff()
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  configured_value jsonb;
  lock_minutes integer;
begin
  select settings.value
  into configured_value
  from public.settings
  where settings.key = 'lock_minutes_before_kickoff';

  if configured_value is null then
    return 10;
  end if;

  begin
    if jsonb_typeof(configured_value) in ('number', 'string') then
      lock_minutes := (configured_value #>> '{}')::integer;
    end if;
  exception when others then
    return 10;
  end;

  if lock_minutes is null or lock_minutes < 0 or lock_minutes > 180 then
    return 10;
  end if;

  return lock_minutes;
end;
$$;

create or replace function public.compute_match_lock_at(match_kickoff_at timestamptz)
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select match_kickoff_at - make_interval(mins => public.get_lock_minutes_before_kickoff());
$$;

create or replace function public.set_match_lock_at()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.lock_at is null then
      new.lock_at = public.compute_match_lock_at(new.kickoff_at);
    end if;
  elsif tg_op = 'UPDATE' then
    -- Recalculate when kickoff changes and lock_at was not explicitly changed
    -- in the same update. Explicit lock_at corrections remain possible for
    -- future admin/server-side sync flows.
    if new.kickoff_at is distinct from old.kickoff_at
      and new.lock_at is not distinct from old.lock_at then
      new.lock_at = public.compute_match_lock_at(new.kickoff_at);
    end if;
  end if;

  if new.lock_at is null then
    raise exception 'matches.lock_at could not be calculated';
  end if;

  return new;
end;
$$;

revoke all on function public.get_lock_minutes_before_kickoff() from public;
revoke all on function public.compute_match_lock_at(timestamptz) from public;

create trigger teams_set_updated_at
before update on public.teams
for each row
execute function public.set_updated_at();

create trigger stadiums_set_updated_at
before update on public.stadiums
for each row
execute function public.set_updated_at();

create trigger matches_set_lock_at
before insert or update of kickoff_at, lock_at on public.matches
for each row
execute function public.set_match_lock_at();

create trigger matches_set_updated_at
before update on public.matches
for each row
execute function public.set_updated_at();

alter table public.teams enable row level security;
alter table public.stadiums enable row level security;
alter table public.matches enable row level security;

grant select on public.teams to authenticated;
grant select on public.stadiums to authenticated;
grant select on public.matches to authenticated;

create policy "Authenticated users can read teams"
on public.teams
for select
to authenticated
using (true);

create policy "Authenticated users can read stadiums"
on public.stadiums
for select
to authenticated
using (true);

create policy "Authenticated users can read matches"
on public.matches
for select
to authenticated
using (true);
