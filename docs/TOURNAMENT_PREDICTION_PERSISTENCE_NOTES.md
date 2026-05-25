# Persistencia de Mi Mundial

Este documento describe la persistencia local/Supabase de la llave completa de `Mi Mundial`.

## Tabla

La migración `20260525143000_create_tournament_predictions_schema.sql` agrega `public.tournament_predictions`.

Guarda una predicción completa por usuario y pool:

- `pool_id`, `user_id`;
- `locked_at`;
- `bracket_json`;
- equipos proyectados a `Octavos`, `Cuartos` y `Semifinales`;
- `champion_team_id`, `runner_up_team_id`, `third_place_team_id`, `fourth_place_team_id`;
- `bonus_points`, reservado para scoring futuro;
- timestamps de creación, actualización y scoring.

La tabla tiene `unique (pool_id, user_id)` para que cada jugador tenga una sola llave activa por pool.

## Bloqueo

`public.get_tournament_lock_at()` calcula el cierre como el primer kickoff oficial disponible:

1. `min(matches.kickoff_at)` donde `football_data_id is not null`;
2. si no hay fixtures oficiales, fallback al primer partido local;
3. si no hay partidos, falla con un error controlado.

Los inserts/updates/deletes de usuarios normales pasan por `public.prevent_tournament_prediction_after_lock()`. El trigger bloquea cualquier escritura cuando el torneo ya cerró.

## RLS

Las políticas iniciales son:

- cada usuario puede leer su propia llave siempre;
- miembros del mismo pool pueden leer llaves ajenas después de `locked_at`;
- cada usuario puede insertar/actualizar/borrar solo su propia llave antes del cierre;
- no hay permisos amplios de escritura para clientes.

El service role no se usa en la UI. Queda reservado para futuros trabajos server-side de scoring o reparación de datos.

## JSON guardado

`bracket_json` guarda una versión serializada de la llave:

- selecciones por cruce;
- `16avos` proyectados;
- rondas derivadas;
- resumen de campeón, subcampeón, tercero y cuarto;
- combinación FIFA de mejores terceros cuando aplica.

Esto permite reconstruir la UI guardada sin persistir tablas simuladas de grupos, que siguen siendo derivables desde pronósticos de partidos.

## Estado actual

`/mi-mundial` ya puede:

- cargar una llave guardada;
- precargar selecciones después de refrescar;
- guardar cambios antes del cierre;
- mostrar estado `No guardado todavía`, `Mi Mundial guardado` o `Predicción bloqueada`.

## Pendiente

- scoring real de bonus;
- vista pública de llaves ajenas después del cierre;
- autorización/admin productiva para calcular bonus;
- comparación contra resultados oficiales del Mundial.
