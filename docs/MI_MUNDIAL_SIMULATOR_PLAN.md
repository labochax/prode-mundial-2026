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
