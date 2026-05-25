# Automated Sync Plan

## Estado Actual

La sincronización sigue teniendo controles manuales locales desde `/admin/sync`,
pero el código ya tiene una ruta cron-ready para automatizar Football-Data
cuando haya deploy:

- `GET /api/cron/football-data`
- modos: `smart`, `fixtures`, `results`
- autorización obligatoria: `Authorization: Bearer <CRON_SECRET>` o
  `?secret=<CRON_SECRET>` para prueba local controlada

- `Probar Football-Data`: vista previa limitada, sin escrituras.
- `Sincronizar fixtures oficiales`: importa equipos y calendario disponible.
- `Sincronizar resultados ahora`: actualiza estado, marcador, minuto y puntúa solo partidos `FINISHED`.

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
- Para desarrollo local también se acepta `?secret=${CRON_SECRET}`.
- Logs sin tokens.
- Reusar los módulos server-only actuales.
- Registrar cada ejecución en `sync_runs`.

`vercel.json` usa:

- path: `/api/cron/football-data`
- schedule: `*/5 * * * *`

La ruta corre en modo `smart` por default para evitar query strings en la
configuración de Vercel Cron.

## Decisiones Smart Sync

### Fixtures

- No se ejecuta una sync completa en cada tick.
- Se ejecuta si no hay partidos oficiales Football-Data.
- Se ejecuta si la última sync exitosa de fixtures supera 12 horas.
- Se ejecuta si `mode=fixtures` fuerza el flujo.

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
- Si después de fixtures queda cuota por minuto muy baja, el orquestador omite
  resultados para evitar una llamada que probablemente termine en `429`.
- Las respuestas JSON no incluyen secretos.

## Permisos Productivos

`/admin/sync` sigue local-only. En producción hace falta:

- autorización admin real por perfil/claim;
- auditoría de acciones manuales;
- protección contra ejecución accidental;
- separación clara entre sync manual, cron y herramientas de desarrollo.

## Reglas De Producto

- La sync nunca modifica predicciones.
- Los puntos oficiales solo se calculan con `status = 'FINISHED'`.
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
