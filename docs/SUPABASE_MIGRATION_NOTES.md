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

## Match Foundation Migration

Created local migration:

`supabase/migrations/20260523202802_create_match_foundation_schema.sql`

This migration is also intended for local review and later Supabase application. It has not been applied to a remote project by this task.

### What It Adds

- `public.teams`
  - Spanish-facing team names via `name_es`;
  - optional Football-Data.org and TheSportsDB identifiers;
  - optional flag/badge URLs and raw provider JSON.
- `public.stadiums`
  - venue name, city, country, optional image URL, and raw provider JSON.
- `public.matches`
  - Football-Data.org match id;
  - match number, stage, group code;
  - home/left and away/right team references;
  - kickoff and lock timestamps;
  - stadium reference;
  - practical Football-Data-like status values;
  - score, minute, winner, sync metadata, and raw provider JSON.
- `public.get_lock_minutes_before_kickoff()`
- `public.compute_match_lock_at(kickoff_at)`
- `public.set_match_lock_at()` trigger helper.
- Updated-at triggers for `teams`, `stadiums`, and `matches`.
- RLS enabled on `teams`, `stadiums`, and `matches`.
- Authenticated read-only policies for those tables.

### Lock Time Behavior

`matches.lock_at` is required after insert.

On insert:

- if `lock_at` is provided explicitly, the trigger keeps it;
- if `lock_at` is omitted, the trigger calculates it as `kickoff_at - settings.lock_minutes_before_kickoff`.

On update:

- if `kickoff_at` changes and `lock_at` was not explicitly changed in the same update, the trigger recalculates `lock_at`;
- if an admin/server sync updates both `kickoff_at` and `lock_at`, the explicit `lock_at` is preserved.

The setting defaults to `10` minutes from the seeded `settings` row. If the setting is missing, malformed, negative, or unreasonably large, the helper falls back to `10`.

### What Is Still Excluded

- Predictions table.
- Prediction visibility policies.
- Scoring functions, score tables, or leaderboard views.
- Sync runs and Edge Functions.
- Storage buckets for team/stadium assets.
- External API calls to Football-Data.org or TheSportsDB.

Predictions and scoring are intentionally excluded so the lock-time and read-only fixture foundation can be tested first.

### Must Be Tested Before Moving To Predictions

- Default `lock_at` calculation from the seeded 10-minute setting.
- `lock_at` calculation after changing the setting in tests.
- `kickoff_at` update recalculation behavior.
- Explicit `lock_at` preservation for future admin corrections.
- Status, score, minute, and winner constraints.
- Authenticated read access for teams, stadiums, and matches.
- Confirm authenticated clients cannot insert/update/delete fixture foundation rows.
