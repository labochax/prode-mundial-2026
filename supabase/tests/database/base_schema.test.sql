begin;

select no_plan();

select has_table('public', 'settings', 'settings table exists');
select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'pools', 'pools table exists');
select has_table('public', 'pool_memberships', 'pool_memberships table exists');

select has_column('public', 'profiles', 'id', 'profiles.id exists');
select has_column('public', 'profiles', 'email', 'profiles.email exists');
select has_column('public', 'profiles', 'full_name', 'profiles.full_name exists');
select has_column('public', 'profiles', 'display_name', 'profiles.display_name exists');
select has_column('public', 'profiles', 'first_name', 'profiles.first_name exists');
select has_column('public', 'profiles', 'last_name', 'profiles.last_name exists');
select has_column('public', 'profiles', 'age', 'profiles.age exists');
select has_column('public', 'profiles', 'favorite_team', 'profiles.favorite_team exists');
select has_column('public', 'profiles', 'school_group', 'profiles.school_group exists');
select has_column('public', 'profiles', 'graduation_year_or_category', 'profiles.graduation_year_or_category exists');
select has_column('public', 'profiles', 'country', 'profiles.country exists');
select has_column('public', 'profiles', 'province', 'profiles.province exists');
select has_column('public', 'profiles', 'city', 'profiles.city exists');
select has_column('public', 'profiles', 'prode_subgroup', 'profiles.prode_subgroup exists');
select has_column('public', 'profiles', 'avatar_kind', 'profiles.avatar_kind exists');
select has_column('public', 'profiles', 'avatar_value', 'profiles.avatar_value exists');
select has_column('public', 'profiles', 'google_avatar_url', 'profiles.google_avatar_url exists');
select has_column('public', 'profiles', 'uploaded_avatar_path', 'profiles.uploaded_avatar_path exists');
select has_column('public', 'profiles', 'onboarding_completed', 'profiles.onboarding_completed exists');
select has_column('public', 'profiles', 'created_at', 'profiles.created_at exists');
select has_column('public', 'profiles', 'updated_at', 'profiles.updated_at exists');

select has_column('public', 'pools', 'id', 'pools.id exists');
select has_column('public', 'pools', 'name', 'pools.name exists');
select has_column('public', 'pools', 'slug', 'pools.slug exists');
select has_column('public', 'pools', 'description', 'pools.description exists');
select has_column('public', 'pools', 'invite_code', 'pools.invite_code exists');
select has_column('public', 'pools', 'created_by', 'pools.created_by exists');
select has_column('public', 'pools', 'is_public', 'pools.is_public exists');
select has_column('public', 'pools', 'created_at', 'pools.created_at exists');
select has_column('public', 'pools', 'updated_at', 'pools.updated_at exists');

select has_column('public', 'pool_memberships', 'pool_id', 'pool_memberships.pool_id exists');
select has_column('public', 'pool_memberships', 'user_id', 'pool_memberships.user_id exists');
select has_column('public', 'pool_memberships', 'role', 'pool_memberships.role exists');
select has_column('public', 'pool_memberships', 'created_at', 'pool_memberships.created_at exists');

select ok(
  exists (
    select 1
    from public.settings
    where key = 'lock_minutes_before_kickoff'
      and value = '10'::jsonb
  ),
  'settings.lock_minutes_before_kickoff seed exists with value 10'
);

select ok(
  to_regprocedure('public.set_updated_at()') is not null,
  'public.set_updated_at() function exists'
);
select ok(
  to_regprocedure('public.is_pool_member(uuid, uuid)') is not null,
  'public.is_pool_member(uuid, uuid) function exists'
);
select ok(
  to_regprocedure('public.is_pool_admin(uuid, uuid)') is not null,
  'public.is_pool_admin(uuid, uuid) function exists'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'profiles_age_reasonable'
      and conrelid = 'public.profiles'::regclass
  ),
  'profiles age check constraint exists'
);
select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'profiles_avatar_kind_allowed'
      and conrelid = 'public.profiles'::regclass
  ),
  'profiles avatar_kind check constraint exists'
);
select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'pool_memberships_role_allowed'
      and conrelid = 'public.pool_memberships'::regclass
  ),
  'pool_memberships role check constraint exists'
);

insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'schema-user-1@example.test', now(), now(), now()),
  ('10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'schema-user-2@example.test', now(), now(), now()),
  ('10000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'schema-user-3@example.test', now(), now(), now()),
  ('10000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'schema-user-4@example.test', now(), now(), now()),
  ('10000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'schema-user-5@example.test', now(), now(), now());

select lives_ok(
  $$
    insert into public.profiles (id, display_name, age, avatar_kind)
    values ('10000000-0000-0000-0000-000000000001', 'Edad nula', null, 'stitch')
  $$,
  'profiles accepts null age and stitch avatar kind'
);

select lives_ok(
  $$
    insert into public.profiles (id, display_name, age, avatar_kind)
    values ('10000000-0000-0000-0000-000000000002', 'Edad razonable', 120, 'google')
  $$,
  'profiles accepts reasonable age and google avatar kind'
);

select lives_ok(
  $$
    insert into public.profiles (id, display_name, age, avatar_kind)
    values ('10000000-0000-0000-0000-000000000003', 'Avatar upload', 1, 'upload')
  $$,
  'profiles accepts upload avatar kind'
);

select throws_ok(
  $$
    insert into public.profiles (id, display_name, age, avatar_kind)
    values ('10000000-0000-0000-0000-000000000004', 'Edad invalida', 0, 'stitch')
  $$,
  '23514',
  'new row for relation "profiles" violates check constraint "profiles_age_reasonable"',
  'profiles rejects age below 1'
);

select throws_ok(
  $$
    insert into public.profiles (id, display_name, avatar_kind)
    values ('10000000-0000-0000-0000-000000000005', 'Avatar invalido', 'robot')
  $$,
  '23514',
  'new row for relation "profiles" violates check constraint "profiles_avatar_kind_allowed"',
  'profiles rejects unsupported avatar_kind'
);

insert into public.pools (id, name, slug, created_by)
values (
  '20000000-0000-0000-0000-000000000001',
  'Pool de schema',
  'schema-pool',
  '10000000-0000-0000-0000-000000000001'
);

select lives_ok(
  $$
    insert into public.pool_memberships (pool_id, user_id, role)
    values (
      '20000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000001',
      'owner'
    )
  $$,
  'pool_memberships accepts owner role'
);

select lives_ok(
  $$
    insert into public.pool_memberships (pool_id, user_id, role)
    values (
      '20000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000002',
      'admin'
    )
  $$,
  'pool_memberships accepts admin role'
);

select lives_ok(
  $$
    insert into public.pool_memberships (pool_id, user_id, role)
    values (
      '20000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000003',
      'member'
    )
  $$,
  'pool_memberships accepts member role'
);

select throws_ok(
  $$
    insert into public.pool_memberships (pool_id, user_id, role)
    values (
      '20000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000004',
      'capitan'
    )
  $$,
  '23514',
  'new row for relation "pool_memberships" violates check constraint "pool_memberships_role_allowed"',
  'pool_memberships rejects unsupported role'
);

select * from finish();

rollback;
