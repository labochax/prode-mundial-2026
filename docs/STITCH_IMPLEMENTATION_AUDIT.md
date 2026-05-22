# Stitch Implementation Audit

## Scope

This audit records the first implementation read of Google Stitch project `WorldCupProde` (`15571639831700616710`). It is design guidance for the next UI pass, not a UI implementation.

Stitch references inspected:

| Requested reference | Stitch source inspected |
| --- | --- |
| `Prode 2026 - Design Data` | Design system asset `assets/4fc60e1d755a46dfbc79f36606afb4e7` |
| `PRODE 2026 - Logo Animé Dinámico` | Screen `b0828a62ff7d4dc0ace6d25902755448` |
| `PRODE 2026 - Login Arcade Final Animado` | Screen `f0fd413acbdd4effa0bccc173a3d3bbc` |
| `PRODE 2026 - Configuración Pro con Logo` | Screen instance `a457a6b24b514edfab8f3faf62ee5889`; the exported screen title is `PRODE 2026 - Perfil con Colegios Ampliados` |
| `PRODE 2026 - Dashboard con Logo` | Screen instance `0680e5449b7a4c8893835a2e0a8af63a`; the exported screen title is `PRODE 2026 - Dashboard de Predicciones Finalizado` |
| `PRODE 2026 - Detalle Partido con Logo` | Screen `e11622a1cb344494aa54cdcf1b98cb7a` |
| `PRODE 2026 - Posiciones con Logo` | Screen instance `7eeb63e9ab58426c9cf2f9fd1878b310`; the exported screen title is `PRODE 2026 - Ranking con Tendencias y Menú Unificado` |

The requested instance labels remain the route/design authority even where Stitch's exported screen title differs.

## 1. Design Tokens

### Colors

The core Stitch palette is high-contrast neo-brutalist:

| Token intent | Stitch value | Implementation note |
| --- | --- | --- |
| Electric action yellow | `#f7ff00` | Primary CTA fill, selected nav, active row, focus/highlight accents. |
| Structural black | `#1c1c0f` plus black override | Borders, copy, hard shadows, icon strokes, separators. |
| Warm background | `#fdfae4` | Main app floor instead of a neutral white SaaS background. |
| White content floor | `#ffffff` | Cards, inputs, flag/avatar frames and secondary CTAs. |
| Surface low | `#f7f4df` | Secondary strips and footers. |
| Surface container | `#f1efd9` | Muted panels and alternate rows. |
| Surface high | `#ebe9d4` | Denser supporting areas. |
| Surface highest | `#e5e3ce` | Low-emphasis cells and bars. |
| Outline | `#79795f` / `#c9c8aa` | Labels, placeholder copy, low-emphasis dividers. |
| Error | `#ba1a1a` | Negative trend/error states. |

`Prode 2026 - Design Data` mentions International Orange as a sparse hot/live accent, but the inspected target screens mostly express urgency with yellow, black, white, and error red.

### Typography

| Role | Family | Stitch size / behavior |
| --- | --- | --- |
| Display headline | Anton | `96px / 90px`, poster-scale uppercase. |
| Large headline | Anton | `48px / 52px`. |
| Mobile headline | Anton | `36px / 40px`. |
| Player/editorial name | Bodoni Moda | `24px / 28px`, bold. |
| Body copy | Hanken Grotesk | `16px / 24px`. |
| Number/stat | Space Grotesk | `20px / 20px`, bold, spaced. |
| Label caps | Space Grotesk | `12px / 16px`, uppercase, wide letter spacing. |

Anton is structural and loud. Space Grotesk carries technical data and labels. Bodoni Moda provides the editorial counterpoint for names. Hanken Grotesk stays in instructions and explanatory copy.

### Spacing

- Base unit: `8px`.
- Standard gutter: `24px`.
- Mobile outer margin: `16px`.
- Desktop outer margin: `48px`.
- Desktop page grids use 12 columns; mobile uses a reduced 4-column mental model and single-column stacks.
- The exported layouts consistently use strong section breaks and large title spacing instead of soft card nesting.

### Border Radii

- Structural elements are sharp: cards, inputs, rows, CTA blocks, tabs, and large buttons use `0px` corner radius.
- Circular player avatars are an explicit exception.
- The inspected match screens also show circular score stepper buttons and pulse/status dots; keep those as Stitch-observed exceptions rather than making the whole UI rounded.

### Shadows

- Use hard black offset shadows without blur.
- Default offset is `6px`.
- Compact actions often use `4px` hard offsets.
- Hover/active states translate toward the shadow and shrink or remove it to simulate a physical press.
- Avoid translucent SaaS elevation and soft drop-shadow stacks.

### Gradients And Texture

- Do not introduce decorative soft gradients as the main visual language.
- Stitch uses low-opacity linear-gradient grids and scanline overlays as texture:
  - login: scrolling grid and CRT scanlines/color-fringe overlay;
  - onboarding: grid floor plus scanline overlay;
  - dashboard: subtle graph-paper grid floor.
