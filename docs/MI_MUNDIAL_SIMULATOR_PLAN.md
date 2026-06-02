# Mi Mundial - plan de simulador

## 1. Concepto de producto

`/dashboard` debe seguir siendo la lista principal para cargar pronósticos partido por partido.

La nueva experiencia debería vivir en una ruta separada, preferentemente:

- `/mi-mundial`

Alternativa viable:

- `/dashboard/mi-mundial`

Recomendación inicial: usar `/mi-mundial` como sección propia dentro del shell autenticado. Evita sobrecargar `/dashboard` y permite que el usuario entienda que es una vista de simulación personal, no la carga operativa de partidos.

Objetivo:

- mostrar tablas de grupos generadas desde los pronósticos del usuario;
- mostrar clasificados tentativos;
- mostrar ranking de mejores terceros;
- preparar una llave proyectada;
- eventualmente permitir una predicción de campeón.

La vista debe dejar claro que `Mi Mundial` es una proyección privada basada en los pronósticos del usuario, no una tabla oficial ni el ranking del Prode.

## 2. Supuestos de formato Mundial 2026

Supuestos para MVP:

- 12 grupos de 4 equipos.
- Las posiciones de grupo se calculan desde los marcadores pronosticados por el usuario.
- Clasifican los 2 primeros de cada grupo.
- Clasifican los mejores 8 terceros.
- La ronda de 32 debe seguir las reglas oficiales del bracket o los placeholders de Football-Data cuando estén disponibles.

Desempates MVP:

1. puntos;
2. diferencia de gol;
3. goles a favor;
4. fallback estable por nombre alfabético o `team_id`.

Riesgo: FIFA puede aplicar criterios más detallados, como enfrentamiento directo, fair play o sorteo. Antes de producción, hay que revisar el reglamento oficial FIFA 2026 y ajustar los desempates si el Prode decide copiarlo estrictamente.

## 3. Simulación de fase de grupos

Para cada usuario:

1. leer sus predicciones de partidos de fase de grupos;
2. agrupar partidos por `matches.group_code`;
3. calcular por equipo:

- puntos;
- goles a favor;
- goles en contra;
- diferencia de gol;
- partidos jugados;
- ganados;
- empatados;
- perdidos.

Puntaje de tabla simulada:

- victoria: 3;
- empate: 1;
- derrota: 0.

Predicciones incompletas:

- si faltan partidos en un grupo, la tabla puede calcularse parcialmente;
- la UI debe marcar ese grupo como incompleto;
- copy sugerida: `Te faltan pronósticos para completar este grupo.`

Clasificación:

- marcar 1ro y 2do de cada grupo como clasificados directos;
- juntar todos los terceros;
- ordenar terceros con los mismos criterios MVP;
- marcar los mejores 8 terceros como clasificados.

No conviene persistir estas tablas en MVP. Son derivables desde `predictions`, `matches` y `teams`.

## 4. Proyección de eliminatorias

La dificultad principal es que los cruces eliminatorios dependen de:

- ranking final de cada grupo;
- combinaciones de mejores terceros;
- reglas oficiales del bracket;
- placeholders que Football-Data puede exponer antes de tener equipos concretos.

MVP recomendado:

- mostrar clasificados proyectados por grupo;
- mostrar mejores terceros;
- mostrar una sección `Llave proyectada` en estado parcial;
- evitar afirmar cruces oficiales exactos hasta implementar el mapeo completo.

Fases propuestas:

- Phase 1: tablas de grupos + mejores terceros.
- Phase 2: llave proyectada con slots y mapeo oficial revisado.
- Phase 3: predicción de marcadores de eliminatorias cuando los equipos estén proyectados o cuando el fixture oficial ya tenga equipos.
- Phase 4: predicción de campeón y bonus.

Para Phase 2, `src/lib/tournament/bracket.ts` debería aislar toda la lógica de slots para que pueda testearse sin UI.

