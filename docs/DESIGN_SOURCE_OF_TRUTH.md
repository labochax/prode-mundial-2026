# Design Source Of Truth

## Autoridad Visual

La fuente visual estricta para Prode Mundial 2026 es Google Stitch:

- Proyecto: `WorldCupProde`
- Project id: `15571639831700616710`

Hasta completar la auditoria por Stitch MCP, el repositorio debe usar scaffolding neutral. Los placeholders actuales no definen la identidad final del producto.

## Pantallas A Auditar

Cuando MCP este configurado, inspeccionar estas piezas antes de refinar UI:

- `Prode 2026 - Design Data`
- `PRODE 2026 - Logo Animé Dinámico`
- `PRODE 2026 - Login Arcade Final Animado`
- `PRODE 2026 - Configuración Pro con Logo`
- `PRODE 2026 - Dashboard con Logo`
- `PRODE 2026 - Detalle Partido con Logo`
- `PRODE 2026 - Posiciones con Logo`

## Reglas Para Implementacion Visual

- No inventar una estetica generica de dashboard.
- No convertir placeholders en mocks ricos antes de la auditoria.
- Traducir fielmente layout, jerarquia, branding, color, motion y estados relevantes desde Stitch.
- Mantener componentes accesibles y revisar contraste, foco, lectura por teclado y reduccion de movimiento al adaptar el diseno.

## Salida Esperada De La Auditoria

La siguiente iteracion visual debe registrar:

1. Tokens o decisiones visuales extraidas de Stitch.
2. Componentes comunes que se pueden reutilizar.
3. Diferencias entre placeholders actuales y UI aprobada.
4. Assets y motion que deban implementarse o exportarse.
