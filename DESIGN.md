# Design Brief

## Direction

**Clinical Trust** — light-mode medical invoice platform with warm neutrals and professional structure designed for healthcare practitioners and admins.

## Tone

Editorial clarity with subtle refinement. Warm cream backgrounds and restrained blue-green primary inspired by healthcare software but modern and approachable, not clinical-cold.

## Differentiation

Intentional structural zones (elevated header, content cards with subtle depth, clear footer) create visual hierarchy without visual noise. Generous whitespace respects mental load of medical workflows.

## Color Palette

| Token      | OKLCH         | Role                           |
| ---------- | ------------- | ------------------------------ |
| background | 0.97 0.008 75 | Soft cream off-white            |
| foreground | 0.18 0.015 30 | Deep warm text                  |
| card       | 1.0 0.005 75  | Pure white content cards        |
| primary    | 0.48 0.16 200 | Medical blue-green trust       |
| accent     | 0.7 0.15 85   | Warm amber for alerts & CTAs   |
| muted      | 0.92 0.01 75  | Subtle secondary background    |
| destructive| 0.55 0.22 25  | Clinical red delete actions    |

## Typography

- **Display**: Space Grotesk — headings, navigation, confidence
- **Body**: Figtree — clean, approachable, information-dense text
- **Scale**: hero `text-4xl font-bold tracking-tight`, h2 `text-2xl font-semibold`, label `text-xs font-semibold uppercase`, body `text-base`

## Elevation & Depth

Cards elevated with subtle shadow (`0 1px 3px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.06)`). No gradients. Borders and background color shifts create depth.

## Structural Zones

| Zone    | Background           | Border       | Notes                         |
| ------- | -------------------- | ------------ | ----------------------------- |
| Header  | bg-primary/card      | border-b     | Blue-green nav with depth     |
| Content | bg-background        | —            | Alternating card/muted        |
| Cards   | bg-card              | border       | Elevated, readable padding    |
| Footer  | bg-muted/40          | border-t     | Billing & legal info clarity  |

## Spacing & Rhythm

Compact grid with 4px baseline rhythm. Section gaps 24–32px, card padding 16–20px, micro-spacing 4–8px. Information-dense layout for invoice scanning without horizontal scroll on mobile.

## Component Patterns

- **Buttons**: Primary blue-green, rounded-sm (8px), hover state with 0.08 opacity shift, destructive in red
- **Cards**: White background, subtle borders, card-elevated shadow, 16px padding for invoice rows
- **Badges**: Tier badges (Developer/User) in pill shape with primary or muted background

## Motion

- **Entrance**: Fade-in 0.3s on page load, staggered cards
- **Hover**: Smooth 0.3s background shift on interactive rows/buttons, text to foreground/50
- **Focus**: Primary ring on keyboard navigation

## Constraints

- Light mode only — practitioners need minimal eye strain in clinical settings
- No decorative gradients — financial/medical context demands clarity
- Information density over whitespace — dashboards must fit invoice list + metadata in one viewport

## Signature Detail

Warm cream background instead of clinical white creates psychological safety while maintaining professional credibility. Medical blue-green primary signals trust, amber accents guide action without alarm.
