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

## Cómo Probar

1. Iniciar sesión con Google.
2. Completar onboarding si hace falta.
3. Guardar predicciones en `/dashboard` o `/partidos/[matchId]`.
4. Abrir `/admin/sync`.
5. Cargar un resultado final y usar `Finalizar y puntuar`.
6. Abrir `/posiciones` y verificar los puntos.
7. Finalizar otro partido y confirmar que la tabla se actualiza.

## Limitaciones

- No hay sincronización real con Football-Data.org.
- No hay fixtures oficiales.
- No hay permisos admin productivos.
- `/admin/sync` está desactivado en producción.
- Las celdas de últimos resultados y tendencia todavía son derivadas mínimas porque `get_pool_leaderboard` devuelve totales, no historial por partido.
