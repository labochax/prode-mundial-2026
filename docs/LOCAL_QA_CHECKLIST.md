# Local QA Checklist

Usar este checklist antes de preparar deploy o sumar features grandes. No llama
APIs externas salvo que se prueben manualmente los botones de sync local.

## Preparacion

1. Levantar Supabase local.
2. Confirmar `.env.local` con valores locales y sin tokens reales en Git.
3. Ejecutar `npm run dev`.
4. Iniciar sesion con Google local.

## Auth Y Perfil

1. Entrar sin sesion a `/dashboard` y confirmar redirect a `/login`.
2. Iniciar sesion.
3. Completar `/onboarding`.
4. Editar `/perfil` con Club, Colegio, Pais, Provincia, Ciudad y hasta 3
   Subgrupos.
5. Recargar `/perfil` y confirmar persistencia/sugerencias.
6. Usar `Cerrar sesion` y confirmar redirect a `/login`.

## Predicciones Partido A Partido

1. Abrir `/dashboard`.
2. Guardar una prediccion de fase de grupos.
3. Entrar por `Ver detalles`.
4. Confirmar que `/partidos/[matchId]` precarga la prediccion.
5. Editar desde detalle y volver al dashboard.
6. Confirmar que la tarjeta muestra el marcador actualizado.
7. Confirmar que cruces de eliminatorias sin equipos oficiales estan bloqueados
   y enlazan a `/mi-mundial`.

## Mi Mundial

1. Cargar suficientes predicciones de grupos para proyectar `16avos`.
2. Abrir `/mi-mundial`.
3. Confirmar tablas de grupos, mejores terceros y llave proyectada.
4. Completar ganadores de `16avos`, `Octavos`, `Cuartos`, `Semifinales`,
   Final y `3.º puesto`.
5. Guardar con `Guardar Mi Mundial`.
6. Recargar y confirmar que la llave guardada se reconstruye.
7. Cambiar un ganador de una ronda anterior y confirmar que fases posteriores
   invalidas se limpian.

## Admin Local/Dev

1. Abrir `/admin/sync`.
2. Confirmar copy `Herramienta local de prueba. No usar como panel admin
   productivo.`
3. Usar `Eliminar datos Mundial de prueba`.
4. Confirmar mensaje no vacio y que se conservan predicciones/llave guardada.
5. Abrir `/dashboard`: grupos editables, eliminatorias sin equipos oficiales
   bloqueadas.
6. Abrir `/mi-mundial`: editable si todavia no paso el primer kickoff real.
7. Usar `Autocompletar Mundial de prueba`.
8. Confirmar resumen con grupos, eliminatorias y predicciones puntuadas.
9. Abrir `/mi-mundial`: debe mostrar `Mi Mundial esta bloqueado` y la llave en
   modo lectura.
10. Usar `Calcular bonus Mi Mundial`.
11. Confirmar resumen de bonus actualizado.

## Posiciones

1. Abrir `/posiciones` despues de reset: `Puntos partidos` y `Bonus Mi Mundial`
   en cero si no hay scoring activo.
2. Despues de autocomplete, confirmar `Puntos partidos` recalculados.
3. Despues de bonus, confirmar `Total = Puntos partidos + Bonus Mi Mundial`.
4. Probar `GLOBAL`.
5. Probar `GRUPOS` con Subgrupo, Club y Grupo etario combinados.

## Locks Y Estados Finalizados

1. Con partidos `TIMED`, confirmar dashboard/detalle editables antes de
   `lock_at`.
2. Con partidos `FINISHED` por autocomplete, confirmar que dashboard/detalle no
   permiten editar.
3. Confirmar desglose `Exacto +3`, `Resultado +1` o `Fallado +0` en partidos
   finalizados con prediccion puntuada.
4. Confirmar que `/mi-mundial` queda solo lectura si cualquier fixture oficial
   ya esta iniciado/finalizado.

## Seguridad Local

1. Confirmar que `/admin/sync` muestra estado desactivado en build/entorno
   productivo.
2. Confirmar que `/api/cron/football-data` devuelve `401` con secreto invalido.
3. En desarrollo, probar `?secret=<CRON_SECRET>` solo localmente.
4. Para produccion, usar solo `Authorization: Bearer <CRON_SECRET>`.
5. Confirmar que logs no imprimen tokens, cookies, service role ni secretos.

## Comandos De Verificacion

```bash
npm run test
npm run build
npx supabase test db
git diff --check
```
