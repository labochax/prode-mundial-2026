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
6. Cargar un resultado final y usar `Finalizar y puntuar`.
7. Abrir `/posiciones` y verificar los puntos.
8. Finalizar otro partido y confirmar que la tabla se actualiza.

## Limitaciones

- La sincronización con Football-Data.org es manual y local-only.
- No hay permisos admin productivos.
- `/admin/sync` está desactivado en producción.
- No hay integración con TheSportsDB.
- Las celdas de últimos resultados y tendencia todavía son derivadas mínimas porque `get_pool_leaderboard` devuelve totales, no historial por partido.
