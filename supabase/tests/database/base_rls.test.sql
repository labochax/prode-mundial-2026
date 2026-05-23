begin;

select no_plan();

select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.settings'::regclass
  ),
  'RLS is enabled on settings'
);
select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.profiles'::regclass
  ),
  'RLS is enabled on profiles'
);
select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.pools'::regclass
  ),
  'RLS is enabled on pools'
);
select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.pool_memberships'::regclass
  ),
  'RLS is enabled on pool_memberships'
);

insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('30000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'rls-owner@example.test', now(), now(), now()),
  ('30000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'rls-member@example.test', now(), now(), now()),
  ('30000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'rls-outsider@example.test', now(), now(), now()),
  ('30000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'rls-public@example.test', now(), now(), now());

set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

select ok(
  exists (
    select 1
    from public.settings
    where key = 'lock_minutes_before_kickoff'
      and value = '10'::jsonb
  ),
  'authenticated users can read settings'
);

select lives_ok(
  $$
    insert into public.profiles (id, email, display_name, avatar_kind)
    values (
      '30000000-0000-0000-0000-000000000001',
      'rls-owner@example.test',
      'Dueño RLS',
      'stitch'
    )
  $$,
  'a user can insert their own profile'
);

select lives_ok(
  $$
    update public.profiles
    set display_name = 'Dueño Editado'
    where id = '30000000-0000-0000-0000-000000000001'
  $$,
  'a user can update their own profile'
);

reset role;

insert into public.profiles (id, email, display_name, avatar_kind)
values
  ('30000000-0000-0000-0000-000000000002', 'rls-member@example.test', 'Miembro RLS', 'stitch'),
  ('30000000-0000-0000-0000-000000000003', 'rls-outsider@example.test', 'Invitado RLS', 'stitch'),
  ('30000000-0000-0000-0000-000000000004', 'rls-public@example.test', 'Publico RLS', 'stitch');

set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

select lives_ok(
  $$
    update public.profiles
    set display_name = 'No deberia cambiar'
    where id = '30000000-0000-0000-0000-000000000002'
  $$,
  'updating another user profile is silently filtered by RLS'
);

reset role;

select is(
  (
    select display_name
    from public.profiles
    where id = '30000000-0000-0000-0000-000000000002'
  ),
  'Miembro RLS',
  'another user profile remains unchanged after filtered update'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

select lives_ok(
  $$
    insert into public.pools (id, name, slug, created_by, is_public)
    values (
      '40000000-0000-0000-0000-000000000001',
      'Pool Privado RLS',
      'pool-privado-rls',
      '30000000-0000-0000-0000-000000000001',
      false
    )
  $$,
  'a user can create a private pool with created_by = auth.uid()'
);

select lives_ok(
  $$
    insert into public.pool_memberships (pool_id, user_id, role)
    values (
      '40000000-0000-0000-0000-000000000001',
      '30000000-0000-0000-0000-000000000001',
      'owner'
    )
  $$,
  'pool creator can insert the first owner membership'
);

select ok(
  exists (
    select 1
    from public.pools
    where id = '40000000-0000-0000-0000-000000000001'
  ),
  'private pool is readable by its creator'
);

select lives_ok(
  $$
    insert into public.pool_memberships (pool_id, user_id, role)
    values (
      '40000000-0000-0000-0000-000000000001',
      '30000000-0000-0000-0000-000000000002',
      'member'
    )
  $$,
  'pool owner can add a member'
);

select lives_ok(
  $$
    insert into public.pools (id, name, slug, created_by, is_public)
    values (
      '40000000-0000-0000-0000-000000000002',
      'Pool Publico RLS',
      'pool-publico-rls',
      '30000000-0000-0000-0000-000000000001',
      true
    )
  $$,
  'a user can create a public pool with created_by = auth.uid()'
);

reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000002', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);

select ok(
  exists (
    select 1
    from public.pools
    where id = '40000000-0000-0000-0000-000000000001'
  ),
  'private pool is readable by a member'
);

select ok(
  exists (
    select 1
    from public.pool_memberships
    where pool_id = '40000000-0000-0000-0000-000000000001'
      and user_id = '30000000-0000-0000-0000-000000000001'
  ),
  'members can read memberships in their pool'
);

reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000003', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);

select is(
  (
    select count(*)::int
    from public.pools
    where id = '40000000-0000-0000-0000-000000000001'
  ),
  0,
  'private pool is not readable by a non-member'
);

select ok(
  exists (
    select 1
    from public.pools
    where id = '40000000-0000-0000-0000-000000000002'
  ),
  'public pools can be read by authenticated users'
);

select throws_ok(
  $$
    insert into public.pool_memberships (pool_id, user_id, role)
    values (
      '40000000-0000-0000-0000-000000000001',
      '30000000-0000-0000-0000-000000000003',
      'member'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "pool_memberships"',
  'private invite-code joins are unavailable without future RPC/admin flow'
);

reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000004', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-0000-0000-000000000004","role":"authenticated"}',
  true
);

select lives_ok(
  $$
    insert into public.pool_memberships (pool_id, user_id, role)
    values (
      '40000000-0000-0000-0000-000000000002',
      '30000000-0000-0000-0000-000000000004',
      'member'
    )
  $$,
  'authenticated users can self-join public pools as member'
);

select throws_ok(
  $$
    insert into public.pool_memberships (pool_id, user_id, role)
    values (
      '40000000-0000-0000-0000-000000000002',
      '30000000-0000-0000-0000-000000000003',
      'admin'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "pool_memberships"',
  'public self-join cannot create admin memberships'
);

reset role;

set local role anon;

select throws_ok(
  $$
    insert into public.settings (key, value)
    values ('anon_write_attempt', 'true'::jsonb)
  $$,
  '42501',
  'new row violates row-level security policy for table "settings"',
  'anonymous users cannot write settings'
);

reset role;

select * from finish();

rollback;
