# Filtros del dashboard

## Comportamiento

`/dashboard` carga partidos reales desde Supabase local y conserva la fuente activa de fixtures:

- si existen fixtures oficiales de Football-Data, usa esos partidos;
- si no existen, usa datos seed/dev como fallback local.

La lista permite filtrar sin volver a consultar la base:

- `Todos`;
- grupos disponibles en los datos, por ejemplo `Grupo A`;
- fases eliminatorias disponibles, como `16avos`, `Octavos`, `Cuartos`, `Semifinales` y `Final`.

Las opciones se generan desde los partidos cargados. Si un grupo o fase no tiene partidos, no aparece como filtro.

## UI

El filtro vive debajo del encabezado `Próximos Partidos`, con una barra horizontal brutalista. En mobile puede desplazarse horizontalmente.

Los separadores por fase se mantienen después de filtrar. Si un filtro no devuelve partidos, la pantalla muestra `No hay partidos para este filtro.`

## Persistencia

El filtrado es solo de presentación. No cambia:

- guardado de predicciones;
- navegación a `Ver detalles`;
- reglas de bloqueo;
- scoring.

## Fuera de alcance

Este pase no implementa simulador completo, predicción de campeón ni una vista `Mi Mundial`. Ese flujo puede apoyarse en estos filtros más adelante, pero debería tener su propia navegación y modelo de estado.
