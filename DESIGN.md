# Weather App Design Brief

## Overview
Premium, data-driven weather interface with sky-inspired palette. Real-time city search, 7-day forecast, detailed metrics (wind, pressure, humidity, feels-like), alerts, and C/F toggle.

## Tone & Differentiation
Modern minimalism with informational depth. Professional data visualization without clutter. Sky blues + accent amber for alerts. Unified, clean hierarchy.

## Palette (OKLCH Light/Dark)
| Token | Light | Dark | Purpose |
| --- | --- | --- | --- |
| Primary (Sky Blue) | 0.52 0.15 260 | 0.68 0.15 260 | CTAs, highlights, primary data points |
| Accent (Amber) | 0.65 0.18 60 | 0.72 0.18 60 | Weather alerts, warnings |
| Destructive (Red) | 0.58 0.22 30 | 0.62 0.2 28 | Critical alerts |
| Chart-1 to Chart-5 | Weather data viz palette | Weather data viz palette | Forecast visualization |
| Background | 0.98 0.01 280 | 0.14 0.02 260 | Page background |
| Card | 1.0 0.01 280 | 0.18 0.02 260 | Data cards |

## Typography
**Display & Body**: General Sans (clean, unified hierarchy). Sizes: 14px body, 20px section heads, 32px hero temps, 16px card data labels.

## Structural Zones
| Zone | Treatment | Notes |
| --- | --- | --- |
| Header | bg-card border-b | Search bar + C/F toggle in flex row |
| Alerts | bg-destructive/10 border-l-4 | Stacked at top if present |
| Current Conditions | weather-hero gradient primary/20 to primary/5 | Large centered temp, 4-col metric grid below |
| Forecast | forecast-grid 2sm:4lg:7 cols | Cards with date, icon, high/low, wind |
| Footer | bg-muted/30 text-muted-foreground text-xs | Attribution, last update time |

## Component Patterns
- **weather-card**: Default card with shadow + hover elevation
- **weather-hero**: Gradient background, primary accent, large typography
- **alert-banner**: Left border accent, destructive/warning color
- **forecast-grid**: Responsive grid 2→4→7 columns

## Motion & Interaction
- `transition-smooth` (0.3s cubic-bezier) on hover for cards
- Shadow elevation on interactive states
- Temperature unit toggle: instant update, no flash

## Constraints
- No gradients on text (readability)
- AA+ contrast maintained in both modes
- Mobile-first responsive (sm, md, lg breakpoints)
- Dark mode: tuned for readability, not just inverted lightness

## Signature Detail
Weather alert accent in warm amber (60h hue) against cool sky blues creates visual hierarchy and signals actionable information without aggressive red.
