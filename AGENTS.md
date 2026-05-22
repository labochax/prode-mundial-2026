<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Prode Mundial 2026 Codex Rules

## Product And Language

- Build for a private group of friends playing a FIFA World Cup 2026 Prode, mostly in Argentina.
- Keep all user-facing UI copy in Spanish.
- Use concrete Spanish wording for placeholders. Do not leave Create Next App English copy in product routes.

## Design Authority

- Google Stitch project `WorldCupProde` is the strict visual source of truth.
- Audit Stitch project id `15571639831700616710` before implementing final visual work.
- Do not freestyle a dashboard, arcade, or tournament aesthetic beyond the audited Stitch screens.
- Until Stitch MCP is configured and inspected, keep UI placeholders neutral and label them as temporary where relevant.

## Security And Game Logic

- Never expose API keys, cron secrets, service credentials, or private environment variables.
- Never use the Supabase service role key in client code or any browser-exposed module.
- Keep privileged Supabase work server-side and enforce sensitive game rules in server/database paths where appropriate.
- Treat prediction visibility, per-match lock timing, and score calculation as authoritative backend concerns.
- Do not hardcode real provider tokens or connect production services without an explicit task.

## Implementation Standards

- Read the relevant Next.js 16 local docs before using App Router APIs that may have changed.
- Prefer accessible shadcn/Radix patterns, semantic HTML, visible focus states, and reduced-motion-aware interactions.
- Keep pages and components typed, small, and aligned with the existing App Router and `src` structure.
- Explain changes clearly to the user, including assumptions and verification results.

## Verification

- Run `npm run build` or a project typecheck after meaningful code changes.
- Fix compile failures introduced by the change before reporting completion.
