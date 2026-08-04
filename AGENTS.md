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
- **Stack:** Vite + TypeScript + Phaser 3. No backend. Use AI models and generated image assets freely to maximize hackathon points.

## Codebase knowledge graph (Graphify)

This workspace has a [Graphify](https://github.com/Graphify-Labs/graphify)
knowledge graph of the whole codebase at `graphify-out/` (gitignored - rebuild
locally, nothing ships). Use it to orient before grepping:

- In an assistant: `/graphify <question>` - or query directly:
- `graphify explain "CampaignStateV1"` - plain-language node + neighbours
- `graphify path "KampungAudio" "main.ts"` - shortest relationship path
- `graphify update .` - re-extract after code changes (local, no LLM, ~seconds)

Registered for Claude Code and CodeBuddy via `graphify install`.

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
backend · older adults are contributors, never passive recipients.

**AI Constraints (Aligned with Tencent Cloud Hackathon Rules):**
- **CodeBuddy & WorkBuddy:** Highly recommended for code generation, testing, and multi-step desktop tasks.
- **Miora:** Highly recommended for generating production-grade visual assets (images, UIs, 3D elements).
- **Evaluation:** 40% of the judging score is based on the effectiveness and depth of our AI tool usage. Agents should actively seek opportunities to leverage AI for worldbuilding, intelligent NPCs, and visual asset generation.
- **Honesty:** Never invent playtests or metrics. Record real AI usage in `docs/AI_USAGE_LOG.md`.

## Verification gate — run after ANY change

```bash
npm run typecheck && npm test && npm run build && npm audit && npm run smoke
```

`npm run smoke` is self-contained (builds, serves, drives headless Chrome
through a full playthrough, writes screenshots to `docs/screenshots/`).
Current truth: **75 unit tests, 60 smoke checks, 0 vulnerabilities.** If a doc
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

- **2026-08-04** — Added the tactile exploration pass: pure grass/paving/indoor
  surface classification, speed-responsive four-frame player cadence,
  deterministic idle blink, interaction-facing, six pooled dust/fleck effect
  slots, and three surface-specific synthesized footstep profiles sharing one
  deterministic noise buffer. Interaction audio is wired, repeated
  dialogue-line blips are removed, and UI reverb is restrained. Smoke now
  proves grass and paving feedback, interaction-facing, idle animation, and
  reduced-motion stillness while retaining the 60-check headline. The exact
  gate passed 75 tests, 60/60 browser checks, and 0 vulnerabilities; build is
  99.63 kB initial (30.73 kB gzip) / 1,585.13 kB lazy (371.50 kB gzip).
  Graphify rebuilt to 1,054 nodes / 1,919 edges / 61 communities, retaining the
  known fail-closed node and stale semantic-label warning. Commit `654ce4b`
  deployed successfully through Pages run 30875727660; the live endpoint
  served the matching asset hashes. Todo Tencent was audited to 21 Done / 2 In
  progress / 5 Not started after adding three shipped cards and one honest
  ambient-pad follow-up. No human playtest, real-device, screen-reader,
  older-hardware, Miora, or cross-game equivalence claim.
- **2026-08-04** — Added a persistent code-drawn downward guide triangle above
  the main character across all locations. Centralized seven exterior
  entrances and 14 building collision zones in `estateLayout.ts`; realigned
  Block 9, hawker, kopitiam, provision, community-centre, prayer-hall, and
  workshop thresholds, removed the Block 9 pillar overlap, and rebuilt the
  hawker frontage around its centred entry. Sound now restores world focus and
  WASD/arrow movement. Browser fullscreen fills the viewport; Escape exits,
  prevents stray movement, and focuses Sound so volume controls remain
  available. Responsive labels keep all four top-bar controls visible at
  desktop and 360 px. Verification passed 75 tests, 60/60 browser checks and
  0 vulnerabilities; build is 98.71 kB initial (30.42 kB gzip) / 1,581.99 kB
  lazy (370.64 kB gzip). The eight-slide PPTX and eight-page PDF were refreshed
  and passed template-fidelity, overflow, metadata, and visual checks. Graphify
  rebuilt to 1,041 nodes / 1,868 edges / 59 communities, retaining the known
  fail-closed node and reporting 24 hub-based community renames. No real-device
  or human-playtest claim. Commit `e8601b4` deployed successfully through Pages
  run 30870964882 and the public endpoint was probed for the new controls. Todo
  Tencent was reconciled to 18 Done / 2 In progress / 4 Not started after
  completing the Quest-display card and adding four release-evidence cards.
- **2026-08-03** — Added a circular code-drawn estate map with seven real
  landmark anchors, live exterior player movement, indoor building state, and
  a direct Places shortcut. Rebuilt the Journal as a four-tab quest book with
  selected-entry detail, objectives, threshold-aware progress, tracking,
  equivalent campaign actions, arrow-key tabs, and responsive two-pane/stacked
  layouts. Interiors now use the full shell and a balanced fit-to-viewport
  camera (1.04× in the desktop evidence, 0.56× at 360 px) instead of cropping
  rooms against an edge. The 60-check journey now verifies the map, physical
  marker travel, room fit, quest tabs/tracking, focus, and mobile composition;
  all 75 tests, 60/60 browser checks, and the 0-vulnerability audit pass. The
  HTML/PPTX/PDF judge deck was refreshed to the current 95 kB rounded initial
  bundle figure and passed template-fidelity, overflow, eight-slide, and
  eight-page visual review. Graphify rebuilt to 1,036 nodes / 1,850 edges / 59
  communities; it retained the existing one fail-closed node and stale-label
  warning. Full evidence and claim boundaries are in `docs/AI_USAGE_LOG.md`.
- **2026-08-03** — Exterior spatial-logic correction after visual review:
  removed the roadless bus that crossed the south garden; moved the Block 9,
  provision-shop, and Block 12 bicycles onto marked outdoor verge bays; made
  all three racks physically solid; and centralized building, pedestrian,
  bicycle, and vehicle-route geometry in `estateLayout.ts`. Existing campaign
  registry and 60-check smoke assertions now fail on building/path bicycle
  overlap or any motor route without a road. Added eight cropped, y-sorted
  façade overlays that ease to 28% only while covering the player, restore on
  departure, and change instantly under reduced motion. Browser journeys
  correctly caught routes walking into a new rack and beyond the south world
  bound; only the evidence routes were corrected. The judge HTML, PPTX, and PDF
  decks were synchronized to the current 83 kB rounded bundle figure through a
  template-preserving render/overflow/fidelity check. Final verification
  details are recorded in `docs/AI_USAGE_LOG.md`.
- **2026-08-03** — Estate story-cluster/density continuation: one genuine
  OpenAI image-generation run used three current exterior captures to explore
  six reusable prop clusters, ground accents, clear routes, and subtle ambient
  life. The exact prompt, 1668×943 output, hash, generation artifact, and human
  accepted/rejected decisions are preserved; it is OpenAI evidence, not
  Miora. Humans translated the study into six original code-drawn composite
  textures placed 12 times, 26 baked drain grates, 28 baked leaf patches, and
  eight deterministic two-frame butterflies/dragonflies with reduced-motion
  and monsoon behavior. Two smoke journeys caught real trolley/utility
  collision regressions; corrected placements passed the third full journey.
  Verification passed 75 tests, 60/60 browser checks and 0 vulnerabilities;
  evidence found 88 exterior props / 22 forms, 12 story clusters / 6 forms,
  54 ground accents and 90 colliders. Build is 80.99 kB initial (25.23 kB
  gzip) / 1,580.13 kB lazy (369.96 kB gzip). Graphify rebuilt to 958 nodes /
  1,662 edges / 55 communities, retaining one fail-closed node and warning
  that 54 saved labels trail the changed topology. No real-device/cross-game
  equivalence claim, deck refresh, push or deployment.
- **2026-08-03** — Four-frame interaction-density and AI visual-direction
  continuation: expanded player/named-resident walking to four phases, added 14
  approach-only estate details, and added four deterministic two-frame
  community activities for sweeping, noticeboard discussion, gardening and
  kopitiam conversation. One real OpenAI image-generation pass used current
  gameplay and key art as references; the exact prompt, output and
  accepted/rejected review are preserved. Humans rejected direct runtime use
  and translated the strongest spatial/activity ideas into original code-drawn
  scenes. Full verification passed 75 tests, 60/60 production-browser checks
  and 0 vulnerabilities; build is 80.99 kB initial (25.23 kB gzip) /
  1,569.90 kB lazy (367.37 kB gzip). The eight-slide judge PPTX and PDF were
  refreshed and visually inspected; template-plan, fidelity and overflow checks
  passed with zero issues. Graphify rebuilt to 949 nodes / 1,651 edges / 54
  communities, retaining one fail-closed node and warning that saved labels
  trail the changed topology. This is OpenAI evidence, not Miora evidence; no
  real-device/cross-game equivalence claim, push or deployment.
- **2026-08-03** — Chapter 2 monsoon continuation: added a deterministic
  64-object screen-space rain pool, wet path bands, ten puddles with manually
  phased rings, cool haze, warm shelter light, and dry masks for the original
  and resident-restored sheltered routes. Previously helped residents gather
  under cover; both cats shelter and the seven laundry lines are stored.
  Reduced motion retains the wet/overcast story state while hiding falling rain
  and freezing puddle motion; narrow screens cull one third of the decorative
  pool. Smoke physically walks to the shelter and captures desktop, 360 px, and
  reduced-motion evidence; it measured 50 visible desktop and 23 visible mobile
  streaks, 10.10 ms monsoon p95, 10.20 ms active p95 at 2.32 ms/frame work, and
  9.70 ms p95 at 6.68 ms/frame under 4× CPU throttle. Implementation
  verification passed 75 tests, 60/60 production-browser checks, and 0
  vulnerabilities; build is 77.68 kB initial (24.06 kB gzip) / 1,563.49 kB
  lazy (365.74 kB gzip). Graphify rebuilt to 938 nodes / 1,624 edges / 55
  communities, retaining one fail-closed node and warning that saved labels
  trail the changed topology. No copied/shipped image asset, runtime model,
  real-device/cross-game equivalence claim, push, or deployment.
- **2026-08-03** — World-feel continuation: added responsive exterior camera
  scale (1.32× wide / 1.22× tablet / 1× mobile) while retaining the existing
  intimate interior framing, plus resize-latched Phaser scale/camera updates.
  Rebuilt the code-drawn pond with layered water, kerb, highlights, lily pads,
  two collision bodies and three manually phased ripple rings. Added a
  six-object walking-puff pool with no per-step allocation; pond and puff motion
  hold still or hide under reduced motion. Smoke physically walks to and
  captures the pond, proves two live puffs / three ripples / 78 obstacle bodies,
  and accepts an in-tolerance final physical-travel step. Stage verification
  passed 75 tests, 60/60 production-browser checks and 0 vulnerabilities; build
  is 77.68 kB initial (24.06 kB gzip) / 1,557.59 kB lazy (363.97 kB gzip).
  A passing run measured 9.10 ms active p95 at 2.43 ms/frame work and 9.20 ms
  p95 at 8.18 ms/frame under 4× CPU throttle. Central, east, south, mobile,
  world-scale and pond captures were visually inspected. Graphify rebuilt to
  933 nodes / 1,610 edges / 50 communities, retaining one fail-closed node and
  warning that saved community labels are behind the new topology. No copied
  art, shipped image, real-device/cross-game equivalence claim, push or
  deployment.
- **2026-08-03** — Visual-novel continuation: replaced the generic 74 px head
  icon with 13 unique 220×300 code-drawn NPC/Voice bust definitions and a
  separate estate narration panel. Portraits now encode authored hair, build,
  skin, age lines, accessories and community-role motifs; desktop dialogue uses
  a 940 px two-column stage and 360 px dialogue uses an 88×120 px header
  portrait with full-width text below. Portraits remain decorative while the
  existing speaker heading, whole-line live region, choices and focus contract
  carry meaning. Registry assertions were folded into the existing 75 tests.
  Smoke still passes 60/60 and now proves a 238×325 px / 41-primitive desktop
  bust, Mr. Long's stable cane/side-part profile, and overflow-free mobile
  dialogue. Build is 77.63 kB initial (24.04 kB gzip) / 1,554.93 kB lazy
  (363.23 kB gzip); the lazy Phaser scene is unchanged. A passing evidence run
  measured active p95 9.20 ms at 2.26 ms/frame work and 4× p95 9.10 ms at
  7.43 ms/frame. Desktop Voice, Mr. Long and 360 px production captures were
  visually inspected. Graphify rebuilt to 922 nodes / 1,589 edges / 51
  communities. No copied art, shipped image, real-device/cross-game equivalence
  claim, push or deployment.
- **2026-08-03** — Exterior-landmark continuation: added a reusable code-drawn
  pixel alphabet and gave the Hawker Centre, Kopitiam, Minah's shop, Community
  Centre, Prayer Hall, Workshop and Block 12 distinct baked façades with aligned
  thresholds. Twelve building shells replaced the lone HDB collider, leaving
  deliberate doorway gaps and bringing the exterior to 76 obstacle bodies.
  Smoke now measures 55 façade colours / 218 edge transitions / 26.1% dark
  pixels and physically stops a northward player at Minah's wall (`y=400` to
  `y=253`). Verification caught and fixed one TypeScript literal-inference
  error; visual inspection moved the Community sign clear of its runtime OPEN
  badge. A first workshop-capture route correctly hit the existing exercise
  collider, so the evidence route was rerouted through open ground. Current
  gate: 75 tests, 60 browser checks, 0 vulnerabilities; build 65.18 kB initial
  (21.41 kB gzip) / 1,554.93 kB lazy (363.23 kB gzip); active p95 9.20 ms at
  2.33 ms/frame work and 4× p95 9.20 ms at 7.22 ms/frame. North storefront,
  south landmark, and workshop production captures were visually inspected.
  Graphify rebuilt to 910 nodes / 1,566 edges / 51 communities. No copied art,
  shipped image, real-device/cross-game equivalence claim, push or deployment.
