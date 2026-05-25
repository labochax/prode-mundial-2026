# API Sync Implementation Plan

## Alcance

Este documento define el diseño de sincronizacion para Football-Data.org y TheSportsDB antes de implementar clientes, jobs, Edge Functions o cron. No se llamaron APIs externas para escribir este plan.

Fuentes revisadas:

- Football-Data.org v4 overview: https://docs.football-data.org/general/v4/index.html
- Football-Data.org quickstart: https://www.football-data.org/documentation/quickstart
- Football-Data.org lookup tables, headers y enums: https://docs.football-data.org/general/v4/lookup_tables.html
- TheSportsDB v1 docs: https://www.thesportsdb.com/documentation#v1
- TheSportsDB examples: https://www.thesportsdb.com/docs_api_examples

## 1. Revision Del Esquema Local Actual

### `teams`

- `football_data_id`: clave externa principal para identificar equipos desde Football-Data.org. Debe ser unica e idempotente para upserts.
- `sportsdb_id`: clave opcional de TheSportsDB para enriquecimiento visual. No debe usarse para resultados oficiales.
- `name_es`: nombre visible de UI en espanol. Football-Data suele devolver nombres en ingles; la app debe conservar traducciones/alias propios cuando haga falta.
- `name_en`, `short_name`, `tla`: campos utiles para mapear nombres, codigos FIFA/TLA y fallback visual.
- `flag_url`: puede venir de Football-Data (`area.flag` o assets similares) o TheSportsDB si se decide enriquecer banderas.
- `badge_url`: candidato principal para badges/escudos desde TheSportsDB.
- `raw_json`: payload original del proveedor. Debe guardar el ultimo payload relevante para diagnostico y remapeo sin perder informacion.

### `stadiums`

- Hoy contiene `name`, `city`, `country`, `image_url`, `raw_json`.
- Football-Data puede no tener estadio completo para todos los casos o niveles de plan; TheSportsDB puede ayudar con venue images si se logra mapear.
- El esquema actual alcanza para MVP si el estadio se mapea por nombre/ciudad. Para una sync mas robusta conviene agregar una clave externa por proveedor.

### `matches`

- `football_data_id`: clave externa oficial para fixture/resultados. Debe ser el eje de upsert.
- `match_number`: util para orden mundialista si Football-Data lo expone o si se infiere desde payload oficial.
- `stage`: debe mapear desde `stage` de Football-Data. Sus enums incluyen valores como `GROUP_STAGE`, `LAST_16`, `QUARTER_FINALS`, `SEMI_FINALS`, `FINAL`.
- `group_code`: debe mapear desde `group`, por ejemplo `GROUP_A`, `GROUP_B`; la UI puede convertirlo a `Grupo A`.
- `kickoff_at`: debe mapear desde la fecha/hora UTC oficial.
- `lock_at`: se calcula por trigger desde `kickoff_at` menos `settings.lock_minutes_before_kickoff`. La sync no debe escribirlo salvo correccion admin explicita.
- `status`: hoy permite `SCHEDULED`, `TIMED`, `IN_PLAY`, `PAUSED`, `FINISHED`, `POSTPONED`, `CANCELLED`. Football-Data tambien documenta `EXTRA_TIME`, `PENALTY_SHOOTOUT`, `SUSPENDED`, `AWARDED`; esto requiere decision de migracion antes de live sync.
- `minute`: opcional para live/in-play si el proveedor lo entrega o se infiere.
- `home_score`, `away_score`: deben mapear desde marcador oficial de tiempo regular/final segun regla MVP. Para el MVP no se predicen penales.
- `winner`: `HOME_TEAM`, `AWAY_TEAM`, `DRAW`. Debe derivarse del marcador MVP usado para scoring.
- `raw_json`: payload completo del match oficial.
- `last_synced_at`: timestamp de ultimo update exitoso por proveedor.

### `predictions`, `settings` y scoring

- `predictions` ya guarda una fila por `pool_id + user_id + match_id`.
- `score_match_predictions(match_id)` es idempotente y solo puntua partidos `FINISHED` con ambos scores.
- `settings.lock_minutes_before_kickoff` controla el lock default.
- Los triggers bloquean cambios de predicciones despues de `matches.lock_at` para usuarios normales.

