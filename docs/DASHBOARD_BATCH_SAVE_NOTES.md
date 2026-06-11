# Dashboard Batch Save Notes

## Comportamiento

`/predicciones` permite cargar varios pronosticos y guardarlos en una sola
accion. `/dashboard` queda como redirect compatible hacia esa ruta.
Cada tarjeta mantiene sus controles de marcador, pero el estado lo administra la
lista completa de fixtures.

Cuando hay cambios pendientes:

- la tarjeta muestra `SIN GUARDAR`;
- aparece una barra inferior fija con el total de cambios;
- `Guardar predicciones` envia todos los cambios editables en lote;
- `Descartar` vuelve a los ultimos valores guardados.

Los cambios pendientes se conservan al cambiar filtros de grupo o fase.

Un marcador visible `0-0` es un pronostico valido. La UI distingue entre:

- una fila guardada en `predictions` con resultado `0-0`;
- un partido que solo muestra el valor visual default y todavia no tiene fila.

Al hacer clic en `Guardar predicciones`, el lote incluye tanto los cambios
manuales como los defaults `0-0` faltantes de partidos editables. No hay
autosave al cargar la pagina. Partidos bloqueados, iniciados, finalizados, sin
equipos oficiales o no editables quedan excluidos.

La barra muestra:

- `X cambios sin guardar` cuando solo hay cambios manuales;
- `Y predicciones pendientes` cuando solo faltan filas default `0-0`;
- `X cambios + Y pendientes 0-0` cuando existen ambos casos.

Si el usuario intenta salir de `/predicciones` con cambios pendientes:

- refresh/cierre usa el aviso nativo de `beforeunload`;
- navegacion interna muestra `Tenés cambios sin guardar. ¿Querés salir sin guardar?`;
- links con modificadores, descargas, `target="_blank"` y anchors internos no
  disparan el aviso.

## Carga Rapida

En partidos editables, tocar el escudo local o visitante usa el mismo helper
`generateQuickPickScore` que el detalle del partido y carga un marcador
razonable a favor de ese equipo. El control central `EMP` carga un empate.

La carga rapida:

- actualiza los steppers inmediatamente;
- marca la tarjeta como `SIN GUARDAR`;
- suma el partido a la barra de batch save;
- no guarda automaticamente;
- queda desactivada si el partido ya no admite predicciones.

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

`Mis grupos` y `Mi Mundial` consideran completo un partido cuando existe su
fila de prediccion, incluso si el marcador guardado es `0-0`. Un partido sin
fila sigue siendo incompleto.

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
