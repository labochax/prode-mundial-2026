# Filtros de predicciones

## Comportamiento

`/predicciones` carga partidos reales desde Supabase local y conserva la fuente
activa de fixtures. `/dashboard` redirige a `/predicciones` para mantener
compatibilidad con links anteriores.

- si existen fixtures oficiales de Football-Data, usa esos partidos;
- si no existen, usa datos seed/dev como fallback local.

La lista permite filtrar sin volver a consultar la base:

- `Todos`;
- grupos disponibles en los datos, por ejemplo `Grupo A`;
- fases eliminatorias disponibles, como `16avos`, `Octavos`, `Cuartos`, `Semifinales` y `Final`.
- `3.º Puesto` si el fixture oficial incluye ese partido.

Las opciones se generan desde los partidos cargados. Si un grupo o fase no tiene partidos, no aparece como filtro.

## Eliminatorias Sin Equipos Oficiales

Los fixtures oficiales de eliminatorias pueden llegar desde Football-Data con equipos placeholder mientras todavía no se conocen los clasificados reales.

La lista no proyecta equipos del usuario sobre esos fixtures. La regla de producto queda separada:

- `/predicciones` es para pronosticar partidos oficiales jugables;
- `/predicciones/grupos` muestra `Mis grupos`, una proyeccion dinamica derivada
  de los marcadores guardados de fase de grupos;
- `/mi-mundial` es para proyectar la llave pre-torneo y competir por bonus;
- un cruce de eliminatorias se habilita automáticamente cuando el fixture oficial tenga `home_team_id` y `away_team_id`;
- hasta entonces, la tarjeta muestra un estado bloqueado y enlaza a `Mi Mundial`.

Esto evita mezclar equipos proyectados con equipos oficiales y previene que resultados dev/local congelen slots posteriores.

El reset local `Eliminar datos Mundial de prueba` vuelve a limpiar equipos dev asignados a eliminatorias, por lo que esas tarjetas pasan otra vez al estado no disponible. No borra las predicciones del usuario.

## Editabilidad

Una tarjeta permite editar solo si:

- ambos equipos oficiales están asignados;
- todavía no pasó `lock_at`;
- el estado sigue siendo programado (`SCHEDULED` / `TIMED`).

Si el partido está en vivo, finalizado o en estado especial, el score stepper y el guardado quedan desactivados. El desglose `Exacto +3`, `Resultado +1` o `Fallado +0` sigue visible cuando `predictions.points` ya fue calculado.

## UI

El filtro vive debajo del encabezado `Predicciones por partido`, con una barra
horizontal brutalista. En mobile puede desplazarse horizontalmente. Las tabs
secundarias `Partidos` y `Mis grupos` separan carga operativa de resultados y
proyeccion dinamica.

Los separadores por fase se mantienen después de filtrar. Si un filtro no devuelve partidos, la pantalla muestra `No hay partidos para este filtro.`

## Persistencia

El filtrado es solo de presentación. No cambia:

- guardado de predicciones;
- navegación a `Ver detalles`;
- reglas de bloqueo;
- scoring.

La lista no usa datos mock ni helpers locales de fixtures fake. La fuente de
datos es Supabase: fixtures oficiales cuando existen, seed/dev solo como fallback
si todavia no hay fixtures oficiales.

Las tarjetas finalizadas, tanto de grupos como de eliminatorias, muestran el desglose calculado desde `predictions.points`:

- `Exacto +3`;
- `Resultado +1`;
- `Fallado +0`.

## Fuera de alcance

Este pase no persiste proyecciones de eliminatorias dentro de `Predicciones`.
`Mi Mundial` sigue siendo la vista dedicada para completar y guardar la llave
bonus pre-torneo.
