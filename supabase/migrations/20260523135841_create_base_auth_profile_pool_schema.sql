-- Base auth/profile/pool foundation for Prode Mundial 2026.
-- This migration intentionally does not create matches, predictions, scoring,
-- sync jobs, storage buckets, or API integration tables.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.settings (
  key text primary key,
  value jsonb not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table public.settings is
  'Application-level settings safe for authenticated clients to read. Client writes are not allowed by RLS.';

insert into public.settings (key, value)
values ('lock_minutes_before_kickoff', '10'::jsonb);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  display_name text,
  first_name text,
  last_name text,
  age int,
  favorite_team text,
  school_group text,
  graduation_year_or_category text,
  country text default 'Argentina',
  province text,
  city text,
  prode_subgroup text,
  avatar_kind text default 'stitch' not null,
  avatar_value text,
  google_avatar_url text,
  uploaded_avatar_path text,
  onboarding_completed boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint profiles_age_reasonable check (
    age is null or age between 1 and 120
  ),
  constraint profiles_avatar_kind_allowed check (
    avatar_kind in ('stitch', 'google', 'upload')
  )
);

comment on table public.profiles is
  'Player profile data extending auth.users. App validation should require display_name before onboarding completes.';
comment on column public.profiles.avatar_value is
  'Selected avatar value. For avatar_kind=stitch this should be the local Stitch avatar id.';
comment on column public.profiles.google_avatar_url is
  'Optional Google profile image URL if the product allows using provider photos.';
comment on column public.profiles.uploaded_avatar_path is
  'Future Supabase Storage path for uploaded avatars. Do not store private signed URLs here.';

create table public.pools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  invite_code text unique,
  created_by uuid references public.profiles(id) on delete set null,
  is_public boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table public.pools is
  'Private or public prediction pools. MVP can start with one private friend-group pool.';

create table public.pool_memberships (
  pool_id uuid references public.pools(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text default 'member' not null,
  created_at timestamptz default now() not null,
  primary key (pool_id, user_id),
  constraint pool_memberships_role_allowed check (
    role in ('owner', 'admin', 'member')
  )
);

comment on table public.pool_memberships is
  'Links profiles to pools and carries the pool-level role.';

create index pools_created_by_idx on public.pools (created_by);
create index pool_memberships_user_id_idx on public.pool_memberships (user_id);
create index pool_memberships_pool_role_idx on public.pool_memberships (pool_id, role);

create trigger settings_set_updated_at
before update on public.settings
for each row
execute function public.set_updated_at();

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger pools_set_updated_at
before update on public.pools
for each row
execute function public.set_updated_at();

-- Security-definer helpers avoid recursive RLS checks on pool_memberships.
-- They must stay narrow, stable, and scoped to public tables.
create or replace function public.is_pool_member(
  target_pool_id uuid,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pool_memberships membership
    where membership.pool_id = target_pool_id
      and membership.user_id = target_user_id
  );
$$;

create or replace function public.is_pool_admin(
  target_pool_id uuid,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pool_memberships membership
    where membership.pool_id = target_pool_id
      and membership.user_id = target_user_id
      and membership.role in ('owner', 'admin')
  );
$$;

revoke all on function public.is_pool_member(uuid, uuid) from public;
revoke all on function public.is_pool_admin(uuid, uuid) from public;
grant execute on function public.is_pool_member(uuid, uuid) to authenticated;
grant execute on function public.is_pool_admin(uuid, uuid) to authenticated;

alter table public.settings enable row level security;
alter table public.profiles enable row level security;
alter table public.pools enable row level security;
alter table public.pool_memberships enable row level security;

-- Grants expose the tables to authenticated API roles; RLS policies below still
-- decide which rows can be read or modified. No grants are made to anon.
grant select on public.settings to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.pools to authenticated;
grant select, insert, update, delete on public.pool_memberships to authenticated;

create policy "Authenticated users can read settings"
on public.settings
for select
to authenticated
using (true);

-- This broad profile read policy supports rankings and friend-group displays.
-- If profile privacy becomes stricter, replace this with a public profile view
-- before exposing sensitive columns.
create policy "Authenticated users can read profiles"
on public.profiles
for select
to authenticated
using (true);

create policy "Authenticated users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy "Authenticated users can update their own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Authenticated users can read visible pools"
on public.pools
for select
to authenticated
using (
  is_public
  or created_by = auth.uid()
  or public.is_pool_member(id)
);

create policy "Authenticated users can create their own pools"
on public.pools
for insert
to authenticated
with check (created_by = auth.uid());

create policy "Pool owners and admins can update pools"
on public.pools
for update
to authenticated
using (
  created_by = auth.uid()
  or public.is_pool_admin(id)
)
with check (
  created_by = auth.uid()
  or public.is_pool_admin(id)
);

create policy "Members can read memberships in their pools"
on public.pool_memberships
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_pool_member(pool_id)
);

-- Allows the pool creator to create the first owner membership, admins to add
-- members, and authenticated users to self-join public pools as members.
-- Private invite-code joins should be implemented later through a validated RPC.
create policy "Allowed users can insert pool memberships"
on public.pool_memberships
for insert
to authenticated
with check (
  public.is_pool_admin(pool_id)
  or (
    user_id = auth.uid()
    and role = 'owner'
    and exists (
      select 1
      from public.pools pool
      where pool.id = public.pool_memberships.pool_id
        and pool.created_by = auth.uid()
    )
  )
  or (
    user_id = auth.uid()
    and role = 'member'
    and exists (
      select 1
      from public.pools pool
      where pool.id = public.pool_memberships.pool_id
        and pool.is_public
    )
  )
);

create policy "Pool owners and admins can update memberships"
on public.pool_memberships
for update
to authenticated
using (public.is_pool_admin(pool_id))
with check (public.is_pool_admin(pool_id));

create policy "Pool owners and admins can delete memberships"
on public.pool_memberships
for delete
to authenticated
using (public.is_pool_admin(pool_id));
