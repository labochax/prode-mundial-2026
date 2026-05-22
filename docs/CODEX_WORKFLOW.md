# Codex Workflow

## Orden De Trabajo

1. Leer `AGENTS.md` y las guias locales relevantes de Next.js 16 antes de usar APIs del App Router.
2. Confirmar si la tarea requiere Stitch MCP antes de tomar decisiones visuales finales.
3. Mantener texto visible en espanol y no exponer secretos.
4. Implementar el menor cambio que mantenga limites de autenticacion, puntaje y sync claros.
5. Ejecutar `npm run build` o la verificacion indicada despues de cambios significativos.
6. Informar archivos tocados, supuestos, verificaciones y siguiente paso.

## Durante El Scaffold Inicial

- Usar placeholders neutrales.
- No conectar Supabase.
- No llamar Football-Data.org ni TheSportsDB.
- No crear migraciones, Edge Functions ni clientes con service role.
- Documentar decisiones futuras sin presentar trabajo pendiente como terminado.

## Cuando Stitch Este Disponible

- Auditar las pantallas listadas en `docs/DESIGN_SOURCE_OF_TRUTH.md`.
- Registrar patrones reutilizables antes de refinar rutas.
- Reemplazar o ajustar placeholders actuales para que sigan la fuente visual aprobada.
