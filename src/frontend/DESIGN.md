# Design Brief

## Direction

MediBill Pro — Clinical trust dashboard for medical practice billing and invoice management.

## Tone

Refined minimal with warm clinical neutrals — professional enough for healthcare, approachable enough for daily use without anxiety.

## Differentiation

Warm cream base (hue 75) paired with a sharp blue-green primary (hue 200) — the contrast reads "medical precision" without the sterile all-white clinical cliché.

## Color Palette

| Token      | OKLCH           | Role                                |
| ---------- | --------------- | ----------------------------------- |
| background | 0.97 0.008 75   | Warm cream off-white base           |
| foreground | 0.18 0.015 30   | Deep warm brown-charcoal text       |
| card       | 1.0 0.005 75    | Pure white elevated surfaces        |
| primary    | 0.48 0.16 200   | Blue-green trust primary            |
| accent     | 0.7 0.15 85     | Warm amber — alerts, upgrade CTAs   |
| muted      | 0.92 0.01 75    | Cream muted backgrounds             |

## Typography

- Display: Space Grotesk — headings, invoice numbers, page titles
- Body: Figtree — UI labels, body copy, table data
- Scale: hero `text-4xl font-bold tracking-tight font-display`, h2 `text-2xl font-semibold font-display`, label `text-xs font-semibold tracking-wider uppercase`, body `text-sm font-body`

## Elevation & Depth

Three tiers: flat `bg-background` pages → `shadow-subtle` cards → `shadow-elevated` modals/popovers; warm border-border separators at every zone boundary.

## Structural Zones

| Zone    | Background        | Border       | Notes                             |
| ------- | ----------------- | ------------ | --------------------------------- |
| Header  | bg-card           | border-b     | Elevated white, logo + nav + user |
| Sidebar | bg-sidebar        | border-r     | Cream tinted, nav links           |
| Content | bg-background     | —            | Warm cream main area              |
| Footer  | bg-muted/40       | border-t     | Subdued, branding + links         |

## Spacing & Rhythm

Section gaps `gap-6`, content grouping `space-y-4`, micro-spacing `p-4`/`p-6` for cards; table rows `py-3 px-4`.

## Component Patterns

- Buttons: rounded-lg, primary bg-primary text-primary-foreground, hover scale+shadow; accent for upgrade CTAs
- Cards: rounded-xl shadow-subtle bg-card border border-border, hover shadow-elevated
- Badges: rounded-full pill shape; status colors map to paid/pending/overdue/draft states

## Motion

- Entrance: fade-in 0.4s ease-out on page mount, stagger 0.05s per list item
- Hover: transition-smooth on all interactive surfaces (150ms)
- Decorative: none — dashboard utility app prioritizes performance over decoration

## Constraints

- No decorative gradients on content surfaces — reserved for hero only
- Amber accent used sparingly: only subscription upgrade CTAs and warning states
- Tables use right-aligned numbers, sticky headers on scroll

## Signature Detail

Invoice status badges use a four-color semantic system (green/amber/red/gray) mapped to OKLCH success/warning/destructive/muted — the first thing users scan.
