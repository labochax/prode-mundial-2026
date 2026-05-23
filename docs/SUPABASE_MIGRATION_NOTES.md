# Supabase Migration Notes

## Migration

Created local migration:

`supabase/migrations/20260523135841_create_base_auth_profile_pool_schema.sql`

This migration is intended for local review and later Supabase application. It has not been applied to a remote project.

## What It Creates

- `pgcrypto` extension for UUID generation.
- `public.set_updated_at()` trigger helper.
- `public.settings`
  - includes seeded `lock_minutes_before_kickoff = 10`.
- `public.profiles`
  - extends `auth.users`;
  - includes current onboarding/profile fields;
  - includes avatar references and `onboarding_completed`.
- `public.pools`
  - base private/public Prode pool table.
- `public.pool_memberships`
  - links users to pools with `owner`, `admin`, or `member` role.
- Updated-at triggers for `settings`, `profiles`, and `pools`.
- Helper functions:
  - `public.is_pool_member(pool_id, user_id)`;
  - `public.is_pool_admin(pool_id, user_id)`.
- RLS enabled on all created tables.
- Initial RLS policies for authenticated access.

## What It Intentionally Does Not Create

- Supabase client code.
- Google Auth UI or auth callbacks.
- Matches, teams, stadiums, predictions, scoring, leaderboard views, or sync tables.
- Edge Functions.
- Storage buckets or upload policies.
- Generated TypeScript Supabase types.
- Remote Supabase project configuration.

## RLS Notes

- `profiles` are broadly readable by authenticated users for MVP ranking and pool member display. If privacy requirements tighten, replace broad profile reads with a dedicated public profile view before exposing sensitive columns.
- `pool_memberships` policies use security-definer helper functions to avoid circular RLS recursion.
- The pool creator can create the first `owner` membership.
- Existing pool owners/admins can manage memberships.
- Users can self-join public pools as `member`.
- Private invite-code joins are intentionally left for a future RPC flow so invite validation can be server-side.
- Client writes are not allowed for `settings`.

## Must Be Tested Before Remote Apply

- Run the migration against a local Supabase database.
- Verify `auth.uid()` policies with at least two test users.
- Verify first profile insert where `profiles.id = auth.uid()`.
- Verify profile update is limited to owner.
- Verify private pool creator can insert the first owner membership.
- Verify members can read membership rows in their pool.
- Verify non-members cannot read private pools.
- Verify admins can add/update/delete memberships.
- Verify public pool self-join cannot create `owner` or `admin` roles.

## Known Open Decisions

- Whether `Global` means all app users or all members of the default private pool.
- Whether private invite joins should be handled by RPC, admin-only flow, or both.
- Whether profile reads should remain broad or move behind a public profile view.
- Whether pool deletion should be supported and who can perform it.
- Whether changing `pools.created_by` should be blocked by a trigger in a later hardening migration.