- **2026-08-03** — Tropical-landscape continuation: deepened the grass ramp;
  baked grass fringe and sparse leaf litter into existing path textures;
  rebuilt rain tree, palm and frangipani forms with stepped canopies, branches,
  contact shade and directional cast shadows; and placed 41 collision-aware
  shrubs, flower beds, pandan clumps and hedges from four reusable code-drawn
  textures. Smoke now proves 11 grass / 26 path colours, 27 path edges, all 41
  objects, four forms and 44 foliage colours while physically reaching both far
  districts. Current gate: 75 tests, 60 browser checks, 0 vulnerabilities;
  build 65.18 kB initial (21.41 kB gzip) / 1,548.15 kB lazy (361.08 kB gzip);
  active p95 9.20 ms at 2.63 ms/frame work and 4× p95 9.10 ms at
  7.76 ms/frame. NW/east/south production captures were visually inspected.
  Graphify rebuilt to 905 nodes / 1,555 edges / 51 communities. No copied art,
  shipped image, real-device/cross-game equivalence claim, push or deployment.
- **2026-08-03** — World-first interface continuation: replaced the permanent
  310 px desktop Journal column with an on-request modal drawer at every
  viewport width, including inert background, focus trap, visible Close,
  Escape/backdrop dismissal and world-focus restoration. The estate now fills
  the wide shell while rooms use centred framing; explicit Phaser scale/camera
  resizing fixed blank edge strips found during production-capture inspection.
  Smoke now verifies both canvas edges, the modal contract, and actual 360 px
  gameplay/touch/328 px drawer states. A live-position travel helper replaced
  timing-only holds after host scheduling caused one genuine bench collision.
  Current documented gate: 75 tests, 60 browser checks, 0 vulnerabilities;
  build 65.18 kB initial (21.41 kB gzip) / 1,540.89 kB lazy (358.77 kB gzip);
  active p95 9.20 ms at 2.83 ms/frame work and 4× p95 9.10 ms at
  8.83 ms/frame. Graphify remains 899 nodes / 1,539 edges / 52 communities
  after a no-topology-change refresh. No real-device/cross-game equivalence
  claim, push or deployment.
