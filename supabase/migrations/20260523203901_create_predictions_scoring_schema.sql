-- Predictions, lock enforcement, scoring helpers, and leaderboard foundation.
-- This migration intentionally does not create client code, Edge Functions,
-- external API sync, or penalty shootout prediction support.

create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.pools(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  predicted_home_score int not null,
  predicted_away_score int not null,
  points int,
  scored_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint predictions_pool_user_match_unique unique (pool_id, user_id, match_id),
  constraint predictions_pool_membership_fk foreign key (pool_id, user_id)
    references public.pool_memberships(pool_id, user_id)
    on delete cascade,
  constraint predictions_home_score_non_negative check (predicted_home_score >= 0),
  constraint predictions_away_score_non_negative check (predicted_away_score >= 0),
  constraint predictions_points_allowed check (
    points is null or points in (0, 1, 3)
  )
);

comment on table public.predictions is
  'User predictions for one pool, one match, and one player. Edits are locked by matches.lock_at.';
comment on column public.predictions.pool_id is
  'Stored directly for pool-specific ranking, visibility, and RLS checks.';
comment on column public.predictions.points is
  'Server-side scoring result: 3 exact, 1 correct outcome, 0 wrong, null until scored.';

create index predictions_user_id_idx on public.predictions (user_id);
create index predictions_match_id_idx on public.predictions (match_id);
create index predictions_pool_id_idx on public.predictions (pool_id);
create index predictions_pool_points_idx on public.predictions (pool_id, points);

create or replace function public.get_match_outcome(
  home_score int,
  away_score int
)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when home_score is null or away_score is null then null
    when home_score > away_score then 'HOME_TEAM'
    when home_score < away_score then 'AWAY_TEAM'
    else 'DRAW'
  end;
$$;

create or replace function public.calculate_prediction_points(
  pred_home int,
  pred_away int,
  actual_home int,
  actual_away int
)
returns int
language sql
immutable
set search_path = public
as $$
  select case
    when pred_home is null
      or pred_away is null
      or actual_home is null
      or actual_away is null
      then null
    when pred_home = actual_home and pred_away = actual_away
      then 3
    when public.get_match_outcome(pred_home, pred_away)
      = public.get_match_outcome(actual_home, actual_away)
      then 1
    else 0
  end;
$$;

create or replace function public.is_match_locked(target_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select now() >= matches.lock_at
      from public.matches
      where matches.id = target_match_id
    ),
    false
  );
$$;

