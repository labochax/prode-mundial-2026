# Datos reales de estadios y Stats

## Fuente

Football-Data sigue siendo la fuente oficial de fixtures. Cuando el payload de
un partido incluye `venue`, la sync de fixtures y la sync de resultados:

1. normalizan el nombre del estadio;
2. resuelven aliases contra el catálogo de 16 sedes del Mundial 2026;
3. crean o actualizan `public.stadiums`;
4. enlazan `matches.stadium_id`;
5. conservan cualquier enlace existente si una respuesta parcial no trae
   `venue`.

El catálogo agrega ciudad y país para nombres oficiales y aliases conocidos.
Si Football-Data entrega un nombre real que todavía no está catalogado, se
conserva ese nombre sin inventar ciudad ni país.

## Snapshot local actual

El snapshot comprometido en `supabase/seed.sql` conserva fixtures oficiales,
pero sus payloads de partido no incluyen `venue`. Los `venue` presentes en los
payloads de `teams` son estadios locales de las selecciones y no deben usarse
como sede mundialista.

Por ese motivo no se editaron manualmente los 104 fixtures del seed con
asignaciones inferidas. La fuente correcta sigue siendo un payload de partido
con `venue`.

## Backfill one-shot

Para inspeccionar y enlazar venues ya guardados en `matches.raw_json`:

```bash
npm run enrich:stadiums:dry
npm run enrich:stadiums
```

El script usa `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` desde
`.env.local` o `.env`, corre solo por CLI y escribe un reporte local ignorado:

```text
reports/football-data-stadium-enrichment-report.json
```

Solo modifica `stadiums` y `matches.stadium_id`. No toca predicciones, perfiles,
pools, scoring ni llaves de `Mi Mundial`.

## Stats verdaderas

`/partidos/[matchId]` ya no presenta números sintéticos:

- `Historial directo` solo aparece con valores si `raw_json.direct_history`
  incluye números y un `source` explícito; si no, muestra
  `Historial directo no disponible.`;
- `Tendencia Prode` no revela distribución antes del cierre;
- antes del cierre muestra
  `La tendencia se habilita cuando cierre el partido.`;
- después del cierre, si no existe un agregado real con `source`, muestra
  `Todavía no hay suficientes pronósticos.`;
- `Datos del partido` marca como `Fixture oficial` un estadio enlazado y
  conserva `Estadio a confirmar` / `Ciudad a confirmar` cuando falta la sede.

El dashboard comparte la misma regla de tendencia: antes del cierre muestra
`Tendencia disponible al cierre` y nunca presenta el fallback ficticio
`45/25/30`.
