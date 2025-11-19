## Shallwe UI Primitives (v0.2)

Single-source rules so every screen stays on the pared-back white + slate system and on the shadcn/Radix rails.

### Semantic Tokens

- **Colors** – Only use the Tailwind tokens generated from `@theme` in `src/app/globals.css`:
  - Surfaces → `bg-background`, `bg-card`, `bg-surface-muted`, `bg-surface-elevated` (all subtle off-whites)
  - Text → `text-foreground`, `text-muted-foreground` (charcoal + gray)
  - Accent/brand → `bg-primary` (standard app blue #2563eb), `bg-accent` (safety orange #f97316), `bg-secondary` (slate), `bg-brand-weak` (pale blue)
  - Status fills → `bg-success-soft`, `bg-warning-soft`, `bg-destructive-soft`; overlays must use `bg-overlay`
- **Borders & inputs** – `border-border`, `ring-primary`, and `bg-card`. Skip opacity utilities entirely; rely on the provided solid tokens for any subtle fills.
- **Radii** – softened just a hair: `--radius-xs` = 2px, `--radius-sm` = 4px, `--radius-md` = 6px, `--radius-lg` = 8px. Use `rounded-[var(--radius-sm)]` for controls, `rounded-[var(--radius-lg)]` for sections/cards, and avoid bigger Tailwind radius utilities.
- **Shadows** – `shadow-[var(--shadow-soft)]` or `shadow-[var(--shadow-card)]` only.

### Layout Helpers

- `.page-shell` – centers content with `--space-page-inline` and `--content-max-width` (now capped at ~1040px) so views stay laptop-friendly.
- `.section-shell` – section spacing wrapper; use `fullWidth`/`bleed` props via `Section`.
- **Header offset** – the first `.section-shell` inside `main` automatically clamps its top padding to ~35% of `--space-section-y` so hero content hugs the sticky header.
- `.card-shell` – elevated container for highlight panels.
- `.surface-chip` – metadata badge background.
- `.stack*` + `.form-field` – spacing primitives for vertical rhythm.
- **Stack gaps & responsiveness** – `Stack` maps to `.stack-{xs|sm|md|lg}` which now drive a tightened `--stack-gap` clamp (max 1.9rem). Pick the closest token and avoid adding custom margins/padding for vertical rhythm; shrink on mobile happens automatically.
- **Section density** – `--space-section-y` now tops out at 3.5rem. Only add modifiers defined in `globals.css` (e.g., `section-shell--fluid`) instead of Tailwind `py-*` utilities.

### Control & Button Scale

- **Buttons** – `Button` sizes are locked to h-8/h-10/h-11 with coordinated padding. Mix sizes sparingly on the same view.
- **Inputs/selects** – `Input`, `Select`, and form controls render at h-10 by default to align with medium buttons and keep forms compact.
- **Cards/sections** – Card padding is capped at 1.25rem (header 1.25rem, content 1.25rem) to avoid huge gutters. Add internal `Stack` components if more breathing room is needed.

### Components

- All new UI **must** import from `src/components/ui/*` (Button, Card, Alert, Input, Select, Textarea, Checkbox, Radio, Stack, Section, FormField, MetaPill). Do not hand-roll Tailwind blobs inside pages.
- Inputs, selects, textareas, radios, and checkboxes inherit `--radius-sm`, `bg-card`, and `ring-primary` via the shared primitives.
- To introduce a new semantic color/spacing token: add it to `@theme` in `globals.css`, re-run Tailwind, then surface it via the UI primitives. Never drop raw hex/HSL directly into JSX.

### Guardrails for Contributors (LLMs included)

1. **Only one theme** – no dark-mode overrides, no alternative palettes.
2. **No raw HTML buttons/links** – always wrap the shadcn/Radix component, even for temporary work.
3. **No custom gradients or shadows** – extend the token set if something is missing instead of inlining values.
4. **Layouts go through shells** – hero/section layouts must use `Section`, `Stack`, `.page-shell`, etc.
5. **Zero ad-hoc CSS** – style changes belong either in `globals.css` utilities or inside the shared primitives. Pages/components should only compose existing classes.
6. **Solid surfaces only** – never use Tailwind opacity modifiers like `bg-primary/10` or `border-border/60`. If a softer fill is required, use the provided soft tokens (`bg-brand-weak`, `bg-success-soft`, `bg-overlay`, etc.) or add a new token first.

### Microcopy & Tone

- **Concise hero text** – limit primary headlines to one clause and body copy to one sentence (two max) focused on value/action.
- **Action-oriented buttons** – prefer verbs + nouns (`Continue with Google`, `Save changes`, `Hide profile`).
- **Hints stay short** – helper text in `FormField` should stay under ~8 words and avoid repeating label language.
- **Plain vocabulary** – avoid marketing fillers (`revolutionize`, `game-changing`). Be specific about what happens next (e.g., “Takes under a minute”).

### Self-check Before Shipping

1. Re-read the [official shadcn docs](https://ui.shadcn.com/docs) checklist: verify components stay inside `src/components/ui` and rely on Tailwind tokens.
2. Run `npm run lint` and `npm run build -- --no-lint`; builds must pass before review.
3. Inspect the page in the browser, toggling devtools to confirm no raw `#hex` or inline styles slipped in.
4. Ensure any new primitive updates `STYLE_GUIDE.md` and is referenced from `PROGRES.md` if it adds a new guardrail.
5. When touching generated shadcn files, note the change in the PR/commit so future CLI syncs know what diverged.

### Notes

- Landing + setup pages are the reference implementations—mirror their usage patterns everywhere else.
- Keep backgrounds calm: stick to plain tokens (`bg-background`, `bg-card`) and skip gradients, ornaments, or animated flourishes entirely.
