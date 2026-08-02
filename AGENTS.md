# Repository Guidelines

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
