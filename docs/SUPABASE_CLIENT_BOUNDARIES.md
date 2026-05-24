# Supabase Client Boundaries

Este documento define los límites de uso antes de conectar Auth/UI real.

## Cliente de navegador

Archivo: `src/lib/supabase/client.ts`

- Usa `createBrowserClient` de `@supabase/ssr`.
- Usa solo `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- No importa ni conoce `SUPABASE_SERVICE_ROLE_KEY`.
- Debe usarse únicamente desde componentes cliente o hooks cliente.

## Cliente de servidor con sesión

Archivo: `src/lib/supabase/server.ts`

- Usa `createServerClient` de `@supabase/ssr`.
- Lee cookies con `next/headers`.
- Debe crearse por request en Server Components, Server Actions o Route Handlers.
- No usa service role.
- Sirve para consultas normales bajo RLS del usuario autenticado.

## Cliente admin / service role

Archivo: `src/lib/supabase/admin.ts`

- Importa `server-only`.
- Usa `SUPABASE_SERVICE_ROLE_KEY`.
- Solo debe usarse para sync, scoring, cron o tareas admin futuras.
- No debe importarse desde componentes cliente, hooks cliente ni módulos compartidos con el navegador.

La validación de service role vive en `src/lib/config/env.server.ts` para mantener ese secreto fuera del helper público importable por el navegador.

## Helpers de entorno

- `src/lib/config/env.ts` valida únicamente variables públicas de Supabase.
- `src/lib/config/env.server.ts` valida variables servidor/admin y está protegido con `server-only`.
- Las funciones validan al ser llamadas para no romper builds estáticos donde Supabase todavía no se usa.

## Consultas tipadas

Los módulos en `src/lib/supabase/queries/` aceptan un cliente Supabase tipado como argumento. No crean clientes por su cuenta y no están conectados todavía a las páginas.

Consultas iniciales:

- `getCurrentProfile(client)`
- `getMatches(client)`
- `getMatchById(client, matchId)`
- `getPredictionForMatch(client, matchId, poolId?)`
- `getPoolLeaderboard(client, poolId)`

## Regenerar tipos

Con Supabase local corriendo:

```bash
npx supabase gen types typescript --local > src/lib/supabase/database.types.ts
```

No regenerar tipos contra un proyecto remoto salvo que la tarea lo pida explícitamente.
