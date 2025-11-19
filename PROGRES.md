Proposed plan (sequenced, bite‑sized)

1. [Done] Landing trim & polish – Keep only the core CTA, short value pitch, and error/processing states. Remove secondary buttons, highlight pills, extra gradients; simplify header
   to just the wordmark (no nav). Use the shadcn button/card/alert we already added.
2. [Done] Shell & tokens lock-in – Finalize the light blue/peach tokens, spacing, radii, and shadow scale in globals.css, and document them so every component uses the same
   primitives.
```text
Step 2 Detailed Plan (Shadcn-focused)

- Token Inventory + Targets
    - Audit current refs to colors/spacing/radii/shadows in globals.css, tailwind.config.ts, and shadcn component overrides (src/components/ui/*).
    - Produce a table (Color / Spacing / Radius / Shadow / Typography) showing: existing values, desired “light blue + peach” tokens, and any shadcn semantic mapping (e.g.,
      background, primary, muted).
- Define Core Design Tokens
    - In :root of globals.css, declare CSS vars (--sw-bg, --sw-foreground, --sw-blue-50, --sw-peach-100, --sw-radius-md, etc.) aligned with shadcn naming.
    - Mirror them inside .dark even if dark is unused to keep parity.
    - Document usage with short comments (e.g., /* Primary accent (soft blue) */).
- Wire Tokens into Shadcn Theme
    - Update tailwind.config.ts theme.extend.colors, borderRadius, boxShadow, fontFamily to pull from the new CSS vars (hsl(var(--sw-primary)) style), matching the standard
      shadcn setup.
    - Ensure shadcn components (button, card, alert...) are referencing bg-primary, text-muted-foreground, etc., not raw hex—adjust component styles if needed.
- Shell / Layout Primitives
    - Add lightweight utility classes in globals.css (e.g., .page-shell, .section-shell, .card-shell) that only compose spacing, max-width, and background pulled from the
      tokens.
    - Confirm landing already uses .page-shell; plan to swap other screens during steps 3–4.
- Verification + Guardrails
    - Run npm run lint and a quick npm run build -- --no-lint after changes.
    - Use two sample screens (Landing + Settings) to verify every color/spacing/shadow now comes via tailwind/shadcn tokens; note any manual values for follow-up in Step 3.
    - Add a short markdown snippet (in repo docs or code comment) summarizing “Style rules of engagement” so future components default to shadcn tokens.
```

3. [Done] Shared primitives audit – Landing, Settings, Setup, and both Profile read/edit states now sit on Stack/Section/Card/FormField shells. Setup Step 1’s optional cluster also moved to the shared wrappers; what’s left (radio/checkbox/select cosmetics) rolls into Step 4.
```text
Step 3 Detailed Plan

- Component census
    - Inventory recurring ad-hoc wrappers (stack divs, chips, form rows) in src/app/components.
    - Decide on 3–4 primitives (Stack, Section, FormField, MetaPill) that cover ~80% of usage.
- Build primitives
    - Implement them in src/components/ui/ using the Step 2 tokens (spacing/radius/shadows).
    - Export Tailwind-friendly utility classes when a React wrapper is overkill (e.g., .stack-md).
- Replace usages
    - Convert landing + one profile/setup screen to the new primitives without touching logic. ✅ Landing + Settings + Setup + Profile read/edit done (including the optional Setup accordion).
    - Track leftover edge layouts for Step 4 (profile form rows, modals, accordions, input controls).
- Validation
    - Re-run lint/build and visually diff the touched pages to ensure spacing + typography stay on spec.
```
4. [Next] Input controls restyle – Swap the remaining radio/checkbox/select/textarea fields in Setup + Profile for shadcn-style primitives (same tokens, focus states) without touching logic.
5. Microcopy & spacing pass – Tighten copy length, line-heights, and spacing to keep everything airy; align mobile breakpoints.
6. Lint/style sanity – Fix remaining lint warnings in profile components and add a quick visual checklist per page.

---

### Guardrails & Self-checks (must hold for every styling change)

1. **Use shared primitives only.** New UI must import Button/Card/Alert/Input/Stack/Section/FormField/MetaPill from `src/components/ui`. No raw `<button>`/`<input>`/custom Tailwind stacks.
2. **Tokens first.** Any new color/radius/shadow gets added to `@theme` in `src/app/globals.css` and consumed via Tailwind tokens; raw hex/HSL literals are forbidden in JSX/TSX.
3. **Layout shells.** Sections, heroes, cards, and form rows must compose `.page-shell`, `.section-shell`, `.stack*`, `.form-field`, `.card-shell`.
4. **Self-check routine.**
   - Re-read `STYLE_GUIDE.md` and the official shadcn docs to confirm patterns.
   - Run `npm run lint` and `npm run build -- --no-lint`.
   - Visually inspect landing + one setup/profile screen to ensure the change respects the shared palette.
   - Document any primitive/tokens adjustments inside `STYLE_GUIDE.md` before requesting review.
