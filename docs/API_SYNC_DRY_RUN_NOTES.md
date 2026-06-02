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
- muestra conteos y una muestra breve, no el calendario completo;
- no escribe en Supabase;
- no muestra tokens ni raw JSON grande.

## Errores Esperados

- Si falta token: se muestra un error en español indicando que falta `FOOTBALL_DATA_API_TOKEN`.
- Si el proveedor rechaza token: se muestra error de token.
- Si hay rate limit: se muestra error de límite de uso.

## Sync Manual De Fixtures

Después de validar la vista previa, `/admin/sync` también incluye
`Sincronizar fixtures oficiales`.

La acción:

- corre solo en desarrollo/test;
- usa el cliente server-only de Football-Data;
- escribe con el cliente admin server-only porque `teams` y `matches` no aceptan
  escrituras de usuarios normales;
- upsertea equipos por `football_data_id`;
- inserta o actualiza partidos por `football_data_id`;
- deja que el trigger de `matches` calcule `lock_at` para partidos nuevos y
  recalcule si cambia `kickoff_at`;
- registra el intento en `sync_runs`;
- enlaza `stadiums` y `matches.stadium_id` cuando el payload del partido
  contiene un `venue` real;
- no modifica predicciones;
- no ejecuta scoring;
- no llama TheSportsDB.

La semilla local sigue disponible como fallback de desarrollo. El sync oficial
no borra esos partidos, pero `/dashboard` y la navegación normal prefieren
fixtures oficiales cuando existen. En ese caso los fixtures fake del seed quedan
ocultos de las pantallas principales.

## Siguiente Paso

Después de verificar la importación manual, implementar sync de resultados y
scoring oficial con el mismo patrón de `sync_runs`.

## Sync Manual De Resultados

`/admin/sync` incluye `Sincronizar resultados ahora`.

La acción:

- corre solo en desarrollo/test;
- usa el cliente server-only de Football-Data;
- actualiza partidos existentes por `football_data_id`;
- guarda `status`, `minute`, marcador, `winner`, `raw_json` y `last_synced_at`;
- conserva o actualiza el enlace de estadio cuando el payload incluye `venue`;
- actualiza `kickoff_at` si el proveedor lo corrige;
- no modifica predicciones directamente;
- ejecuta `score_match_predictions(match_id)` solo cuando el estado es `FINISHED`;
- no puntúa automáticamente `AWARDED`, `SUSPENDED`, `POSTPONED` ni `CANCELLED`.

Los estados en vivo (`IN_PLAY`, `PAUSED`, `EXTRA_TIME`,
`PENALTY_SHOOTOUT`) se reflejan como información parcial. Los puntos
provisionales quedan como mejora futura de UI.
