# UI Design Tokens

This document outlines the core visual variables for the Split Bill OCR interface. Because the application is **Dark Mode Only**, all tokens are designed around a premium dark, space-inspired, glassmorphic aesthetic.

## 1. Color System (HSL)

These values represent the standard HSL configurations. In code, they are represented as CSS custom properties.

### Base Colors
- **`--background`**: `hsl(224 71% 4%)` - Deepest space navy.
- **`--foreground`**: `hsl(210 40% 98%)` - Crisp off-white.
- **`--card`**: `hsla(224 71% 6% / 0.55)` - Dark translucent glass container.
- **`--card-foreground`**: `hsl(210 40% 98%)` - Card text.
- **`--popover`**: `hsl(224 71% 6%)` - Tooltips and dropdown menus.
- **`--popover-foreground`**: `hsl(210 40% 98%)` - Dropdown/tooltip text.

### Brand & Interactive Colors
- **`--primary`**: `hsl(250 95% 68%)` - Electric Indigo (primary buttons, active tabs).
- **`--primary-hover`**: `hsl(250 95% 74%)` - Brightened Indigo.
- **`--primary-foreground`**: `hsl(210 40% 98%)` - Text on primary buttons.
- **`--secondary`**: `hsl(215 25% 15%)` - Dark slate/grey for secondary buttons and indicators.
- **`--secondary-foreground`**: `hsl(210 40% 98%)` - Text on secondary elements.

### Status & Utility Colors
- **`--success`**: `hsl(142 70% 45%)` - Emerald Green (complete assignments, paid status, success OCR toast).
- **`--warning`**: `hsl(38 92% 50%)` - Amber Orange (unassigned items, mismatched calculations, warnings).
- **`--destructive`**: `hsl(0 84.2% 60.2%)` - Crimson Red (deleting items, clearing assignments).
- **`--info`**: `hsl(199 89% 48%)` - Cyber Blue (OCR scanning status, hints).

### Borders & Inputs
- **`--border`**: `hsla(217 32% 17% / 0.6)` - Subtle border separating glass cards.
- **`--input`**: `hsla(217 32% 17% / 0.8)` - Background for text inputs, number counters.
- **`--ring`**: `hsla(250 95% 68% / 0.5)` - Ring color on element focus.

---

## 2. Glassmorphism & Visual Effects

To achieve a modern, premium feel:
- **`--glass-bg`**: `linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)`
- **`--glass-border`**: `linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)`
- **`--glass-blur`**: `blur(12px)`
- **`--glass-shadow`**: `0 8px 32px 0 rgba(0, 0, 0, 0.37)`

---

## 3. Typography & Sizing

We recommend using Google Fonts: **Outfit** (headings) and **Inter** (body text).
- **Font Family (Headings)**: `Outfit, sans-serif`
- **Font Family (Body)**: `Inter, sans-serif`

### Spacing & Layout
- Card padding: `p-6` (`1.5rem` or `24px`) for desktop, `p-4` (`1rem` or `16px`) for mobile.
- Gap intervals: `gap-4` for element grouping, `gap-6` for section layout.
- Border Radius:
  - Small elements (inputs, buttons): `rounded-lg` (`0.5rem` or `8px`)
  - Medium elements (cards, wrappers): `rounded-2xl` (`1rem` or `16px`)
  - Full items: `rounded-full` (`9999px`)