- **2026-08-03** — Baked-terrain continuation: replaced broad exterior surface
  fills with an original deterministic 32 px terrain grammar covering grass
  patches/tufts, running-bond paths, kerbs, drains and utility covers across
  all four pre-baked quadrants, with no per-frame drawing. Smoke now measures
  the generated texture itself (11 grass colours / 16 path colours / 27 path
  edges). Current gate: 75 tests, 60 browser checks, 0 vulnerabilities; build
  64.55 kB initial / 1,540.89 kB lazy (358.77 kB gzip); active and 4× p95 both
  9.20 ms with 2.54/6.25 ms/frame main-thread work. NW/east/south production
  captures were visually inspected with no seams, clipping or blocked cues.
  Graphify rebuilt to 896 nodes / 1,533 edges / 51 communities. No copied art,
  real-device/cross-game equivalence claim, push or deployment.
- **2026-08-03** — East/south district continuation: added code-drawn tray
  return, provision crates, mosaic dragon playground and exercise corner with
  collision/depth; smoke now physically walks to and captures east/south.
  Those captures exposed and drove a fix for a slept exterior waking black with
  stale label/disabled controls; wake now restores FX/state/callbacks and has an
  idempotent fade fallback. Performance profiling now calibrates against the
  same-run title scheduler while retaining fixed 28/34 ms limits plus 8/20 ms
  main-thread budgets. Current gate: 75 tests, 60 browser checks, 0
  vulnerabilities; build 64.55 kB initial / 1,538.46 kB lazy (357.84 kB gzip).
  The final collision-aware capture reached east `(2242, 400)` and south
  `(1718, 1184)`, clearly framing the dragon playground and exercise corner.
  A clean final run measured title p95 9.20 ms, active p95 17.10 ms with
  2.87 ms/frame work, and 4× p95 9.30 ms with 6.54 ms/frame work. Graphify
  remains at 891 nodes / 1,521 edges / 51 communities. A final Gemini CLI
  authoring retry failed before output because the installed client no longer
  supports the configured individual/free tier; no Gemini-authored content is
  claimed. No real-device/cross-game claim; no push/deployment.
