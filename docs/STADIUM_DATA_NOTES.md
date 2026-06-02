# Datos Reales De Estadios Y Stats

## Autoridad De Sedes WC26

La asignación final de sede por partido usa el calendario oficial FIFA WC26:

- 16 sedes oficiales con nombre FIFA, ciudad, país, nombre común y aliases;
- mapa mantenido `match_number -> sede FIFA` para `M1-M104`;
- validación automática que exige cobertura exacta de los 104 partidos.

La fuente mantenida vive en:

```text
src/lib/sports/world-cup-2026/official-venue-map.ts
```

Referencia pública: calendario oficial FIFA WC26 y páginas públicas de sedes de
FIFA Hospitality.

Football-Data sigue siendo útil como alerta de cambios:

1. si `matches.raw_json.venue` coincide con la sede FIFA, el reporte marca la
   asignación como resuelta desde Football-Data;
2. si falta `raw_json.venue`, se usa el mapa FIFA;
3. si Football-Data contradice FIFA, gana FIFA y el reporte registra
   `match_id`, `match_number`, `footballDataVenue` y `fifaVenue`;
4. una discrepancia de nombres no frena la ejecución;
5. sí bloquean el write los errores estructurales: falta de número FIFA,
   falta de asignación FIFA o mapa inválido.

El snapshot heredado guarda `matchday` de Football-Data en `match_number` para
fase de grupos, por lo que allí aparecen jornadas `1-3` y no números FIFA
`M1-M72`. El módulo conserva una correlación mantenida
`football_data_id -> FIFA match_number` para resolver el snapshot actual sin
editar a mano `supabase/seed.sql` ni adivinar por orden cronológico.

## Backfill One-Shot

El flujo CLI es repetible e idempotente:

```bash
npm run enrich:stadiums:dry
npm run enrich:stadiums
```

`enrich:stadiums:dry`:

- no escribe en Supabase;
- valida el mapa FIFA;
- imprime asignaciones por Football-Data y por fallback FIFA;
- lista discrepancias;
- lista asignaciones faltantes sin inventar venues;
- deja el reporte local en:

```text
reports/football-data-stadium-enrichment-report.json
```

La ausencia de asignaciones no produce código de salida distinto de cero en
dry-run. En write mode, una asignación FIFA faltante frena la ejecución antes
de escribir. Los errores inesperados sí producen salida distinta de cero.

`enrich:stadiums` solo crea o actualiza `stadiums` y enlaza
`matches.stadium_id`. No toca equipos, predicciones, perfiles, pools, scoring,
resultados ni llaves de `Mi Mundial`.

## Después De Seed O Deploy

No se edita manualmente el bloque grande de fixtures en `supabase/seed.sql`.
Después de restaurar o publicar el seed, ejecutar:

```bash
npx supabase db push --include-seed
npm run enrich:stadiums:dry
npm run enrich:stadiums
```

Para apuntar el CLI a Supabase remoto desde PowerShell:

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL="<remote-url>"
$env:SUPABASE_SERVICE_ROLE_KEY="<server-only-key>"
npm run enrich:stadiums:dry
npm run enrich:stadiums
```

La service role se usa únicamente dentro del proceso CLI local. Nunca se
importa en componentes ni rutas expuestas al navegador.

## UI

`/partidos/[matchId]` muestra:

- nombre FIFA de la sede enlazada;
- `Ciudad, país`;
- badge `Fixture oficial`;
- `Estadio a confirmar` / `Ciudad a confirmar` si todavía no existe enlace.

## Stats Verdaderas

`/partidos/[matchId]` no presenta números sintéticos:

- `Historial directo` solo aparece con valores si `raw_json.direct_history`
  incluye números y un `source` explícito; si no, muestra
  `Historial directo no disponible.`;
- `Tendencia Prode` no revela distribución antes del cierre;
- antes del cierre muestra
  `La tendencia se habilita cuando cierre el partido.`;
- después del cierre, si no existe un agregado real con `source`, muestra
  `Todavía no hay suficientes pronósticos.`;
- el dashboard comparte la misma regla de tendencia y nunca presenta el
  fallback ficticio `45/25/30`.