## 5. Predicción de campeón

Diseño:

- cada usuario puede elegir un campeón antes del bloqueo del torneo;
- el bloqueo debería ser el primer kickoff del Mundial o un `tournament_lock_at` configurado;
- la predicción de campeón debe guardarse separada de los pronósticos por partido;
- `/reglas` debe indicar claramente si el bonus está activo, cuánto suma y cuándo se bloquea.

Opciones de bonus:

- 5 puntos: bajo impacto, casi simbólico.
- 10 puntos: relevante sin romper la tabla.
- 15 puntos: alto impacto, puede compensar muchos errores de partidos.

Recomendación: 10 puntos. Es suficientemente divertido para que importe, pero no debería definir todo el Prode frente a la consistencia de 104 partidos.

No activar este bonus hasta tener:

- migración;
- reglas visibles;
- bloqueo probado;
- scoring probado.

## 6. Propuesta de modelo de datos

No hace falta persistir tablas simuladas de grupo en MVP. Deben derivarse.

Tabla futura sugerida:

`public.tournament_predictions`

- `id uuid primary key default gen_random_uuid()`
- `pool_id uuid not null references public.pools(id) on delete cascade`
- `user_id uuid not null references public.profiles(id) on delete cascade`
- `predicted_champion_team_id uuid references public.teams(id)`
- `locked_at timestamptz not null`
- `points int`
- `scored_at timestamptz`
- `created_at timestamptz default now() not null`
- `updated_at timestamptz default now() not null`

Restricción recomendada:

- unique `(pool_id, user_id)`
- `points is null or points in (0, 10)` si se adopta bonus de 10.

RLS esperado:

- usuario puede leer su propia predicción;
- miembros del pool podrían verla después del bloqueo;
- usuario puede insertar/actualizar solo antes del bloqueo;
- scoring/admin server-only.

## 7. Propuesta de UI

Mantener lenguaje Stitch/brutalista:

- fondo cálido;
- bloques amarillos;
- bordes negros de 3px;
- sombras duras;
- tipografía display para títulos y técnica para números.

Navegación:

- agregar nav item `Mi Mundial`, o
- agregar toggle superior `Partidos` / `Mi Mundial`.

Recomendación: agregar nav item `Mi Mundial` si la vista tendrá grupos, terceros, llave y campeón. Es más claro que esconderlo como subestado de `/dashboard`.

Secciones:

- `Mis grupos`
- `Mejores terceros`
- `Llave proyectada`
- `Mi campeón`

Estados:

- grupo incompleto: `Te faltan pronósticos para completar este grupo.`
- sin predicciones: `Cargá pronósticos en el panel para empezar a simular tu Mundial.`
- bracket no disponible: `La llave se completa cuando haya suficientes clasificados proyectados.`
- campeón no activo: `La predicción de campeón todavía no está activa.`

## 8. Arquitectura backend/query

Lógica pura sugerida:

- `src/lib/tournament/simulate-groups.ts`
- `src/lib/tournament/rank-third-placed.ts`
- `src/lib/tournament/bracket.ts`
- `src/lib/tournament/types.ts`

Loaders server-side:

- cargar usuario actual;
- obtener pool activo;
- cargar partidos oficiales de fase de grupos con equipos;
- cargar predicciones del usuario para esos partidos;
- pasar datos serializados a la vista.

No se necesita service role para la simulación del usuario. Debe usar el cliente Supabase server bajo RLS normal.

Funciones puras:

- `simulateGroupStandings(matches, predictions)`
- `rankGroupTable(rows)`
- `rankThirdPlacedTeams(groupResults)`
- `buildProjectedBracket(qualifiers)` en fase posterior.

## 9. Plan de verificación

Tests unitarios:

- cálculo de tabla con victorias, empates y derrotas;
- diferencia de gol;
- goles a favor;
- desempates;
- ranking de mejores terceros;
- grupos con predicciones faltantes;
- empates 0-0;
- marcadores altos;
- fallback estable por nombre/id.