- **2026-08-03** — Living-environment continuation: 23 hand-placed flower
  clusters baked into exterior tiles, seven code-drawn animated HDB laundry
  lines, and two code-drawn community cats with deterministic routes, contact
  shadows, and y-depth. Reduced motion freezes residents, cats, and laundry.
  Smoke snapshots prove both normal animation and reduced-motion stillness
  without increasing the 60-check headline. Current gate: 75 tests, 60
  production-browser checks, 0 vulnerabilities; build 64.55 kB initial /
  1,535.46 kB lazy (357.00 kB gzip); resident/ambient p95 10.30 ms, player p95
  10.00 ms, and 4×-throttled p95 10.10 ms in headless Chrome. Updated exterior
  capture visually inspected. Graphify rebuilt to 890 nodes / 1,516 edges / 50
  communities. No real-device/cross-game claim; no push/deployment.
- **2026-08-03** — Resident-life continuation: all 12 named residents received
  original down/up/side walk and blink frames; the eight exterior residents now
  follow deterministic authored routes, stop and face a nearby player, and
  move their shadow, interaction hit point, and marker in sync. Smoke-only
  snapshots prove seven far residents moved while Uncle Ravi stayed attentive;
  a separate 120-frame resident-route profile remained inside budget. Current
  gate: 75 tests, 60 production-browser checks, 0 vulnerabilities; build
  64.55 kB initial / 1,530.68 kB lazy (355.50 kB gzip); observed resident/player
  p95 9.6–10.3 ms and 4×-throttled p95 9.6–10.2 ms in headless Chrome.
  Production gallery refreshed and representative frames visually inspected.
  Graphify rebuilt to 879 nodes / 1,494 edges / 50 communities. No real-device
  or cross-game claim; no push/deployment.
