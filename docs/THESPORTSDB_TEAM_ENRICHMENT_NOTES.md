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

## Fuente de assets

La API v1 con free key `123` puede devolver datos limitados o irrelevantes para
selecciones nacionales. Por ejemplo, `searchteams.php?t=Argentina` puede
responder un club en vez de la seleccion.

Por eso el script usa como estrategia preferida las paginas publicas:

1. lee `https://www.thesportsdb.com/league/4429-fifa-world-cup`;
2. extrae links `/team/<id>-<slug>`;
3. matchea esos slugs contra nombres locales y aliases;
4. abre la pagina publica del equipo;
5. extrae solo assets principales del equipo.

La API queda como camino opcional/futuro para keys premium o respuestas utiles,
pero el fallback publico es el camino confiable para la free key.

## Extraccion de assets

El script guarda:

- `badge_url`: imagen con `alt` tipo `team badge`, preferentemente
  `/team/badge/`;
- `logo_url`: imagen con `alt` tipo `team logo`, preferentemente
  `/team/logo/`;
- `jersey_url`: imagen `/team/equipment/`;
- `fanart_url`: imagen `/team/fanart/` o `/team/banner/`.

Ignora iconos chicos de partidos proximos:

- URLs terminadas en `/tiny`;
- `alt="tiny home badge icon"`;
- `alt="tiny away badge icon"`.

Esto evita guardar escudos de rivales que aparecen en widgets de próximos
partidos.

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

Los slugs de TheSportsDB se normalizan igual que los nombres locales. Tambien
se decodifican slugs URL-encoded, por ejemplo `cura%C3%A7ao`.

Si hay mas de un candidato normalizado en el camino API, el equipo queda como
ambiguo y no se actualiza automaticamente.

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
