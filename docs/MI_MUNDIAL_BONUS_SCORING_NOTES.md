# Mi Mundial Bonus Scoring Notes

## Modelo de bonus

El modelo implementado coincide con `/reglas`:

- equipo correcto en `Octavos`: `+1` cada uno;
- equipo correcto en `Cuartos`: `+1` cada uno;
- equipo correcto en `Semifinales`: `+2` cada uno;
- campeón exacto: `+10`;
- subcampeón exacto: `+5`;
- `3.º` exacto: `+3`;
- `4.º` exacto: `+2`.

No hay bonus por llegar a `16avos`. Esa ronda es el punto de partida de la llave.

El máximo posible es `52 puntos`.

## Helpers puros

`src/lib/tournament/bonus-scoring.ts` compara una llave guardada contra resultados reales ya derivados.

Reglas:

- compara por `team_id`;
- ignora el orden dentro de cada instancia;
- no cuenta duplicados dos veces;
- maneja outcomes incompletos sin romper;
- devuelve total y breakdown por instancia.

`src/lib/tournament/actual-outcomes.ts` deriva outcomes desde partidos oficiales de eliminatorias:

- ganadores de `16avos` -> equipos en `Octavos`;
- ganadores de `Octavos` -> equipos en `Cuartos`;
- ganadores de `Cuartos` -> equipos en `Semifinales`;
- Final -> campeón y subcampeón;
- 3.º puesto -> tercero y cuarto.

Si faltan resultados, devuelve estado `incomplete` y una razón segura.

Si un cruce está finalizado por marcador pero todavía no tiene equipos oficiales asignados (`home_team_id` / `away_team_id`), el helper devuelve una razón específica por partido, por ejemplo:

`Faltan equipos oficiales en 16avos: M82 no tiene visitante asignado.`

También diagnostica:

- partidos faltantes;
- partidos no finalizados;
- `home_team_id` faltante;
- `away_team_id` faltante;
- ganador faltante.

## Scoring local/dev

`src/app/actions/dev-tournament-scoring.ts` agrega una acción local:

- usa `createSupabaseAdminClient()` solo en server action;
- está desactivada en producción;
- lee resultados oficiales guardados en `matches`;
- lee `tournament_predictions`;
- calcula bonus;
- actualiza `tournament_predictions.bonus_points` y `scored_at`;
- no modifica `predictions` partido a partido.

`/admin/sync` expone la sección `Puntuar Mi Mundial` con el botón `Calcular bonus Mi Mundial`.

Si todavía no hay suficientes resultados de eliminatorias, informa el motivo y no actualiza bonus.

## Simulador Dev De Resultados

`/admin/sync` también expone `Resultados de prueba` -> `Autocompletar Mundial de prueba`.

Este flujo:

- está disponible solo en local/dev;
- usa la llave guardada del usuario actual como torneo ficticio;
- escribe equipos y marcadores en `matches` para eliminatorias 73-104;
- asigna `match_number` FIFA 73-104 a los fixtures knockout cuando Football-Data los trae sin ese número;
- completa marcadores determinísticos de fase de grupos;
- recalcula puntos regulares de predicciones para todos los partidos finalizados con `score_match_predictions(match_id)`;
- no llama Football-Data ni TheSportsDB;
- no cambia los marcadores pronosticados por los usuarios;
- permite probar `Calcular bonus Mi Mundial` aunque los fixtures oficiales todavía tengan placeholders.

Es una herramienta de QA local, no una estrategia productiva de sync o scoring.

La misma sección incluye `Eliminar datos Mundial de prueba`.

Ese reset:

- limpia marcadores, ganadores, minuto y estado finalizado de los partidos;
- conserva equipos oficiales de fase de grupos;
- limpia equipos asignados por el simulador dev en eliminatorias 73-104;
- conserva `match_number`, fixture, `raw_json`, usuarios, perfiles y pools;
- no borra `predictions`;
- no borra `tournament_predictions.bracket_json`;
- limpia `predictions.points`, `predictions.scored_at`, `tournament_predictions.bonus_points` y `tournament_predictions.scored_at`.