Manual browser:

- usuario sin predicciones ve estado vacío;
- usuario con algunos pronósticos ve grupos incompletos;
- usuario con grupo completo ve posiciones ordenadas;
- mejores terceros aparecen cuando hay datos suficientes;
- navegación no rompe `/dashboard`;
- no se escriben datos al guardar pronósticos desde esta vista en Phase 1.

## 10. Secuencia recomendada

Primera implementación segura:

1. Crear `/mi-mundial` read-only.
2. Cargar partidos de fase de grupos + predicciones del usuario.
3. Implementar `simulate-groups.ts` con tests unitarios.
4. Renderizar `Mis grupos` con estados incompletos.
5. Agregar `Mejores terceros`.

Después:

1. Implementar bracket proyectado.
2. Revisar reglas oficiales FIFA para terceros y cruces.
3. Crear migración para `tournament_predictions`.
4. Implementar predicción de campeón.
5. Actualizar `/reglas` con bonus activo.

## Decisiones abiertas

- Ruta final: `/mi-mundial` versus `/dashboard/mi-mundial`.
- Bonus de campeón: confirmar 10 puntos o elegir otro valor.
- Nivel de fidelidad con desempates oficiales FIFA.
- Momento exacto de bloqueo de campeón.
- Si la llave debe permitir pronosticar eliminatorias antes de que los equipos estén oficialmente definidos.

## Nota de implementación Phase 1

Phase 1 queda implementada como `/mi-mundial`, una vista read-only bajo el shell autenticado.

Incluye:

- tablas de grupos derivadas de los pronósticos del usuario actual;
- ranking de mejores terceros;
- avisos de grupos incompletos;
- link a `/dashboard` para cargar más pronósticos.

No incluye todavía:

- predicción de campeón;
- bonus de campeón;
- llave eliminatoria proyectada;
- persistencia de tablas simuladas.

Las proyecciones no se guardan en la base. Se calculan desde `matches`, `teams` y `predictions` usando el cliente Supabase server bajo RLS normal, sin service role.

Los placeholders oficiales de eliminatorias deben mostrarse como labels de slot o `Por definir`, no como nombres falsos de equipos. La siguiente fase debería tomar los clasificados simulados del usuario y usarlos para proyectar esos slots sin sobreescribir el fixture oficial.

## Nota de verificación

La lógica pura de torneo tiene tests unitarios con Vitest:

- cálculo de tablas de grupo;
- victorias, empates, derrotas y diferencia de gol;
- desempates por puntos, diferencia de gol, goles a favor y fallback estable;
- grupos incompletos;
- empates 0-0 y marcadores altos;
- ranking de mejores terceros;
- clasificación del top 8 de terceros.

Los tests de base de datos, RLS y funciones SQL siguen separados en Supabase pgTAP (`npx supabase test db`).

## Nota de implementación Phase 2

Phase 2 agrega una sección read-only `Llave proyectada` dentro de `/mi-mundial`.

Incluye:

- armado de 32 clasificados proyectados desde los 24 clasificados directos y los mejores 8 terceros;
- render de 16 cruces de `16avos` usando los slots publicados del calendario FIFA 2026;
- asignación de mejores terceros mediante lookup de Annexe C según el conjunto de 8 grupos clasificados;
- origen visible por equipo, por ejemplo `1° Grupo A`, `2° Grupo B` o `Mejor 3° - Grupo C`;
- opción FIFA seleccionada visible como diagnóstico, por ejemplo `Combinación FIFA: opción 254`;
- tests unitarios para la lógica pura de bracket en `src/lib/tournament/bracket.ts` y para la tabla de combinaciones en `src/lib/tournament/third-place-combinations.ts`.

Limitaciones intencionales:

