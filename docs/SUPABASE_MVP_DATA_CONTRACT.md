# Supabase MVP Data Contract

## Estado

Este documento define el contrato de datos para conectar el MVP visual con Supabase Auth, Postgres, Storage, Edge Functions y jobs seguros. No crea migraciones, clientes, policies ni llamadas externas.

La UI actual usa estado local/mock en `/login`, `/onboarding`, `/perfil`, `/dashboard`, `/partidos/[matchId]`, `/posiciones`, `/reglas` y `/premios`. Las columnas y reglas propuestas abajo deben guiar la primera implementación real.

## 1. Auth Model

- Supabase Auth con proveedor Google será el mecanismo de ingreso del MVP.
- `auth.users` será la fuente de identidad autenticada: email, proveedor, timestamps y `user_id`.
- `profiles` extenderá `auth.users` con datos públicos/editables del jugador.
- Al primer login:
  - si no existe `profiles` o `onboarding_completed = false`, redirigir a `/onboarding`;
  - si `onboarding_completed = true`, redirigir a `/dashboard`.
- `/onboarding` crea/completa el perfil inicial.
- `/perfil` edita después los mismos datos de `profiles`.
- La foto de Google puede usarse como origen visual, pero el perfil debe guardar una referencia explícita al avatar elegido.

## 2. Profile Fields From Current UI

Tabla prevista: `profiles`

| UI actual | Columna propuesta | Tipo sugerido | Notas |
| --- | --- | --- | --- |
| Identidad autenticada | `id` | `uuid primary key references auth.users(id)` | Un perfil por usuario autenticado. |
| Nombre visible | `display_name` | `text` | Nombre principal mostrado en nav, ranking y tarjetas. |
| Nombre | `first_name` | `text` | Puede venir vacío hasta completar onboarding. |
| Apellido | `last_name` | `text` | Puede venir vacío hasta completar onboarding. |
| Edad | `age` | `int` | Validar rango razonable en DB y servidor. |
| Club / equipo favorito | `favorite_team` | `text` | Texto libre, no equipo FIFA oficial. |
| Colegio / grupo | `school_group` | `text` | Texto libre para contexto social. |
| Año de egreso o categoría | `graduation_year_or_category` | `text` | Texto, no entero, para permitir categorías no numéricas. |
| País | `country` | `text` | Default UI actual: `Argentina`. |
| Provincia | `province` | `text` | Texto libre para MVP. |
| Ciudad | `city` | `text` | Texto libre para MVP. |
| Subgrupo / equipo del Prode | `prode_subgroup` | `text` | Puede alimentar rankings internos o etiquetas. |
| Avatar seleccionado | `avatar_kind` | enum/text | Valores sugeridos: `stitch`, `google`, `uploaded`. |
| Avatar Stitch | `stitch_avatar_id` | `text` | Referencia a assets locales como `messi`, `alvarez`, etc. |
| Foto de Google | `google_avatar_url` | `text` | URL del proveedor; guardar solo si se decide permitir ese origen. |
| Imagen subida | `uploaded_avatar_path` | `text` | Ruta de Supabase Storage, no URL pública hardcodeada. |
| Onboarding completo | `onboarding_completed` | `boolean` | Controla redirect inicial. |
| Auditoría | `created_at`, `updated_at` | `timestamptz` | `updated_at` debe cambiar en edición. |

Reglas de UI:

- `/onboarding` y `/perfil` usan el mismo contrato de campos.
- `/onboarding` debe marcar `onboarding_completed = true` al guardar correctamente.
- `/perfil` no debe resetear `onboarding_completed`.
- Las acciones “Usar foto de Google” y “Subir imagen” son opciones de avatar, no autenticación ni upload real todavía.

## 3. Match And Prediction Model

Tablas previstas: `teams`, `stadiums`, `matches`, `predictions`

### Matches

