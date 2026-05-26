# TheSportsDB Team Enrichment Notes

## Alcance

TheSportsDB se usa solo para enriquecer metadata visual de equipos. Football-Data
sigue siendo la fuente de verdad para fixtures, horarios, estados, resultados y
ganadores.

No hay feature de UI en `/admin/sync` para este flujo. Es un script local de una
sola ejecucion, repetible e idempotente.

## Campos de base de datos

`teams` conserva el identificador existente `sportsdb_id` como ID de
TheSportsDB. No se agrego un campo duplicado `thesportsdb_id`.

Campos agregados:

- `logo_url`
- `jersey_url`
- `fanart_url`
- `thesportsdb_raw_json`
- `assets_last_synced_at`
- `team_aliases`

El script solo escribe campos de enriquecimiento en `teams`. No toca
`matches`, `predictions`, `tournament_predictions`, `profiles`, scoring ni
resultados. En modo escritura, solo actualiza equipos con cambios detectados en
los campos de enriquecimiento, por lo que se puede repetir sin duplicar datos.

## Como ejecutar

Dry-run sin escrituras:

```bash
npm run enrich:teams:thesportsdb:dry
```

Ejecucion con escrituras locales:

```bash
npm run enrich:teams:thesportsdb
```

Requisitos en `.env.local` o `.env`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `THESPORTSDB_API_KEY`

`THESPORTSDB_API_KEY` usa `123` como fallback local si no esta configurado.

El script genera un reporte local en:

```text
reports/thesportsdb-team-enrichment-report.json
```

`reports/` esta ignorado por Git. El reporte no incluye API keys.

## Estrategia de matching

La logica pura vive en `src/lib/sports/team-name-aliases.ts`.

Normalizacion:

- minusculas;
- sin acentos;
- sin puntuacion;
- espacios repetidos colapsados.

Aliases iniciales:

- `Korea Republic` / `South Korea`
- `Cote d'Ivoire` / `Ivory Coast`
- `USA` / `United States`
- `IR Iran` / `Iran`
- `Turkiye` / `Turkey`
- `Bosnia-H.` / `Bosnia and Herzegovina`
- `Czechia` / `Czech Republic`
- `Congo DR` / `DR Congo`
- `Curacao` / `Curacao` con acento en origen
- `Cape Verde` / `Cabo Verde`

Si hay mas de un candidato normalizado, el equipo queda como ambiguo y no se
actualiza automaticamente.

## Uso en UI

`/dashboard`, `/partidos/[matchId]` y `/mi-mundial` usan `badge_url` o
`logo_url` si existen. Si no existen, mantienen los flags/assets Stitch o los
placeholders actuales.

Los assets remotos no son requeridos para renderizar la app. Se cargan con
`img` simple para evitar acoplar `next/image` a dominios remotos variables.

## Head-to-head futuro

No se implementa H2H en este paso.

TheSportsDB tiene endpoints de busqueda de eventos y eventos previos por equipo,
pero en la documentacion v1 gratuita no aparece un endpoint directo y confiable
para "ultimos 3 cruces entre equipo A y equipo B".

Un enfoque futuro podria:

- guardar `sportsdb_id` de equipos;
- traer eventos previos de ambos equipos;
- intersectar o buscar por nombres normalizados;
- cachear resultados en una tabla futura `match_context`;
- mostrar el contexto en `/partidos/[matchId]`.

Ese flujo debe cachearse y validarse antes de usarlo en UI para evitar llamadas
repetidas y resultados ambiguos.
