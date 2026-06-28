# Automated Sync Plan

## Estado Actual

La sincronización sigue teniendo controles manuales locales desde `/admin/sync`,
pero el código ya tiene una ruta cron-ready para automatizar Football-Data
cuando haya deploy:

- `GET /api/cron/football-data`
- modos: `smart`, `fixtures`, `results`
- autorización obligatoria: `Authorization: Bearer <CRON_SECRET>`
- en desarrollo local tambien se acepta `?secret=<CRON_SECRET>` para prueba
  controlada; en produccion no se acepta secreto por query string

- `Probar Football-Data`: vista previa limitada, sin escrituras.
- `Sincronizar fixtures oficiales`: importa equipos y calendario disponible.
- `Sincronizar resultados ahora`: actualiza estado, marcador, minuto, sede y
  asignaciones oficiales de equipos cuando Football-Data ya devuelve
  `homeTeam.id` / `awayTeam.id`; también puede completar cruces de 16avos
  solo si existe un mapeo confiable `football_data_id -> equipos oficiales`.
  Puntúa solo partidos `FINISHED`.

No hay deploy ni Edge Functions en esta etapa. `vercel.json` queda preparado
con una ejecución conservadora cada 5 minutos; la ruta decide si realmente
llama a Football-Data.

## Estrategia De Polling Futura

### Días Sin Partido

- Fixtures completos: 1 vez por día.
- Resultados recientes: 1 vez por día.
- Objetivo: capturar cambios de horario, sedes o estados administrativos sin gastar cuota.

### Día De Partido Antes Del Kickoff

- Desde 6 horas antes del primer partido del día: cada 60 minutos.
- Desde 60 minutos antes: cada 15 minutos.
- Objetivo: detectar cambios de kickoff/status antes del lock.

### Ventanas En Vivo

- Desde kickoff hasta 2 horas después del último partido activo: cada 5 a 10 minutos.
- Si Football-Data devuelve `IN_PLAY`, `PAUSED`, `EXTRA_TIME` o `PENALTY_SHOOTOUT`, mantener polling corto.
- El sync debe actualizar marcador y estado, pero no recalcular puntos hasta `FINISHED`.

### Después Del Final

- Cuando un partido aparece `FINISHED`, puntuar inmediatamente con `score_match_predictions(match_id)`.
- Reconsultar cada 15 minutos durante 2 horas por correcciones del proveedor.
- Si el resultado local ya está `FINISHED`, incluso si quedó parcialmente
  corrupto con scores nulos, Football-Data solo puede reemplazarlo con otro
  `FINISHED` que tenga ambos marcadores.
- Un match local con ambos marcadores completos también queda protegido frente
  a respuestas incompletas aunque su status local sea inconsistente.
- En ambos casos se omite completamente el update stale y se registra en
  `staleResultsSkipped`.
- Si Football-Data luego devuelve un `FINISHED` completo, aplicar el resultado
  oficial y volver a ejecutar el scoring idempotente para aceptar correcciones.
- Luego bajar a frecuencia diaria.

## Rate Limits

El cliente debe leer y registrar headers seguros:

- `X-Requests-Available-Minute`
- `X-RequestCounter-Reset`
- `X-RequestsAvailable` si el proveedor lo devuelve

Si la cuota está baja o hay `429`, el job debe pausar/reintentar después del reset en vez de insistir.

## Ruta Cron Preparada

Ruta:

- `GET /api/cron/football-data`

Parámetros:

- `mode=smart`: default, decide fixtures/resultados según estado local.
- `mode=fixtures`: fuerza sync de fixtures.
- `mode=results`: fuerza sync de resultados/live.

Autorización:

- `CRON_SECRET` obligatorio.
- Comparar `Authorization: Bearer ${CRON_SECRET}`.
- Para desarrollo local tambien se acepta `?secret=${CRON_SECRET}`.
- En produccion, `?secret=` se rechaza aunque coincida para evitar secretos en
  URLs/logs.
- Logs sin tokens.
- Reusar los módulos server-only actuales.
- Registrar cada ejecución en `sync_runs`.

`vercel.json` usa:

- path: `/api/cron/football-data`
- schedule: `*/5 * * * *`

La ruta corre en modo `smart` por default para evitar query strings en la
configuración de Vercel Cron.

## GitHub Actions Para Resultados

El workflow `.github/workflows/sync-football-data-results.yml` ejecuta
automáticamente el modo `results` cada 5 minutos, desplazado al minuto 2, y
también permite una ejecución manual desde GitHub Actions.

Configurar estos GitHub Actions secrets en el repositorio:

- `PRODE_APP_URL`: URL productiva de la aplicación, sin secretos.
- `CRON_SECRET`: mismo secreto privado configurado en la aplicación productiva.

El workflow llama a:

- `GET <PRODE_APP_URL>/api/cron/football-data?mode=results`
- header `Authorization: Bearer <CRON_SECRET>`

`/admin/resultados` permanece como respaldo manual autorizado para sincronizar
o finalizar resultados cuando Football-Data esté demorado.

## Decisiones Smart Sync

