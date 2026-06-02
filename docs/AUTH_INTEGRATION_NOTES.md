# Auth Integration Notes

## Variables locales requeridas

El flujo usa Supabase local y las variables ya definidas en `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` solo para tareas admin futuras, no para login ni UI.

## Google OAuth local

El botón `Continuar con Google` llama a Supabase Auth con provider `google` y redirige a:

```text
http://localhost:3000/auth/callback
```

Para que el OAuth real funcione en local, Google Cloud debe permitir:

Authorized redirect URI principal:

```text
http://127.0.0.1:54321/auth/v1/callback
```

Redirect URI adicional opcional:

```text
http://localhost:54321/auth/v1/callback
```

Authorized JavaScript origins:

```text
http://localhost:3000
http://127.0.0.1:3000
http://127.0.0.1:54321
```

El archivo local `.env` debe existir para Supabase CLI y contener:

```text
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET=
```

`.env` y `.env.local` no deben commitearse. Si el provider no está listo, la UI muestra un error controlado en español o Supabase devuelve el fallo del proveedor.

## Callback y bootstrap de perfil

`/auth/callback` intercambia el código OAuth por sesión con el cliente server-side normal, sin service role.

Después del intercambio:

- busca `profiles.id = auth.uid()`
- si no existe, crea el perfil bajo RLS con datos de `auth.users`
- marca `onboarding_completed = false`
- usa `avatar_kind = google` si Google entrega foto, o `stitch` como fallback

Redirección:

- perfil faltante o onboarding incompleto -> `/onboarding`
- onboarding completo -> `/predicciones`
- error de auth -> `/login?error=auth`

## Protección de rutas

`src/proxy.ts` refresca sesión con `@supabase/ssr` y protege:

- `/admin/*`
- `/dashboard`
- `/predicciones/*`
- `/onboarding`
- `/partidos/*`
- `/perfil`
- `/posiciones`
- `/premios`
- `/reglas`

Rutas públicas:

- `/`
- `/login`
- `/auth/callback`

Si una persona autenticada visita `/login`, se redirige según `profiles.onboarding_completed`.

## Shell autenticado

El shell autenticado lee `profiles` con el cliente Supabase server-side bajo la sesión del usuario y RLS. No usa service role.

Reglas de identidad:

- muestra `display_name`, luego `full_name`, luego el prefijo del email
- muestra `prode_subgroup`, luego `school_group`, o `Grupo privado`
- usa foto de Google si `avatar_kind = google` y existe `google_avatar_url`
- usa avatar Stitch local si `avatar_kind = stitch` y `avatar_value` coincide con un asset local
- si no hay coincidencia, cae al avatar Stitch por defecto

`Cerrar sesión` ejecuta una Server Action con `supabase.auth.signOut()` y redirige a `/login`.

## Pendiente

Todavía no hay datos reales de partidos, pronósticos ni posiciones conectados a Supabase.