- los cruces directos, como `1°J vs 2°H`, usan el slot oficial;
- los mejores terceros se asignan con las 495 combinaciones de Annexe C;
- si no hay una fila de Annexe C para el conjunto recibido, la UI muestra `Por definir` con el rango permitido y se emite un warning solo en desarrollo;
- no hay predicción de campeón todavía;
- no se persisten tablas ni llaves proyectadas;
- no se sobreescriben fixtures oficiales ni predicciones guardadas.
- los desempates de grupos todavía usan reglas MVP simplificadas; antes de producción habría que implementar todos los criterios oficiales de Article 13 si el Prode decide copiarlos estrictamente.

## Nota de implementación Phase 3

Phase 3 agrega interacción local sobre la `Llave proyectada`.

Incluye:

- selección de ganadores sin ingresar marcadores;
- avance derivado por rondas: `16avos`, `Octavos`, `Cuartos`, `Semifinales`, `Final` y `3.º puesto`;
- derivación automática de `Campeón`, `Subcampeón`, `3.º` y `4.º`;
- resumen `No guardado todavía`;
- botón deshabilitado `Guardar predicción próximamente`;
- helpers puros en `src/lib/tournament/knockout-selection.ts`;
- tests unitarios para avance de rondas, final, tercer puesto, bonus y no mutación.

Modelo de bonus propuesto, todavía sin persistencia ni scoring:

- equipo correcto en `Octavos`: +1 cada uno;
- equipo correcto en `Cuartos`: +1 cada uno;
- equipo correcto en `Semifinales`: +2 cada uno;
- campeón exacto: +10;
- subcampeón exacto: +5;
- tercer puesto exacto: +3;
- cuarto puesto exacto: +2.

No hay bonus por llegar a `16avos`: esa ronda es la base proyectada desde fase de grupos. El máximo total mostrado es `52 puntos`.

Limitaciones intencionales:

- refrescar la página borra la selección de llave;
- no se guarda en Supabase;
- no hay migración para bracket pre-torneo;
- no hay scoring final de bonus;
- la futura fase debe persistir la llave completa y bloquearla antes del inicio del torneo.

## Nota de reglas finales

`/reglas` documenta el modelo final previsto para Mi Mundial:

- la llave completa se arma antes del inicio del torneo;
- se bloquea al inicio del primer partido del Mundial;
- el bonus empieza en `Octavos`, sin puntos por llegar a `16avos`;
- la selección de campeón, subcampeón, tercer y cuarto puesto se deriva de la llave completa;
- el máximo de bonus de Mi Mundial es `52 puntos`.

La próxima fase técnica debe alinear persistencia, bloqueo y scoring con estas reglas antes de activar puntos reales por la llave pre-torneo.

## Nota de implementación Phase 4

Phase 4 agrega persistencia de la llave completa en Supabase mediante `public.tournament_predictions`.

Incluye:

- una predicción única por `pool_id` + `user_id`;
- guardado de selecciones completas de la llave en `bracket_json`;
- columnas derivadas para equipos en `Octavos`, `Cuartos`, `Semifinales`, campeón, subcampeón, tercero y cuarto;
- bloqueo en base de datos con `public.get_tournament_lock_at()`, calculado desde el primer kickoff oficial disponible;
- RLS para lectura propia siempre, lectura de miembros del pool después del cierre y escritura propia solo antes del cierre;
- acción server-side `saveTournamentPredictionAction`, usando cliente Supabase normal bajo RLS, sin service role;
- UI de `/mi-mundial` con carga inicial de la llave guardada, guardado manual y estado bloqueado.

La persistencia no modifica `predictions` partido a partido ni persiste tablas simuladas de grupo. El scoring de bonus sigue pendiente y debe implementarse en una fase separada alineada con `/reglas`.

## Nota de implementación Phase 5

Phase 5 agrega la base de scoring de bonus de Mi Mundial.

Incluye:

