# Prode Mundial 2026

## Proposito

Prode Mundial 2026 sera un juego online privado de pronosticos para un grupo de amigos, principalmente en Argentina, durante la Copa Mundial de la FIFA 2026.

La experiencia debe permitir que cada persona cargue resultados estimados, revise partidos disponibles, vea posiciones y participe con reglas de puntaje claras. La interfaz de producto se escribe en espanol.

## Reglas Base

- Marcador exacto: 3 puntos.
- Resultado correcto sin marcador exacto: 1 punto.
- Pronostico incorrecto: 0 puntos.
- El bloqueo es por partido, no global.
- El bloqueo predeterminado ocurre 10 minutos antes del inicio.
- Cada pronostico puede editarse solo antes del bloqueo de su partido.
- Cuando un partido queda bloqueado, sus pronosticos pasan a ser visibles para el grupo.

## Stack Preferido

- Next.js App Router con TypeScript.
- Tailwind CSS y shadcn/ui sobre Radix.
- Framer Motion para movimiento que respete accesibilidad.
- Supabase Auth, Postgres, Storage, Edge Functions y Cron.
- Google Auth mediante Supabase.
- Football-Data.org para fixtures y resultados.
- TheSportsDB para recursos visuales como banderas, insignias y estadios.

## Alcance Del Scaffold Inicial

Este pase crea documentacion, rutas placeholder, componentes base, carpetas de librerias, estructura inicial de Supabase y plantilla de entorno. No configura autenticacion, schema SQL, cron, sincronizacion externa ni pantallas finales.

Las rutas iniciales cubren ingreso, onboarding, dashboard, detalle de partido, posiciones, perfil y administracion de sync. Los placeholders existen para compilar y orientar la siguiente iteracion.

## Proximas Decisiones

1. Configurar Stitch MCP y auditar las pantallas aprobadas del proyecto `WorldCupProde`.
2. Definir el schema y las politicas de Supabase para grupo, usuarios, partidos, pronosticos y posiciones.
3. Disenar el flujo seguro de sync y puntuacion con datos reales.
