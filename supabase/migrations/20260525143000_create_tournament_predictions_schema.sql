-- Complete Mi Mundial bracket predictions.
-- This migration stores a user's pre-tournament bracket for one pool without
-- mutating match-by-match predictions or official fixture data.

create or replace function public.get_tournament_lock_at()
returns timestamptz
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  target_lock_at timestamptz;
begin
  select min(match.kickoff_at)
  into target_lock_at
  from public.matches match
  where match.football_data_id is not null;

  if target_lock_at is null then
    select min(match.kickoff_at)
    into target_lock_at
    from public.matches match;
  end if;

  if target_lock_at is null then
    raise exception 'tournament lock cannot be calculated without matches'
      using errcode = 'P0001';
  end if;

  return target_lock_at;
end;
$$;

comment on function public.get_tournament_lock_at() is
  'Returns the first official Football-Data kickoff when available, otherwise the first local match kickoff. Used to lock Mi Mundial predictions.';

create table public.tournament_predictions (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.pools(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  locked_at timestamptz not null default public.get_tournament_lock_at(),
  bracket_json jsonb not null,
  round_of_16_team_ids uuid[] not null default '{}',
  quarterfinal_team_ids uuid[] not null default '{}',
  semifinal_team_ids uuid[] not null default '{}',
  champion_team_id uuid not null references public.teams(id),
  runner_up_team_id uuid not null references public.teams(id),
  third_place_team_id uuid not null references public.teams(id),
  fourth_place_team_id uuid not null references public.teams(id),
  bonus_points integer not null default 0,
  scored_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tournament_predictions_pool_user_unique unique (pool_id, user_id),
  constraint tournament_predictions_pool_membership_fk foreign key (pool_id, user_id)
    references public.pool_memberships(pool_id, user_id)
    on delete cascade,
  constraint tournament_predictions_bonus_points_non_negative check (
    bonus_points >= 0
  ),
  constraint tournament_predictions_final_teams_distinct check (
    champion_team_id <> runner_up_team_id
    and champion_team_id <> third_place_team_id
    and champion_team_id <> fourth_place_team_id
    and runner_up_team_id <> third_place_team_id
    and runner_up_team_id <> fourth_place_team_id
    and third_place_team_id <> fourth_place_team_id
  )
);

comment on table public.tournament_predictions is
  'Saved complete Mi Mundial bracket prediction. Editable by owner before the tournament lock only.';
comment on column public.tournament_predictions.bracket_json is
  'Serialized bracket selections and round details used to reconstruct the saved Mi Mundial UI.';
comment on column public.tournament_predictions.bonus_points is
  'Future bonus scoring result. It remains 0 until Mi Mundial bonus scoring is implemented.';

create index tournament_predictions_pool_id_idx
on public.tournament_predictions (pool_id);

create index tournament_predictions_user_id_idx
on public.tournament_predictions (user_id);

create index tournament_predictions_champion_team_id_idx
on public.tournament_predictions (champion_team_id);

create or replace function public.prevent_tournament_prediction_after_lock()
returns trigger
language plpgsql
as $$
declare
  target_locked_at timestamptz;
begin
  -- Admin/service-role maintenance can bypass this trigger for future scoring
  -- or data repair jobs. Regular authenticated users cannot.
  if current_user in ('postgres', 'supabase_admin')
    or coalesce(auth.role(), '') = 'service_role' then
    return coalesce(new, old);
  end if;

  if tg_op = 'INSERT' then
    new.locked_at = public.get_tournament_lock_at();
    target_locked_at = new.locked_at;
  elsif tg_op = 'UPDATE' then
    if now() >= old.locked_at then
      raise exception 'tournament prediction is locked'
        using errcode = 'P0001';
    end if;

    new.locked_at = public.get_tournament_lock_at();
    target_locked_at = new.locked_at;
  else
    target_locked_at = old.locked_at;
  end if;

  if now() >= target_locked_at then
    raise exception 'tournament prediction is locked'
      using errcode = 'P0001';
  end if;

  return coalesce(new, old);
end;
$$;

revoke all on function public.get_tournament_lock_at() from public;
revoke all on function public.prevent_tournament_prediction_after_lock() from public;
grant execute on function public.get_tournament_lock_at() to authenticated;

create trigger tournament_predictions_prevent_after_lock
before insert or update or delete on public.tournament_predictions
for each row
execute function public.prevent_tournament_prediction_after_lock();

create trigger tournament_predictions_set_updated_at
before update on public.tournament_predictions
for each row
execute function public.set_updated_at();

alter table public.tournament_predictions enable row level security;

grant select, insert, update, delete on public.tournament_predictions to authenticated;

create policy "Users can read visible tournament predictions"
on public.tournament_predictions
for select
to authenticated
using (
  user_id = auth.uid()
  or (
    now() >= locked_at
    and public.is_pool_member(pool_id, auth.uid())
  )
);

create policy "Users can insert own tournament prediction before lock"
on public.tournament_predictions
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.is_pool_member(pool_id)
  and now() < public.get_tournament_lock_at()
);

create policy "Users can update own tournament prediction"
on public.tournament_predictions
for update
to authenticated
using (
  user_id = auth.uid()
  and public.is_pool_member(pool_id)
)
with check (
  user_id = auth.uid()
  and public.is_pool_member(pool_id)
);

create policy "Users can delete own tournament prediction"
on public.tournament_predictions
for delete
to authenticated
using (
  user_id = auth.uid()
  and public.is_pool_member(pool_id)
);
