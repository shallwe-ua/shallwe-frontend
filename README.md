# Shallwe Frontend (demo)

> ⚠️ Work in Progress. This repo is one part of a bigger codebase. The frontend was built mainly to make the demo *clickable* and understandable without digging into backend code. Some parts were vibe-coded (mostly CSS and Tailwind) to save time — this wasn’t meant as a design project.

> Usage: Evaluation-Only (see LICENSE)

---

📜 Background

This is the demo UI for **Shallwe**, a Ukrainian flatmate-matching platform prototype focused on compatibility rather than listings. The backend is Django REST (see separate repo); this is the **Next.js app** that visualizes it.

- Status: working mock demo; still WIP in visuals and minor refactors.
- Purpose: show how the app flows and how the data validation works, with real routing and mocked API calls for local usage.

---

✅ What’s implemented (and works)

- **Auth & Middleware Routing** — real logic that redirects users depending on access/profile state; runs against `/access` endpoints (mocked locally, real later).
- **Landing page** — minimal intro and entry point for auth.
- **Setup flow** — multi-step form for initial profile creation.
- **Profile view & edit** — full edit mode with field-level validation, typed state, and update handling.
- **Photo cropper** — interactive crop and preview with fallback image handling and mock AI moderation call.
- **Location selector** — search and select based on Ukraine’s KATOTTG dataset:
  - regions, cities, and other populated places are distinct;
  - city districts are nested under their city entries.
- **Form validation** — mirrors backend logic (validators and type guards).
- **MSW mocks** — mock service worker simulating backend responses for local/demo mode.
- **Typed API layer** — each feature module (auth, profile, locations, photo, etc.) has its own calls and schemas.

Not included: search, contacts, and chats (were part of future roadmap).

---

🏗 Architecture (short)

- Framework: **Next.js 14 (App Router)** + **TypeScript** + **TailwindCSS**.
- Data layer: under `src/lib/shallwe/*`, mirrors backend API schemas and calls.
- Validation & form state: separated collectors, validators, and states under each module (profile, photo, rent preferences, etc.).
- Middleware: real redirect logic tied to auth/profile state, identical to how backend would respond.
- Mocking: **MSW (Mock Service Worker)** runs in the browser for local API simulation.
- Render logic: simple component hierarchy — landing → setup → profile (view/edit).
- Design: intentionally functional, not styled for production polish.

---

🔌 Backend/API reference
- [SwaggerHub Spec](https://app.swaggerhub.com/apis/S3MCHANNEL/shallwe-api/0.6.1)

Slighly outdated backend version in API spec - though, no fields or validation rules have changed since

---

🦯 How to run locally (standalone)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Copy environment example**
   ```bash
   cp .env.example .env
   ```
   Read the comments to provide correct values

3. **Run the app (mock mode)**
   ```bash
   npm run dev
   ```
   The MSW worker starts automatically and intercepts API calls.

4. **Open the demo**
   ```
   http://localhost:3000
   ```
   You can go through landing → setup → profile → settings/edit and explore how validation and routing behave.

---

🌐 Deployment

- Planned: **Vercel (free tier)** for the public demo.
- Current: local-only with MSW mocks.
- Once backend stage API (AWS) is live, switching to real mode is a single env variable change.

---

🤕 Testing

- Manual QA via local mock interactions (form filling, validation, redirects, cropping, etc.).
- No automated tests yet (planned for validators and mocks).

---

🛠 Tech note (short)

- Stack: **Next.js**, **TypeScript**, **TailwindCSS**, **MSW**.
- Approach: keep frontend light, predictable, and typed; skip unnecessary libraries.
- UI/UX: minimal, purely functional; CSS work left for later refactor.
- Linting: ESLint & Prettier enabled.

---

📊 Plans and constraints

- **Plans:**
  - Refactor component layout and shared form states.
  - Integrate live backend once available.
  - Add simple landing/about screens.
  - Deploy to Vercel.

- **Constraints:**
  - Mock-only mode for now.
  - No design system or CI yet.
  - Focused on clarity and correctness, not styling.

---

🔐 License and usage

This repository is provided for **evaluation purposes only (read-only)**.

All rights reserved.

- You may: clone, read, run locally, and evaluate as part of recruiting/technical review.
- You may not: modify, distribute, or use the code in any product or derivative work.

Copyright © the project author.

---

🙋‍♂️ Contact

Feel free to reach out for a quick walkthrough or architecture chat.

LinkedIn: [Serhii Soldatov](https://www.linkedin.com/in/serhii-soldatov)