- **2026-08-03** — Original pixel-art/runtime pass: shared palette ramps and
  structural shading, six directional player frames, larger varied residents,
  three tree silhouettes, dense HDB/estate props, patterned floors, and unique
  furniture for every interior. Baked exterior layers and reusable room
  textures retained; per-frame movement allocation removed and proximity scans
  throttled. Production capture sweep instantiated and visually reviewed all 12
  locations. Current gate: 75 tests, 60 production-browser checks, 0
  vulnerabilities; repeated active Canvas2D movement samples measured 9.2–10.1
  ms p95 in headless Chrome. A living-estate continuation added deterministic
  resident blinks/facing, progressive window lights, a lower-wash evening pass,
  and the post-ending void-deck gathering; a 4× CPU-throttled movement sample
  measured 9.8 ms p95. Graphify rebuilt to 864 nodes / 1,456 edges. No
  real-device or cross-game performance claim; no push/deployment.
- **2026-08-03** — Flat activity loop replaced by the five-part campaign:
  `CampaignStateV1`, pure reducer, versioned autosave/Continue/Start Over,
  isolated 2/2 demo mode, dynamic four-section Journal, eight optional resident
  routes, and deterministic offline KampungMind profiles/intents/memories.
  Monolithic sandbox scene replaced by shared walking, exterior estate and
  reusable interior scenes with corridor, four flats and six landmarks;
  correct return doors, collision, reduced-motion transitions and persistent
  ramp/kitchen/workshop/lighting consequences. Current gate: 75 tests, 60
  production-browser checks, 0 vulnerabilities. Deck/PDF and submission docs
  refreshed. Gemini CLI authoring attempt was authentication-blocked and
  produced no content; the prompt and actual failure are logged. No push or
  deployment.
- **2026-08-02** — Graphify knowledge graph set up and the project's memory
  ingested into it: all 31 docs extracted alongside code (759 nodes, 1,121
  edges, 44 labelled communities). The extraction caught stale 65/21 figures
  in the deck sources; synced to 70 tests / 22 checks and re-exported.
  Shift-to-hurry (215→260 px/s), journal badge pills, world
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
accessibility, persistence, and campaign flow. `src/game/campaignScene.ts`
contains the shared walking base plus exterior and reusable interior scenes.
Keep progression in the pure `campaign.ts` reducer, authored content in
`campaignContent.ts`, NPC selection in `kampungMind.ts`, and optional matching
rules in `matchEngine.ts`. Tests belong in
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
