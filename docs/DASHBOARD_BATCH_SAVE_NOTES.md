# Dashboard Batch Save Notes

## Comportamiento

`/dashboard` permite cargar varios pronosticos y guardarlos en una sola accion.
Cada tarjeta mantiene sus controles de marcador, pero el estado lo administra la
lista completa de fixtures.

Cuando hay cambios pendientes:

- la tarjeta muestra `SIN GUARDAR`;
- aparece una barra inferior fija con el total de cambios;
- `Guardar cambios` envia todos los cambios editables en lote;
- `Descartar` vuelve a los ultimos valores guardados.

Los cambios pendientes se conservan al cambiar filtros de grupo o fase.

## Guardado

El Server Action `savePredictionsBatchAction` recibe un JSON con:

- `match_id`
- `predicted_home_score`
- `predicted_away_score`

El guardado usa el mismo criterio que el guardado individual:

- sesion/perfil actual;
- pool default;
- validacion Zod;
- lectura de cada partido;
- `getMatchEditability`;
- lectura de prediccion existente;
- `insert` o `update` bajo RLS normal.

No usa `upsert` masivo ni service role.

## Estados parciales

Si algunos partidos ya no son editables o fallan por permisos/RLS:

- los que se guardaron se limpian del estado pendiente;
- los que fallaron quedan como cambios sin guardar;
- la UI muestra `Se guardaron X. No se pudieron guardar Y.`

## Alcance

`/partidos/[matchId]` mantiene el guardado individual.

El batch save no cambia:

- scoring;
- esquema de base de datos;
- RLS;
- reglas de bloqueo;
- Mi Mundial, salvo revalidar `/mi-mundial` para recalcular proyecciones cuando
  cambian pronosticos de grupos.
