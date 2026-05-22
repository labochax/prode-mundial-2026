# Prode Mundial 2026 Initial Scaffold Design

## Goal

Create the first neutral scaffold for Prode Mundial 2026 without integrating Supabase, calling sports APIs, creating database migrations, or inventing a visual direction before the Stitch MCP audit.

## Scope

- Document the product brief, future design authority, data-model intent, sync plan, deployment checklist, and Codex workflow.
- Replace the default agent instructions with project-specific operating rules while preserving the Next.js 16 local-doc requirement.
- Add Spanish App Router placeholder pages for the home entry and the requested public and admin routes.
- Add small shared placeholder components for layout, navigation, motion, Prode branding, matches, and leaderboard previews.
- Add typed config and scoring scaffolding plus inert sports and Supabase placeholders.
- Add the requested Supabase directories, README, and tracked `.env.example`.

## Architecture

Routes stay in `src/app` and remain thin. Shared placeholder UI lives in `src/components` so the pages can stay neutral and consistent until Stitch assets are audited. Known static rules and configuration live under `src/lib`, while future integrations get explicit placeholder files and docs that avoid network work or secret access.

The scaffold uses existing shadcn components and App Router server pages by default. `AnimatedPage` is the only planned client boundary because it wraps Framer Motion. The dynamic match detail placeholder reads its route parameter using the Next.js 16 async `params` shape.

## UI Direction

Every user-facing string is Spanish. The placeholders should look clean enough to navigate but must state that the final visual treatment will follow the Stitch project `WorldCupProde` and its audited screens. No fake dashboard data, tournament art direction, or mock arcade visual system belongs in this pass.

## Security And Data Boundaries

`.env.example` contains only empty server secrets and the requested TheSportsDB starter value. Browser-exposed variables keep the `NEXT_PUBLIC_` prefix only where intended. Supabase service role usage is documented as server-only and no client constructor is added.

Scoring and lock timing are documented now so later work can enforce them in server/database paths. The scaffold does not create SQL schema, Edge Functions, cron jobs, auth code, or API clients.

## Verification

Run `npm run build` after implementation and fix compile failures before reporting the scaffold status.
