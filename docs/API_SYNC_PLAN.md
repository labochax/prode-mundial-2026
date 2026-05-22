# API Sync Plan

## Estado

Este plan define limites para la integracion futura. El scaffold actual no llama APIs reales.

## Fuentes Previstas

| Fuente | Uso previsto |
| --- | --- |
| Football-Data.org | Fixture, horarios, estados y resultados oficiales. |
| TheSportsDB | Recursos visuales de equipos, insignias, banderas o estadios cuando correspondan. |

## Flujo Futuro

1. Una Edge Function autorizada o un job seguro inicia la sync.
2. Football-Data.org actualiza fixture y resultados mediante upserts idempotentes.
3. Cambios relevantes de kickoff recalculan el bloqueo futuro sin reabrir partidos bloqueados sin una decision explicita.
4. Resultados oficiales disparan recalcado de puntajes server-side.
5. TheSportsDB completa referencias visuales sin mezclar assets con el dato oficial de resultado.
6. `sync_runs` registra origen, ventana consultada, resultado y errores utiles.

## Seguridad Operativa

- `FOOTBALL_DATA_API_TOKEN`, `THESPORTSDB_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` y `CRON_SECRET` se consumen solo en contextos server-side.
- La ruta administrativa no debe exponer secretos ni invocar sync sin autorizacion.
- Los reintentos deben ser idempotentes y respetar cuotas de proveedor.
- Los errores deben conservar suficiente contexto para diagnostico sin guardar tokens.

## Primer Corte Recomendado

- Sincronizar solo fixtures y resultados del torneo requerido.
- Separar datos oficiales de assets visuales.
- Mantener una accion manual segura para desarrollo antes de habilitar cron.