- The textures support the poster/arcade language and should stay secondary to legibility.

### Graphic Motifs

- Final logo: black and electric-yellow ball mark with velocity slashes, heavy frame, and `PRODE 2026` word block.
- Sports editorial / street-poster composition with heavy dividers, oversized type, badges pinned to card corners, and deliberate offset blocks.
- Pixel-art circular avatars with thick black frames.
- Bordered flags and score boxes that read as scoreboard modules.
- Alternating ranking rows, selected-row yellow highlight, visible trend marks and latest-result cells.

### Motion Style

- Login is the richest motion surface:
  - logo entry and glow pulse;
  - moving grid;
  - white flash;
  - blinking `Pulse una tecla`;
  - hard slide-up entrance for the login card after the start state.
- Product controls should use press-down motion tied to hard shadows.
- Live/now states can pulse as small yellow indicators.
- Motion should feel abrupt, physical, and arcade-like. Reduced-motion handling must preserve hierarchy without relying on flashes, pulsing, or continuous grid movement.

## 2. Layout Structure By Screen

### Login

- Full-viewport centered arcade stage without the app sidebar.
- CRT/grid texture behind a large animated logo scene.
- Initial visible state is a start prompt: `Pulse una tecla`.
- Exported HTML reveals the next card state:
  - title `Seleccion de Jugador`;
  - supporting challenge copy;
  - stacked auth choices styled as save slots, including Google and email;
  - rules/acceptance copy below.
- Use the Stitch login as a dedicated auth experience, not a generic card inside the shared app shell.

### Onboarding / Crea Tu Jugador

- Desktop:
  - fixed left sidebar with logo, points/profile block, divider, and vertical nav;
  - main content offset from the sidebar;
  - oversized `Crea tu Jugador` title;
  - 12-column content grid split into avatar selector and profile form.
- Avatar area:
  - poster card titled `Choose Your Player` in the Stitch export;
  - dense 5-column circular avatar chooser;
  - selected/avatar affordances need black frame and hard-shadow behavior.
- Form area:
  - name and surname;
  - age and football club;
  - school and graduation year;
  - country and province;
  - subgroup/team textarea;
  - full-width yellow `Listo para jugar` CTA.
- Mobile:
  - fixed top app bar;
  - content stacks vertically;
  - bottom navigation replaces the desktop sidebar.

### Dashboard

- Desktop page shell uses the same fixed sidebar pattern as onboarding.
- Main page headline is `Próximos Partidos`, with `Partidos` highlighted in yellow.
- Phase/date status chip sits under the headline.
- Prediction list is a responsive match-card grid:
  - one column at reduced width;
  - two columns on large desktop.
- Match card anatomy:
  - upper-corner time badge;
  - two team columns with bordered flag, name, score box and plus/minus stepper controls;
  - central `VS`;
  - footer strip with tendency percentage and save CTA.
- A broadsheet-like `Cargar Mas Partidos` divider/action closes the list.
- No leaderboard block appears in this target dashboard screen.

### Match Detail

- Focused task layout, not the sidebar shell.
- Horizontal top bar includes back action, compact logo, utility icons, points, and player avatar.
- Main content uses a large desktop split:
  - prediction canvas on the left;
  - stats sidebar on the right.
- Prediction canvas includes:
  - group/date chip;
  - `Ingresar Predicción` heading;
  - closing timer;
  - team flags and names;
  - large numeric score inputs;
  - plus/minus controls;
  - central `VS` badge/divider;
  - quick selection buttons for local, empate, visitante;
  - save and next actions.
- Stats column includes recent head-to-head bar, Prode tendency bars, and match metadata such as stadium and climate.

### Posiciones

- Desktop shell returns to the fixed left sidebar.
- Page title is `Tabla de Posiciones`.
- Ranking mode toggle appears at top right with `Global` and `Amigos`.
- Table/list surface includes:
  - desktop column header;
  - rank number;
  - player avatar and name;
  - latest-results cells;
  - trend indicator;
  - total points.
- Current player row receives electric-yellow emphasis with extra outline/shadow.
- Reduced viewports drop lower-priority columns while keeping rank, name, and points readable.
- `Cargar Mas` CTA sits below the table.

## 3. Reusable Components

| Component | Stitch behavior to preserve |
| --- | --- |
| Navigation | Desktop fixed left sidebar for general app screens; mobile top/bottom bars where the shell collapses. Active item uses yellow and hard offset. |
| Logo / brand header | Final logo asset plus compact brand/points/avatar combinations. Login uses the logo as the hero object; app pages use a framed compact mark. |
| Match card | Time badge, two team/score halves, `VS`, steppers, tendency footer, save CTA, hard-border card frame. |
| Prediction form | Large score inputs, team flags/names, steppers, timer/lock context, quick local/empate/visitante actions, save/proximo CTA region. |
| Leaderboard row | Rank, avatar, player name, recent-result cells, trend, points, alternating surfaces, highlighted self state. |
| Ranking toggle | Sharp two-option control for `Global` and `Amigos` with active high-contrast state. |
| Profile / avatar components | Circular pixel-art avatar frame, avatar picker grid, profile points summary, compact player identity block in navigation/header. |