### `supabase/seed.sql`

- Sigue siendo util para desarrollo offline.
- El seed default ahora usa un snapshot oficial de Football-Data para equipos y
  fixtures 2026.
- Ya no debe cargar fixtures fake/demo en el dashboard default.
- La sync manual/live sigue siendo necesaria para cambios de horario,
  postergaciones, estados de partido, resultados y fases eliminatorias que el
  snapshot pueda no reflejar.

## 2. Plan De Sync Con Football-Data.org

### Endpoints esperados

Football-Data v4 expone recursos y subrecursos relevantes:

- `GET /v4/competitions/{id_or_code}/teams` para equipos de una competencia.
- `GET /v4/competitions/{id_or_code}/matches` para fixture de una competencia, con filtros como `dateFrom`, `dateTo`, `stage`, `status`, `matchday`, `group`, `season`.
- `GET /v4/matches/{id}` para refrescar un partido puntual.
- `GET /v4/matches?competitions={codes}&status={statuses}` para ventanas de partidos entre competiciones si resulta mas conveniente.

Para Mundial, usar inicialmente codigo `WC` solo despues de confirmar disponibilidad del torneo/temporada 2026 en la cuenta. La documentacion muestra `FIFA World Cup` con codigo `WC` en ejemplos de respuesta, pero la cobertura exacta de 2026 y permisos deben verificarse con token real en una fase posterior.

### Token y cliente server-only

- Usar `FOOTBALL_DATA_API_TOKEN`.
- Enviar token en header `X-Auth-Token`.
- El cliente debe vivir en modulo server-only, por ejemplo `src/lib/sync/football-data/client.ts`.
- Nunca importar ese cliente desde componentes client ni rutas publicas sin autorizacion.
- No guardar token en logs, errores serializados o UI.

### Rate limit y headers

Football-Data documenta headers utiles:

- `X-RequestsAvailable`: requests restantes antes de bloqueo.
- `X-RequestCounter-Reset`: segundos hasta reset.
- `X-API-Version`: version usada.
- `X-Authenticated-Client`: cliente detectado.

El cliente debe leer esos headers en cada respuesta y persistirlos en `sync_runs` o logs server-side seguros para diagnostico.

### Sync de equipos

Flujo:

1. Fetch equipos de competencia/temporada.
2. Por cada team:
   - upsert por `football_data_id`;
   - actualizar `name_en`, `short_name`, `tla`, `raw_json`;
   - conservar `name_es` si ya fue editado manualmente;
   - no pisar `sportsdb_id`, `badge_url` o assets enriquecidos salvo regla explicita.
3. Registrar equipos nuevos que requieren traduccion/alias.

Regla de nombres:

- `name_es` debe ser fuente de UI.
- Si no existe traduccion, usar fallback inicial desde `shortName || name`, pero marcar en `raw_json` o `provider_errors` que falta revision.

### Sync de fixtures

Flujo:

1. Fetch `competitions/WC/matches?season=2026` o la combinacion oficial confirmada.
2. Upsert `matches` por `football_data_id`.
3. Resolver `home_team_id` y `away_team_id` por `teams.football_data_id`.
4. Mapear:
   - `utcDate` -> `kickoff_at`;
   - `status` -> `matches.status`;
   - `stage` -> `matches.stage`;
   - `group` -> `matches.group_code`;
   - score oficial -> `home_score`, `away_score`;
   - winner oficial o derivado -> `winner`;
   - payload completo -> `raw_json`;
   - `last_synced_at = now()`.
5. Dejar que el trigger recalcule `lock_at` cuando cambia `kickoff_at`, salvo correccion explicita.

### Kickoff updates

Regla recomendada:

- Si `now() < old.lock_at`, permitir update de `kickoff_at`; el trigger recalcula `lock_at`.
- Si el partido ya esta bloqueado, actualizar `kickoff_at` solo si el cambio viene de fixture oficial y registrar el cambio en `sync_runs`; no modificar predicciones.
- Si una postergacion oficial mueve un partido ya bloqueado muy lejos en el futuro, no reabrir predicciones automaticamente. Esa decision debe ser admin/producto, no sync automatica.

