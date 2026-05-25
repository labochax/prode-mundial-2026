# Local Data Wiring Notes

## Alcance

`/dashboard` y `/partidos/[matchId]` ahora leen partidos y predicciones desde Supabase local. La UI conserva el tratamiento Stitch existente; el cambio principal es el origen de datos.

## Seed Local

`supabase/seed.sql` carga datos falsos de desarrollo:

- Pool público: `Prode Mundial 2026` (`prode-mundial-2026`).
- Equipos: Argentina, México, Brasil, Alemania, España, Japón, Uruguay y Francia.
- Estadios de muestra.
- Cuatro partidos de ejemplo con fechas futuras.

Estos partidos no son fixtures oficiales del Mundial 2026. Son datos locales para validar el MVP visual y el flujo de pronósticos.

Los partidos fake del seed deben tener `football_data_id = null` y un marcador
`raw_json.seed_note`. Las instalaciones locales antiguas pueden conservar IDs
fake de seed; por eso la app también detecta `raw_json.seed_note` como fixture
de prueba.

## Dashboard

El panel autenticado ahora:

- asegura el perfil del usuario actual;
- busca el pool local por slug;
- agrega al usuario al pool como `member` si todavía no pertenece;
- carga partidos desde `public.matches` con equipos y estadio;
- si existen fixtures oficiales de Football-Data, muestra solo esos partidos;
- si no existen fixtures oficiales, usa los partidos fake del seed como fallback;
- carga las predicciones propias del usuario para esos partidos;
- guarda predicciones rápidas mediante Server Action y RLS normal.

## Detalle De Partido

`/partidos/[matchId]` ahora:

- busca el partido por UUID real de Supabase;
- carga la predicción existente del usuario en el pool activo;
- calcula el siguiente partido por `kickoff_at` dentro de la fuente activa:
  fixtures oficiales si existen, seed local si no existen;
- guarda cambios de predicción mediante Server Action;
- respeta el estado bloqueado que expone la base por `matches.lock_at`.

La navegación directa a un partido fake por UUID puede seguir funcionando en
desarrollo local, pero el dashboard no los promociona cuando ya hay fixtures
oficiales importados.

## Persistencia De Predicciones

Las predicciones se guardan en `public.predictions` con:

- `pool_id`
- `user_id`
- `match_id`
- `predicted_home_score`
- `predicted_away_score`

No se usa service role para el flujo normal de usuario. La base mantiene el bloqueo por partido con triggers y RLS.

## Limitaciones Actuales

- La sincronización de Football-Data.org es manual/local desde `/admin/sync`.
- No hay assets oficiales desde TheSportsDB.
- No hay Supabase remoto ni deploy.
- El seed local no crea usuarios, perfiles ni predicciones reales.