| Concepto UI | Columna/relación propuesta | Notas |
| --- | --- | --- |
| ID estable local actual | `matches.id` | UUID interno. |
| ID externo futuro | `matches.football_data_match_id` | Stable external ID desde Football-Data.org; unique nullable hasta sync real. |
| Equipo izquierdo/local visual | `home_team_id` | En Mundial puede ser “equipo izquierdo” de la fuente, no localía real. |
| Equipo derecho/visitante visual | `away_team_id` | En UI usar nombres de equipo, no “local/visitante” como significado deportivo. |
| Kickoff | `kickoff_at` | `timestamptz`, fuente oficial cuando exista. |
| Lock time | `lock_at` | `kickoff_at - settings.lock_minutes_before_kickoff`; default 10 minutos. |
| Grupo/fase | `group_label`, `stage` | Puede normalizarse luego; MVP puede guardar labels. |
| Estadio/ciudad | `stadium_id`, `city` | `stadium_id` si se normaliza; ciudad puede venir de estadio o match. |
| Estado | `status` | Ej. `scheduled`, `locked`, `live`, `finished`, `cancelled`. |
| Resultado oficial | `home_score`, `away_score` | Nullable hasta finalizado. |

`teams` debe guardar nombre, código, país y referencias visuales. Las flags pueden empezar como rutas locales/mock y luego enriquecerse con TheSportsDB o Storage.

### Predictions

| Concepto UI | Columna propuesta | Notas |
| --- | --- | --- |
| Usuario + partido | `user_id`, `match_id` | Unique compuesto: un pronóstico vigente por usuario y partido. |
| Score izquierdo | `predicted_home_score` | Entero `>= 0`. |
| Score derecho | `predicted_away_score` | Entero `>= 0`. |
| Guardado/edición | `created_at`, `updated_at` | Edición permitida solo antes de `matches.lock_at`. |
| Visibilidad | derivada de `matches.lock_at` | No duplicar si alcanza con policy/view. |
| Puntaje | derivado o persistido luego | Ver sección de scoring. |

Quick-pick:

- `Local`/`Visitante` no debe guardarse como semántica; la UI actual usa nombres de equipos.
- La selección rápida genera scores plausibles localmente.
- No guardar `quick_pick` como campo separado en MVP salvo que se quiera analítica futura.

Reglas:

- Guardar y editar solo antes de `lock_at`.
- El usuario puede leer su propio pronóstico en cualquier momento.
- Al llegar `lock_at`, los pronósticos del partido quedan visibles para miembros autorizados del grupo/pool.

## 4. Scoring Model

Reglas de puntaje:

- 3 puntos por marcador exacto.
- 1 punto por resultado correcto: gana equipo izquierdo, empate o gana equipo derecho.
- 0 puntos si no coincide el resultado.
- No se predicen penales en el MVP.
- El cálculo no debe depender solo del cliente.

Implementación recomendada:

- Crear función SQL/server-side para calcular el puntaje de una predicción contra un resultado final.
- Recalcular al cerrar/finalizar partidos o al corregir resultados oficiales.
- Exponer leaderboard desde views/functions seguras.
- Si se persisten puntajes, usar una tabla tipo `prediction_scores` o columnas controladas por función server-only, nunca actualizadas libremente por el cliente.

## 5. Leaderboard Model

La pantalla `/posiciones` muestra:

- ranking global;
- ranking de amigos/grupo;
- puntos totales;
- aciertos exactos;
- aciertos por resultado;
- últimos cinco marcadores de resultado;
- tendencia;
- fila del jugador actual destacada.

Valores derivados vs almacenados:

| Valor | Derivado o almacenado | Fuente |
| --- | --- | --- |
| Puntos totales | Derivado, opcionalmente materializado | Suma de scores por pool/torneo. |
| Exactos | Derivado | Conteo de predicciones con 3 puntos. |
| Aciertos por resultado | Derivado | Conteo de predicciones con 1 punto. |
| Últimos resultados | Derivado | Últimos N partidos finalizados del usuario. |
| Tendencia | Derivado | Cambio de rank o puntos entre snapshots. |
| Rank | Derivado | Orden por puntos, exactos, aciertos y desempate definido. |
| Jugador actual | Derivado del `auth.uid()` | UI resalta el perfil autenticado. |

Para MVP, se puede calcular por view SQL. Si la tabla crece, materializar snapshots por pool o usar una función paginada.

## 6. Groups / Friends Model

Tablas previstas: `pools`, `pool_memberships`

- El MVP puede arrancar con un único pool privado para el grupo de amigos.
- `pools` representa una competencia o grupo privado del Prode.
- `pool_memberships` vincula `profiles` con pools e incluye rol/estado.
- Roles sugeridos: `owner`, `admin`, `member`.
- Estados sugeridos: `invited`, `active`, `removed`.
- Más adelante un usuario puede pertenecer a varios pools, pero no es obligatorio para el primer corte.
- El toggle `/posiciones`:
  - `Global`: ranking dentro del universo visible para el usuario, probablemente todos los miembros del pool principal o una vista global del torneo;
  - `Amigos`: ranking filtrado por pool privado/subgrupo.