### Status y resultados

Mapeo base:

- `SCHEDULED`, `TIMED`: partido futuro.
- `IN_PLAY`, `PAUSED`: partido en progreso.
- `FINISHED`: marcador final disponible y scoring habilitado.
- `POSTPONED`, `CANCELLED`: no puntuar; mostrar estado en UI.

Decision pendiente:

- Agregar soporte DB para `EXTRA_TIME`, `PENALTY_SHOOTOUT`, `SUSPENDED`, `AWARDED`, porque Football-Data los documenta y el check actual no los permite.

### Scoring

Cuando una sync marque un match como `FINISHED` con scores no nulos:

1. actualizar match;
2. llamar `score_match_predictions(match_id)`;
3. guardar cantidad puntuada en `sync_runs`;
4. revalidar UI si el flujo corre desde una accion del app.

`score_match_predictions` es idempotente, asi que reejecutar el resultado oficial es seguro.

### Fallos e idempotencia

- Todos los upserts deben usar claves de proveedor (`football_data_id`) y no nombres.
- Fallo parcial de un partido no debe abortar todo el lote si se puede continuar.
- Guardar respuesta y error sanitizado por match en `sync_runs` o `provider_errors`.
- Nunca borrar fixtures locales por ausencia en una respuesta parcial.
- Retries con backoff si hay 429/rate limit o errores 5xx.
- Si hay 401/403, abortar lote y registrar configuracion/token invalido.

### Frecuencia recomendada

Para desarrollo local:

- Manual desde `/admin/sync`.

Para produccion futura:

- Fixture completo: diario cuando falten semanas/meses.
- Fixture cercano: cada 1-6 horas durante torneo.
- Dias de partido: cada 5-15 minutos para status/resultados, ajustado a rate limits.
- Partido en vivo: evitar polling agresivo salvo que el plan de API lo soporte; MVP puede usar sync periodica moderada.

## 3. Plan De Enriquecimiento Con TheSportsDB

### Uso esperado

TheSportsDB debe complementar, no reemplazar, los datos oficiales:

- badges o logos de equipos;
- banderas si Football-Data no alcanza;
- imagenes de estadios/venues si hay match confiable;
- arte adicional opcional para UI futura.

### Cliente server-only

- Usar `THESPORTSDB_API_KEY`.
- Para v1, la key va en la URL: `https://www.thesportsdb.com/api/v1/json/{key}/...`.
- El valor local default puede ser `123`, como documenta TheSportsDB para free key.
- Aunque v1 use key en URL, las llamadas deben hacerse server-side para no exponer habitos de uso ni facilitar scraping desde el cliente.

### Endpoints candidatos

- `searchteams.php?t={teamName}` para buscar equipo por nombre.
- `lookupteam.php?id={idTeam}` cuando ya exista `sportsdb_id`.
- `searchvenues.php?v={venueName}` para venues/estadios si se decide enriquecer estadios.
- Event search solo si hace falta metadata visual; no usarlo para resultados oficiales.

### Persistencia

- Guardar `teams.sportsdb_id` al primer match confiable.
- Guardar `teams.badge_url`, `teams.flag_url` si es mejor que el fallback actual.
- Guardar `stadiums.image_url` si el venue match es confiable.
- Guardar payload original en `raw_json`, idealmente bajo clave separada si se agrega migracion (`raw_json->sportsdb`).

### Fallos

- Fallo de TheSportsDB no debe bloquear sync de Football-Data.
- Rate limit documentado: free users 30 requests/min; premium 100/min; business 120/min. Implementar throttle conservador.
- Si no hay match confiable por nombre, no inventar assets; dejar null/fallback Stitch.

## 4. Opciones De Ejecucion De Sync

### Local manual route/button

Ventajas:

- Simple para probar mapeos.
- Permite dry-run y comparar payload antes de escribir.
- Encaja con `/admin/sync` actual.

Desventajas:

- No es produccion.
- Requiere sesion manual y guard fuerte local/dev.

### Vercel Cron

Ventajas:

