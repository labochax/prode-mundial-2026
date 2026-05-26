# Filtros de grupos en posiciones

## Comportamiento

`/posiciones` mantiene dos modos:

- `GLOBAL`: muestra la tabla completa del pool activo.
- `GRUPOS`: filtra esa misma tabla combinando datos compartidos del perfil.

El ranking usa puntos totales: puntos de partidos + bonus de `Mi Mundial`. El desglose se conserva por jugador como `Partidos X · Mi Mundial Y`.

El modo `GRUPOS` arranca con el filtro `Subgrupo` si el jugador actual tiene un valor disponible. Se usa primero el primer valor de `profiles.prode_subgroups`; si no existe, se usa `profiles.prode_subgroup`.

## Filtros soportados

Los filtros de `GRUPOS` son combinables y usan lógica `AND`: un jugador debe coincidir con todos los filtros activos para aparecer.

- `Subgrupo`: usa `profiles.prode_subgroup` y todos los valores de `profiles.prode_subgroups`.
- `Club`: usa `profiles.favorite_team`.
- `Colegio`: usa `profiles.school_group`.
- `Grupo etario`: se deriva de `profiles.age`.
- `País`: usa `profiles.country`.
- `Provincia`: usa `profiles.province`.
- `Ciudad`: usa `profiles.city`.

`Año de egreso` sigue siendo un dato editable del perfil (`profiles.graduation_year_or_category`), pero por ahora no se usa como filtro del ranking.

## Grupos etarios

Los grupos etarios actuales son:

- `Menos de 18`
- `18–25`
- `26–34`
- `35–45`
- `46–55`
- `56+`

Si un jugador no tiene edad cargada, no aparece cuando se aplica un filtro de `Grupo etario`.

## Subgrupos múltiples

Cada jugador puede pertenecer hasta a 3 subgrupos. Al filtrar por `Subgrupo`, un jugador aparece si el valor elegido coincide con su subgrupo principal o con cualquiera de los valores guardados en `prode_subgroups`.

`profiles.prode_subgroup` sigue siendo el campo principal de compatibilidad hacia atrás.

## Normalización

Los valores se limpian en capa de aplicación antes de compararlos:

- se eliminan espacios al principio y al final;
- se colapsan espacios repetidos;
- la comparación ignora mayúsculas/minúsculas;
- la comparación ignora acentos cuando es práctico.

La pantalla conserva la primera variante legible encontrada para mostrar el valor con buen casing.

## Limitaciones actuales

- El ranking de grupos se calcula filtrando el leaderboard del pool activo con datos reales cargados desde Supabase, no con una función SQL dedicada.
- El bonus de `Mi Mundial` se toma de `tournament_predictions.bonus_points` y vale `0` hasta que se puntúe.
- Los filtros de grupo deciden quién aparece; el orden se mantiene por puntos totales.
- `GLOBAL` y `GRUPOS` usan el mismo pool local por ahora.
- Las tendencias siguen siendo derivadas/placeholder hasta tener historial real de movimientos de ranking.
- Si un jugador no completa un dato de perfil, esa dimensión no puede usarse para compararlo.
