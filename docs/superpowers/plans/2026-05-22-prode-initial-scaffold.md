# Prode Mundial 2026 Initial Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a neutral Spanish-language project scaffold for Prode Mundial 2026 that documents future work and compiles without external integrations.

**Architecture:** Keep App Router pages thin and compose them from small shared placeholder components under `src/components`. Put documented future integration boundaries under `src/lib` and `supabase`, with Stitch named as the future visual authority everywhere that matters.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Supabase placeholders.

---

## File Map

- `AGENTS.md` records project rules for future Codex work.
- `docs/*.md` captures product, design, data, sync, deployment, and workflow decisions.
- `.env.example` and `.gitignore` establish the environment template without tracking local secrets.
- `src/app/**/page.tsx` exposes the home entry and requested placeholder routes.
- `src/components/{layout,motion,prode,leaderboard}` provides reusable neutral placeholder UI.
- `src/lib/{config,scoring,sports,supabase}` holds known constants and inert integration boundaries.
- `supabase/README.md` and tracked placeholder files preserve the requested Supabase directories without schema or function code.

### Task 1: Project Instructions And Documentation

**Files:**
- Modify: `AGENTS.md`
- Modify: `.gitignore`
- Create: `.env.example`
- Create: `docs/PROJECT_BRIEF.md`
- Create: `docs/DESIGN_SOURCE_OF_TRUTH.md`
- Create: `docs/DATA_MODEL.md`
- Create: `docs/API_SYNC_PLAN.md`
- Create: `docs/DEPLOYMENT_CHECKLIST.md`
- Create: `docs/CODEX_WORKFLOW.md`

- [ ] **Step 1: Update instructions and environment tracking**

Replace `AGENTS.md` with project-specific Spanish UI, Stitch, secret handling, server logic, accessibility, verification, and communication rules while retaining the Next.js 16 docs warning. Add `!.env.example` below the `.env*` ignore rule, then create `.env.example` with the requested variable names and values.

- [ ] **Step 2: Write the requested documentation**

Document the approved scope, scoring and lock rules, future Stitch audit screens, intended entities and policies without SQL, Football-Data/TheSportsDB sync boundaries without API calls, deployment checks, and Codex operating workflow.

- [ ] **Step 3: Review docs against scope**

Confirm the docs do not claim a completed UI, a created database schema, configured MCP, or active external sync.

### Task 2: Shared Placeholders And Routes

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Create: `src/app/login/page.tsx`
- Create: `src/app/onboarding/page.tsx`
- Create: `src/app/dashboard/page.tsx`
- Create: `src/app/partidos/[matchId]/page.tsx`
- Create: `src/app/posiciones/page.tsx`
- Create: `src/app/perfil/page.tsx`
- Create: `src/app/admin/sync/page.tsx`
- Create: `src/components/layout/app-shell.tsx`
- Create: `src/components/layout/site-nav.tsx`
- Create: `src/components/motion/animated-page.tsx`
- Create: `src/components/prode/prode-logo-placeholder.tsx`
- Create: `src/components/prode/match-card-placeholder.tsx`
- Create: `src/components/leaderboard/leaderboard-placeholder.tsx`

- [ ] **Step 1: Create neutral shared components**

Build shared wrappers from existing shadcn UI and simple layout primitives. Add code comments that explicitly reserve final UI refinement for the Stitch MCP audit. Keep the motion boundary isolated in `AnimatedPage`.

- [ ] **Step 2: Replace the starter page and metadata**

Set the root document language and metadata to Spanish product copy. Replace the Create Next App landing content with a simple route entry placeholder for the Prode scaffold.

- [ ] **Step 3: Add route pages**

Create each requested `page.tsx` with Spanish placeholder copy. Compose pages from the shared scaffold and avoid mock predictions, fake standings, or claimed admin actions. Read `matchId` from async App Router params on the match page.

### Task 3: Library And Supabase Boundaries

**Files:**
- Create: `src/lib/config/app.ts`
- Create: `src/lib/scoring/rules.ts`
- Create: `src/lib/sports/football-data.ts`
- Create: `src/lib/sports/thesportsdb.ts`
- Create: `src/lib/supabase/README.md`
- Create: `supabase/README.md`
- Create: `supabase/migrations/.gitkeep`
- Create: `supabase/functions/.gitkeep`
- Verify: `npm run build`

- [ ] **Step 1: Add typed local constants**

Create app and scoring constants for the known product name, default lock lead time, and points rules without database or API work.

- [ ] **Step 2: Add inert integration placeholders**

Create sports placeholder modules and Supabase READMEs that state the future integration intent, secret boundaries, and the absence of schema/functions in this pass.

- [ ] **Step 3: Verify the scaffold**

Run `npm run build`. If it fails, fix the compile issue, then rerun the same command until it exits successfully.
