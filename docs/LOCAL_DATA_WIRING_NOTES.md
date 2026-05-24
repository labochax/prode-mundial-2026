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

## Dashboard

El panel autenticado ahora:

- asegura el perfil del usuario actual;
- busca el pool local por slug;
- agrega al usuario al pool como `member` si todavía no pertenece;
- carga partidos desde `public.matches` con equipos y estadio;
- carga las predicciones propias del usuario para esos partidos;
- guarda predicciones rápidas mediante Server Action y RLS normal.

## Detalle De Partido

`/partidos/[matchId]` ahora:

- busca el partido por UUID real de Supabase;
- carga la predicción existente del usuario en el pool activo;
- calcula el siguiente partido por `kickoff_at`;
- guarda cambios de predicción mediante Server Action;
- respeta el estado bloqueado que expone la base por `matches.lock_at`.

## Persistencia De Predicciones

Las predicciones se guardan en `public.predictions` con:

- `pool_id`
- `user_id`
- `match_id`
- `predicted_home_score`
- `predicted_away_score`

No se usa service role para el flujo normal de usuario. La base mantiene el bloqueo por partido con triggers y RLS.

## Limitaciones Actuales

- No hay sincronización con Football-Data.org.
- No hay assets oficiales desde TheSportsDB.
- No hay fixtures oficiales.
- No hay Supabase remoto ni deploy.
- El seed local no crea usuarios, perfiles ni predicciones reales.
- La tabla de posiciones todavía no consume el leaderboard SQL real.