Implementation should also factor out primitives for hard borders, hard shadows, section dividers, stitched badge chips, scanline/grid texture layers, and press-state buttons.

## 4. Route Mapping

| Stitch target | Route |
| --- | --- |
| Login | `/login` |
| Configuración Pro / `Crea tu Jugador` | `/onboarding` |
| Dashboard | `/dashboard` |
| Detalle Partido | `/partidos/[matchId]` |
| Posiciones | `/posiciones` |
| Perfil edits | `/perfil` |

`/perfil` should reuse the profile-edit visual language from the configuration/profile Stitch reference unless a dedicated Stitch profile screen is selected later.

## 5. Responsive Behavior

### Desktop Navigation

- General app surfaces use a fixed left sidebar with logo, player stats, and vertical links.
- Dashboard, onboarding, and positions all follow that structure.
- Match detail intentionally prioritizes the prediction canvas with a compact top bar instead of the sidebar.
- Login has no product navigation.

### Mobile / Top Navigation

- Onboarding exports a fixed top app bar and bottom navigation.
- Dashboard and positions export mobile bottom navigation and reduced content stacks; the HTML also marks the shell change away from the desktop sidebar.
- Match detail already uses a top toolbar pattern that can stay consistent on narrow screens.

### Reduced Viewport Behavior

- Main content collapses from multi-column desktop grids to vertical stacks.
- Dashboard match grid reduces from two cards per row to one.
- Onboarding form fields shift from paired columns to single-field rows.
- Match detail stacks team/prediction/stats areas as the viewport narrows.
- Posiciones hides secondary desktop columns such as latest-results detail or trend where necessary.

### Side Menu Vs Top Menu Decision

- Use the Stitch split:
  - sidebar for general authenticated desktop screens;
  - top/bottom bars for mobile authenticated screens;
  - focused top bar only for match detail;
  - no shared product nav on login.

## 6. Gap Report

| Current scaffold route/component | Stitch target behavior/design | Required implementation change |
| --- | --- | --- |
| `/login` neutral `AppShell` card and disabled Google button | Full-screen arcade start/login sequence with CRT/grid texture, logo hero, start prompt, save-slot auth card | Build a dedicated auth layout and staged login composition; use final logo and Stitch motion with reduced-motion fallback. |
| `/onboarding` generic welcome card | `Crea tu Jugador` shell with sidebar/mobile bars, avatar selector, detailed profile form and CTA | Replace placeholder with Stitch navigation shell, avatar picker, profile fields and form sections. |
| `/dashboard` combines `MatchCardPlaceholder` and `LeaderboardPlaceholder` | `Próximos Partidos` prediction grid with score steppers, save CTAs, time badges and tendencies | Remove neutral summary composition; build Stitch match-card grid and dashboard title/status structure. |
| `/partidos/[matchId]` placeholder card pair | Focused prediction canvas, score form, timer, quick picks and stats column under top toolbar | Add dedicated match-detail layout and reusable prediction form/stat modules. |
| `/posiciones` wraps `LeaderboardPlaceholder` | Ranking table with `Global`/`Amigos` toggle, alternating rows, highlighted self row, trend and last-results cells | Replace placeholder with responsive leaderboard system and ranking toggle. |
| `/perfil` profile placeholder | Profile-edit behavior is implied by the configuration/profile Stitch reference | Reuse onboarding/profile form language for profile edit mode after confirming fields and data requirements. |
| `AppShell` and `SiteNav` top navigation | Desktop fixed sidebar, mobile top/bottom shell, task-specific match toolbar | Split shell variants instead of stretching the neutral top nav across all routes. |
| `ProdeLogoPlaceholder` | Final animated black/yellow logo and compact framed app mark | Replace placeholder mark with approved logo asset/treatment. |
| shadcn neutral cards/buttons in placeholders | Sharp 3px borders, zero-radius structural components, hard shadows, yellow press states | Create Stitch-specific primitives or variants instead of relying on default rounded styling. |
| `AnimatedPage` generic fade/slide | Login-specific arcade sequence and physical button press states | Restrict route animation to Stitch motion patterns and reduced-motion-safe fallbacks. |

## Implementation Guardrails

- The audit does not authorize Supabase integration, sports API calls, schema work, or secret handling changes.
- UI copy added during implementation should be Spanish. Stitch exports containing residual English labels such as `Choose Your Player` should be localized before shipping.
- Do not reinterpret the target as a generic dark SaaS dashboard. The approved direction is warm-surface, electric-yellow, black-bordered, editorial/arcade neo-brutalism from Stitch.