- helper puro `scoreTournamentPredictionBonus` para comparar la llave guardada contra outcomes reales;
- helper puro `deriveActualTournamentOutcome` para derivar outcomes desde partidos oficiales de eliminatorias finalizados;
- tests unitarios para bonus perfecto, parcial, sin aciertos, duplicados, outcomes incompletos y extracción de resultados;
- acción local/dev `scoreTournamentPredictionsAction`, server-only, usando admin client solo en servidor;
- sección `/admin/sync` -> `Puntuar Mi Mundial` con botón `Calcular bonus Mi Mundial`.

La acción actualiza `tournament_predictions.bonus_points` y `scored_at` solo cuando hay resultados suficientes. No toca `predictions` partido a partido ni cambia la lógica de puntaje normal.

## Nota de implementación Phase 6

`/posiciones` suma el bonus de `Mi Mundial` al ranking general:

- `match_points`: total de predicciones partido a partido;
- `mi_mundial_bonus_points`: `tournament_predictions.bonus_points` del pool activo, con `0` por defecto;
- `total_points`: suma de ambos.

La pantalla rankea por `total_points` y mantiene desempates por exactos, aciertos, predicciones puntuadas y fallback estable. La UI muestra `Puntos partidos`, `Bonus Mi Mundial`, `Total` y el desglose por fila.

### Ajuste de QA local

El scoring de bonus ahora distingue entre resultados faltantes y cruces de eliminatorias finalizados sin equipos oficiales asignados. Este segundo caso ocurre con fixtures placeholder de Football-Data: puede haber marcador cargado, pero sin `home_team_id` / `away_team_id` no hay forma confiable de saber qué equipo avanzó.

Para pruebas locales, `/admin/sync` agrega `Autocompletar Mundial de prueba`. La herramienta usa la llave guardada del usuario actual para completar equipos y marcadores ficticios de eliminatorias, además de marcadores determinísticos de grupos. No llama APIs, no persiste proyecciones nuevas, no cambia marcadores pronosticados por usuarios y recalcula puntos regulares con `score_match_predictions(match_id)`.

El pase también agrega desglose visual de puntos por partido en dashboard y detalle usando `predictions.points`. La UI no recalcula reglas: solo muestra el resultado ya calculado por servidor/base.

El simulador dev también cubre fixtures knockout importados sin `match_number`: asigna los números FIFA 73-104 al completar resultados de prueba. Esto permite que el extractor de outcomes derive `Octavos`, `Cuartos`, `Semifinales`, campeón, subcampeón, `3.º` y `4.º` desde `matches`.

`/mi-mundial` muestra desglose de bonus cuando esos outcomes existen. Si faltan datos reales de eliminatorias, mantiene el estado pendiente y evita mostrar `+0` falsos.

### Ajuste de display de bonus y separación con dashboard

El desglose visual de bonus en `Octavos`, `Cuartos` y `Semifinales` muestra el valor numérico como badge de etapa en el header de cada cruce (`BONUS +1` o `BONUS +2`). Los equipos dentro del cruce solo muestran `Acertado` o `No acertado`, para no sugerir que el mismo partido duplica el bonus por lado.

El resumen de `Mi Mundial` reutiliza el diagrama de bonus para mostrar puntos obtenidos por segmento cuando ya existen outcomes completos: `Equipos en octavos`, `Cuartos`, `Semifinales`, campeón, subcampeón, tercero y cuarto. Si los outcomes están pendientes, mantiene el diagrama de máximos posibles y no muestra falsos `0 / 52`.

El dashboard queda explícitamente fuera de la proyección personal. Solo maneja fixtures oficiales jugables: si un cruce de eliminatorias todavía no tiene equipos oficiales asignados, la tarjeta queda bloqueada y deriva al usuario a `/mi-mundial`. Cuando la sincronización oficial o el simulador dev asignen `home_team_id` y `away_team_id`, el cruce se habilita automáticamente como cualquier otro partido.