create or replace function public.is_prediction_visible(
  target_prediction_id uuid,
  viewer_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if viewer_id is null then
    return false;
  end if;

  -- Authenticated callers can only ask about their own visibility context.
  -- Direct postgres/test callers have auth.uid() = null and are unrestricted.
  if auth.uid() is not null and viewer_id <> auth.uid() then
    return false;
  end if;

  return exists (
    select 1
    from public.predictions prediction
    join public.matches match on match.id = prediction.match_id
    where prediction.id = target_prediction_id
      and (
        prediction.user_id = viewer_id
        or (
          public.is_pool_member(prediction.pool_id, viewer_id)
          and now() >= match.lock_at
        )
      )
  );
end;
$$;

create or replace function public.prevent_prediction_after_lock()
returns trigger
language plpgsql
as $$
declare
  target_match_id uuid;
begin
  -- Supabase service-role/server-side operations can bypass RLS but not
  -- triggers. Keep an explicit escape hatch for future controlled admin
  -- corrections while regular authenticated clients remain locked.
  if current_user in ('postgres', 'supabase_admin')
    or coalesce(auth.role(), '') = 'service_role' then
    return coalesce(new, old);
  end if;

  if tg_op = 'INSERT' then
    target_match_id = new.match_id;
  elsif tg_op = 'UPDATE' then
    if public.is_match_locked(old.match_id)
      or public.is_match_locked(new.match_id) then
      raise exception 'predictions are locked for this match'
        using errcode = 'P0001';
    end if;

    return new;
  else
    target_match_id = old.match_id;
  end if;

  if public.is_match_locked(target_match_id) then
    raise exception 'predictions are locked for this match'
      using errcode = 'P0001';
  end if;

  return coalesce(new, old);
end;
$$;

create or replace function public.score_match_predictions(target_match_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  target_match public.matches%rowtype;
  scored_count integer;
begin
  select *
  into target_match
  from public.matches
  where id = target_match_id;

  if not found then
    raise exception 'match not found: %', target_match_id
      using errcode = 'P0002';
  end if;

  -- Scoring is intentionally conservative: only finished matches with both
  -- official scores are scored. Running this repeatedly is safe.
  if target_match.status <> 'FINISHED'
    or target_match.home_score is null
    or target_match.away_score is null then
    return 0;
  end if;

  update public.predictions prediction
  set
    points = public.calculate_prediction_points(
      prediction.predicted_home_score,
      prediction.predicted_away_score,
      target_match.home_score,
      target_match.away_score
    ),
    scored_at = now(),
    updated_at = now()
  where prediction.match_id = target_match_id;

  get diagnostics scored_count = row_count;

  return scored_count;
end;
$$;

create or replace function public.get_pool_leaderboard(target_pool_id uuid)
returns table (
  user_id uuid,
  display_name text,
  avatar_kind text,
  avatar_value text,
  total_points int,
  exact_hits int,
  outcome_hits int,
  predicted_matches_count int,
  rank bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with visible_pool as (
    select target_pool_id as pool_id
    where public.is_pool_member(target_pool_id, auth.uid())
  ),
  totals as (
    select
      membership.user_id,
      coalesce(profile.display_name, profile.full_name, profile.email, 'Jugador') as display_name,
      profile.avatar_kind,
      profile.avatar_value,
      coalesce(sum(prediction.points) filter (where prediction.points is not null), 0)::int as total_points,
      count(prediction.id) filter (where prediction.points = 3)::int as exact_hits,
      count(prediction.id) filter (where prediction.points = 1)::int as outcome_hits,
      count(prediction.id) filter (where prediction.points is not null)::int as predicted_matches_count
    from visible_pool
    join public.pool_memberships membership
      on membership.pool_id = visible_pool.pool_id
    join public.profiles profile
      on profile.id = membership.user_id
    left join public.predictions prediction
      on prediction.pool_id = membership.pool_id
      and prediction.user_id = membership.user_id
      and prediction.points is not null
    group by
      membership.user_id,
      profile.display_name,
      profile.full_name,
      profile.email,
      profile.avatar_kind,
      profile.avatar_value
  )
  select
    totals.user_id,
    totals.display_name,
    totals.avatar_kind,
    totals.avatar_value,
    totals.total_points,
    totals.exact_hits,
    totals.outcome_hits,
    totals.predicted_matches_count,
    rank() over (
      order by
        totals.total_points desc,
        totals.exact_hits desc,
        totals.outcome_hits desc,
        totals.predicted_matches_count desc,
        totals.display_name asc
    ) as rank
  from totals
  order by rank, display_name;
$$;

revoke all on function public.get_match_outcome(int, int) from public;
revoke all on function public.calculate_prediction_points(int, int, int, int) from public;
revoke all on function public.is_match_locked(uuid) from public;
revoke all on function public.is_prediction_visible(uuid, uuid) from public;
revoke all on function public.score_match_predictions(uuid) from public;
revoke all on function public.get_pool_leaderboard(uuid) from public;

grant execute on function public.is_match_locked(uuid) to authenticated;
grant execute on function public.is_prediction_visible(uuid, uuid) to authenticated;
grant execute on function public.get_pool_leaderboard(uuid) to authenticated;

create trigger predictions_prevent_after_lock
before insert or update or delete on public.predictions
for each row
execute function public.prevent_prediction_after_lock();

create trigger predictions_set_updated_at
before update on public.predictions
for each row
execute function public.set_updated_at();

alter table public.predictions enable row level security;

grant select, insert, update, delete on public.predictions to authenticated;

create policy "Users can read visible predictions"
on public.predictions
for select
to authenticated
using (public.is_prediction_visible(id, auth.uid()));

create policy "Users can insert own predictions before lock"
on public.predictions
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.is_pool_member(pool_id)
  and not public.is_match_locked(match_id)
);

create policy "Users can update own predictions"
on public.predictions
for update
to authenticated
using (
  user_id = auth.uid()
  and public.is_pool_member(pool_id)
)
with check (
  user_id = auth.uid()
  and public.is_pool_member(pool_id)
  and not public.is_match_locked(match_id)
);

create policy "Users can delete own predictions"
on public.predictions
for delete
to authenticated
using (
  user_id = auth.uid()
  and public.is_pool_member(pool_id)
);