Decisión pendiente: si “Global” significa todos los usuarios de la app o todos los usuarios del pool principal. Para un grupo privado, conviene que Global sea “todo el pool” y Amigos sea un subgrupo/filtro social.

## 7. Assets

Estado actual:

- Avatares Stitch: `public/stitch/avatars/`.
- Acciones de avatar: `public/stitch/icons/google-avatar-option.png` y `public/stitch/icons/upload-avatar-option.png`.
- Logo: `public/stitch/logos/`.
- Flags mock/local: `public/stitch/flags/`.
- Manifest local: `src/lib/design/stitch-assets.ts`.

Futuro:

- Los avatares Stitch pueden seguir siendo assets versionados si son parte del diseño aprobado.
- Avatares subidos por usuarios deben ir a Supabase Storage.
- Guardar en `profiles.uploaded_avatar_path` la ruta de Storage, no una URL con secreto.
- Google photo puede guardarse como URL externa solo si se acepta su estabilidad/privacidad; si no, copiarla a Storage con consentimiento.
- Flags, escudos y estadios se pueden enriquecer desde TheSportsDB y cachear como URLs o Storage paths.
- No hotlinkear assets frágiles de Stitch en producción.

## 8. RLS And Security Requirements

Requisitos mínimos:

- `profiles`: readable por miembros autenticados según política del pool; editable solo por `auth.uid() = profiles.id`.
- `pools`: readable por miembros.
- `pool_memberships`: readable por miembros del mismo pool; cambios administrativos server-only o por admins autorizados.
- `teams`, `stadiums`, `matches`: readable por usuarios autenticados.
- `predictions`: insert/update/delete solo por el dueño antes de `matches.lock_at`.
- `predictions`: readable por el dueño en cualquier momento.
- `predictions`: readable por miembros del pool después de `matches.lock_at`.
- `prediction_scores` o views de scoring: readable por miembros autorizados; writes solo por funciones/server.
- Leaderboard: readable por miembros autenticados del grupo/pool correspondiente.
- Sync y scoring administrativo: Edge Functions/server-only con autorización explícita.
- `SUPABASE_SERVICE_ROLE_KEY` nunca debe aparecer en código cliente ni en módulos importables por el navegador.
- Secrets de proveedores y cron solo en entorno server-side.

Consideración importante: las policies que comparan contra `lock_at` deben consultar `matches` de forma estable y no confiar en timestamps enviados por el cliente.

## 9. Proposed Migration Order

1. `settings`
   - Valores como `lock_minutes_before_kickoff`, timezone/display defaults y feature flags simples.
2. `profiles`
   - Extensión de `auth.users`, campos de jugador y onboarding.
3. `pools`
   - Grupo privado inicial del Prode.
4. `pool_memberships`
   - Relación usuario-pool, rol y estado.
5. `teams`
   - Selecciones, códigos y referencias visuales.
6. `stadiums`
   - Sedes, ciudad, país y posibles assets.
7. `matches`
   - Fixture, kickoff, lock, equipos, fase, estado y resultado.
8. `predictions`
   - Pronósticos por usuario, partido y pool si aplica.
9. Scoring functions/views
   - Funciones de puntaje, leaderboard y últimos resultados.
10. RLS policies
   - Activar y probar acceso por dueño, miembro y admin.
11. `sync_runs`
   - Historial de sync, fuente, estado, payload resumido y errores sin secretos.

## Open Decisions Before Schema

- Definir si “Global” es global de toda la app o global dentro del pool privado.
- Definir si `predictions` pertenece directamente a `pool_id` o si se infiere por membresía del usuario.
- Decidir si se guarda historial de ediciones de pronósticos o solo la versión vigente.
- Decidir si Google photo se hotlinkea, se copia a Storage o se omite en el MVP real.
- Definir desempates oficiales del ranking: puntos, exactos, aciertos, fecha de última edición u otro criterio.
- Definir si `lock_at` se persiste al crear/actualizar kickoff o se calcula en view; para RLS suele ser más simple persistirlo.