- Bueno para scheduling en despliegue Next.
- Puede llamar Route Handler server-only protegido por `CRON_SECRET`.

Desventajas:

- Necesita deploy y configuracion.
- Requiere resolver admin auth/secret handling antes.

### Supabase Edge Function

Ventajas:

- Cerca de la base de datos.
- Buena para jobs server-side con service role.
- Puede integrarse con Supabase Cron.

Desventajas:

- Nuevo runtime y packaging.
- Requiere cuidado extra para compartir mapping/types con app.

### Server action/admin route MVP

Ventajas:

- Menos piezas ahora.
- Reusa `src/lib/supabase/admin.ts`.
- Puede tener boton manual `Sync fixtures` y `Sync results` en `/admin/sync`.

Desventajas:

- Debe quedar bloqueado en produccion hasta admin auth real.
- No reemplaza cron.

Recomendacion: empezar con server-only fetch clients y acciones manuales locales en `/admin/sync`. Despues mover la misma logica a Route Handler/Cron o Edge Function cuando el mapping este probado.

## 5. Cambios De Base De Datos Necesarios

El esquema actual alcanza para un primer sync local de equipos, fixtures y resultados si se aceptan limitaciones.

Migraciones recomendadas antes de produccion:

1. `sync_runs`
   - `id uuid`
   - `provider text`
   - `kind text` (`fixtures`, `results`, `assets`)
   - `status text` (`started`, `success`, `partial_failure`, `failed`)
   - `started_at`, `finished_at`
   - `requested_url text` sanitizado
   - `request_filters jsonb`
   - `response_headers jsonb`
   - `inserted_count`, `updated_count`, `failed_count`
   - `error_json jsonb`

2. `provider_errors`
   - `id uuid`
   - `sync_run_id uuid`
   - `provider text`
   - `entity_type text`
   - `entity_external_id text`
   - `message text`
   - `details jsonb`

3. Match status expansion
   - Agregar `EXTRA_TIME`, `PENALTY_SHOOTOUT`, `SUSPENDED`, `AWARDED` al check actual.

4. Competition/season metadata
   - Opcion A: columnas en `matches`: `external_competition_code`, `season`.
   - Opcion B: tablas `competitions` y `seasons`.
   - MVP puede empezar con columnas simples.

5. Stadium provider fields
   - `football_data_id` si el proveedor lo expone.
   - `sportsdb_id`.
   - `asset_source`.

6. Asset source fields
   - En `teams`: `flag_source`, `badge_source`.
   - En `stadiums`: `image_source`.
   - Evita confundir assets locales Stitch con URLs externas.

No crear estas migraciones hasta implementar el primer cliente y confirmar payloads reales.

## 6. Locking Y Seguridad De Predicciones

### `kickoff_at` y `lock_at`

- La sync puede actualizar `kickoff_at`.
- El trigger recalcula `lock_at` si `kickoff_at` cambia y `lock_at` no fue modificado explicitamente.
- No escribir `lock_at` desde sync normal.

### Predicciones bloqueadas

- La sync nunca debe modificar `predictions`.
- El lock trigger de predicciones sigue siendo autoridad para usuarios.
- Service role puede actualizar matches/resultados, pero no debe reabrir predicciones.

### Score oficial y scoring

- Solo puntuar cuando `status = 'FINISHED'` y ambos scores no son null.
- Para MVP, usar score final compatible con regla actual de 3/1/0 y sin penales.
- Si el partido termina por penales, decidir antes si el MVP usa resultado de tiempo regular/extra o marcador oficial final. Hoy no se predicen penales.

### Idempotencia

- Repetir `score_match_predictions(match_id)` debe mantener mismos puntos si el resultado no cambio.
- Si un proveedor corrige un resultado, reejecutar scoring recalcula puntos. Registrar correccion en `sync_runs`.
- No borrar `points` automaticamente para partidos no `FINISHED`; si un resultado se revierte, debe ser decision admin.

## 7. Plan Para `/admin/sync`

Estado actual:

- Mantiene sandbox local de scoring.
- Usa service role solo en server action local/dev.
- Esta desactivado en produccion.

