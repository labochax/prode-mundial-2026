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

Para que el OAuth real funcione, todavía falta configurar el provider Google en Supabase local y en Google Cloud con ese callback permitido. Si el provider no está listo, la UI muestra un error controlado en español o Supabase devuelve el fallo del proveedor.

## Callback y bootstrap de perfil

`/auth/callback` intercambia el código OAuth por sesión con el cliente server-side normal, sin service role.

Después del intercambio:

- busca `profiles.id = auth.uid()`
- si no existe, crea el perfil bajo RLS con datos de `auth.users`
- marca `onboarding_completed = false`
- usa `avatar_kind = google` si Google entrega foto, o `stitch` como fallback

Redirección:

- perfil faltante o onboarding incompleto -> `/onboarding`
- onboarding completo -> `/dashboard`
- error de auth -> `/login?error=auth`

## Protección de rutas

`src/middleware.ts` refresca sesión con `@supabase/ssr` y protege:

- `/admin/*`
- `/dashboard`
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

Nota técnica: Next.js 16 documenta `proxy.ts` como reemplazo de `middleware.ts`. Esta implementación usa `middleware.ts` porque la tarea pidió ese archivo explícitamente; puede renombrarse a `proxy.ts` más adelante.

## Pendiente

La persistencia de formularios de `/onboarding` y `/perfil` queda diferida. La próxima pasada debería guardar campos de perfil mediante Server Actions o Route Handlers usando el cliente server-side bajo RLS del usuario autenticado.