### Fixtures

- No se ejecuta una sync completa en cada tick.
- Se ejecuta si no hay partidos oficiales Football-Data.
- Se ejecuta si la última sync exitosa de fixtures supera 12 horas.
- Se ejecuta si `mode=fixtures` fuerza el flujo.
- Sigue siendo el backfill completo de calendario/equipos. `mode=results`
  también puede completar `home_team_id` / `away_team_id` en cruces ya
  definidos por Football-Data, pero no crea equipos nuevos si falta el lookup
  local.

### Resultados/Live

- Se ejecuta si hay partidos desde 30 minutos antes del kickoff hasta 3 horas
  después.
- Se ejecuta si hay partidos con estado `IN_PLAY`, `PAUSED`, `EXTRA_TIME` o
  `PENALTY_SHOOTOUT`.
- Si no hay ventana live, se permite un refresh más lento cuando la última sync
  de resultados supera 60 minutos.
- Se ejecuta si `mode=results` fuerza el flujo.

### Rate Limit

- Cada sync devuelve headers seguros de rate limit cuando Football-Data los
  entrega.
- El resumen de resultados incluye `staleResultsSkipped`; el mismo contador
  queda en la respuesta cron y en `sync_runs.summary`.
- El modo `results` no limpia equipos asignados si el proveedor omite
  temporalmente `homeTeam.id` o `awayTeam.id`; solo escribe relaciones cuando
  recibe un ID concreto y ese equipo existe localmente.
- Si Football-Data todavía no informa equipos de eliminación, el modo
  `results` no infiere el número de partido por horario. Los 16avos solo pueden
  completarse si el fixture tiene una entrada explícita y revisada en
  `official-knockout-fixture-map.ts`.
- El mapa verificado de 16avos está keyed por `football_data_id` e incluye TLA
  local/visitante. El sync resuelve esas TLAs contra `teams.tla`, corrige lados
  no nulos que contradigan el mapa verificado y no usa orden cronológico.
- Los octavos, cuartos, semifinales, tercer puesto y final se completan desde
  un mapa explícito de avance M89-M104 keyed por `football_data_id`. Cada lado
  toma el ganador o perdedor oficial de su partido fuente según corresponda; si
  el source no terminó, está empatado sin `winner`, o falta el target mapeado,
  el lado queda sin asignar.
- Los fixtures de eliminación sin ese mapa quedan bloqueados como `P/D`; esto
  es intencional para evitar cruces imposibles o equipos duplicados.
- El resumen de resultados incluye `knockoutTeamSlotsResolved`,
  `knockoutMatchesUnlocked`, `knockoutTeamSlotsSkipped` y
  `knockoutSkippedMissingOfficialFixtureMap`, además de los contadores de
  fixtures mapeados aplicados, corregidos o salteados por falta de equipo local.
  Para octavos conserva contadores específicos por compatibilidad. Para todo el
  avance M89-M104 incluye contadores genéricos de fixtures aplicados,
  corregidos, slots resueltos, partidos desbloqueados, sources faltantes,
  sources sin resultado y targets sin mapa.
- Si después de fixtures queda cuota por minuto muy baja, el orquestador omite
  resultados para evitar una llamada que probablemente termine en `429`.
- Las respuestas JSON no incluyen secretos.

### Rollback Manual De Equipos De 16avos Mal Asignados

Si una corrida anterior asignó equipos de eliminación sin IDs oficiales del
proveedor, limpiar solo esas relaciones con SQL manual auditado. No borrar
predicciones:

```sql
update public.matches
set home_team_id = null, away_team_id = null
where stage = 'LAST_32'
  and raw_json->'homeTeam'->>'id' is null
  and raw_json->'awayTeam'->>'id' is null
  and (home_team_id is not null or away_team_id is not null);
```

## Permisos Productivos

`/admin/sync` sigue local-only. En producción hace falta:

- autorización admin real por perfil/claim;
- auditoría de acciones manuales;
- protección contra ejecución accidental;
- separación clara entre sync manual, cron y herramientas de desarrollo.

## Reglas De Producto

- La sync nunca modifica predicciones.
- Los puntos oficiales solo se calculan con `status = 'FINISHED'`.
- La sync de resultados es monotónica: no degrada un resultado local finalizado
  con scores por una respuesta stale/incompleta, ni un estado live por
  `TIMED`/`SCHEDULED` sin scores.
- Estados en vivo muestran información parcial/provisional.
- `AWARDED`, `SUSPENDED`, `POSTPONED` y `CANCELLED` se guardan para visibilidad, pero no puntúan automáticamente en el MVP.

## Prueba Local Manual

1. Definir `CRON_SECRET` en `.env.local`.
2. Reiniciar `npm run dev`.
3. Probar:
   - `/api/cron/football-data?mode=smart&secret=<local secret>`
   - `/api/cron/football-data?mode=results&secret=<local secret>`
4. Confirmar que un secreto inválido devuelve `401`.
5. Confirmar que `/dashboard` sigue leyendo los fixtures oficiales o el seed
   fallback según corresponda.
