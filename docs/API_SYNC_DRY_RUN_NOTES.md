# API Sync Dry Run Notes

## Variables Locales

Agregar manualmente en `.env.local`:

```env
FOOTBALL_DATA_API_TOKEN=
THESPORTSDB_API_KEY=123
```

`FOOTBALL_DATA_API_TOKEN` es obligatorio solo cuando se ejecuta la vista previa. No se valida en build.

## Uso

1. Iniciar Supabase local y Next dev.
2. Iniciar sesión.
3. Abrir `/admin/sync`.
4. En `Vista previa API`, usar `Probar Football-Data`.

La acción:

- corre solo en desarrollo/test;
- llama Football-Data desde servidor;
- mapea equipos y partidos a candidatos locales;
- muestra conteos y una muestra breve;
- no escribe en Supabase;
- no muestra tokens ni raw JSON grande.

## Errores Esperados

- Si falta token: se muestra un error en español indicando que falta `FOOTBALL_DATA_API_TOKEN`.
- Si el proveedor rechaza token: se muestra error de token.
- Si hay rate limit: se muestra error de límite de uso.

## Siguiente Paso

Después de verificar payloads reales manualmente, implementar sync de DB en modo local con upserts idempotentes y `sync_runs`.
