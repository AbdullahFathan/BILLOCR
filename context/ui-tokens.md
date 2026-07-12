# UI Design Tokens

> **Status:** Updated for M5.0 — Aura Split Design System Migration  
> **Source:** `context/ui_v1/DESIGN.md`  
> **Strategy:** Modern-Flat, Tonal Layering, **Electric Indigo → Golden Orange**

---

## 1. Color System (HSL)

All tokens are mapped via `@theme` in `src/app/globals.css`. **Dark Mode Only.**

### Base Foundation
- **`--color-background`**: `hsl(220 84% 8%)` — Deep nocturnal navy (`#041426`)
- **`--color-foreground`**: `hsl(216 88% 91%)` — Crisp blue-white (`#d4e3fe`)

### Surface Tonal Layers *(replaces glassmorphism)*
| Token | Value | Usage |
| :--- | :--- | :--- |
| `--color-surface-lowest` | `hsl(221 89% 5%)` | Deepest bg layer |
| `--color-surface-low` | `hsl(218 55% 11%)` | Level 1 cards |
| `--color-surface` | `hsl(217 52% 13%)` | Main card surface |
| `--color-surface-high` | `hsl(217 39% 17%)` | Elevated / popped cards |
| `--color-surface-highest` | `hsl(216 32% 22%)` | Tooltips / popovers |

### Primary — Golden Orange *(replaces Electric Indigo)*
- **`--color-primary`**: `hsl(37 100% 73%)` — Golden Orange (`#ffc77a`) — CTA buttons, active tabs, progress bar
- **`--color-primary-hover`**: `hsl(37 100% 65%)` — Slightly richer on hover
- **`--color-primary-foreground`**: `hsl(29 100% 14%)` — Deep brown (`#452b00`) — Text on orange buttons

### Accent — Amber Yellow
- **`--color-accent`**: `hsl(44 100% 57%)` — Amber Yellow (`#eec133`) — Secondary interactions, qty badges, split success states
- **`--color-accent-foreground`**: `hsl(40 100% 12%)` — Dark brown (`#3d2f00`)

### Secondary
- **`--color-secondary`**: `hsl(216 32% 22%)` — `surface-highest` — Secondary buttons, inactive chips
- **`--color-secondary-foreground`**: `hsl(216 88% 91%)`

### Status & Utility
- **`--color-success`**: `hsl(142 70% 45%)` — Emerald Green
- **`--color-warning`**: `hsl(38 92% 50%)` — Amber Orange
- **`--color-destructive`**: `hsl(0 84.2% 60.2%)` — Crimson Red
- **`--color-info`**: `hsl(199 89% 48%)` — Cyber Blue

### Borders & Inputs
- **`--color-border`**: `hsl(217 30% 16%)` — Subtle 1px border (`#1D2433`)
- **`--color-border-active`**: `hsl(37 100% 73%)` — Orange glow for active/selected state
- **`--color-input`**: `hsl(217 52% 13%)` — Solid dark input surface
- **`--color-ring`**: `hsla(37 100% 73% / 0.45)` — Amber glow ring on focus

### Muted / On-Surface Variant
- **`--color-muted`** / **`--color-muted-foreground`**: `hsl(27 31% 73%)` — Warm blue-grey for metadata, inactive icons (`#d7c3ae`)

---

## 2. Elevation & Depth Strategy

> **No glassmorphism** in M5+. Replaced by **Tonal Layering + Subtle Outlines**.

| Level | Token | Usage |
| :--- | :--- | :--- |
| Level 0 — Base | `background` | Page background |
| Level 1 — Surfaces | `surface-low` | Inner sections |
| Level 2 — Cards | `surface` / `card` | Item cards |
| Level 3 — Elevated | `surface-high` | Popped-up panels |
| Level 4 — Popover | `surface-highest` | Dropdowns, tooltips |

**Active State:** Border switches to `--color-border-active` (orange) + `box-shadow: 0 0 0 1px orange`.

---

## 3. Typography

| Role | Font | Size | Weight |
| :--- | :--- | :--- | :--- |
| H1 Display | Outfit | 32px | 700 |
| H2 Section | Outfit | 24px | 600 |
| H1 Mobile | Outfit | 28px | 700 |
| Body LG | Inter | 18px | 400 |
| Body MD | Inter | 16px | 400 |
| Label Bold | Inter | 14px | 600 · uppercase · tracking-wider |
| Label SM | Inter | 12px | 500 |
| Price Display | Outfit | 40px | 700 · tracking-tighter |

---

## 4. Shadows

- **`--shadow-sm`**: `0 1px 3px 0 rgba(0,0,0,0.4)`
- **`--shadow-md`**: `0 4px 12px 0 rgba(0,0,0,0.5)`
- **`--shadow-glass`**: `0 8px 32px 0 rgba(0,0,0,0.37)` *(kept for compat)*

---

## 5. Spacing & Layout

- **Container padding:** `20px` (fixed outer margins, mobile-first)
- **Base rhythm:** 4px grid — use `4 / 8 / 12 / 16 / 20 / 32px` increments
- **Card padding:** `p-5` (20px) mobile, `p-6` (24px) desktop
- **Gap intervals:** `gap-3` element grouping, `gap-5` section layout
- **Touch targets:** Minimum `48px × 48px` for all interactive elements

### Border Radius
| Size | Tailwind | Value |
| :--- | :--- | :--- |
| SM (inputs, badges) | `rounded-lg` | `0.5rem / 8px` |
| MD (cards, rows) | `rounded-xl` | `0.75rem / 12px` |
| LG (containers) | `rounded-2xl` | `1rem / 16px` |
| Full (pills, avatars) | `rounded-full` | `9999px` |

---

## 6. Animations

| Token | Value | Usage |
| :--- | :--- | :--- |
| `--animate-scan` | `scan 3s ease-in-out infinite` | OCR scan beam |
| `--animate-pulse-glow` | `pulse-glow 2s ease-in-out infinite` | Active nav icon |
| `--animate-slide-up` | `slide-up 0.3s ease-out` | Panel entry |
| `--animate-fade-in` | `fade-in 0.25s ease-out` | Element reveal |
