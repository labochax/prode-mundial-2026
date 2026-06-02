# Profile Persistence Notes

## Enfoque

`/onboarding` y `/perfil` guardan datos en `public.profiles` mediante Server Actions. El guardado usa el cliente Supabase server-side con la sesión del usuario y respeta RLS; no usa service role.

## Campos guardados

- `display_name`
- `first_name`
- `last_name`
- `age`
- `favorite_team`
- `school_group`
- `graduation_year_or_category`
- `country`
- `province`
- `city`
- `prode_subgroup`
- `avatar_kind`
- `avatar_value`
- `onboarding_completed`

## Comportamiento

- `/onboarding` carga o crea el perfil del usuario autenticado, precarga campos existentes y al guardar marca `onboarding_completed = true`.
- Después de completar onboarding, redirige a `/predicciones`.
- `/perfil` carga el mismo perfil, precarga los campos y guarda cambios sin redirigir.
- `/perfil` muestra `Cambios guardados` cuando la acción termina correctamente.

## Validación

- `display_name` es obligatorio a nivel app.
- `age` puede quedar vacío o ser un número entero entre 1 y 120.
- `avatar_kind` acepta `stitch`, `google` o `upload`, pero `upload` todavía no se guarda porque no hay Storage conectado.
- Si se elige Google sin `google_avatar_url`, el servidor usa un avatar Stitch de fallback.

## Limitaciones actuales

- No hay subida real de imagen todavía.
- La opción de upload se mantiene visual y muestra aviso de `Próximamente`.
- La foto de Google solo puede usarse si Supabase Auth entrega `avatar_url`/`picture` en metadata.
- No se usa `SUPABASE_SERVICE_ROLE_KEY` para edición normal de perfil.
