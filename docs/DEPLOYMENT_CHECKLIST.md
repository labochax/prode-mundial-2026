# Deployment Checklist

## Antes Del Primer Deploy Funcional

- [ ] Auditar Stitch MCP para la identidad visual aprobada.
- [ ] Revisar que toda copia visible este en espanol.
- [ ] Definir y aplicar migraciones Supabase con RLS.
- [ ] Configurar Google Auth mediante Supabase para los entornos necesarios.
- [ ] Configurar variables del entorno a partir de `.env.example` sin commitear secretos.
- [ ] Confirmar que la service role solo existe en codigo server-side autorizado.

## Datos Y Jobs

- [ ] Definir la estrategia de Football-Data.org para fixtures y resultados.
- [ ] Definir el uso permitido de TheSportsDB para assets.
- [ ] Configurar cron o disparadores seguros con `CRON_SECRET`.
- [ ] Validar bloqueo por partido y visibilidad posterior al bloqueo con datos reales.
- [ ] Validar recalcado de puntajes ante resultados o correcciones.

## Calidad

- [ ] Ejecutar `npm run build`.
- [ ] Ejecutar typecheck y pruebas que existan en el proyecto.
- [ ] Revisar navegacion por teclado, foco visible y motion reducido.
- [ ] Verificar rutas protegidas y permisos administrativos.
- [ ] Revisar logs para evitar tokens o datos sensibles.
