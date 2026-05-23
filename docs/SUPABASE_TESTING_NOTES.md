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

## What Still Needs Manual Or Integration Testing

- Full auth callback behavior after Google Auth is wired.
- Profile creation from real Supabase session metadata.
- Private invite-code join flow after a dedicated RPC is added.
- Admin member-management flows from server-side code.
- Profile privacy posture before production, especially if broad authenticated profile reads remain.
- RLS tests against generated application clients once Supabase client code exists.
