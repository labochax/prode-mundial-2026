# Automated Sync Plan

## Estado Actual

La sincronización sigue siendo manual y local desde `/admin/sync`.

- `Probar Football-Data`: vista previa limitada, sin escrituras.
- `Sincronizar fixtures oficiales`: importa equipos y calendario disponible.
- `Sincronizar resultados ahora`: actualiza estado, marcador, minuto y puntúa solo partidos `FINISHED`.

No hay Vercel Cron, Edge Functions ni deploy en esta etapa.

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

## Vercel Cron Futuro

Ruta propuesta:

- `POST /api/cron/football-data/results`
- `POST /api/cron/football-data/fixtures`

Requisitos antes de activar:

- `CRON_SECRET` obligatorio.
- Comparar `Authorization: Bearer ${CRON_SECRET}`.
- Logs sin tokens.
- Reusar los módulos server-only actuales.
- Registrar cada ejecución en `sync_runs`.

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