La progresión de fases en `/mi-mundial` queda separada de los outcomes oficiales: `Octavos`, `Cuartos`, `Semifinales`, Final y `3.º` puesto se habilitan cuando el usuario elige ganadores de la ronda anterior. Los resultados oficiales solo sirven para evaluar bonus. Si faltan, se muestra `Bonus pendiente` en el resumen, no se reemplazan rondas editables por estados bloqueados.

### Ajuste de coherencia de llave

La interacción de `/mi-mundial` sanea selecciones contra la proyección actual:

- si cambia un ganador de una ronda anterior, las selecciones posteriores que ya no tienen ese equipo disponible se limpian;
- si el usuario cambia predicciones de grupos en `/dashboard`, al volver a `/mi-mundial` se reconstruyen grupos, mejores terceros y `16avos`;
- si la llave guardada no encaja con esa nueva proyección, se descartan solo las selecciones inválidas y se muestra el aviso para revisar fases pendientes;
- los headers muestran `COMPLETO`, `INCOMPLETO` o `PENDIENTE`.

### Ajuste de bloqueo por torneo iniciado

`Mi Mundial` queda bloqueado cuando:

- `now() >= public.get_tournament_lock_at()` / primer kickoff oficial; o
- cualquier fixture oficial ya tiene estado de torneo iniciado (`IN_PLAY`, `PAUSED`, `EXTRA_TIME`, `PENALTY_SHOOTOUT`, `FINISHED`, `AWARDED`, `SUSPENDED`).

Esto cubre el caso local/dev donde la fecha real todavía está antes del Mundial, pero `Autocompletar Mundial de prueba` marcó partidos como `FINISHED`. En ese estado `/mi-mundial` muestra la llave guardada en modo lectura, desactiva selección/guardado y muestra `Mi Mundial está bloqueado`.

`Eliminar datos Mundial de prueba` vuelve los partidos a `TIMED`; si la fecha real sigue antes del primer kickoff, `Mi Mundial` vuelve a ser editable.

`/admin/sync` ahora permite deshacer el simulador dev con `Eliminar datos Mundial de prueba`. Ese reset conserva predicciones y llaves guardadas, pero limpia resultados, puntos calculados y equipos dev asignados a eliminatorias para volver a probar el flujo desde un estado sin resultados.

### Ajuste visual de estados criticos

`Mi Mundial` usa tres tratamientos visuales consistentes:

- amarillo fuerte para seleccion activa, estado positivo o accion principal;
- rojo brutalista para estados criticos que requieren accion o atencion, como `Cambios sin guardar`, `INCOMPLETO` o errores de guardado;
- amarillo apagado/gris para selecciones bloqueadas en modo lectura, manteniendo el badge `Seleccionado` sin sugerir que el cruce todavia es editable.

### Separacion final entre Predicciones, Mis grupos y Mi Mundial

El flujo visible queda dividido en tres conceptos:

- `/predicciones`: carga y batch save de marcadores para partidos reales;
- `/predicciones/grupos`: tablas dinamicas de `Mis grupos` y mejores terceros,
  derivadas de los marcadores guardados de fase de grupos;
- `/mi-mundial`: llave bonus pre-torneo, enfocada en eliminatorias y guardado.

`/dashboard` permanece como redirect compatible hacia `/predicciones`.

Antes del primer kickoff, `Mi Mundial` usa la proyeccion dinamica como base de
los `16avos`. Una vez bloqueado, reconstruye la vista desde el snapshot guardado
en `tournament_predictions.bracket_json`: cambios posteriores en Predicciones
no recalculan visualmente una llave ya cerrada. Si el usuario no guardo la llave
antes del cierre, la pantalla muestra un estado bloqueado vacio.

Las tablas largas de grupos y mejores terceros dejaron de vivir dentro de
`/mi-mundial`. La pantalla ofrece un link compacto a `Ver Mis grupos`. En la
llave interactiva, `3.º puesto` aparece antes de `Final` para respetar el orden
natural de resolucion.
