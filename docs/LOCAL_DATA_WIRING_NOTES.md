# Local Data Wiring Notes

## Alcance

`/dashboard` y `/partidos/[matchId]` ahora leen partidos y predicciones desde Supabase local. La UI conserva el tratamiento Stitch existente; el cambio principal es el origen de datos.

## Seed Local

`supabase/seed.sql` carga un snapshot oficial local de Football-Data:

- Pool público: `Prode Mundial 2026` (`prode-mundial-2026`).
- Equipos oficiales del Mundial 2026 disponibles en Football-Data.
- Fixtures oficiales disponibles para la temporada 2026.
- `football_data_id`, `stage`, `group_code`, `kickoff_at`, `status`,
  `raw_json` y `last_synced_at`.

El reset local ya no vuelve a los fixtures fake como Argentina vs México. Los
datos fake/demo dejaron de ser la fuente default del dashboard.

El snapshot no requiere llamadas live durante `npx supabase db reset`. La sync
manual desde `/admin/sync` sigue siendo útil para cambios de calendario,
postergaciones, horarios, estados live/resultados y actualizaciones de fases
eliminatorias.

El snapshot actual no incluye `venue` a nivel partido. El backfill one-shot
enlaza estadios con el mapa oficial FIFA `M1-M104`, usa
`matches.raw_json.venue` como señal adicional cuando exista y reporta cualquier
discrepancia. Después de restaurar el seed, usar `npm run enrich:stadiums:dry`
y luego `npm run enrich:stadiums`. Ver `docs/STADIUM_DATA_NOTES.md`.

## Dashboard

El panel autenticado ahora:

- asegura el perfil del usuario actual;
- busca el pool local por slug;
- agrega al usuario al pool como `member` si todavía no pertenece;
- carga partidos desde `public.matches` con equipos y estadio;
- si existen fixtures oficiales de Football-Data, muestra solo esos partidos;
- si no existen fixtures oficiales, puede usar fixtures de prueba heredados como
  fallback de desarrollo, pero el seed default ya trae fixtures oficiales;
- carga las predicciones propias del usuario para esos partidos;
- guarda predicciones rápidas mediante Server Action y RLS normal.

## Detalle De Partido

`/partidos/[matchId]` ahora:

- busca el partido por UUID real de Supabase;
- carga la predicción existente del usuario en el pool activo;
- muestra datos oficiales del fixture primero;
- después de `lock_at`, agrega las predicciones visibles del pool para mostrar
  `Tendencia Prode` y los tres marcadores exactos más elegidos;
- antes del cierre, oculta distribución y marcadores para no condicionar
  pronósticos;
- calcula el siguiente partido por `kickoff_at` dentro de la fuente activa:
  fixtures oficiales si existen, seed local si no existen;
- guarda cambios de predicción mediante Server Action;
- respeta el estado bloqueado que expone la base por `matches.lock_at`.

La navegación directa a un partido fake heredado por UUID puede seguir
funcionando en desarrollo local, pero el dashboard no los promociona cuando ya
hay fixtures oficiales.

## Persistencia De Predicciones

Las predicciones se guardan en `public.predictions` con:

- `pool_id`
- `user_id`
- `match_id`
- `predicted_home_score`
- `predicted_away_score`

No se usa service role para el flujo normal de usuario. La base mantiene el bloqueo por partido con triggers y RLS.

## Limitaciones Actuales

- El snapshot de seed puede quedar desactualizado si Football-Data cambia
  horarios, estados o cruces eliminatorios; usar `/admin/sync` o la ruta cron
  local para refrescar.
- Los assets TheSportsDB son opcionales y se cargan solo si se ejecuto el script
  local `npm run enrich:teams:thesportsdb`.
- No hay Supabase remoto ni deploy.
- El seed local no crea usuarios, perfiles ni predicciones reales.
- El detalle no muestra historial directo porque no existe una fuente real
  mantenida para todos los cruces. `Tendencia Prode` se calcula desde filas
  reales de `public.predictions`.
- La tendencia requiere al menos 3 predicciones visibles. Antes de `lock_at`,
  RLS solo permite leer la fila propia, por lo que el panel oculta distribución,
  marcadores y conteos parciales.
