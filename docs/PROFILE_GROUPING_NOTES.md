# Profile Grouping Notes

## Etiquetas Del Formulario

El formulario compartido de `/onboarding` y `/perfil` usa etiquetas más cortas:

- `Club`
- `Colegio`
- `Año de egreso`
- `Subgrupo`

No se renombraron columnas de base de datos. Se mantienen:

- `favorite_team`
- `school_group`
- `graduation_year_or_category`
- `prode_subgroup`

Esto evita migraciones innecesarias mientras se estabiliza la UX.

## Sugerencias

Las sugerencias se leen desde `profiles` usando el cliente normal de Supabase
con la sesión del usuario y RLS. No se usa service role.

Campos fuente:

- `favorite_team`
- `school_group`
- `graduation_year_or_category`
- `country`
- `province`
- `city`
- `prode_subgroup`

En UI se aplican sugerencias con `datalist` para:

- `Club`
- `Colegio`
- `Año de egreso`
- `País`
- `Provincia`
- `Ciudad`
- `Subgrupos`

El usuario puede seguir escribiendo valores nuevos.

Los `datalist` se renderizan como hijos directos del formulario con IDs
estables (`profile-...-sugerencias`) y cada input usa `list` apuntando a ese ID.
Además, las sugerencias incluyen los valores actuales del perfil cargado para
que aparezcan después de guardar y recargar aunque todavía haya pocos perfiles
en la base.

`País` es texto libre con sugerencias. Además de países ya guardados en
perfiles, se incluye una lista corta común: Argentina, Uruguay, Chile,
Paraguay, Brasil, Bolivia, Perú, Colombia, México, Estados Unidos, Canadá,
España, Alemania, Francia, Italia, Inglaterra y Japón.

## Subgrupos

El usuario puede cargar hasta 3 subgrupos:

- `Subgrupo principal`
- `Subgrupo 2`
- `Subgrupo 3`

`profiles.prode_subgroup` se mantiene como campo backward-compatible y guarda
el primer subgrupo no vacío. `profiles.prode_subgroups` guarda la lista
normalizada/deduplicada de hasta 3 valores.

Las sugerencias de subgrupo combinan:

- `profiles.prode_subgroup`
- cada valor de `profiles.prode_subgroups`

## Normalización

Para sugerencias:

- se eliminan espacios iniciales/finales;
- se colapsan espacios repetidos;
- se deduplica comparando sin distinguir mayúsculas/minúsculas;
- se deduplica comparando sin acentos.

Para guardado:

- se eliminan espacios iniciales/finales;
- se colapsan espacios repetidos;
- los campos opcionales vacíos se guardan como `null`;
- los subgrupos vacíos se eliminan;
- los subgrupos se deduplican sin distinguir mayúsculas/minúsculas ni acentos;
- se conservan como máximo 3 subgrupos;
- se preserva la capitalización ingresada por el usuario.

No se reescriben valores existentes en base de datos de forma masiva.

## Uso Futuro

Estos campos preparan futuros filtros de `/posiciones`, por ejemplo por
colegio, subgrupo principal, cualquiera de los subgrupos secundarios, ciudad o
camada. La agrupación real debe seguir leyendo desde Supabase y respetar RLS.
