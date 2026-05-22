# Data Model Intent

## Estado

Este documento describe el modelo previsto. No crea schema, migraciones ni politicas SQL en este scaffold.

## Entidades Candidatas

| Entidad | Responsabilidad prevista |
| --- | --- |
| `profiles` | Perfil publico del jugador vinculado a Supabase Auth. |
| `groups` | Grupo privado del Prode y su configuracion. |
| `group_members` | Participacion, rol y estado de cada usuario dentro de un grupo. |
| `teams` | Selecciones y referencias externas necesarias para partidos y assets. |
| `matches` | Fixture, kickoff, estado, goles oficiales y ventana de bloqueo por partido. |
| `predictions` | Marcador pronosticado por usuario y partido antes del bloqueo. |
| `prediction_scores` | Puntaje calculado para cada pronostico con trazabilidad de reglas. |
| `sync_runs` | Historial operativo de sincronizaciones externas. |
| `visual_assets` | Referencias cacheadas de recursos de TheSportsDB o storage propio. |

## Reglas Que El Modelo Debe Soportar

- Un usuario puede tener como maximo un pronostico vigente por partido dentro de su grupo.
- El partido define su propio `lock_at`; el valor inicial deriva del kickoff menos 10 minutos.
- Una edicion de pronostico debe rechazarse una vez alcanzado `lock_at`.
- Los pronosticos de un partido bloqueado pueden mostrarse al grupo; antes de eso deben mantenerse privados segun la politica acordada.
- El puntaje oficial usa 3, 1 o 0 puntos segun marcador exacto, resultado correcto o fallo.

## Limites De Seguridad

- Las politicas RLS deben restringir datos por grupo y rol.
- El calculo y la persistencia de puntaje no deben depender solo de logica del cliente.
- Las operaciones administrativas de sync necesitan autorizacion explicita y secretos server-only.
- La service role de Supabase no pertenece a componentes cliente ni a modulos importables por el browser.

## Preguntas Para El Schema Real

- Si se permite mas de un grupo por usuario en el MVP.
- Si se conserva historial de ediciones de pronosticos o solo la version vigente.
- Si los bloqueos manuales o correcciones de kickoff necesitan auditoria.
- Si posiciones se materializan o se calculan a partir de puntajes persistidos.
