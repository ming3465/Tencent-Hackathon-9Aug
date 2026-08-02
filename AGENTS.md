# Agent Onboarding — Kampung SG

Read this first. It is the shared entry point for every AI agent (Claude Code,
CodeBuddy, Cursor, Codex, or anything else) working in this repository.

## What this is

**Kampung SG** — a cozy top-down Singapore HDB-estate sandbox for the Tencent
Cloud "AI CAN DO IT" **Age Well** Social Good Challenge, **Game Track**. Team
**TheTwoGuys** (Sutolimin Widjaja, Andreas Auwyano). Thesis: older adults are
the experts, not the patients.

- **Live build:** https://ming3465.github.io/Tencent-Hackathon-9Aug/ (auto-deploys from `main`)
- **Judge path:** append `?demo=1` — see `docs/DEMO_MODE.md`
- **Stack:** Vite + TypeScript + Phaser 3. No backend, no runtime LLM, zero
  image assets shipped (all in-game art is drawn in code).

## Read in this order

1. `docs/IMPROVEMENTS.md` — prioritised backlog, **the non-negotiable
   constraints**, and the "Already done" table so you never redo landed work.
2. `docs/WINNING_PLAYBOOK.md` — strategy: judging rubric, top-10 actions,
   video beat sheet, Demo Day plan.
3. `docs/submission/SUBMIT_NOW.md` — submission-window runbook and deliverable
   status (window ~Aug 5–8, 2026).
4. `docs/AI_USAGE_LOG.md` — dated log of all AI work. **Append an entry for
   anything you do.** Honesty rules apply: never log work that did not happen.
5. `docs/DEMO_MODE.md`, `docs/GAME_DESIGN.md`, `docs/ACCESSIBILITY.md` — as
   needed for the area you touch.

## Hard constraints (published in the deck — breaking them falsifies claims)

No timer · no failure state · no energy system · no dark patterns · no
medical/cognitive/dementia claims · no data collection · no account · no
backend · no runtime LLM · no image assets in the shipped bundle · older
adults are contributors, never passive recipients · never invent playtests,
metrics, or AI-tool runs.

## Verification gate — run after ANY change

```bash
npm run typecheck && npm test && npm run build && npm audit && npm run smoke
```

`npm run smoke` is self-contained (builds, serves, drives headless Chrome
through a full playthrough, writes screenshots to `docs/screenshots/`).
Current truth: **70 unit tests, 22 smoke checks, 0 vulnerabilities.** If a doc
or deck quotes different numbers after your change, update them — stale
numbers are treated as defects.

## Git rules

- Commit as **ming3465** only (`user.name ming3465`,
  `user.email 78863917+ming3465@users.noreply.github.com` — already set in
  repo-local config). **No `Co-Authored-By` trailers.**
- Never force-push or rewrite history; flag identity problems instead.
- Every push to `main` deploys to the public judged URL — keep `main` always
  green and always shippable.

## Session log (what has been worked on, newest first)

This section is the cross-agent handoff trail. Append a dated line when you
finish a work session.

- **2026-08-02** — Shift-to-hurry (215→260 px/s), journal badge pills, world
  collision (tree trunks, furniture, garden fence with gate), ambient bus at
  the bus stop. Title screen rebuilt (CSS scene: laundry poles, void deck,
  elder + player). AI key art integrated as deck hero (`docs/art/`).
  AGENTS.md established as shared onboarding.
- **2026-08-01** — Visual-novel dialogue with portraits; resident-anchored
  interactions (talk to the person, they stop and face you); map expanded to
  2560×1600 with 6 districts and 5 ambient neighbours; custom procedural art
  pass (palette, rain trees, kerbed paths); characters got faces, outlines,
  4 skin tones; demo mode `?demo=1`; deck (PPTX+PDF) built; GitHub Pages
  deploy; smoke harness (Node CDP) replacing PowerShell; audio system
  (Web Audio synthesis, zero files); research playbook; improvement audit.
- **2026-07-25** — CodeBuddy Phase 1 graybox (documented failure + `429`),
  sandbox pivot, core game systems, 42-test suite. See `docs/AI_USAGE_LOG.md`
  for the full verified history.

---

# Repository Guidelines

*(Conventions below were contributed by another agent and verified accurate.)*

## Project Structure & Module Organization

`index.html` contains the page shell and CSS. `src/main.ts` coordinates DOM UI,
accessibility, and game flow; `src/game/sandboxScene.ts` owns Phaser rendering
and input. Keep rules in pure `sandboxState.ts` and `matchEngine.ts` modules.
Game content, tuning, and audio live beside them. Tests belong in
`src/game/__tests__/*.test.ts`. `public/` holds static assets; `docs/` holds
design, QA, screenshots, decks, and submission evidence; `scripts/` contains
automation. `dist/` and `node_modules/` are generated and ignored.

## Build, Test, and Development Commands

Use Node.js 20+ and npm 10+; the smoke harness requires Node.js 22+.

- `npm ci`: install the locked dependency set.
- `npm run dev`: start the Vite development server.
- `npm run typecheck`: run strict TypeScript checks without emitting files.
- `npm test` / `npm run test:watch`: run Vitest once or in watch mode.
- `npm run build`: type-check and create the production bundle in `dist/`.
- `npm run smoke`: build and drive Chrome through the production gameplay path.
  Set `CHROME_PATH` if needed; this may update `docs/screenshots/`.

## Coding Style & Naming Conventions

Use two-space indentation, double quotes, semicolons, and trailing commas in
multiline constructs. Retain `.js` suffixes in relative TypeScript imports. Use
`PascalCase` for types/classes, `camelCase` for functions/variables,
`UPPER_SNAKE_CASE` for module constants, and kebab-case for domain IDs. No
formatter or linter is configured; match neighboring code and pass strict checks.

## Testing Guidelines

Write focused `*.test.ts` cases with Vitest's `describe`, `it`, and `expect`.
Use the seeded PRNG for deterministic rule tests. There is no coverage threshold.
Before review, run typecheck, tests, and build. For UI or gameplay changes, also
run smoke and check keyboard, touch, narrow-screen, focus, and reduced-motion
behavior. Commit screenshot changes only when intentional.

## Commit & Pull Request Guidelines

Use short, imperative, sentence-case subjects without Conventional Commit
prefixes, for example `Fix Space key dialogue activation`. Keep commits focused;
use the body for rationale and verification. Pull requests should describe
behavior, link an issue when applicable, list test results, and include
before/after screenshots for visual changes. Call out accessibility,
claim-language, dependency, or deployment effects.

## Security & Product Guardrails

Never commit secrets or `.env` files, collect personal data, or add analytics.
Seek approval before adding dependencies, APIs, or cloud resources. Preserve
keyboard/touch support, 48px targets, reduced motion, and non-color-only cues.
Do not make diagnostic, prevention, or treatment claims. Record agent-assisted
changes and verification in `docs/AI_USAGE_LOG.md`.
