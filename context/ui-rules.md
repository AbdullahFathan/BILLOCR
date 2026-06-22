# UI Styling Rules (Tailwind CSS v4)

These rules govern how we write CSS classes and styles in this project. To ensure a cohesive, professional, and consistent user experience, we must follow these conventions strictly.

## 1. No Raw Colors or Hex Values

- **Rule**: Never use hex codes (e.g. `text-[#fff]`, `bg-[#1a202c]`) or raw Tailwind color scales (e.g. `bg-slate-900`, `text-indigo-500`) directly in your component markup.
- **Reasoning**: The project is strictly Dark Mode Only and follows a custom design token configuration.
- **Correct Pattern**:
  ```tsx
  // Good: Uses configured design tokens
  <div className="bg-card text-card-foreground border-border" />
  <button className="bg-primary text-primary-foreground hover:bg-primary-hover" />
  ```

---

## 2. Tailwind CSS v4 Integration Strategy

Tailwind v4 is configured via CSS files rather than `tailwind.config.js`. Your theme rules are defined in `src/app/globals.css` using the `@theme` directive:

```css
@import "tailwindcss";

@theme {
  --color-background: hsl(224 71% 4%);
  --color-foreground: hsl(210 40% 98%);
  
  --color-card: hsla(224 71% 6% / 0.55);
  --color-card-foreground: hsl(210 40% 98%);
  
  --color-primary: hsl(250 95% 68%);
  --color-primary-hover: hsl(250 95% 74%);
  --color-primary-foreground: hsl(210 40% 98%);

  --color-success: hsl(142 70% 45%);
  --color-warning: hsl(38 92% 50%);
  --color-destructive: hsl(0 84.2% 60.2%);
  --color-info: hsl(199 89% 48%);
  
  --color-border: hsla(217 32% 17% / 0.6);
  --color-input: hsla(217 32% 17% / 0.8);
  
  --shadow-glass: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}
```

---

## 3. Glassmorphic Cards & Containers

For card structures, utilize backdrop filters, subtle translucent borders, and deep shadows.
- **Base Card Structure**:
  ```tsx
  <div className="bg-card backdrop-blur-md border border-border shadow-glass rounded-2xl p-6">
     {/* Content */}
  </div>
  ```

---

## 4. Micro-Animations & Interactivity

Every interactive element must feel responsive and alive.
- **Buttons and Clickable Cards**: Always add smooth transition effects, hover shifts, and active presses:
  ```tsx
  <button className="transition-all duration-200 active:scale-98 hover:brightness-110" />
  ```
- **OCR Scanning Overlay**: Implement a scanning beam animation to communicate image reading state:
  ```css
  @keyframes scan {
    0% { top: 0%; }
    50% { top: 100%; }
    100% { top: 0%; }
  }
  .animate-scan {
    animation: scan 3s ease-in-out infinite;
  }
  ```

---

## 5. Mobile-First Layout

Since Fathan and his friends will use this app on their mobile devices at restaurants:
- Design layouts to stack on mobile (`flex-col`) and expand to grid/multi-column structures only on larger viewports (`md:grid-cols-2`, `lg:grid-cols-3`).
- Keep touch targets large (minimum `44px x 44px` for buttons, inputs, and toggle checkmarks).
- Implement sticky summaries or actions at the bottom of the viewport on mobile devices.
