# Prode Mundial 2026

Prode privado para seguir el Mundial 2026 con amigos: pronósticos partido a partido, simulación de llave personal, tabla de posiciones y resultados oficiales sincronizados.

## Funcionalidades

- Autenticación con Supabase y acceso con Google.
- Perfil de jugador, grupos y subgrupos para competir en rankings filtrados.
- `/predicciones`: pronósticos de marcador, guardado por lote, filtros por fase/grupo, salto al próximo partido y Tendencia Prode real.
- `/predicciones/grupos`: tablas de grupos proyectadas a partir de pronósticos guardados.
- `/mi-mundial`: llave personal, bonus de Mi Mundial y resumen del torneo.
- `/posiciones`: ranking global y por grupos, puntos de partidos + bonus, últimos resultados y tendencia.
- `/jugadores/[userId]/mi-mundial`: vista de solo lectura del Mi Mundial y de predicciones visibles de otros jugadores.
- `/partidos/[matchId]`: detalle del partido, pronóstico, resultado y estadísticas agregadas del Prode.
- `/admin/resultados`: control protegido para sincronizar resultados y finalizar partidos manualmente cuando sea necesario.
- Sincronización de fixtures y resultados con Football-Data.org, con enriquecimiento visual opcional mediante TheSportsDB.

## Stack

- Next.js App Router y TypeScript
- Supabase: Auth, Postgres y RLS
- Tailwind CSS y sistema visual Prode
- Football-Data.org para fixtures, estados y resultados
- TheSportsDB para assets visuales de equipos
- Vitest para pruebas unitarias
- Vercel para despliegue y GitHub Actions para sincronización programada

## Desarrollo local

```bash
npm install
cp .env.example .env.local
# Completar las variables necesarias en .env.local
npm run dev
```

La aplicación queda disponible en `http://localhost:3000`.

## Variables de entorno

Definí únicamente las variables que correspondan a tu entorno. No publiques valores reales ni archivos `.env.local`.

| Variable | Uso |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública del proyecto Supabase. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave pública de Supabase para el cliente. |
| `SUPABASE_SERVICE_ROLE_KEY` | Operaciones administrativas y scripts server-only. Nunca se expone al navegador. |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` | Configuración de acceso con Google. |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET` | Secreto de configuración de Google server-only. |
| `FOOTBALL_DATA_API_TOKEN` | Sincronización de Football-Data.org. |
| `THESPORTSDB_API_KEY` | Enriquecimiento visual opcional de equipos. |
| `LOCK_MINUTES_BEFORE_KICKOFF` | Minutos de cierre antes del inicio de cada partido. |
| `CRON_SECRET` | Protege el endpoint de sincronización programada. |
| `ADMIN_EMAILS` | Lista separada por comas de correos autorizados para controles administrativos. |

## Scripts útiles

```bash
npm run dev
npm run test
npm run build
npm run lint

# Enriquecimiento visual de equipos
npm run enrich:teams:thesportsdb:dry
npm run enrich:teams:thesportsdb

# Enriquecimiento de estadios
npm run enrich:stadiums:dry
npm run enrich:stadiums
```

## Despliegue y sincronización

La app se despliega en Vercel. El endpoint de resultados es:

```text
/api/cron/football-data?mode=results
```

Está protegido por `CRON_SECRET`. El workflow de GitHub Actions lo llama periódicamente con los secretos `PRODE_APP_URL` y `CRON_SECRET`. Si la sincronización automática se retrasa o Football-Data aún no publica un resultado, `/admin/resultados` es el respaldo manual autorizado.

Un cron de Vercel, si está configurado, puede permanecer como respaldo adicional.

## Seguridad de datos

Un despliegue normal no modifica datos de Supabase. Ejecutá comandos destructivos solo con una intención explícita y entendiendo su efecto, especialmente:

```bash
npx supabase db reset
npx supabase db push --include-seed
npx supabase seed
```

`db reset` puede eliminar datos locales, incluyendo usuarios, perfiles, fixtures importados y pronósticos de prueba.

## Documentación

- [Brief del proyecto](docs/PROJECT_BRIEF.md)
- [Modelo de datos](docs/DATA_MODEL.md)
- [Puntuación local y posiciones](docs/LOCAL_SCORING_AND_LEADERBOARD_NOTES.md)
- [Automatización de sincronización](docs/AUTOMATED_SYNC_PLAN.md)
- [Control administrativo de resultados](docs/ADMIN_RESULTS_CONTROL_NOTES.md)
- [Ranking por grupos](docs/GROUP_LEADERBOARD_NOTES.md)
- [Mi Mundial y bonus](docs/MI_MUNDIAL_SIMULATOR_PLAN.md)
- [Enriquecimiento de equipos con TheSportsDB](docs/THESPORTSDB_TEAM_ENRICHMENT_NOTES.md)
