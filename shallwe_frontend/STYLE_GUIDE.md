## Shallwe UI Primitives (v0.1)

Lightweight rules so every screen uses the same blue/peach foundation.

### Semantic Tokens

- **Colors** – Always consume Tailwind’s shadcn tokens:
  - Surface: `bg-background`, `bg-card`
  - Text: `text-foreground`, `text-muted-foreground`
  - Accent/brand: `bg-primary`, `text-primary` (soft blue) and `bg-secondary` (peach).
- **Borders & inputs** – `border-border`, `bg-muted/20` for subtle fills.
- **Radii** – Use `rounded-[var(--radius-sm)]` for buttons + inputs, `rounded-[var(--radius-lg)]` for cards/sections.
- **Shadows** – Prefer `shadow-[var(--shadow-card)]` or `shadow-[var(--shadow-soft)]`; avoid Tailwind defaults unless matching exactly.

### Layout Helpers

- `.page-shell` – centers content with `--space-page-inline`.
- `.section-shell` – adds vertical breathing room (use for hero/setup sections).
- `.card-shell` – elevated container for multi-step forms or highlight panels.
- `.surface-chip` – small pill for metadata badges; don’t invent new pill styles.

### Components

- Buttons/alerts/cards should use the primitives from `src/components/ui/*` (no custom Tailwind stacks).
- Inputs + textareas inherit `--radius-sm`, `bg-card`, `ring-primary`.
- When a component needs a new semantic color, add it as a CSS variable first, then expose through Tailwind—no direct hex values inside JSX.

### Notes

- Dark theme mirrors the same tokens; avoid hardcoded light-only colors.
- Keep backgrounds airy: prefer gradients with `color-mix` or `bg-accent/40` overlays over solid white blocks.