Después del reset, los outcomes de eliminatorias vuelven a estar incompletos y el bonus queda pendiente hasta cargar resultados oficiales o volver a usar el simulador dev.

El autocomplete también pone la app en estado de torneo iniciado porque deja partidos oficiales en `FINISHED`. Por eso `/mi-mundial` queda bloqueado/solo lectura hasta usar `Eliminar datos Mundial de prueba` o hasta volver a un estado sin partidos iniciados.

## Desglose En Mi Mundial

`/mi-mundial` evalúa la llave actual contra los outcomes oficiales disponibles:

- en `Octavos`, cada cruce muestra un único badge de etapa `BONUS +1`;
- en `Cuartos`, cada cruce muestra un único badge de etapa `BONUS +1`;
- en `Semifinales`, cada cruce muestra un único badge de etapa `BONUS +2`;
- dentro del cruce, cada equipo marca `Acertado` o `No acertado` sin repetir el valor numérico;
- en `Final` y `3.º puesto`, las ubicaciones exactas muestran `+10`, `+5`, `+3` o `+2`;
- el resumen muestra el total evaluado sobre `52`;
- el diagrama de bonus muestra puntos obtenidos por segmento cuando hay outcomes completos.

El badge numérico es de la etapa, no de cada equipo individual. Esto evita que un partido de `Octavos` parezca otorgar `+2` por mostrar `BONUS +1` en ambos lados.

Si los outcomes de eliminatorias todavía están incompletos, la UI muestra:

`Bonus pendiente: faltan resultados oficiales de eliminación.`

No se muestran falsos `0 / 52` ni falsos `+0` mientras el torneo real no tenga datos suficientes. En ese caso se conserva el diagrama de máximos posibles, por ejemplo `+1 por equipo / 16 pts`.

La disponibilidad de fases en `/mi-mundial` no depende de estos outcomes. `Octavos`, `Cuartos`, `Semifinales`, Final y `3.º` puesto dependen únicamente de que el usuario haya elegido ganadores en la ronda anterior. Los outcomes oficiales solo controlan la evaluación del bonus.

La editabilidad completa de `Mi Mundial` sí depende del cierre pre-torneo: se bloquea por tiempo de primer kickoff o por estado oficial iniciado/finalizado de cualquier partido. Si está bloqueado, la llave se muestra completa en modo lectura y no se puede guardar.

Las selecciones de la llave se mantienen coherentes en cliente:

- cambiar un ganador de `16avos` limpia selecciones inválidas de `Octavos` en adelante;
- cambiar un ganador de `Octavos`, `Cuartos` o `Semifinales` limpia las fases posteriores afectadas;
- si cambian pronósticos de grupos y se reconstruye la proyección de `16avos`, las selecciones guardadas que ya no coinciden se descartan y la UI avisa al usuario;
- cada fase muestra estado `COMPLETO`, `INCOMPLETO` o `PENDIENTE`.

## Leaderboard

La tabla de posiciones principal suma el bonus guardado de `Mi Mundial` al puntaje regular:

- `match_points`: puntos de predicciones partido a partido desde `get_pool_leaderboard(pool_id)`;
- `mi_mundial_bonus_points`: `tournament_predictions.bonus_points` del pool activo, con `0` por defecto si todavía no fue puntuado;
- `total_points`: `match_points + mi_mundial_bonus_points`.

`/posiciones` rankea por `total_points` y mantiene los desempates existentes: exactos, aciertos, cantidad de predicciones puntuadas y fallback estable por nombre/usuario.

La UI muestra el total como puntaje principal y el desglose `Partidos X · Mi Mundial Y` en cada fila. El bonus se lee con el cliente Supabase normal bajo RLS; no se usa service role para mostrar la tabla.

## Pendiente

- scoring automático después de sincronizar resultados finales de eliminatorias;
- vista pública de llaves guardadas después del cierre;
- autorización admin productiva para scoring fuera del entorno local/dev.
