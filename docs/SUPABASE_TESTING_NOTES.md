# Supabase Testing Notes

## How To Run

From the project root:

```bash
npx supabase db reset
npx supabase test db
```

`db reset` reapplies local migrations. `test db` runs pgTAP tests from `supabase/tests/database/`.

## Test Files

- `supabase/tests/database/base_schema.test.sql`
  - verifies base tables exist;
  - verifies important profile, pool, and membership columns exist;
  - verifies the lock-minutes setting seed;
  - verifies helper functions exist;
  - validates profile age/avatar checks and membership role checks.

- `supabase/tests/database/base_rls.test.sql`
  - verifies RLS is enabled on base tables;
  - simulates authenticated users with deterministic UUIDs;
  - verifies settings reads and blocked anonymous settings writes;
  - verifies own-profile insert/update;
  - verifies users cannot update another profile;
  - verifies private/public pool read behavior;
  - verifies pool owner membership setup;
  - verifies member reads for memberships;
  - verifies public-pool self-join as member;
  - verifies private joins remain blocked without a future RPC/admin flow.

- `supabase/tests/database/match_foundation_schema.test.sql`
  - verifies teams, stadiums, and matches schema;
  - verifies match helper functions and triggers exist;
  - verifies match status, winner, score, and minute checks;
  - verifies default and settings-driven `lock_at` calculation.

- `supabase/tests/database/match_live_status_schema.test.sql`
  - verifies supported Football-Data live/result statuses are accepted,
    including `EXTRA_TIME`, `PENALTY_SHOOTOUT`, `SUSPENDED`, and `AWARDED`.

- `supabase/tests/database/match_foundation_rls.test.sql`
  - verifies RLS is enabled on fixture foundation tables;
  - verifies authenticated read access;
  - verifies authenticated clients cannot mutate teams, stadiums, or matches.

- `supabase/tests/database/predictions_schema.test.sql`
  - verifies predictions schema, constraints, helper functions, and triggers;
  - verifies negative scores, invalid points, and duplicate pool/user/match predictions are rejected.

- `supabase/tests/database/predictions_rls.test.sql`
  - verifies own prediction insert/update/delete before lock;
  - verifies post-lock insert/update/delete blocks;
  - verifies users cannot predict for another user;
  - verifies users cannot predict in pools where they are not members;
  - verifies own prediction visibility before lock;
  - verifies other-user visibility only after lock for same-pool members;
  - verifies other-pool predictions remain hidden.

- `supabase/tests/database/predictions_scoring.test.sql`
  - verifies exact, outcome, draw-outcome, and wrong scoring;
  - verifies `score_match_predictions` updates points and can be rerun;
  - verifies `get_pool_leaderboard` totals, hits, ranks, zero-prediction members, and non-member blocking.

## What Still Needs Manual Or Integration Testing

- Full auth callback behavior after Google Auth is wired.
- Profile creation from real Supabase session metadata.
- Private invite-code join flow after a dedicated RPC is added.
- Admin member-management flows from server-side code.
- Profile privacy posture before production, especially if broad authenticated profile reads remain.
- RLS tests against generated application clients once Supabase client code exists.
- Service-role-only execution paths for scoring and sync jobs.
- Prediction edit-history behavior if product decides to preserve revisions.
