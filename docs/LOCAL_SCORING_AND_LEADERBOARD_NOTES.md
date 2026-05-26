# Local Scoring And Leaderboard Notes

## Posiciones

`/posiciones` ahora lee el ranking desde Supabase local:

1. valida la sesión del usuario;
2. asegura el perfil local;
3. obtiene o crea la membresía del usuario en el pool `prode-mundial-2026`;
4. llama `public.get_pool_leaderboard(pool_id)`;
5. mapea los resultados a la UI Stitch existente.

Por ahora `Global` y `Amigos` muestran el mismo pool local. La separación real entre rankings queda pendiente hasta implementar grupos/pools productivos.

## Puntaje Local

`/admin/sync` funciona como sandbox local de resultados:

- lista los partidos del seed local;
- permite cargar marcador final;
- marca el partido como `FINISHED`;
- calcula `winner`;
- ejecuta `public.score_match_predictions(match_id)`;
- revalida `/posiciones`, `/dashboard` y `/partidos/[matchId]`.

La acción usa el cliente admin server-only porque los usuarios normales no tienen permisos para actualizar resultados. No se importa service role en componentes client.

## Resultados De Prueba Para Mi Mundial

`/admin/sync` incluye `Autocompletar Mundial de prueba` solo para entorno local/dev.

La herramienta existe porque los fixtures oficiales de eliminatorias pueden venir con equipos placeholder (`Por definir`, `P/D`) hasta que el torneo real resuelva esos cruces. Aunque se cargue un marcador final manualmente, sin `home_team_id` y `away_team_id` reales no se puede derivar campeón, subcampeón ni equipos por ronda para calcular el bonus de `Mi Mundial`.

El simulador dev:

- usa la llave guardada del usuario actual como resultado ficticio del torneo;
- asigna equipos y marcadores determinísticos a los partidos 73-104;
- completa los fixtures knockout aunque Football-Data los haya importado con `match_number` nulo;
- al completar eliminatorias, guarda el `match_number` FIFA esperado para que `actual-outcomes` pueda derivar rondas y posiciones finales;
- completa marcadores determinísticos de fase de grupos;
- no llama APIs externas;
- no modifica pronósticos de usuarios;
- no ejecuta scoring por sí mismo.

Después de autocompletar, `Calcular bonus Mi Mundial` puede puntuar llaves guardadas si existe una predicción completa. Esta herramienta no debe convertirse en flujo productivo.

La sección también incluye `Eliminar datos Mundial de prueba` para volver al estado previo a resultados.

El reset local/dev:

- reinicia partidos a estado `TIMED`;
- limpia `home_score`, `away_score`, `winner` y `minute`;
- conserva equipos oficiales de fase de grupos;
- limpia equipos asignados por el simulador en eliminatorias 73-104;
- conserva predicciones de usuarios;
- conserva llaves guardadas de `Mi Mundial`;
- limpia `predictions.points`, `predictions.scored_at`, `tournament_predictions.bonus_points` y `tournament_predictions.scored_at`.

Después del reset, `/dashboard` vuelve a mostrar grupos jugables con predicciones existentes y eliminatorias sin equipos oficiales como no disponibles. `/mi-mundial` mantiene la llave guardada y vuelve a mostrar bonus pendiente hasta que haya outcomes oficiales.

## Desglose De Puntos Por Partido

Las pantallas de predicción muestran desglose solo cuando el partido está `FINISHED`, existe una predicción del usuario y la base ya calculó `predictions.points`.

El dashboard muestra un resumen compacto:

- `Exacto +3`;
- `Resultado +1`;
- `Fallado +0`.

El detalle del partido muestra `Tu pronóstico`, `Resultado final`, `Puntos obtenidos` y el motivo. No se recalcula puntaje en cliente: la UI usa el valor persistido por la lógica de base/servidor.

## Desglose De Bonus Mi Mundial

`/mi-mundial` muestra el desglose de bonus cuando los resultados de eliminatorias se pueden derivar:

- equipos correctos en `Octavos`, `Cuartos` y `Semifinales`;
- campeón, subcampeón, `3.º` y `4.º` exactos;
- total evaluado sobre `52`.

Si faltan resultados o equipos oficiales en eliminatorias, muestra estado pendiente y no marca fallos prematuros.

La progresión editable de la llave no depende de esos resultados oficiales: las fases se habilitan por selecciones del usuario en la ronda anterior. El bloqueo real de edición es el cierre pre-torneo.

## Sync Local De Fixtures

`/admin/sync` también incluye `Sincronizar fixtures oficiales` para desarrollo
local. Esa acción importa equipos y partidos desde Football-Data usando módulos
server-only y registra el intento en `sync_runs`.

El sync de fixtures:

- está desactivado en producción;
- no modifica predicciones;
- no ejecuta scoring;
- no elimina los partidos del seed local;
- no llama TheSportsDB todavía.

## Sync Local De Resultados

`/admin/sync` incluye `Sincronizar resultados ahora`.

El sync de resultados:

- actualiza estados y marcadores de partidos oficiales ya importados;
- guarda información en vivo (`IN_PLAY`, `PAUSED`, `EXTRA_TIME`,
  `PENALTY_SHOOTOUT`) sin puntuar oficialmente;
- ejecuta `score_match_predictions(match_id)` solo para partidos `FINISHED`;
- no modifica predicciones directamente;
- registra la ejecución en `sync_runs`;
- está desactivado en producción.

La tabla `/posiciones` sigue usando puntos oficiales ya calculados. Los puntos
provisionales durante partidos en vivo quedan como mejora futura.

El sandbox está desactivado en producción. Antes de desplegar una operación real,
`/admin/sync` debe reemplazarse por un flujo con autorización admin explícita,
auditoría y controles de sincronización.

Los logs de guardado de predicciones se mantienen reducidos: no se registran
IDs de usuario, IDs de pool, IDs de partido ni marcadores en guardados exitosos.
Solo se conservan errores de desarrollo con detalles técnicos no secretos.

## Cómo Probar

1. Iniciar sesión con Google.
2. Completar onboarding si hace falta.
3. Guardar predicciones en `/dashboard` o `/partidos/[matchId]`.
4. Abrir `/admin/sync`.
5. Opcional: usar `Sincronizar fixtures oficiales` para importar fixtures de Football-Data en local.
6. Opcional: usar `Autocompletar Mundial de prueba` para simular resultados completos.
7. Opcional: usar `Eliminar datos Mundial de prueba` para volver a estado sin resultados.
8. Cargar un resultado final y usar `Finalizar y puntuar`.
9. Abrir `/posiciones` y verificar los puntos.
10. Finalizar otro partido y confirmar que la tabla se actualiza.

## Limitaciones

- La sincronización con Football-Data.org es manual y local-only.
- No hay permisos admin productivos.
- `/admin/sync` está desactivado en producción.
- No hay integración con TheSportsDB.
- Las celdas de últimos resultados y tendencia todavía son derivadas mínimas porque `get_pool_leaderboard` devuelve totales, no historial por partido.
- El leaderboard principal todavía no suma `tournament_predictions.bonus_points`.
