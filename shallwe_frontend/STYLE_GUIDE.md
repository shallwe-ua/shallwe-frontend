## Shallwe UI Primitives (v0.2)

Single-source rules so every screen stays on the blue/peach system and on the shadcn/Radix rails.

### Semantic Tokens

- **Colors** – Only use the Tailwind tokens generated from `@theme` in `src/app/globals.css`:
  - Surfaces → `bg-background`, `bg-card`
  - Text → `text-foreground`, `text-muted-foreground`
  - Accent/brand → `bg-primary`, `text-primary`, `bg-secondary`
- **Borders & inputs** – `border-border`, `bg-muted/20`, `ring-primary`.
- **Radii** – `rounded-[var(--radius-sm)]` for controls, `rounded-[var(--radius-lg)]` for sections/cards.
- **Shadows** – `shadow-[var(--shadow-soft)]` or `shadow-[var(--shadow-card)]` only.

### Layout Helpers

- `.page-shell` – centers content with `--space-page-inline`.
- `.section-shell` – section spacing wrapper; use `fullWidth`/`bleed` props via `Section`.
- `.card-shell` – elevated container for highlight panels.
- `.surface-chip` – metadata badge background.
- `.stack*` + `.form-field` – spacing primitives for vertical rhythm.

### Components

- All new UI **must** import from `src/components/ui/*` (Button, Card, Alert, Input, Stack, Section, FormField, MetaPill). Do not hand-roll Tailwind blobs inside pages.
- Inputs + textareas inherit `--radius-sm`, `bg-card`, `ring-primary`.
- To introduce a new semantic color/spacing token: add it to `@theme` in `globals.css`, re-run Tailwind, then surface it via the UI primitives. Never drop raw hex/HSL directly into JSX.

### Guardrails for Contributors (LLMs included)

1. **Only one theme** – no dark-mode overrides, no alternative palettes.
2. **No raw HTML buttons/links** – always wrap the shadcn/Radix component, even for temporary work.
3. **No custom gradients or shadows** – extend the token set if something is missing instead of inlining values.
4. **Layouts go through shells** – hero/section layouts must use `Section`, `Stack`, `.page-shell`, etc.
5. **Zero ad-hoc CSS** – style changes belong either in `globals.css` utilities or inside the shared primitives. Pages/components should only compose existing classes.

### Self-check Before Shipping

1. Re-read the [official shadcn docs](https://ui.shadcn.com/docs) checklist: verify components stay inside `src/components/ui` and rely on Tailwind tokens.
2. Run `npm run lint` and `npm run build -- --no-lint`; builds must pass before review.
3. Inspect the page in the browser, toggling devtools to confirm no raw `#hex` or inline styles slipped in.
4. Ensure any new primitive updates `STYLE_GUIDE.md` and is referenced from `PROGRES.md` if it adds a new guardrail.
5. When touching generated shadcn files, note the change in the PR/commit so future CLI syncs know what diverged.

### Notes

- Landing + setup pages are the reference implementations—mirror their usage patterns everywhere else.
- Keep backgrounds airy: use the provided gradients/ornaments (`bg-ornaments`, `.bg-orb`) instead of inventing new assets.
