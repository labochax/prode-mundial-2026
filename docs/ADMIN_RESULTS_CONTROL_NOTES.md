# Control Admin De Resultados

## Alcance

`/admin/resultados` es una herramienta productiva y móvil para controlar
resultados oficiales del Mundial:

- ejecutar la sync de resultados de Football-Data;
- finalizar manualmente un partido oficial cuando el proveedor esté demorado;
- recalcular puntos mediante `score_match_predictions(match_id)`.

No modifica pronósticos cargados por usuarios, reglas de puntaje ni
`tournament_predictions`.

## Autorización

La ruta y cada Server Action validan el email autenticado contra
`ADMIN_EMAILS`, una lista separada por comas:

```env
ADMIN_EMAILS=labocha@gmail.com
```

El guard se ejecuta antes de crear un cliente Supabase admin o iniciar una sync.
Un usuario autenticado que no figure en la lista ve `No autorizado`. Un usuario
sin sesión es redirigido a `/login`.

`SUPABASE_SERVICE_ROLE_KEY` se usa únicamente en módulos y Server Actions
server-only. El componente cliente de confirmación no importa módulos admin.

## Sincronización

`Sincronizar Football-Data` reutiliza `syncFootballDataResults()` y muestra:

- partidos revisados y actualizados;
- partidos finalizados puntuados;
- predicciones puntuadas;
- resultados stale protegidos;
- cuota disponible por minuto.

La protección monotónica existente evita que respuestas incompletas degraden
resultados locales finalizados o con marcador completo.

## Finalización Manual

La lista muestra partidos oficiales dentro de las últimas 36 horas y próximas
6 horas, además de cualquier partido vencido que no esté `FINISHED`.

Antes de enviar, el navegador pide confirmación explícita del marcador. La
Server Action vuelve a validar:

- email admin;
- UUID del partido;
- scores enteros entre 0 y 99;
- existencia del partido oficial;
- equipos local y visitante asignados.

Después actualiza exclusivamente el resultado del match, deriva `winner`, fija
`status = FINISHED`, actualiza timestamps y ejecuta
`score_match_predictions(match_id)`. Repetir el mismo marcador es idempotente;
una corrección posterior vuelve a puntuar con las reglas existentes.

## Configuración Y QA

Configurar `ADMIN_EMAILS` y las variables server-only existentes tanto
localmente como en Vercel. No guardar valores secretos en el repositorio.

QA mínimo:

1. Iniciar sesión con un email incluido en `ADMIN_EMAILS`.
2. Abrir `/admin/resultados` desde móvil y escritorio.
3. Ejecutar la sync y revisar el resumen.
4. Finalizar un partido local/oficial y confirmar el marcador.
5. Revisar `/posiciones` y `/partidos/[matchId]`.
6. Iniciar sesión con otro usuario y confirmar `No autorizado`.