Evolucion propuesta:

1. Mantener `Finalizar y puntuar` para desarrollo local.
2. Agregar `Sync fixtures` en modo local:
   - dry-run primero;
   - mostrar conteos insert/update/error;
   - no exponer payload gigante en UI.
3. Agregar `Sync results`:
   - refrescar partidos recientes y proximos;
   - puntuar finalizados.
4. Mostrar ultimo `sync_run`:
   - proveedor;
   - tipo;
   - estado;
   - timestamp;
   - conteos;
   - errores sanitizados.
5. En produccion, mantener disabled hasta tener roles admin reales.

## 8. Fases De Implementacion

### Phase A: docs + env sanity checks

- Confirmar variables:
  - `FOOTBALL_DATA_API_TOKEN`
  - `THESPORTSDB_API_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `CRON_SECRET` futuro
- Agregar helper server-only que valida env sin romper build cuando no se usa.
- Confirmar competencia/season real para Mundial 2026.

### Phase B: server-only fetch clients

- `src/lib/sync/football-data/client.ts`
- `src/lib/sync/thesportsdb/client.ts`
- Tipos Zod o TypeScript para payload minimo.
- Manejo de status HTTP, 429, headers de rate limit, errores JSON.
- Sin escribir DB todavia: solo parse/dry-run local.

### Phase C: sync manual de fixtures Football-Data

- Accion local en `/admin/sync`.
- Dry-run y commit mode.
- Upsert de teams y matches por external IDs.
- Mantener seed local separado.

### Phase D: sync de resultados + scoring

- Refrescar matches por fecha/status o match ID.
- Actualizar status/scores/winner/raw_json/last_synced_at.
- Llamar `score_match_predictions`.
- Registrar sync run.

### Phase E: enriquecimiento TheSportsDB

- Buscar equipos por alias/name.
- Guardar `sportsdb_id` y URLs de assets.
- Enriquecer estadios si el match es confiable.
- No bloquear fixtures/resultados si falla.

### Phase F: scheduling productivo

- Elegir Vercel Cron o Supabase Edge Function.
- Agregar `CRON_SECRET`.
- Agregar roles admin/productivos.
- Crear observabilidad minima de sync.

## 9. Reglas De Seguridad

- Ningun token de API en browser.
- Ningun service role en componentes client ni modulos importables por navegador.
- Clientes de sync con `import "server-only"`.
- Acciones de sync server-only.
- `/admin/sync` local-only hasta tener autorizacion admin real.
- Produccion requiere:
  - admin role en DB o claims;
  - auditoria;
  - rate limiting;
  - proteccion CSRF/origin para acciones mutables;
  - manejo de errores sin secretos.

## 10. Plan De Verificacion

### Tests unitarios/mapping

- Map Football-Data team -> `teams`.
- Map Football-Data match scheduled -> `matches`.
- Map final score -> `home_score`, `away_score`, `winner`.
- Map statuses no soportados -> error controlado o migracion requerida.
- Map TheSportsDB team -> `sportsdb_id`, `badge_url`, `flag_url`.

### Dry-run local

- Ejecutar fetch con fixtures reales en modo dry-run.
- Ver conteos esperados sin escribir DB.
- Confirmar que URLs con token no se imprimen.

### Idempotencia

- Ejecutar sync fixture dos veces.
- Confirmar que no duplica teams/matches.
- Confirmar que `last_synced_at` cambia y external IDs se mantienen.

### Lock y predicciones

- Crear prediccion antes de lock.
- Cambiar kickoff futuro y confirmar `lock_at` recalculado.
- Bloquear partido y confirmar que sync de resultado no modifica predicciones.
- Confirmar que usuarios normales no pueden editar despues del lock.

### Scoring

- Guardar predicciones.
- Marcar partido `FINISHED` desde sync.
- Ejecutar `score_match_predictions`.
- Confirmar leaderboard actualizado.
- Reejecutar sync y confirmar mismo resultado.

### Seguridad

- Buscar `FOOTBALL_DATA_API_TOKEN`, `THESPORTSDB_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` en bundle/client imports.
- Confirmar que `src/lib/supabase/admin.ts` y clientes de sync no aparecen en componentes `"use client"`.
- Confirmar que logs no incluyen tokens, cookies ni service keys.

## Proximo Paso Recomendado

Implementar Phase A y B: crear clientes server-only en modo dry-run, validadores de env y mappers puros con tests. No escribir a Supabase ni tocar UI hasta confirmar payloads reales y decision de migracion para statuses de Football-Data.

## Nota De Implementacion Phase A/B

Se agregaron los primeros bloques seguros de integracion:

- Helpers server-only para leer `FOOTBALL_DATA_API_TOKEN` y `THESPORTSDB_API_KEY`.
- Cliente server-only de Football-Data con header `X-Auth-Token`, errores controlados y lectura de headers de rate limit.
- Cliente server-only de TheSportsDB con key local default `123`.
- Mappers puros para convertir payloads externos en candidatos DB-shaped, sin upserts.
- Vista previa local en `/admin/sync` mediante `Probar Football-Data`.

La vista previa no escribe en Supabase. Los tokens permanecen en contexto servidor y no se importan en componentes client.

## Nota De Implementacion Phase C Inicial

Se agregó la primera sincronización manual local de fixtures:

- Migración `sync_runs` y `provider_errors` para observabilidad mínima.
- Acción server-only desde `/admin/sync` con botón `Sincronizar fixtures oficiales`.
- Escritura con cliente admin server-only, desactivada en producción.
- Upsert de `teams` por `football_data_id`.
- Inserción/actualización de `matches` por `football_data_id`.
- `lock_at` queda a cargo del trigger existente: en inserts se envía `null` para que la base lo calcule, y en updates no se escribe `lock_at`.
- No se modifican predicciones, no se ejecuta `score_match_predictions`, no se llama TheSportsDB y no hay cron.

La semilla local pasó a ser un snapshot oficial de Football-Data. El sync
oficial no elimina filas locales, pero el dashboard default ya no depende de
fixtures fake/demo después de `npx supabase db reset`. Además de
`football_data_id`, la app sigue reconociendo `raw_json.seed_note` para ocultar
fixtures fake heredados que pudieran quedar en instalaciones antiguas.

## Nota De Implementacion Phase D Inicial

Se agregó la base de sincronización manual de resultados/live:

- Migración para preservar estados Football-Data: `EXTRA_TIME`,
  `PENALTY_SHOOTOUT`, `SUSPENDED` y `AWARDED`, además de los estados ya
  soportados.
- Acción server-only desde `/admin/sync` con botón
  `Sincronizar resultados ahora`.
- Escritura con cliente admin server-only, desactivada en producción.
- Actualización de partidos existentes por `football_data_id`.
- Se actualizan `status`, `minute`, marcador, `winner`, `raw_json`,
  `last_synced_at` y `kickoff_at`.
- No se modifican predicciones directamente.
- `score_match_predictions(match_id)` se ejecuta solo para partidos
  `FINISHED`.
- Estados live se muestran como información parcial; el leaderboard oficial
  sigue dependiendo de partidos puntuados/finalizados.

`AWARDED`, `SUSPENDED`, `POSTPONED` y `CANCELLED` se registran, pero no puntúan
automáticamente hasta definir una regla de producto.

## Nota De Implementacion Cron-Ready

Se agregó la preparación para sincronización automática sin desplegar todavía:

- Route Handler server-only `GET /api/cron/football-data`.
- Autorización obligatoria por `CRON_SECRET`.
- Modo default `smart`, más modos manuales `fixtures` y `results`.
- Orquestador server-only que decide si ejecutar fixtures y/o resultados según
  estado de la base, ventana live y última sync exitosa.
- `vercel.json` preparado con cron cada 5 minutos en
  `/api/cron/football-data`; la ruta decide si debe llamar al proveedor.
- Se reutilizan las funciones server-only existentes de fixtures y resultados.
- No se persisten puntos provisionales; solo se puntúan partidos `FINISHED`.
- No se exponen tokens ni service role en código client.

La activación productiva todavía requiere configurar `CRON_SECRET`,
variables privadas del proyecto y revisar permisos/admin antes de desplegar.
