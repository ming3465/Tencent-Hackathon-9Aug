# AI Usage Log

This log records AI assistance truthfully for judging, reproducibility, and
human review. An entry is evidence of work performed, not proof that the result
was correct.

## 2026-07-25 - Project Contract and Phase 1 Specification

**Tool:** OpenCode

**Goal:** Convert the approved hackathon plan into bounded project instructions,
acceptance criteria, accessibility requirements, research guardrails, and QA
gates before CodeBuddy writes game code.

**Human decisions preserved:**

- Project name: Kampung SG.
- Product definition: ageing well through agency, connection, dignity, purpose,
  and contribution.
- Workflow: CodeBuddy authors major systems; OpenCode reviews and verifies.
- Approved local tools: Git, Phaser, Vite, TypeScript, and Vitest.
- Miora access is available but final art is deferred until after graybox
  validation.

**Files created:**

- `CODEBUDDY.md`
- `docs/GAME_DESIGN.md`
- `docs/ACCESSIBILITY.md`
- `docs/RESEARCH.md`
- `docs/QA_CHECKLIST.md`
- `docs/AI_USAGE_LOG.md`
- `docs/prompts/codebuddy-phase1.txt`

**Verification:** Document review only. No gameplay code existed at this point.

**Limitations:** The competition deadline in the supplied brief is subject to
organizer updates. No older-adult playtest has occurred, so no usability or
impact claim is made.

## 2026-07-25 - CodeBuddy Phase 1 Graybox

**Tool:** CodeBuddy CLI 2.127.0

**Invocation:**

```text
Read CODEBUDDY.md and docs/prompts/codebuddy-phase1.txt, then execute only that
Phase 1 task. You have approval to install only project-local Phaser, Vite,
TypeScript, and Vitest packages. Do not use any other dependency or external
service. Preserve the existing training transcript. Stop after the Phase 1
checks and report truthfully.
```

The detailed task is preserved verbatim in
`docs/prompts/codebuddy-phase1.txt`.

**CodeBuddy-authored files:**

- `index.html`
- `package.json`
- `tsconfig.json`
- `vite.config.ts`
- `vitest.config.ts`
- `src/main.ts`
- `src/game/chapter1.ts`
- `src/game/config.ts`
- `src/game/matchEngine.ts`
- `src/game/__tests__/matchEngine.test.ts`

**Execution result:** CodeBuddy produced the core graybox and test suite but
exceeded its 50-turn limit before returning a final report. Independent checks
then found two TypeScript unused-variable errors, three failing tests based on
an incorrect constant-RNG shuffle assumption, an unused Phaser dependency,
four dependency audit findings, and a stale mismatch-timer race.

**Correction request:** A focused request containing those failures was sent to
the same CodeBuddy session. It could not run because the account returned `429
Credits exhausted`. No additional credits were purchased.

## 2026-07-25 - Independent Correction and Verification

**Tool:** OpenCode

**Goal:** Review CodeBuddy's output, correct verified defects without expanding
the Phase 1 product scope, and run independent checks.

**Corrections:**

- Rewrote tests to locate actual matching IDs rather than relying on an invalid
  shuffle-order assumption.
- Added defensive mismatch resolution and session-aware timer cancellation.
- Integrated Phaser as a non-interactive neighbourhood progress graybox while
  retaining semantic HTML controls.
- Corrected screen focus routing, card labels, ARIA board semantics, mode-button
  markup, skip-link focus, touch targets, and 360px overflow.
- Updated Vite and Vitest to patched Node 20-compatible releases and added a
  `.gitignore`.
- Added a Chrome DevTools Protocol smoke check for the production bundle.

**Verified results:**

- `npm run typecheck`: passed.
- `npm test`: 31 tests passed in one test file.
- `npm run build`: passed with Vite 6.4.3.
- `npm audit`: zero known vulnerabilities.
- Production HTTP response: 200.
- Headless Chrome: Phaser canvas initialized, 12 cards rendered, card focus
  established, mismatch input locked and resolved, Together Mode advanced to
  Player 2, and a stale timer did not alter a newly started game. The automated
  player then matched all 12 cards, opened the completion dialog at 6 of 6
  pairs, verified dialog focus, replayed the same board, returned to the title,
  and started Solo Mode.
- Mobile emulation: 360px document width, no horizontal overflow, and no active
  control below 48 by 48px.

**Known limitations:**

- The Phaser-inclusive production JavaScript is 1,490.81 kB minified and 343.24
  kB gzip; Vite reports its standard 500 kB chunk warning.
- A human still needs to complete Solo and Together Mode using real keyboard
  and touch input, inspect tablet gameplay, test at 200 percent zoom, and check
  announcements with a screen reader.
- Placeholder emoji rendering varies by operating system and will be replaced
  only after the Miora style bible is approved.
- No older-adult playtest has occurred, so no usability or impact claim is
  made.

## 2026-07-25 - Sandbox Direction Pivot

**Decision owner:** User

**Implementation tool:** OpenCode. CodeBuddy remained unavailable because its
account credits were exhausted after the original matching-game pass.

**Reason for change:** The card-board graybox did not match the intended game.
The user selected a Stardew-like implementation model: a top-down explorable
neighbourhood, the matching game retained as an optional activity, and one
avatar with choices designed for shared discussion.

"Stardew-like" refers only to a readable top-down exploration and interaction
loop. The project does not copy Stardew Valley art, characters, maps, systems,
writing, branding, or other protected expression.

**Implemented sandbox systems:**

- Replaced the board-first flow with a 1600 by 1000 Phaser neighbourhood.
- Added player movement, camera following, world bounds, major-building
  collision, touch direction controls, and proximity-based interactions.
- Added an HDB block, void deck, hawker corner, pond, sheltered walk, community
  garden, residents, labels, and activity markers using procedural fallback
  art.
- Added three resident-led activities with two non-punitive choices each.
- Added Connection, Purpose, and Comfort progression with immutable domain
  logic and bounded values.
- Added a Journal, direct activity shortcuts, nearby prompts, modal focus
  management, and an evening reflection after any three activities.
- Reframed the existing matching engine as an optional four-pair memory-table
  activity.
- Lazy-loaded Phaser so the title page ships as a small initial JavaScript
  chunk while the game engine loads only after the player begins.

**Miora preparation:**

- Added `docs/MIORA_ASSET_BIBLE.md` with an original visual direction, palette,
  representation rules, generation order, prompt templates, file contract, and
  review checklist.
- Reserved `public/assets/miora/` for approved transparent exports.
- Kept world geometry and rules separate from procedural drawing so Miora
  characters, environment cutouts, props, portraits, cards, and title art can
  replace fallback visuals without changing game logic.
- No Miora image has been generated or claimed yet.

**Files added or substantially changed:**

- `index.html`
- `src/main.ts`
- `src/game/sandboxScene.ts`
- `src/game/sandboxState.ts`
- `src/game/__tests__/sandboxState.test.ts`
- `scripts/browser-smoke.ps1`
- `README.md`
- `CODEBUDDY.md`
- `docs/GAME_DESIGN.md`
- `docs/ACCESSIBILITY.md`
- `docs/QA_CHECKLIST.md`
- `docs/MIORA_ASSET_BIBLE.md`
- `public/assets/miora/README.md`

**Verified results before final handoff:**

- `npm run typecheck`: passed.
- `npm test`: 42 tests passed across two test files after the choice-reflection
  additions.
- `npm run build`: passed with Phaser in a lazy-loaded sandbox chunk.
- `npm audit`: zero known vulnerabilities.
- Initial JavaScript: 17.62 kB minified, 6.66 kB gzip after the consequence and
  reflection additions.
- Lazy sandbox chunk: 1,494.41 kB minified, 344.30 kB gzip.
- Production-browser mobile emulation: 360px width, no horizontal overflow,
  and no active target below 48 by 48px.
- Browser flow: opened the sandbox, discovered Uncle Ravi, selected a
  noticeboard activity, updated meters and Journal, moved by touch to the
  memory table, completed all four pairs, used a Journal shortcut for Mdm Siti,
  unlocked the evening, completed the end-day reflection, destroyed the Phaser
  scene, and restored title focus.

**Known limitations:**

- Real-device keyboard movement, tablet layout, screen-reader announcements,
  and 200 percent zoom still require human checks.
- The Phaser lazy chunk triggers Vite's standard 500 kB warning even though it
  is not part of the initial title-page JavaScript.
- Procedural shapes are temporary. Final visual quality depends on generating,
  reviewing, and integrating a consistent Miora asset batch.
- Residents currently remain at fixed activity points and do not have schedules
  or autonomous behavior.
- No older-adult playtest has occurred, so no usability or social-impact result
  is claimed.

## 2026-07-25 - Keyboard Movement Regression

**Reported behavior:** The user could open the sandbox but could not move the
player with WASD or arrow keys. Touch movement remained functional.

**Root cause:** `src/main.ts` registered a document-level `keydown` handler that
called `event.preventDefault()` for movement keys. Phaser's keyboard manager
listens at the window level and deliberately ignores any event whose
`defaultPrevented` flag is already true. The event therefore reached Phaser but
was discarded before it could update cursor or WASD key state.

**Fix:** Removed the redundant movement-key cancellation from the document
handler and retained only Escape handling. Phaser's `addKeys`, `addKey`, and
`createCursorKeys` registrations already capture their own browser defaults
after processing the input.

**Independent verification:**

- Production Chrome sent a real `ArrowDown` key event for 430ms.
- The player moved from Uncle Ravi's noticeboard to the memory table.
- A real pointer press on the touch direction pad moved the player back.
- Nearby prompts updated correctly after both input methods.
- The complete dialogue, memory, Journal, evening, focus, and teardown browser
  flow continued to pass.
- Type checking, 42 tests, production build, and audit continued to pass.

**Planning output:** Added `docs/HACKATHON_BLUEPRINT.md` with dated daily tasks,
phase gates, Miora and CodeBuddy handoffs, scope cuts, testing, deployment,
deck, video, social bonus, and submission checks through August 3.

## 2026-07-25 - Credit-Independent Production Work

**Context:** CodeBuddy and Miora credits were still pending. WorkBuddy was not
introduced because the official Game Track workflow uses CodeBuddy and Miora.

**Implemented without new tools or services:**

- Added six choice-specific procedural world consequences: shared herbs,
  flower seating, chess invitation, story swap, route rest point, and extended
  shelter.
- Added a completed-state treatment for the optional memory table.
- Kept every consequence in a separate Phaser visual layer so a Miora prop can
  replace it without changing collision or progression logic.
- Added a pure, tested evening-reflection builder that references the player's
  actual activity choices instead of showing generic copy.
- Added two evening-reflection tests, bringing the suite to 42 tests.

**Submission preparation added:**

- `docs/RUBRIC_SCORECARD.md`
- `docs/PLAYTEST_PROTOCOL.md`
- `docs/DEMO_SCRIPT.md`

These documents define evidence gaps, privacy-safe human testing, issue
severity, the 90-second narrative, required shots, and live-demo fallback.

**Claim boundary:** No Miora asset, human playtest, deployment, or restored
CodeBuddy credit is claimed in this entry.

## 2026-07-25 - Master Responsibility Checklist

**Tool:** OpenCode

**Goal:** Consolidate every known requirement into one owner-based handoff so
user-only actions, AI-agent work, official-tool evidence, approval gates, and
submission responsibilities cannot be silently missed.

**Output:** `docs/MASTER_CHECKLIST.md`

The checklist includes current status, missing user information, user tasks,
OpenCode duties and prohibitions, the recommended next CodeBuddy task, Miora
asset batches, WorkBuddy's non-required status, external approval gates,
deliverables, evidence, playtesting, Git and backup requirements, final
definition of done, and immediate handoffs.

No unknown registration, team, credit, deployment, testing, or submission item
was marked complete without user confirmation.

## 2026-08-01 - Audio System, Living Estate, Node Smoke Harness, Deployment, and Deck

**Tool:** Claude Code (Opus 5), working under human direction.

**Context:** The user explicitly deprioritised CodeBuddy and Miora for this
session because credits were unavailable. None were purchased, so neither tool
was run today. Earlier history stands as already recorded: CodeBuddy CLI
2.127.0 authored the initial ten pre-pivot files, and OpenCode performed the
correction and pivot passes.

**Implemented:**

- Added `src/game/audio.ts`, a centralized Web Audio synthesis system with
  separate music, sfx, and ui buses, a global mute, per-category volume,
  per-sound throttling, and suspension while the browser tab is hidden. No
  audio file is shipped; every sound is generated at runtime.
- Added 17 unit tests for that system in `src/game/__tests__/audio.test.ts`.
- Residents now wander, turn to face the player, and change their spoken line
  after the player acts on their invitation. This replaces the fixed-position
  residents noted as a limitation in the 2026-07-25 pivot entry.
- Added a golden-hour lighting pass that fades the estate toward dusk when the
  third activity unlocks.
- Added character shadows, a walk bob, pond ripples, and butterflies as
  ambient life.
- Replaced the Windows-only PowerShell smoke test with a Node and Chrome
  DevTools Protocol harness at `scripts/browser-smoke.mjs`, exposed as
  `npm run smoke`, which runs on macOS and Linux.
- Added a GitHub Pages auto-deploy workflow at `.github/workflows/deploy.yml`.
- Built an 8-slide project introduction deck from `docs/deck/index.html` using
  `scripts/capture-deck.mjs` and `scripts/build-pptx.py`, exported as
  `docs/deck/Kampung SG-Project Introduction Deck-TheTwoGuys.pptx` and the
  matching `.pdf`, with speaker notes in the PowerPoint notes pane. Its one
  external statistic, "By 2030, nearly one in four citizens will be aged 65
  and above," is quoted from the official "AI CAN DO IT" - "Age Well" Social
  Good Challenge Singapore hackathon brief (2026), p.5.

**Defects found and fixed by verification:**

- The golden-hour overlay did not render at all in its first version. The
  overlay was constructed with `fillAlpha` 0 while the tween animated the
  GameObject's `alpha`, so the fill never drew at any tween value. The code
  read as correct; the defect was caught only by inspecting an actual
  smoke-test screenshot.
- The first version of the smoke harness sized the overlay from
  `camera.width` during `create()`, before canvas layout had settled.
- A synthetic-pointer crash risk in `setPointerCapture` was surfaced by the
  smoke test and guarded.

**Files added or substantially changed:**

- `src/game/audio.ts`
- `src/game/__tests__/audio.test.ts`
- `src/game/sandboxScene.ts`
- `scripts/browser-smoke.mjs`
- `scripts/capture-deck.mjs`
- `scripts/build-pptx.py`
- `.github/workflows/deploy.yml`
- `package.json`
- `docs/deck/index.html`
- `docs/deck/Kampung SG-Project Introduction Deck-TheTwoGuys.pptx`
- `docs/deck/Kampung SG-Project Introduction Deck-TheTwoGuys.pdf`

**Verified results:**

- `npm run typecheck`: passed under strict TypeScript.
- `npm test`: 59 tests passed across three files - 11 in sandboxState, 17 in
  audio, and 31 in matchEngine. The suite was 42 tests before today.
- `npm audit`: zero known vulnerabilities.
- `npm run build`: passed. Initial JavaScript 24.35 kB, 8.85 kB gzip. Lazy
  Phaser chunk 1,498 kB, 345.64 kB gzip.
- `npm run smoke`: 19 checks, 19 passing, 0 failing, run on 2026-08-01
  against the production bundle. The touch-target assertion in that harness
  is a 44px minimum, not 48px.
- Live deployment at https://ming3465.github.io/Tencent-Hackathon-9Aug/
  returned HTTP 200 with HTTPS enforced. The repository is public at
  https://github.com/ming3465/Tencent-Hackathon-9Aug.

**Superseded evidence:** `scripts/browser-smoke.ps1` is retained only as the
pre-pivot PowerShell harness. It exercised the deleted card-matching build
(12 cards, Together Mode, Solo Mode), which no longer exists, so its results
are not evidence for the current game.

**Known limitations:**

- No human playtest has occurred. Zero older adults, or anyone else, have
  played this build.
- No Miora asset exists. `public/assets/miora/` still contains only its
  README, and all visuals remain procedural.
- No additional CodeBuddy run happened. Account credits remained exhausted and
  none were purchased.
- The Phaser lazy chunk still triggers Vite's standard 500 kB chunk warning.
- Screen-reader announcement checks and a 200 percent zoom pass still require
  a human.
- Focus restoration is not one of the 19 automated smoke checks and was not
  automatically verified today.
- FILL - team member names, roles, and email addresses are still unknown and
  are marked as FILL in the deck. The team name is TheTwoGuys.

**Claim boundary:** This entry does not claim any human playtest, participant,
user, or observer; any usage, engagement, wellbeing, or outcome metric; any
Miora-generated asset; any CodeBuddy or Miora run on this date; any
endorsement or third-party review; or any medical, cognitive, or
dementia-related effect. The 18 smoke checks are automated browser assertions
against the production bundle and are evidence that the build loads and
responds, not evidence that it is enjoyable, accessible, or effective.

## 2026-08-01 - Visual-Novel Dialogue, Story Content, and Marker Pass

**Tool:** Claude Code (Opus 5), working under human direction.

**Goal:** Replace the single-paragraph dialogue box with a paced visual-novel
conversation so residents can demonstrate their expertise instead of having it
asserted, and shrink the oversized interaction markers.

**Implemented:**

- Rewrote every activity conversation as a sequence of authored lines:
  `introLines`, per-choice `responseLines`, and `completedLines` for revisits.
  Aunty Mei, Uncle Ravi and Mdm Siti now each have a four-line introduction that
  establishes what they know and why, and three-line responses per choice.
- Added `buildDialogueScript` and `buildChoiceScript` as pure, Phaser-free
  functions so conversation selection is unit-testable.
- Added a visual-novel dialogue panel: pixel-style SVG portrait drawn from the
  same palette as the world sprites, speaker nameplate, an "n of m" line
  counter, a typewriter reveal with a blinking caret, and a Continue control.
  Choices are withheld until the conversation has been read to the end.
- The typewriter is decorative only: the complete line is written to a
  visually-hidden node immediately, and the animated node is `aria-hidden`, so
  screen-reader users receive whole lines rather than partial text.
  `prefers-reduced-motion` disables the animation entirely.
- The memory table now opens with three narration lines and a "Sit down and
  play" control, and stays replayable through "Play another round".
- Reduced the interaction marker from radius 25 to 15 with proportionally
  smaller badge and label offsets.

**Defect found by verification:** the browser smoke test failed after the
rewrite because choices no longer exist at the moment the dialogue opens. That
was the harness encoding the old flow, not a product bug; the harness now reads
through the conversation before asserting on choices, and gained two checks
covering the new sequencing.

**Verified results:**

- `npm run typecheck`: passed.
- `npm test`: 65 tests across 3 files (31 match engine, 17 sandbox state,
  17 audio settings), including 6 new dialogue-script tests that assert every
  activity and every choice has non-empty authored content.
- `npm run build`: passed.
- `npm audit`: 0 vulnerabilities.
- `npm run smoke`: 21 checks, 21 passing, 0 failing, against the production
  bundle.

**Known limitations:**

- No human has played the visual-novel flow yet; line pacing is an authoring
  judgement, not a tested one.
- The conversation is authored ahead of time and selected by deterministic code.
  No language model runs at play time, by design.
- Portraits are procedural SVG, not generated art. No Miora asset exists.
- Screen-reader behaviour of the dialogue panel has been designed for but not
  confirmed with a human running assistive technology.

**Claim boundary:** this entry claims a conversation system, its tests, and its
verification. It does not claim playtesting, generated art, or any measured
effect on a player.

## 2026-08-01 - Judge Path (Demo Mode)

**Tool:** Claude Code (Opus 5), working under human direction.

**Goal:** Research on judging mechanics showed judges give an entry 3-10
minutes and the finalist cut is decided largely from the video, while our full
loop runs 6-8 minutes. Build a compressed judge path without touching the real
game's rules.

**Implemented:**

- `?demo=1` query parameter: evening unlocks after 2 activities instead of 3,
  walking speed 215 -> 260 px/s. Nothing else changes; the progress copy reads
  the threshold from state so the UI stays truthful in both modes.
- `requiredForEvening` moved onto `SandboxState` (clamped 1..4);
  `SandboxGameOptions.playerSpeed` added to the scene factory.
- 5 new unit tests (70 total) and 1 new browser-smoke check (22 total) that
  drives `?demo=1` end-to-end in headless Chrome.
- `docs/DEMO_MODE.md` documents usage, the exact levers, the honesty boundary
  (a pacing device, never a content device), and the 3-minute route for the
  video and the Demo Day stage.

**Verified results:** typecheck clean; 70/70 tests; production build; 22/22
browser smoke including the new judge-path check.

**Claim boundary:** demo mode compresses pacing for a timed judging window.
The full game remains 6-8 minutes by design, and no demo-only content exists.

## 2026-08-02 - Solid World and the Bus

**Tool:** Claude Code (Opus 5), working under human direction.

**Goal:** Two user requests: objects should have physical presence (no walking
through trees or furniture), and the bus stop should occasionally have a bus.

**Implemented:**

- Collision for previously ghost-through props: tree trunks (canopies stay
  walk-behind for depth), the memory table, kopitiam tables, playground
  equipment, fitness-corner equipment, walkway posts, and the bus-stop posts,
  bench and flag. The garden is now fenced with a real gate on the walkway
  side. The sheltered space under the bus stop stays walkable on purpose.
- An ambient bus works the lower road: eases in from the west, halts at the
  stop for a few seconds, pulls away east, and returns on a randomised 14-28s
  interval. Drawn procedurally (ink outline, teal band, lit windows). No
  physics body, so it can never pin the player. Under prefers-reduced-motion it
  waits at the stop instead of driving.

**Verified results:** typecheck clean; 70/70 tests; 22/22 browser smoke - the
keyboard-movement checks now pass against the new memory-table collision, with
the player stopping at the table edge still inside interaction range.

**Claim boundary:** ambient behaviour only; no new progression, no new claims.

## 2026-08-02 - Shift-to-Hurry and Journal Badge Restyle

**Tool:** Claude Code (Opus 5), working under human direction.

- Hold Shift to walk faster: 215 -> 260 px/s, the demo-mode pace. No stamina,
  no cooldown, and demo mode is never made slower (max of the two speeds).
  Shift is read without capture so Shift+Tab keyboard navigation keeps working.
  Step cadence scales with speed so hurrying reads in the body. Control hints
  on the title screen and the canvas label were updated.
- Journal status badges were 42px circles with OPTION crammed inside. Now slim
  pills anchored top-right of each card: neutral for OPEN, gold-tinted for the
  optional memory table, green with a check when completed.

**Verified:** typecheck clean, 70/70 tests, 22/22 browser smoke.

## 2026-08-02 - Graphify Workspace Knowledge Graph (dev tooling)

**Tool:** Graphify 0.9.32 (Graphify-Labs), installed via uv at the user's
request so every AI agent working on this repo shares a queryable map of it.

- `graphify update .` built a local graph: 703 nodes, 943 edges, 51
  communities. Extraction is tree-sitter based, fully local, no LLM calls, and
  parses without executing code. Output lives in `graphify-out/` (gitignored -
  developer tooling, not part of the judged build; nothing ships).
- Registered the `/graphify` skill for Claude Code and CodeBuddy.
- Verified with live queries: node disambiguation and a shortest-path query
  (`KampungAudio <-imports- main.ts`).

**Claim boundary:** development tooling only. No change to the game, its
dependencies, or any deliverable.

## 2026-08-02 - Project Memory Ingested into the Knowledge Graph

**Tool:** Graphify 0.9.32 semantic extraction, with Claude Code (Opus 5)
subagents as the extraction model (no API key; fully local pipeline).

- The 31 project documents - the session logs, constraints, playbook, runbook,
  design docs, and this log - were extracted into the workspace knowledge
  graph alongside the code: 759 nodes, 1,121 edges, 44 labelled communities,
  graph health OK. A .graphifyignore excludes regenerated artifacts
  (screenshots, deck renders) so future updates never re-extract renders of
  sources the graph already tracks.
- The extraction immediately caught a real defect: the deck, deck copy, video
  script, and AI evidence page still quoted 65 tests / 21 smoke checks while
  the build had moved to 70 / 22. All six files were corrected and the deck
  re-exported (PPTX + PDF).

**Verified:** 70/70 tests; deck PDF re-checked (70/70 and 22/22 present, no
stale figures); graph diagnostics report no dangling, missing, or collapsed
edges.

**Claim boundary:** development tooling and documentation sync only; no game
behaviour changed.

## 2026-08-03 - KampungMind Campaign and Enterable Estate

**Tool:** Codex (GPT-5), working under human direction. Two separate Gemini CLI
0.53.1 authoring invocations were attempted and are recorded below.

**Goal:** Replace the flat activity loop with a prologue, three sequential
chapters, The Last Door ending, deterministic offline NPC direction, versioned
progress, and enterable homes/landmarks while preserving every published
product constraint.

**Implemented:**

- Added centralized chapter, quest, NPC, intent, and location registries.
- Replaced `SandboxState` with versioned `CampaignStateV1` and pure
  `reduceCampaign(state, event)` progression. The reducer rejects locked future
  events, keeps prior places/unfinished requests revisitable, prevents duplicate
  rewards, and records unique contributions, invitations, choices, memories,
  visited locations, objectives, and Kampung meters.
- Added `kampung-sg.campaign.v1` autosave, Continue, confirmed Start Over,
  corrupt-save fallback, and fully isolated demo state. `?demo=1` keeps all
  chapters while lowering only the 3-helper/5-invitee thresholds to 2/2 and
  increasing walking speed. `?demo=0` does not enable demo mode.
- Added KampungMind: reviewed personality, role, expertise, knowledge, memory
  rules, and authored intents for the resident cast. Eligible intents are
  deterministically scored by chapter relevance, expertise, prior help, active
  requests, and remembered choices; stable IDs break ties. No runtime text
  generation, network call, API key, or backend was added.
- Replaced the monolithic scene with shared `WalkableScene`, exterior
  `EstateScene`, and reusable `InteriorScene`. Added the Block 9 corridor,
  Y’s/Mr. Long’s/Grandma Ros’s/Ben’s flats, craftsman’s workshop, community
  centre, kopitiam, provision shop, hawker centre, and prayer hall. All art is
  drawn in code.
- Added shared keyboard/touch input, transition latching, reduced-motion fades,
  location announcements, indoor collision, preserved exterior state and
  correct return-door positions.
- Rebuilt the Journal from campaign data with Main Story, Optional Requests,
  People, and Places. Future chapters remain locked without spoilers, and every
  meaningful interaction has a Journal equivalent.
- Added chapter-persistent ramp, garden, sheltered-route, kitchen, workshop,
  gathering, and lighting consequences; varied resident silhouettes and
  age-signalling details without medical or deficit framing.
- Renamed the old memory-card content module from `chapter1.ts` to
  `keepsakes.ts`, and kept matching as an optional system.
- Replaced the smoke harness with full and demo production-campaign
  playthroughs; refreshed game screenshots, judge-deck source/slides, inherited
  PPTX images and speaker notes, PDF, submission copy, design, demo,
  accessibility, QA, and onboarding documents.

**Gemini CLI attempt:**

- Preserved prompt: `docs/prompts/gemini-kampungmind-authoring.txt`.
- Actual invocation:
  `gemini --approval-mode plan --output-format text --prompt "Return only the requested authoring matrix."`
  with the preserved prompt supplied on standard input.
- The CLI opened Google authentication and waited. Authentication was cancelled
  while blocked; the CLI ended with `FatalCancellationError: Authentication
  cancelled by user`.
- A final retry used the same preserved prompt and command after the completed
  implementation. It failed before authoring with `IneligibleTierError`:
  Gemini CLI reported that this client is no longer supported for the
  configured Gemini Code Assist individual/free tier.
- It produced no authoring matrix or usable draft. No Gemini-authored line was
  reviewed or committed, and this work does **not** claim a completed Gemini
  pass.

**Verified results completed during implementation:**

- `npm run typecheck`: passed under strict TypeScript.
- `npm test`: 75/75 passed across campaign (27), optional matching (31), and
  audio (17).
- `npm run build`: passed. Initial JavaScript 64.37 kB (21.12 kB gzip);
  campaign/Phaser scene lazy chunk 1,506.63 kB (348.07 kB gzip). Vite’s standard
  500 kB chunk warning remains.
- `npm audit`: 0 known vulnerabilities.
- `npm run smoke`: 60/60 production-browser checks passed across the full
  3-helper/5-attendee campaign and isolated 2/2 demo campaign.
- Artifact-tool template-fidelity check: 8-slide inherited deck structure,
  zero issues. The final PDF was rendered to eight PNG pages and visually
  inspected after correcting slide 4, slide 6, and the slide 8 footer.
- `graphify update .`: local code graph rebuilt to 830 nodes, 1,319 edges, and
  49 communities; live queries resolve `CampaignStateV1` and
  `selectNpcIntent()` with their current import/call relationships.

**Known limitations and claim boundary:**

- The connected in-app browser was unavailable, so browser verification used
  the repository’s real headless-Chrome production harness.
- No human playtest, real-device touch pass, 200% zoom pass, or human
  screen-reader pass occurred. Automated browser assertions are not evidence
  of enjoyment, accessibility certification, or social impact.
- No push or deployment occurred.

- No backend, runtime LLM, account, analytics, data collection, shipped raster
  game art, timer, failure state, energy system, or medical/cognitive/dementia
  claim was added.

## 2026-08-03 - Original Pixel-Art and Runtime Pass

**Tool:** Codex (GPT-5), working under human direction.

**Goal:** Raise the exploration layer toward the user’s Stardew-level quality
and smoothness target while keeping Kampung SG visually original and retaining
its visual-novel conversations. “Stardew-level” was treated as a bar for
readability, density, feedback, and frame pacing—not permission to copy art,
characters, tiles, maps, systems, writing, or branding.

**Implemented:**

- Added `campaignArt.ts` with one palette-derived light/shade system, consistent
  structural blocks, six directional player walk frames, larger varied
  resident sprites, three tree silhouettes, reusable estate props, and a
  single recyclable location-specific room-backdrop texture.
- Reworked the exterior with code-drawn HDB windows and void-deck details,
  drains, concrete joints, shelter shadows, benches, lamps, bins, bicycle
  racks, planters, denser landmark facades, and a complete moving bus sprite.
- Reworked Y’s flat, the corridor, Mr. Long’s flat, Grandma Ros’s kitchen,
  Ben’s flat, the workshop, community centre, kopitiam, provision shop, hawker
  centre, and prayer hall with patterned floors, contact shadows, depth-aware
  furniture, and resident-specific details.
- Replaced the single squash animation with directional two-frame walking,
  larger contact shadows, a camera deadzone, and desktop zoom. Reduced motion
  keeps a static directional frame.
- Removed the movement vector allocation from every frame. Proximity checks now
  use squared distances at a 50 ms cadence. Static exterior quadrants remain
  baked, prop/character textures are generated once, and only one full-size
  interior backdrop is retained.
- Extended the existing 60-check production harness without increasing its
  headline count: it now instantiates all 12 locations and profiles 120 frames
  while the avatar moves through the completed, consequence-heavy estate.
- Captured and human-reviewed the resulting production screenshots, including
  a ten-image interior/landmark gallery under `docs/screenshots/locations/`.

**Verified before documentation:**

- Full repository gate passed: strict typecheck; 75/75 unit tests; production
  build; 0 known vulnerabilities; 60/60 production-browser checks.
- Build output: 64.37 kB initial JavaScript (21.12 kB gzip) and 1,524.50 kB
  lazy campaign/Phaser scene (353.39 kB gzip). Vite’s standard 500 kB warning
  remains.
- Active Canvas2D movement in headless Chrome measured 8.30 ms average, 9.20 ms
  p95, and 9.30 ms worst across the sampled frames.
- The final documented-state gate also passed 60/60 with all 12 locations;
  that active sample measured 8.33 ms average, 10.10 ms p95, and 10.40 ms
  worst. Documentation reports the observed p95 range rather than presenting
  one machine run as a universal benchmark.
- `graphify update .` rebuilt the local code graph to 859 nodes, 1,444 edges,
  and 47 communities; `graphify explain "campaignArt"` resolves the new art
  module and its scene/type relationships. Graphify warned that the saved
  community labels predate the new community set; no LLM label refresh was run.

**Claim boundary:**

- The connected in-app browser was unavailable, so production Chrome/CDP and
  captured screenshots were used.
- No image-generation tool or external game asset was used. All in-game art
  remains code-drawn; documentation screenshots are not shipped game assets.
- No real-device, older-hardware, 200%-zoom, or screen-reader pass occurred.
  The frame sample is a regression signal on this machine, not proof of
  equivalence to Stardew Valley or performance on a phone.
- No push or deployment occurred.

## 2026-08-03 - Living Estate and Throttled Runtime Continuation

**Tool:** Codex (GPT-5), working under human direction.

**Implemented:**

- Added deterministic resident blink textures and schedules. The nearest
  resident turns toward the player; reduced motion keeps static frames.
- Added progressive HDB window lights (two per completed chapter), reduced the
  muddy full-screen evening multiply, and kept interaction cues above the
  lighting layer.
- Added the missing visual ending payoff: in free exploration the eight
  residents gather at the void deck around a shared table and string lights.
  Their sprites, shadows, interaction coordinates, and markers move together,
  so the gathering remains physically interactive rather than decorative.
- Cleared per-room NPC/marker references on scene restart, removing stale
  display-object references between interiors.
- Repeated the 120-frame active-movement profile under a 4× Chrome DevTools CPU
  throttle and folded it into the existing final smoke assertion.

**Interim verification:**

- Strict TypeScript passed.
- Production build passed: 64.37 kB initial JavaScript (21.12 kB gzip);
  1,526.74 kB lazy scene (354.14 kB gzip).
- The all-location full/demo smoke remained 60/60. Normal active movement
  measured 10.10 ms p95; the 4× CPU-throttled sample measured 9.80 ms p95.
  The near-identical result indicates this machine still had ample CPU
  headroom; it is not presented as a phone benchmark.
- `graphify update .` rebuilt the local code graph to 864 nodes, 1,456 edges,
  and 48 communities; the new `moveNpcTo()` relationships resolve from the
  gathering path. Saved semantic community labels were not refreshed.

**Claim boundary:** No real device, external asset, image-generation tool,
backend, network service, runtime model, or deployment was used.

## 2026-08-03 - Directional Resident Life and Motion Evidence

**Tool:** Codex (GPT-5), working under human direction.

**Implemented:**

- Rebuilt all 12 resident texture sets as original code-drawn down, up, and
  side-facing frames, with two walk poses and a deterministic blink pose for
  each facing. Existing build, skin-tone, hair, glasses, cane, and apron
  distinctions remain.
- Added short authored loops for the eight exterior residents. Route timing and
  speed derive deterministically from stable NPC IDs; no runtime randomness,
  generated text, network request, or new asset is involved.
- Residents pause when the player is within interaction range, face the player,
  and resume their route without closing any dialogue or quest path. Reduced
  motion keeps residents at static home frames with blinking disabled.
- Kept sprite, contact shadow, NPC interaction coordinates, and non-colour
  marker coordinates synchronized on every route step. The ending gathering
  still freezes residents in its authored void-deck arrangement.
- Added a `?smoke=1`-only read-only motion snapshot. The normal game does not
  create this hook. The production harness uses it to prove position changes,
  nearby stop/facing, directional texture selection, and marker synchronization
  while retaining the existing 60-check headline.
- Added a separate 120-frame resident-route pacing sample and a
  `10-living-estate.png` capture. Regenerated the ten-location gallery with the
  new texture set.

**Verified:**

- The complete repository gate passed: strict typecheck; 75/75 unit tests;
  production build; 0 known vulnerabilities; 60/60 production-browser checks.
- Build output is 64.55 kB initial JavaScript (21.18 kB gzip) and 1,530.68 kB
  lazy campaign/Phaser scene (355.50 kB gzip). Vite's existing 500 kB advisory
  remains.
- In the first full-gate run, seven residents changed position while nearby
  Uncle Ravi stopped and faced the player; all eight markers stayed
  synchronized. Resident and active-player samples both measured 10.30 ms p95;
  the 4× CPU-throttled active sample measured 10.00 ms p95.
- The location-gallery repeat also passed 60/60. Resident routes measured
  10.10 ms p95, active player movement measured 10.00 ms p95, and the 4×
  throttled sample measured 9.60 ms p95.
- The documented-state repository gate passed again after the log and Graphify
  updates: 75/75 unit tests, the same build sizes, 0 vulnerabilities, and
  60/60 smoke checks. That run measured 9.60 ms resident-route p95, 9.80 ms
  active-player p95, and 10.20 ms under the 4× CPU throttle.
- Human visual inspection covered the living-estate capture plus refreshed
  Grandma Ros kitchen, workshop, community-centre, kopitiam, and provision-shop
  captures. No sprite clipping, depth, silhouette, or room-layout regression
  was observed.
- `graphify update .` rebuilt the local graph to 879 nodes, 1,494 edges, and 50
  communities. `graphify explain "updateNpcLife"` and
  `graphify explain "getMotionSnapshot"` resolve the new runtime and smoke
  relationships. Graphify retained one fail-closed node whose source left its
  scan corpus and warned that 48 saved semantic labels predate the 50-community
  set; no LLM relabel was run.

**Claim boundary:**

- The connected in-app browser reported `Browser is not available: iab`, so
  the existing production Chrome/CDP harness and captured PNGs were used.
- This was not a human playtest, real-device touch run, 200%-zoom inspection,
  reduced-motion inspection, screen-reader pass, or comparison against Stardew
  Valley on equivalent hardware. The measurements are regression signals on
  this machine, not a cross-game performance claim.
- No image-generation tool, external asset, backend, analytics, data
  collection, runtime model, dependency, push, or deployment was used.

## 2026-08-03 - Living Environment and Reduced-Motion Evidence

**Tool:** Codex (GPT-5), working under human direction.

**Goal:** Continue moving the original exploration layer toward the requested
high-density, lively top-down-game standard without copying another game's art
or compromising the visual-novel layer, frame budget, or reduced-motion
contract.

**Implemented:**

- Added 23 hand-placed flower/ground clusters to the four baked exterior
  textures. They add composed colour and terrain variation with no new
  per-frame draw calls.
- Added seven original code-drawn HDB laundry lines with two deterministic
  breeze frames, distributed across the estate facades.
- Added two original code-drawn community cats with two walk frames, contact
  shadows, y-derived depth, short authored routes, and deterministic pauses.
- Kept the cats decorative: no quest, data, score, timer, failure condition, or
  inaccessible required interaction was introduced.
- Disabled cat routes and laundry frame changes under
  `prefers-reduced-motion: reduce`; baked flowers remain static.
- Extended the `?smoke=1` read-only snapshot with ambient actors and a
  monotonic laundry animation tick. The normal game still does not create the
  debug hook.
- Extended the existing final smoke assertion without changing the 60-check
  headline: both cats must move, laundry must advance, and a separate
  reduced-motion demo run must keep residents, cats, and laundry still.

**Verification and correction history:**

- The first full gate passed typecheck, 75/75 tests, build, audit, and every
  gameplay path, but reported 59/60 smoke checks because the initial laundry
  assertion compared only its starting and ending frame. Laundry advanced an
  even number of times and returned to the same frame, producing a false
  failure. No gameplay or performance failure occurred.
- Replaced that brittle assertion with the monotonic animation tick and reran
  the complete gate. Final result: strict typecheck passed; 75/75 unit tests;
  production build passed; 0 known vulnerabilities; 60/60 production-browser
  checks.
- Final build output: 64.55 kB initial JavaScript (21.18 kB gzip) and
  1,535.46 kB lazy campaign/Phaser scene (357.00 kB gzip). The living
  environment added about 1.5 kB gzip over the resident-life baseline. Vite's
  existing 500 kB advisory remains.
- The passing run proved seven far residents and both cats changed position,
  nearby Uncle Ravi remained attentive, all resident markers stayed
  synchronized, and laundry advanced. The reduced-motion run proved residents,
  cats, and laundry stayed still.
- Passing Canvas2D samples measured 10.30 ms resident/ambient-route p95,
  10.00 ms active-player p95, and 10.10 ms p95 under a 4× CPU throttle.
- Human visual inspection of `docs/screenshots/10-living-estate.png` confirmed
  the flowers, cat, and laundry read at gameplay scale without clipping,
  hiding windows, or obscuring interaction cues.
- `graphify update .` rebuilt the local graph to 890 nodes, 1,516 edges, and 50
  communities. `graphify explain "updateAmbientLife"` and
  `graphify explain "createAmbientTextures"` resolve the new scene/art
  relationships. Graphify retained one fail-closed node and warned that saved
  semantic labels predate the current community structure; no LLM relabel was
  run.

**Claim boundary:**

- The connected in-app browser again reported that it was unavailable, so the
  repository's production Chrome/CDP harness and generated screenshot were
  used.
- The reduced-motion result is automated emulation, not a human vestibular
  review. No real-device, 200%-zoom, human screen-reader, older-hardware,
  consented playtest, or same-hardware comparison against Stardew Valley
  occurred.
- No image-generation tool, external game asset, backend, runtime model,
  dependency, analytics, data collection, push, or deployment was used.

## 2026-08-03 - East/South Districts, Exterior Wake Fix, and Calibrated Profiling

**Tool:** Codex (GPT-5), working under human direction.

**Implemented:**

- Added original code-drawn district props: a hawker tray-return station,
  stacked provision crates, a mosaic dragon playground, and an exercise corner.
  Each uses project palette ramps, contact shadows, y-derived depth, and an
  authored collision base.
- Extended smoke capture with actual Shift+arrow travel from the NW estate to
  the east and then south. No debug teleport is used. The resulting
  `11-estate-east.png` and `12-estate-south.png` captures prove the distant
  districts render at gameplay scale.
- The first physical-capture run exposed a pre-existing wake defect: after the
  interior gallery, the slept estate could retain its black fade, disabled
  controls, and previous area label. Added `resumeFromSleep()` to restore
  position, consequences, camera effects, area announcement, ready callback,
  and controls. Added an idempotent 360 ms transition fallback for a missed
  fade-complete event.
- Added permanent smoke evidence for the fix: the estate area label must update,
  a Canvas sample must contain at least 12 distinct colours, and keyboard
  movement must physically reach x≥1900 east and y≥1000 in the intended
  southern band.
- Added Chrome anti-background-throttling flags without disabling vsync or the
  browser frame-rate limit.
- Reworked the frame profiler to collect a same-run title-screen scheduler
  baseline and Chrome `TaskDuration`/`ScriptDuration`. Fixed cadence budgets
  remain 28 ms normally and 34 ms under 4× CPU throttling. Only when the title
  baseline is itself slower may game cadence use baseline p95 +3 ms;
  main-thread task work remains capped at 8 ms/frame normally and 20 ms/frame
  throttled.
- Active profiling now alternates movement for the entire 120-frame sample,
  instead of moving for a fixed 1.64 seconds and potentially sampling idle
  frames on a scheduler-capped host.

**Verification and correction history:**

- The initial district-capture gate reported 59/60: it completed both campaigns
  and produced the screenshots, but showed the black/stale exterior wake and a
  host-wide 30 Hz rAF cadence. After the wake fix, east/south travel succeeded,
  but the fixed p95 gate still reported 59/60 because title and game were both
  scheduler-capped near 30 Hz.
- Adding only standard anti-background-throttling flags did not change the
  cadence. This ruled out the common headless-background explanation without
  uncapping the renderer or relaxing product budgets.
- The calibrated final gate passed: strict typecheck; 75/75 unit tests;
  production build; 0 known vulnerabilities; 60/60 production-browser checks.
- Final build output: 64.55 kB initial JavaScript (21.17 kB gzip) and
  1,538.46 kB lazy campaign/Phaser scene (357.84 kB gzip). Vite's existing
  500 kB advisory remains.
- On the documented run the machine was at 14% battery with unrelated editor
  processes consuming substantial CPU. Chrome's title-screen baseline measured
  33.40 ms median / 34.80 ms p95. Resident/ambient motion measured 34.80 ms
  p95; active game measured 35.00 ms p95—0.20 ms behind title—with
  2.97 ms/frame main-thread work. Under 4× CPU throttling, active p95 remained
  35.00 ms with 9.99 ms/frame main-thread work.
- The final collision-aware travel route reached east at approximately
  `(2242, 400)`, aligned through an unobstructed x≈1880 north/south lane, then
  shifted only after passing the collision bases to finish south at
  `(1718, 1184)`. The x/y assertion proves physical traversal; no debug
  teleport is used.
- Human visual inspection confirmed the east capture clearly shows the
  provision shop, crates, bicycles, laundry, tables, foliage, flowers, and
  community cat. The final south capture clearly frames the mosaic dragon,
  exercise equipment, community centre, paths, and player without clipping the
  two district props.
- One documented-state attempt stalled at the CDP transport layer while the
  demo campaign visibly waited on an available Ben dialogue choice. The game
  remained responsive, but the idle controller produced no report; that
  disposable Node/Chrome/preview session was terminated, its child processes
  were confirmed gone, and the run was not counted as verification.
- The subsequent clean full gate passed strict typecheck, all 75 unit tests,
  production build, 0 known vulnerabilities, and all 60 browser checks. Its
  title-screen scheduler measured 8.30 ms median / 9.20 ms p95; resident routes
  measured 9.20 ms p95; active movement measured 17.10 ms p95 with
  2.87 ms/frame main-thread work; and the 4× CPU-throttled sample measured
  9.30 ms p95 with 6.54 ms/frame main-thread work.
- `graphify update .` rebuilt the local graph to 891 nodes, 1,521 edges, and 51
  communities. A final update after the capture-route change detected no code
  topology changes, so those outputs remained untouched.
  `graphify explain "resumeFromSleep"` resolves the wake path. Graphify retained
  one fail-closed node and warned that saved semantic labels predate the current
  community set; no LLM relabel was run.

**Claim boundary:**

- Baseline calibration distinguishes browser scheduling from game main-thread
  work; it is not a claim that 30 Hz equals 60 Hz or that the game matches
  Stardew Valley on equivalent hardware.
- The in-app browser remained unavailable. No real-device, AC-power comparison,
  older-hardware run, human playtest, 200%-zoom pass, or screen-reader pass
  occurred.
- No copied art, image-generation tool, external game asset, backend, runtime
  model, dependency, analytics, data collection, push, or deployment was used.

## 2026-08-03 - Baked Terrain Grammar and Texture Evidence

**Tool:** Codex (GPT-5), working under human direction.

**Implemented:**

- Audited the current production captures against the requested
  Stardew-like-in-density goal. Frame pacing was already within budget; the
  clearest remaining gap was broad, flat grass and walkway surfaces.
- Added an original deterministic 32 px terrain grammar in
  `campaignArt.ts`: clustered grass patches and tufts, running-bond concrete
  and sheltered-walk pavers, highlighted/shaded kerbs, drain grates, and
  utility covers. The four 1280×800 exterior quadrants still bake once at scene
  creation, so the detail adds no per-frame Graphics work and ships no image
  asset.
- Added generated-texture evidence to the smoke-only motion snapshot. The
  production harness now samples actual pixels from the baked NW texture and
  requires minimum grass/path colour variation plus structural path-edge
  transitions; it does not trust a feature flag or version string.
- Kept the decorative micro-texture non-semantic. Interaction markers,
  outlined path boundaries, location labels, nearby prompts, and Journal
  equivalents remain the accessible cues.

**Verification and correction history:**

- The first complete gate finished both campaigns and all performance samples
  but reported 59/60 because the initial evidence window covered only a short,
  unusually uniform stretch of path (3 colours / 4 transitions). The refreshed
  screenshot showed the full paver system correctly; the measurement was
  strengthened to sample the entire 1280 px path rather than lowering its
  thresholds.
- The subsequent full gate passed strict typecheck, all 75 unit tests,
  production build, 0 known vulnerabilities, and all 60 browser checks.
- Final build output: 64.55 kB initial JavaScript (21.18 kB gzip) and
  1,540.89 kB lazy campaign/Phaser scene (358.77 kB gzip). Vite's existing
  500 kB advisory remains.
- Actual generated-texture evidence measured 11 grass colours, 16 path
  colours, and 27 path-edge transitions.
- The same production run measured 9.00 ms title-screen p95, 9.10 ms
  resident-route p95, 9.20 ms active-movement p95 with 2.54 ms/frame
  main-thread work, and 9.20 ms p95 under a 4× CPU throttle with
  6.25 ms/frame main-thread work.
- Human visual inspection of `10-living-estate.png`, `11-estate-east.png`, and
  `12-estate-south.png` confirmed the grammar carries across NW, east and south
  views without quadrant seams, prop clipping, or obscured interaction cues.
- `graphify update .` rebuilt the local graph to 896 nodes, 1,533 edges, and 51
  communities. `graphify explain "paintEstateTerrain"` resolves its import and
  call path. Graphify retained one fail-closed node and warned that saved
  semantic labels predate the current community hubs; no LLM relabel was run.

**Claim boundary:**

- This moves the game materially toward tile-scale environmental density; it
  is not a claim of visual or performance equivalence to Stardew Valley.
- The connected in-app browser was unavailable, so the repository's production
  Chrome/CDP harness and generated screenshots were used.
- No copied art, image-generation tool, external asset, new dependency,
  backend, runtime model, analytics, data collection, real-device test,
  same-hardware cross-game benchmark, push, or deployment was used.

## 2026-08-03 - World-First Journal Drawer and Responsive Game Framing

**Tool:** Codex (GPT-5), working under human direction.

**Implemented:**

- Audited the title/HUD and production gameplay states against the requested
  cozy-game presentation goal. The permanent 310 px desktop Journal column
  made the experience read as a dashboard and reduced the world. It also hid
  the Journal's Close button on desktop, so opening the Journal could disable
  movement and focus a visually hidden control.
- Rebuilt the Journal as an on-request right-side modal drawer at every
  viewport width. It now has a dimming backdrop, labelled dialog semantics,
  accurate `aria-hidden` and `aria-expanded` state, an inert closed state,
  inert world while open, initial Close-button focus, wrapped keyboard focus,
  Escape/backdrop dismissal, and world-focus restoration.
- Let the exterior occupy the full wide game shell and centred the more
  intimate interiors in a 1085 px shell. Location changes explicitly resize
  the Phaser scale and every active camera viewport after the CSS shell
  changes, preserving complete edge rendering in both directions.
- Extended the existing 60-check production harness without inflating its
  headline count. It now opens the real Journal before using Journal actions,
  proves the modal/focus contract, samples actual pixels at room and exterior
  edges, and enters gameplay at 360 px to verify touch controls, 48 px targets,
  overflow, and the 328 px drawer.
- Replaced the district capture's timing-only key holds with conservative
  live-position correction. This makes travel evidence independent of host
  scheduling while still moving through the real collision world.

**Verification and correction history:**

- The first drawer implementation passed 60/60, but human inspection of
  `02-neighbourhood.png` found a blank beige strip beside Y's Flat. A passive
  scale refresh did not resize the Canvas internals; the new edge-pixel check
  correctly failed that intermediate run. Explicit scale and camera resizing
  fixed the strip.
- The next run rendered the interior correctly but finished at 59/60 after a
  timing-only movement hold overshot under host scheduling and the player hit
  a real bench. The snapshot-guided travel helper then reached the east and
  south capture coordinates reliably without bypassing collision.
- A clean full gate passed strict typecheck, all 75 unit tests, production
  build, 0 known vulnerabilities, and all 60 browser checks. The run measured
  9.10 ms title p95, 9.20 ms resident-route p95, 9.20 ms active p95 with
  2.83 ms/frame main-thread work, and 9.10 ms p95 under 4× CPU throttle with
  8.83 ms/frame work. Terrain evidence remained 11 grass colours, 16 path
  colours, and 27 path-edge transitions.
- Build output was 65.18 kB initial JavaScript (21.41 kB gzip) and 1,540.89 kB
  lazy campaign/Phaser code (358.77 kB gzip). Vite's existing 500 kB advisory
  remains.
- Human visual inspection of `02-neighbourhood.png`,
  `04-dialogue.png`, `10-living-estate.png`, `13-journal-drawer.png`,
  `14-mobile-game.png`, and `15-mobile-journal.png` confirmed centred room
  framing, a full-width estate, retained visual-novel presentation, readable
  desktop drawer, and usable 360 px world/Journal layouts. A final small mobile
  header spacing adjustment followed that evidence run.
- `graphify update .` rebuilt the local graph to 899 nodes, 1,539 edges, and
  52 communities. A refresh after the final interface CSS change detected no
  code-graph topology change. Graphify retained one fail-closed node and
  warned that saved semantic labels predate the current community set; no LLM
  relabel was run.

**Claim boundary:**

- This materially improves world prominence, responsive framing, and
  regression evidence; it is not proof of visual or performance equivalence
  to Stardew Valley.
- The connected in-app browser was unavailable, so the repository's production
  Chrome/CDP harness and generated screenshots were used.
- No copied art, image-generation tool, external asset, new dependency,
  backend, runtime model, analytics, data collection, real-device test,
  same-hardware cross-game benchmark, push, or deployment was used.

## 2026-08-03 - Tropical Landscape, Path Edge, and Tree-Depth Pass

**Tool:** Codex (GPT-5), working under human direction.

**Implemented:**

- Compared current production captures with the density and community-world
  benchmark represented by the official Stardew Valley press materials. The
  implementation uses no Stardew asset, palette, map, character, or copied
  composition; the observed gap was Kampung SG's broad unplanted path edges and
  flat tree silhouettes.
- Deepened the original grass ramp and baked deterministic grass fringe, sparse
  leaf litter, and additional edge variation into the existing four 1280×800
  exterior textures. This adds no per-frame terrain drawing.
- Rebuilt all three original tropical tree textures. Rain trees, palms, and
  frangipani now have stepped silhouettes, visible trunks/branches, layered
  light and shade, contact shade, and sheared cast shadows.
- Added four reusable code-drawn landscape forms—shrub, flower bed, pandan
  clump, and hedge—and placed 41 of them along building and walkway edges.
  Every base has a matching collision body, with deliberate gaps at doors,
  crossings, and the full east/south travel route.
- Extended the existing combined production check to inspect the generated
  landscape textures and actual instantiated sprite count. The check requires
  at least 40 placed objects, all four forms, and 12 foliage colours alongside
  the existing terrain-pixel, collision-travel, and frame-budget evidence.

**Verification:**

- The first complete production gate passed strict typecheck, all 75 unit
  tests, production build, 0 known vulnerabilities, and all 60 browser checks.
- Generated evidence measured 11 grass colours, 26 path colours, 27 path-edge
  transitions, 41 placed landscape objects, four generated forms, and 44
  foliage colours.
- The run measured 9.20 ms title p95, 9.10 ms resident-route p95, 9.20 ms
  active-movement p95 with 2.63 ms/frame main-thread work, and 9.10 ms p95
  under 4× CPU throttle with 7.76 ms/frame work.
- Build output was 65.18 kB initial JavaScript (21.41 kB gzip) and 1,548.15 kB
  lazy campaign/Phaser code (361.08 kB gzip). The landscape/tree pass added
  2.31 kB gzip to the lazy scene and nothing to the initial JavaScript.
- Human visual inspection of `10-living-estate.png`, `11-estate-east.png`, and
  `12-estate-south.png` confirmed planted HDB thresholds, denser table and
  landmark edges, layered tree forms, directional shadows, and unobscured
  prompts. The physical production route reached east `(2239, 400)` and south
  `(1719, 1180)`.
- `graphify update .` rebuilt the local graph to 905 nodes, 1,555 edges, and 51
  communities. Graphify retained one fail-closed node and warned that the
  saved labels predate the changed community set; no LLM relabel was run.

**Claim boundary:**

- This is concrete progress toward a dense, handcrafted cozy pixel-RPG world;
  it is not proof of visual or performance equivalence to Stardew Valley.
- The connected in-app browser was unavailable, so the repository's production
  Chrome/CDP harness and generated screenshots were used.
- No copied art, image-generation tool, external asset, new dependency,
  backend, runtime model, analytics, data collection, real-device test,
  same-hardware cross-game benchmark, push, or deployment was used.

## 2026-08-03 - Exterior Landmark Identity and Building Solidity Pass

**Tool:** Codex (GPT-5), working under human direction.

**Implemented:**

- Audited production captures and the exterior scene. The enterable locations
  existed, but several exterior fronts still read as generic blocks, some
  visual thresholds did not align with their runtime doors, and only the HDB
  mass had a building-scale collision shell.
- Added a reusable 3×5 code-drawn glyph system for compact baked signs.
- Rebuilt the north-east row as three distinct landmarks: an open-bay Hawker
  Centre, awning-and-counter Kopitiam, and stocked provision shop for Minah.
- Rebuilt the south-east Community Centre and Prayer Hall fronts, added Block
  12 as a background HDB façade, and drew the previously missing exterior
  Workshop with sawtooth roof, timber panels, glazing, tool rack, and aligned
  entrance.
- Added 12 building collision rectangles with deliberate gaps at usable
  thresholds. Combined with existing landscape and prop collision, the exterior
  now exposes 76 obstacle bodies.
- Extended the existing combined production check to sample a generated
  façade's colour count, edge transitions, and dark-value ratio; count live
  obstacle bodies; and physically move the player into the Minah storefront.
  Added `16-landmark-facades.png` and `17-workshop-facade.png` as focused
  production captures.

**Corrections found during verification:**

- The first strict typecheck found that the sign helper's default foreground
  had inferred one numeric colour literal. The parameter was explicitly typed
  as `number`; typecheck and all 75 unit tests then passed.
- The first full gate passed. Visual inspection then found the Community sign's
  final letters behind the runtime OPEN badge, so the baked sign was shifted
  left.
- The next smoke run completed 28 checks before the new workshop capture route
  hit the genuine exercise-corner collider at `x=1515`. This was correct game
  solidity, not a scene defect. The evidence route was moved north through open
  ground before travelling west, and the complete gate passed.

**Verified evidence:**

- Strict typecheck passed; 75/75 unit tests passed; the production build passed;
  `npm audit` reported 0 vulnerabilities; and all 60 production-browser checks
  passed.
- Build output was 65.18 kB initial JavaScript (21.41 kB gzip) and 1,554.93 kB
  lazy campaign/Phaser code (363.23 kB gzip). The façade pass added 2.15 kB
  gzip to the lazy scene and nothing to initial JavaScript.
- The generated façade sample contained 55 colours, 218 edge transitions, and
  26.1% dark pixels. All 76 obstacle bodies instantiated. A real northward
  movement started at `(2095, 400)` and stopped outside the solid storefront at
  `(2095, 253)`; the existing keyboard routes still reached east and south.
- That passing run measured 9.10 ms title p95, 9.20 ms resident-route p95,
  9.20 ms active-movement p95 with 2.33 ms/frame main-thread work, and 9.20 ms
  p95 under 4× CPU throttle with 7.22 ms/frame work.
- Human visual inspection of `16-landmark-facades.png`,
  `12-estate-south.png`, and `17-workshop-facade.png` confirmed separate
  silhouettes/materials, readable baked names, aligned runtime doors, and the
  corrected Community sign placement.
- `graphify update .` rebuilt the local graph to 910 nodes, 1,566 edges, and 51
  communities. Graphify retained one fail-closed node and warned that 11
  community hubs changed names while saved labels were retained; no LLM relabel
  was run.

**Claim boundary:**

- This materially improves landmark legibility and world solidity; it is not
  proof of visual or performance equivalence to Stardew Valley.
- The connected in-app browser was unavailable, so the repository's production
  Chrome/CDP harness and generated screenshots were used.
- No copied art, image-generation tool, external game asset, new dependency,
  backend, runtime model, network call, analytics, data collection, real-device
  test, same-hardware cross-game benchmark, push, or deployment was used.

## 2026-08-03 - Visual-Novel Portrait and Responsive Dialogue Pass

**Tool:** Codex (GPT-5), working under human direction.

**Implemented:**

- Inspected the freshly generated world and dialogue captures. Environmental
  density and landmark identity had improved, but the unique visual-novel mode
  still presented every speaker through the same 74 px generic head icon.
- Added `campaignPortrait.ts`, a pure code-drawn SVG portrait registry covering
  all 13 NPC IDs. Each definition has authored skin, shirt, backdrop, build,
  hair treatment, age-line level, accessory, accent and community-role motif.
  Place and object narration uses a separate estate/HDB panel instead of
  borrowing a resident's face.
- Rebuilt dialogue as a 940 px desktop visual-novel stage with a large portrait
  beside the script. At 360 px, the 88×120 px portrait sits beside the speaker
  heading while the full dialogue, choices and controls span the card below.
- Kept portraits `aria-hidden`. The existing semantic speaker heading,
  complete-line live region, progress text, choices, focus trap, and Close
  behavior remain the authoritative accessible experience.
- Added portrait-registry and generated-detail assertions to an existing
  campaign test without inflating the 75-test headline.
- Strengthened the existing 60-check production harness without inflating its
  headline. It now verifies desktop card/portrait dimensions and primitive
  count, Mr. Long's stable ID/cane/side-part traits, responsive mobile fit, and
  captures `18-mobile-dialogue.png` plus `19-mr-long-portrait.png`.

**Verification and visual review:**

- Strict typecheck and all 75 unit tests passed. Two complete production smoke
  runs passed all 60 checks; `npm audit` reported 0 vulnerabilities.
- The final pre-documentation evidence run rendered the Voice at 238×325 px
  with 41 code-drawn primitives inside a 940 px card. The mobile composition
  rendered at 88×120 px without horizontal or viewport overflow.
- Human inspection of `04-dialogue.png`, `18-mobile-dialogue.png`, and
  `19-mr-long-portrait.png` confirmed balanced desktop and mobile staging,
  readable type, unobscured controls, and Mr. Long's distinct side-part, age
  lines, ramp motif, shirt, and cane.
- Build output was 77.63 kB initial JavaScript (24.04 kB gzip) and 1,554.93 kB
  lazy campaign/Phaser code (363.23 kB gzip). The portrait system added
  2.63 kB gzip to initial JavaScript; the lazy scene was unchanged.
- That evidence run measured 8.80 ms title p95, 8.90 ms resident-route p95,
  9.20 ms active-movement p95 with 2.26 ms/frame main-thread work, and 9.10 ms
  p95 under 4× CPU throttle with 7.43 ms/frame work.
- `graphify update .` rebuilt the local graph to 922 nodes, 1,589 edges, and 51
  communities. Graphify retained one fail-closed node and warned that 17
  community hubs changed names while saved labels were retained; no LLM relabel
  was run.

**Claim boundary:**

- This materially strengthens the project's visual-novel identity; it is not
  proof of visual or performance equivalence to Stardew Valley.
- The connected in-app browser was unavailable, so the repository's production
  Chrome/CDP harness and generated screenshots were used.
- No copied art, image-generation tool, external game asset, new dependency,
  backend, runtime model, network call, analytics, data collection, real-device
  test, same-hardware cross-game benchmark, push, or deployment was used.

## 2026-08-03 - Exterior Camera Scale, Pond Life, and Movement Feedback

**Tool:** Codex (GPT-5), working under human direction.

**Implemented:**

- Reviewed the production captures and motion snapshots after the portrait
  pass. The code-drawn world had gained density and landmark identity, but its
  wide exterior framing still made resident and prop detail read smaller than
  the close dialogue presentation. The current pond had also lost the ripple
  life present in the superseded scene.
- Added exterior-only responsive camera framing: 1.32× at widths of 1180 px or
  more, 1.22× from 760–1179 px, and 1× below 760 px. Interiors retain their
  existing 1.12× desktop and 1× mobile composition. A single queued
  request-animation-frame resize path now updates the Phaser renderer and
  active camera together after viewport or location-shell changes.
- Rebuilt the baked pond with a deep shadow, outlined kerb, layered water,
  highlights, lily pads and flowers. Two structural collision rectangles keep
  its silhouette solid without closing the surrounding route.
- Restored three deterministic pond rings with manual phase updates rather than
  unbounded tweens. Reduced motion keeps the rings at a static phase.
- Added a six-object pool of short player walking puffs. The scene reuses those
  objects instead of allocating on each step; reduced motion emits none.
- Expanded the existing smoke snapshots with camera zoom, visible-puff count,
  ripple count and ripple phase. The production journey now physically walks to
  `21-pond-life.png`, captures `20-world-scale-motion.png` during movement, and
  proves mobile zoom separately. The longer physical route exposed a harness
  boundary case where the twelfth movement landed inside tolerance but was not
  rechecked; the helper now accepts that final valid snapshot.

**Verification and visual review:**

- Strict typecheck and all 75 unit tests passed in stage verification.
  `npm audit` reported 0 vulnerabilities. A complete production-browser run
  passed all 60 checks after the evidence route and tolerance correction.
- Build output was 77.68 kB initial JavaScript (24.06 kB gzip) and 1,557.59 kB
  lazy campaign/Phaser code (363.97 kB gzip), a 0.02 kB initial-gzip and
  0.74 kB lazy-gzip increase over the portrait pass.
- The passing run exposed 1.32× wide-desktop exterior zoom, 1× mobile zoom, two
  visible pooled puffs, three pond rings, animated normal pond phase, static
  reduced-motion phase, zero reduced-motion puffs, and 78 obstacle bodies.
- It measured 9.00 ms title p95, 8.90 ms resident-route p95, and 9.10 ms active
  p95 with 2.43 ms/frame main-thread work. The 4× CPU-throttled sample measured
  9.20 ms p95 with 8.18 ms/frame work.
- Human inspection of `10-living-estate.png`, `11-estate-east.png`,
  `12-estate-south.png`, `14-mobile-game.png`, `20-world-scale-motion.png`, and
  `21-pond-life.png` confirmed a materially closer readable exterior, intact
  mobile composition, open east/south framing, layered pond art, and
  unobscured prompts and controls.
- `graphify update .` rebuilt the local graph to 933 nodes, 1,610 edges, and 50
  communities. Graphify retained one fail-closed node and warned that 51 saved
  labels now cover 50 communities after 17 hub-name changes; no LLM relabel was
  run.

**Claim boundary:**

- This materially improves world readability and movement ambience; it is not
  proof of visual or performance equivalence to Stardew Valley.
- The connected in-app browser was unavailable, so the repository's production
  Chrome/CDP harness and generated screenshots were used.
- No copied art, image-generation tool, external game asset, new dependency,
  backend, runtime model, network call, analytics, data collection, real-device
  test, same-hardware cross-game benchmark, push, or deployment was used.

## 2026-08-03 - Chapter 2 Monsoon and Sheltered-Route Atmosphere

**Tool:** Codex (GPT-5), working under human direction.

**Reference review:**

- Reviewed the official Stardew Valley press-kit screenshots only as a
  composition benchmark for readable weather, ground response, shelter
  contrast, and environmental activity. Reference files were downloaded to a
  temporary directory outside the repository and were not copied, traced,
  transformed, or shipped.
- The connected in-app browser was unavailable, so visual verification used
  the repository's production Chrome/CDP harness and its generated screenshots.

**Implemented:**

- Added a deterministic Chapter 2 tropical monsoon to the existing estate
  rather than introducing a random weather loop, timer, penalty, or separate
  map. A fixed 64-object pool renders angled screen-space streaks without
  allocating game objects per frame.
- Added wet bands to the four main path spines, ten layered puddles with
  manually phased ripple rings, a cool multiply tint, light haze, and warm
  shelter glows.
- Added world-coordinate shelter masking for the original void-deck shelter
  and Mdm Siti's restored route. Rain stays outside both covered regions.
- Previously helped Aunty Mei, Uncle Ravi, and Mdm Siti gather under the
  original shelter. Both deterministic community cats move under cover and
  pause; all seven HDB laundry lines are stored for the chapter.
- Reduced motion retains wet surfaces, overcast colour, shelter light,
  residents, cats, and stored laundry while hiding falling rain and freezing
  puddle phase. Narrow screens cull one third of the decorative rain pool.
- Extended the existing 60-check smoke headline with weather snapshots,
  shelter/cat/resident/laundry assertions, desktop and 360 px captures, a
  reduced-motion capture, and a separate 120-frame monsoon pacing sample.

**Corrections found during verification:**

- The first physical evidence route approached at `x=550` and correctly hit
  shelter-side landscaping at `y=611`. The harness now takes an open east-path
  route before returning to the capture point; it still uses real keyboard
  movement and no teleport.
- Once rain snapshots stored their true world coordinates, the initial mobile
  assertion exposed that two large dry masks plus a one-half mobile cull made
  the narrow view too sparse. The cull was changed to one third. The passing
  capture exposes 23 visible streaks without obscuring controls.
- One unchanged smoke retry failed before opening the game because Chrome did
  not expose its debugging endpoint. Port/process checks found no listener;
  the next unchanged launch connected and completed normally.

**Verification and visual review:**

- Strict TypeScript passed through the production smoke build; all 75 unit
  tests passed; the production build completed; `npm audit` reported 0
  vulnerabilities; and the complete production-browser run passed all 60
  checks.
- Build output was 77.68 kB initial JavaScript (24.06 kB gzip) and 1,563.49 kB
  lazy campaign/Phaser code (365.74 kB gzip).
- The passing run exposed the fixed 64-streak pool, 50 visible desktop streaks,
  23 visible 360 px streaks, ten puddle rings, zero visible rain under dry
  shelter, all three helped residents and both cats under cover, and zero
  visible laundry lines. The reduced-motion repeat exposed zero falling rain,
  a static puddle phase, sheltered residents/cats, and stored laundry.
- It measured 10.00 ms title p95, 9.80 ms resident-route p95, 10.10 ms monsoon
  p95, and 10.20 ms active-movement p95 with 2.32 ms/frame main-thread work.
  The 4× CPU-throttled sample measured 9.70 ms p95 with 6.68 ms/frame work.
- Human inspection of `22-monsoon-shelter.png`, `23-mobile-monsoon.png`, and
  `24-reduced-monsoon.png` confirmed readable dry-cover contrast, a dense but
  unobtrusive mobile storm, legible HUD/touch controls, and a static wet
  reduced-motion alternative.
- `graphify update .` rebuilt the local graph to 938 nodes, 1,624 edges, and
  55 communities. Graphify retained one fail-closed node and warned that 50
  saved labels trail the changed 55-community topology; no LLM relabel was run.

**Claim boundary:**

- This materially improves weather atmosphere, ground response, and community
  staging toward the requested cozy pixel-RPG quality bar; it is not proof of
  visual or performance equivalence to Stardew Valley.
- The frame samples are automated regression evidence on this host, not a
  real-device or same-hardware cross-game benchmark.
- No copied art, image-generation tool, external game asset, shipped raster
  asset, new dependency, backend, runtime model, analytics, data collection,
  real-device test, push, or deployment was used.

## 2026-08-03 - Four-Frame Estate Detail and AI Visual-Direction Pass

**Tools:** Codex (GPT-5), working under human direction, plus one real call to
the Codex built-in OpenAI image-generation tool.

**Context and intent:**

- The user revised `AGENTS.md` to encourage AI models and generated visual
  assets, asked the agent to read those Markdown changes, and explicitly
  approved broad in-scope action.
- The existing code-drawn game was already coherent, so the image-generation
  call was used as a visual-direction review rather than as an unreviewed
  replacement layer.
- The connected in-app browser was unavailable. Visual verification used the
  repository's production Chrome/CDP harness and generated screenshots.

**Locomotion and interaction-density work:**

- Expanded the player and every named resident from two walk phases to four
  distinct down/up/side phases. Side frames continue to flip for left/right;
  reduced motion continues to use one static directional pose.
- Added 14 authored, zero-consequence estate details covering shared bicycles,
  bench, pond, garden labels, tray return, kopitiam tables, provision crates,
  playground, exercise corner, community bench, Block 12 bicycles, prayer-hall
  garden, workshop timber, and sheltered link.
- Low-priority detail markers remain fully hidden until approach, when exactly
  one non-colour ring, icon, label, nearby prompt, and contextual `Look` action
  appears. `E`, Space, desktop, and touch use the existing accessible dialogue
  path.
- The production harness physically walks to the shared bicycles, opens the
  narration with `E`, checks the complete screen-reader line and estate
  portrait, repeats the open card at 360 px, and samples all four player and
  resident walk frames.

**Actual OpenAI image-generation run:**

- Input reference 1:
  `docs/screenshots/10-living-estate.png` (current playable composition and
  game-scale reference).
- Input reference 2: `docs/art/key-art.jpeg` (project mood, HDB detail, and
  palette reference).
- Exact prompt: `docs/prompts/openai-neighbourhood-style-key.txt`.
- Accepted output:
  `docs/art/openai-neighbourhood-style-key.png` (1672×941 PNG). The built-in
  tool returned generation directory
  `019fc528-83b8-7b32-82b1-b1953071e6b8` and call artifact
  `call_N9nyMaksEVA3ZKG8xesDw7uf.png`; the reviewed copy is stored in the repo.
- Accepted ideas: clear HDB/void-deck context, sheltered links, clustered
  shared props, readable circulation, and residents visibly gardening,
  sweeping, talking, and gathering.
- Rejected for direct runtime use: the richer painterly texture and generated
  pseudo-marks on noticeboard paper did not match the deterministic code-drawn
  scene or its accessibility contract.
- Curated result: four original two-frame code-drawn vignettes now show a
  void-deck sweeper, neighbours discussing the noticeboard, an older garden
  steward tending a bed, and kopitiam regulars in conversation. Reduced motion
  holds their first frame. Chapter 2 stores all four activity scenes during the
  monsoon while the named residents and cats gather under cover.

**Verification and visual review:**

- Strict TypeScript passed; all 75 unit tests passed; the production build
  completed; `npm audit` reported 0 vulnerabilities; and all 60
  production-browser checks passed.
- Build output was 80.99 kB initial JavaScript (25.23 kB gzip) and 1,569.90 kB
  lazy campaign/Phaser code (367.37 kB gzip).
- The passing browser run found all four player frames, all four activity IDs
  with both frames, and five moving residents with all four walk phases in the
  sample. It proved 14 flavour details, one visible marker on physical
  approach, both moving cats, animated laundry/pond, four static activity
  vignettes under reduced motion, and zero visible activities during normal and
  reduced-motion monsoon states.
- The same run measured 10.30 ms title p95, 10.20 ms resident-route p95,
  9.50 ms monsoon p95, and 9.30 ms active-movement p95 with 3.06 ms/frame
  main-thread work. The 4× CPU-throttled sample measured 9.20 ms p95 with
  8.12 ms/frame work.
- The monsoon exposed 57 visible desktop and 22 visible 360 px streaks while
  retaining ten puddle rings, dry shelter masks, helped residents/cats under
  cover, and stored activities/laundry.
- Human visual inspection of `10-living-estate.png`,
  `25-estate-detail.png`, `26-mobile-estate-detail.png`, and
  `27-ambient-micro-scenes.png` confirmed legible four-vignette silhouettes,
  unobscured movement and interaction routes, and an in-bounds mobile
  narration card.
- Refreshed the eight-slide judge deck from `docs/deck/index.html`. The final
  PPTX preserves the inherited one-image-per-slide template, updates Slide 5
  with the generated target and curated playable result, updates Slide 6 to
  the current 75 tests / 60 checks / 81 kB evidence, and adds the exact
  OpenAI/human-review boundary to Slide 5 speaker notes.
- The artifact-tool template-plan and fidelity checks both passed with zero
  issues; `slides_test.py` found no overflow. Package inspection found one
  picture and zero slide-layer placeholders on each of eight slides. The PDF
  companion was rebuilt from the same reviewed frames, confirmed as eight
  1280×720 pages with project metadata and no form or JavaScript content, then
  rendered to PNGs and visually inspected as a full montage.
- `graphify update .` rebuilt the local graph to 949 nodes, 1,651 edges, and
  54 communities. It retained one fail-closed node and reported that saved
  community labels trail the changed topology; no LLM relabel run was claimed.

**Claim boundary:**

- This is genuine OpenAI image-generation usage with preserved provenance and
  a verified human-curated implementation. It is not Miora and is not labelled
  as Miora.
- The generated style key is a development/deck artifact; the current playable
  scene remains code-drawn by review choice, not because generated assets are
  forbidden.
- This materially improves authored activity and movement readability toward
  the requested cozy pixel-RPG quality bar. It is not proof of visual or
  performance equivalence to Stardew Valley.
- No copied third-party art, new dependency, backend, runtime model, network
  call during play, analytics, data collection, human playtest, real-device
  test, same-hardware cross-game benchmark, push, or deployment was used.

## 2026-08-03 - OpenAI Estate-Density Study and Curated Story-Cluster Pass

**Tools:** Codex (GPT-5), working under human direction, plus one real call to
the Codex built-in OpenAI image-generation tool.

**Why AI image generation was used:**

- The user explicitly asked agents not to avoid AI use and approved broad
  in-scope work.
- The current exterior was already playable and stylistically coherent, so the
  call targeted one remaining visual problem: making open estate pockets feel
  lived in without obscuring door approaches or the main movement axes.
- The image was requested as a design study for human translation into
  deterministic Phaser geometry, not as an automatic runtime replacement.

**Actual OpenAI image-generation run:**

- Input reference 1: `docs/screenshots/10-living-estate.png`.
- Input reference 2: `docs/screenshots/11-estate-east.png`.
- Input reference 3: `docs/screenshots/12-estate-south.png`.
- Exact prompt and full review:
  `docs/prompts/openai-estate-density-reference.txt`.
- Reviewed output: `docs/art/openai-estate-density-reference.png`
  (1668×943 RGB PNG; SHA-256
  `8f003dc4e82e2cb80cd4a810303fc373e0452ed2c93ba07f6763da1b45bd807b`).
- The built-in tool returned generation directory
  `019fc528-83b8-7b32-82b1-b1953071e6b8` and call artifact
  `call_ThYraMEFppLfA4EGJiQuUtGf.png`; the reviewed repository copy preserves
  the result.
- Accepted ideas: grouping density into story clusters; stone chess seating;
  bicycles framed by planters; a maintenance trolley; utility box/hose/drain;
  stacked community chairs beside a noticeboard; shaded seating; small drain,
  leaf, butterfly, and dragonfly accents; and obvious clear travel lanes.
- Rejected for direct runtime use: richer sprite/foliage detail than the
  established Canvas language, pseudo-writing, residents that did not match
  authored silhouettes, and a flat raster that could not preserve collision or
  chapter-persistent state.
- This was an OpenAI run, not Miora. No Miora output is claimed.

**Curated code-drawn implementation:**

- Added six original composite prop textures: chess seating, bicycle planters,
  maintenance trolley, utility service point, stacked chairs, and shaded
  seating.
- Placed those forms in 12 y-depth-sorted, collision-aware story clusters.
- Baked 26 drain grates and 28 leaf patches into the four exterior textures so
  the extra ground detail adds no per-frame game objects.
- Added eight deterministic butterflies/dragonflies using three two-frame
  texture families and fixed authored orbits. They allocate no objects per
  frame, hold a static base pose under reduced motion, and hide during the
  Chapter 2 monsoon.
- Expanded smoke-only snapshots and the existing 60-check browser assertion
  with exterior prop/form counts, story-cluster counts, ground accents,
  obstacle bodies, two-frame insect motion, reduced-motion stillness, monsoon
  storage, and frame-budget evidence without inflating the headline.

**Corrections found by the production journey:**

- The first complete browser run found the maintenance trolley at `(820, 520)`
  directly blocked the real shelter approach; it was moved to `(900, 520)`.
- The next run found the utility cluster at `(1350, 520)` encroached on a
  second north–south evidence route; it was moved to `(1160, 520)`.
- These were genuine collision regressions found through keyboard travel, not
  ignored or bypassed. The third complete run traversed the full and demo
  campaigns, east and south districts, weather routes, and reload flows.

**Verification and visual review:**

- Strict TypeScript passed; all 75 unit tests passed; the production build
  completed; `npm audit` reported 0 vulnerabilities; and all 60
  production-browser checks passed.
- Build output was 80.99 kB initial JavaScript (25.23 kB gzip) and 1,580.13 kB
  lazy campaign/Phaser code (369.96 kB gzip).
- The passing snapshot found 88 exterior props across 22 texture forms, 12
  story clusters across all six new forms, 54 baked drain/leaf accents, and 90
  obstacle bodies.
- All eight ambient insects moved by at least two pixels during the sample and
  exposed both authored frames. The reduced-motion run kept all eight visible
  and still at frame zero; normal and reduced-motion monsoon runs stored them.
- Existing evidence remained green: 11 grass colours, 26 path colours, 27 path
  transitions, 41 landscaping placements across four forms and 44 foliage
  colours, 55 façade colours, 218 façade edges, 26.1% dark façade pixels, all
  12 locations, all chapter/save/demo flows, 14 approach-only details, four
  community activity vignettes, cats, laundry, pond, weather, mobile layout,
  focus behavior, and physical storefront/district travel.
- The density-evidence run measured 9.90 ms title p95, 10.00 ms resident-route
  p95, 9.80 ms monsoon p95, and 10.10 ms active-movement p95 with
  3.60 ms/frame main-thread work. The 4× CPU-throttled sample measured
  10.00 ms p95 with 8.10 ms/frame work.
- Human inspection of refreshed `10-living-estate.png`,
  `11-estate-east.png`, `12-estate-south.png`, and
  `27-ambient-micro-scenes.png` confirmed readable prop silhouettes, lived-in
  clusters, unobscured travel lanes and door approaches, and intact prompts.

**Claim boundary:**

- The generated raster stays in `docs/art/`; it is not copied into `public/`
  or shipped in the game. The playable translation remains original,
  deterministic code-drawn art by review choice.
- This materially improves environmental storytelling and density toward the
  requested cozy pixel-RPG quality bar. It is not proof of visual or
  performance equivalence to Stardew Valley.
- No copied third-party art, new dependency, backend, runtime model, network
  call during play, analytics, data collection, human playtest, real-device
  test, same-hardware cross-game benchmark, deck refresh, push, or deployment
  was used in this pass.

## 2026-08-03 - Exterior Spatial-Logic Correction

**AI-assisted audit:**

- The user reported a bicycle appearing inside a building and a bus crossing a
  garden. Codex inspected the current scene geometry, prop registries, generated
  texture code, and production smoke captures for the Block 9, east, south,
  workshop, pond, and ambient-life districts.
- The audit confirmed two concrete world-logic errors: the Block 9 bicycle
  overlapped its lobby composition, and the Block 12 rack was anchored inside
  the Block 12 visual footprint. It also confirmed that the campaign estate has
  pedestrian paving and garden verges but no vehicular road, while an inherited
  bus actor still travelled across world `y=1420`.
- The in-app browser was unavailable in this session. Visual review therefore
  used the repository's real production-browser captures and newly rendered
  smoke screenshots. No image-generation run was needed: the correction was
  spatial and remained in the project's code-drawn visual language.

**Curated implementation:**

- Added `src/game/estateLayout.ts` as the single source for exterior building
  visual bounds, pedestrian spines, three bicycle locations, bicycle-bay and
  collision dimensions, and the road/vehicle registries.
- Moved the Block 9, provision-shop, and Block 12 bicycles onto three marked
  outdoor verge bays and synchronized both bicycle narration markers with the
  same registry coordinates.
- Made every bicycle rack physically solid. The estate now exposes 93 obstacle
  bodies while preserving the complete east, south, shelter, and chapter paths.
- Removed the old bus spawn logic and its unused generated texture. The
  roadless map now explicitly has zero motor-vehicle lanes and zero motor
  routes.
- Folded the pure spatial audit into the existing campaign registry test
  without inflating the 75-test headline. It rejects bicycle bays outside the
  world, across any building footprint, or across either pedestrian crossing
  or spine; it also rejects a vehicle route whose points lack a road lane.
- Extended the existing 60-check browser assertion and diagnostics to require
  three bicycle bays, zero motor vehicles, and zero layout issues. Added a
  dedicated Block 12 bicycle-verge capture to the production journey.
- During the same session, the user asked for buildings to soften when the
  player walks behind them. Added eight cropped foreground copies of the baked
  façades, y-sorted at each building's base. The duplicate is pixel-identical
  at rest; while it covers the player it eases to 28% alpha over 180 ms, then
  restores to full opacity after departure.
- Kept doors, laundry, lit windows, and string lights above those crops so
  labels and interaction cues stay crisp. Reduced motion skips the tween and
  applies the same visibility state instantly.
- Extended the existing spatial registry assertions with all eight occlusion
  zones. Browser evidence now requires all eight runtime layers, a real fade at
  the provision-shop collision, full restoration after stepping away, and the
  instant reduced-motion mode.

**Verification and corrections found:**

- Strict TypeScript and all 75 unit tests passed. The production build completed
  at 83.33 kB initial JavaScript (26.08 kB gzip) and 1,581.58 kB lazy
  campaign/Phaser code (370.58 kB gzip). `npm audit` reported 0
  vulnerabilities.
- The first production-browser run passed its first 19 checks, then correctly
  stopped when the harness tried to walk through the newly solid Block 9
  bicycle bay. The harness route was changed to walk around the bay rather than
  weakening collision.
- The next complete production-browser journey passed 60/60 across the full
  and demo campaigns. Its semantic snapshot reported three bicycle bays, zero
  motor vehicles, zero layout issues, 93 obstacles, open east/south travel, and
  an intact physical storefront stop.
- The first occlusion-enabled journey passed fade and restoration evidence,
  then stopped only because the new south-verge camera requested `y=1510`
  beyond the character's natural world-bound stop at `y=1486`. The capture
  target was corrected to accept that physical boundary; no collision was
  weakened.
- The next complete journey passed 60/60. It reported eight occlusion layers,
  `faded=true`, `restored=true`, and `occlusion-instant=true` under reduced
  motion while retaining all campaign, mobile, weather, travel, and pacing
  checks.
- Human inspection of refreshed `10-living-estate.png`,
  `11-estate-east.png`, `12-estate-south.png`, and
  `17-workshop-facade.png` confirmed that the Block 9 and provision-shop racks
  read as outdoor parking and that no bicycle remains embedded in the Block 12
  façade. Inspection of `28-block-twelve-bicycle-verge.png` confirmed the
  relocated south bay, and `29-building-occlusion.png` confirmed that the
  player remains readable through Minah's softened storefront while its sign
  and door stay crisp.

**Claim boundary:**

- This was a code and rendered-layout review, not a human playtest or
  real-device session. No new dependency, generated runtime image, copied art,
  backend, runtime model, analytics, data collection, push, or deployment had
  occurred at the time of this log entry.

**Judge-artifact synchronization:**

- Codex refreshed the HTML deck captures after the verified build-size change,
  then used the repository's existing PowerPoint as the required visual
  template. The source audit found eight blank-layout slides, each containing
  one inherited full-slide raster and preserved speaker notes.
- The first template-plan validation rejected ambiguous bare PowerPoint shape
  numbers. Codex corrected the frame map to the inspected inherited image IDs;
  the validated plan then passed with zero issues.
- The first artifact-tool preview exposed a 4x retina/native-size mismatch that
  zoomed the replacement rasters. Codex normalized the captures to 1280x720 in
  external scratch space, re-exported through the inherited image frames, and
  preserved their placement, crop, fit, geometry, rotation, and notes.
- Template fidelity passed with zero issues, the PowerPoint overflow test
  passed, and all eight final slide renders were visually inspected. Slide 6
  now shows the current rounded 83 kB initial-JavaScript figure; the other
  slides retain the established composition.
- Codex regenerated the matching eight-page PDF from the verified slide
  renders. Poppler reported eight 1280x720 pages with no encryption or
  JavaScript, and a rendered montage was visually checked for clipping,
  overlap, broken glyphs, page-order, footer, and slide-number defects.
- This artifact pass used the presentation/PDF tooling already available to
  Codex plus temporary `uv` environments for validation dependencies. It added
  no project dependency and did not add a runtime image, backend, network call,
  analytics, data collection, or generated in-game art.

## 2026-08-03 - Circular Map, Quest Journal, and Room-Fit Camera

**AI-assisted implementation:**

- The user asked Codex to add a circular map, reshape the Journal into a
  Genshin-inspired quest presentation, and make interiors feel more spacious
  because the camera cropped the rooms.
- Added `src/game/estateMap.ts`, a pure projection layer for the 2560×1600
  estate. Seven authored landmark anchors correspond to the real exterior
  doorways; all four Block 9 homes resolve to the corridor building; the
  outdoor player marker follows the live scene position.
- Added a code-drawn circular SVG map to the world HUD. It highlights the
  current indoor landmark, labels the current place, includes tracked-quest
  context in its accessible button name, and opens that place in the Journal.
  No raster, generated image, network request, or location data is used.
- Added `src/game/journal.ts`, a pure campaign-to-Journal view model. Story,
  Requests, People, and Places now render as four keyboard-operable tabs with a
  selected entry, status, objective checklist, threshold-aware progress,
  optional tracking, and existing equivalent completion actions. Locked future
  chapters remain spoiler-free.
- Rebuilt the modal as a wide two-pane quest book on desktop and a stacked
  full-screen view at 360 px. The existing inert background, focus trap,
  Escape/backdrop dismissal, focus restoration, visible Close action, 48 px
  controls, and Journal-only campaign route were preserved.
- Reworked the shared camera layout to use both viewport dimensions and
  balanced world margins. Every 960×640 room now fits the available desktop
  canvas at up to 1.08×; narrow phones retain a 0.56× readability floor while
  exposing substantially more of the room. The exterior retains its existing
  1.32×/1.22×/1× framing.
- Folded map and Journal registry assertions into the existing campaign test
  count. Extended the existing 60-check production journey with seven-anchor
  map evidence, physical east-to-south marker movement, current-place
  highlighting, room-fit geometry, four-tab keyboard movement, selected quest
  objectives/progress, tracking state, focus wrapping, and 360 px stacked
  layout evidence.

**Verification and visual review:**

- The complete repository gate passed: strict TypeScript, 75/75 unit tests,
  production build, 0 dependency vulnerabilities, and 60/60
  production-browser checks across full and demo campaigns.
- Build output is 94.75 kB initial JavaScript (29.37 kB gzip) and 1,582.14 kB
  lazy campaign/Phaser code (370.77 kB gzip).
- The browser reported a 1413 px full-width room shell, a fitting 1.04×
  desktop room camera, a 0.56× mobile room camera, seven map landmarks, one
  current indoor landmark, and live marker movement from
  `translate(81.00 28.27)` east to `translate(65.72 70.21)` south.
- The same journey verified four Journal tabs, arrow-key category switching,
  two visible prologue objectives, quest tracking, focus wrapping, no
  horizontal overflow, and a 360 px map/Journal/dialogue composition with no
  sub-48 px visible buttons.
- Human inspection of `02-neighbourhood.png`, `11-estate-east.png`,
  `13-journal-drawer.png`, `14-mobile-game.png`, and
  `15-mobile-journal.png` confirmed that the map stays clear of play controls,
  the desktop quest book has a readable list/detail hierarchy, the mobile
  Journal stacks cleanly, and rooms are centred rather than cut against a
  canvas edge.
- Graphify rebuilt locally to 1,036 nodes, 1,850 edges, and 59 communities. It
  retained the existing one fail-closed node and warned that 54 saved labels
  trail the changed topology; no semantic relabel was claimed.

**Judge-artifact synchronization:**

- Updated the HTML deck and mirrored deck copy with the circular-map/quest
  Journal evidence and the current rounded 95 kB initial-JavaScript figure.
- Refreshed all eight 1280×720 slide captures from the verified production
  screenshots, normalized the 2× browser captures to the deck's native frame,
  and used the existing PPTX as the required visual template.
- Artifact-tool replacement preserved the inherited full-slide frames and
  speaker notes. Template fidelity passed with zero issues, the PowerPoint
  overflow check passed, and all eight rendered slides were visually inspected.
- Regenerated the matching eight-page PDF from those verified renders.
  Poppler was not installed in this environment, so PyMuPDF confirmed eight
  unencrypted 1280×720 pages and rendered the montage used for visual review.
  No project dependency was added.

**Claim boundary:**

- This was AI-assisted code authoring, automated production-browser evidence,
  and human inspection of rendered captures. It was not a human playtest,
  screen-reader session, 200% zoom pass, or real-device touch test.
- No runtime model, backend, account, analytics, data collection, timer,
  failure state, energy system, copied art, or new shipped image asset was
  introduced. No deployment had occurred at the time of this log entry.

## 2026-08-04 - Player Guide, Audited Entrances, and Fullscreen Controls

**AI-assisted implementation:**

- The user asked Codex to make the main character easier to find with a
  downward-pointing triangle, realign the exterior estate doors, repair the
  Sound-button focus loss that stopped WASD movement, and make gameplay fill
  the screen while keeping Sound and volume controls reachable after Escape.
- Added a persistent code-drawn player guide to the shared walkable-scene
  foundation. Its ink, cream, and gold downward triangle follows the player in
  every exterior and interior location, stays above the sprite at a fixed HUD
  depth, bobs subtly in normal motion, and remains still under reduced motion.
- Centralized all seven exterior entrances in `estateLayout.ts`, including
  their façade owner, interaction point, threshold, placard, and target
  location. Fourteen building collision zones now share those doorway gaps.
  The layout audit rejects duplicate destinations, doors outside their visual
  building, missing threshold alignment, or collision shells that block an
  entrance.
- Moved the Block 9 lobby entrance onto its painted threshold and removed the
  overlapping void-deck column. Rebuilt the hawker frontage around a centred
  glazed `ENTRY`; aligned the provision shop, community centre, prayer hall,
  and workshop interactions with their code-drawn doors.
- The Sound button now returns focus to the game stage on the next task, so
  keyboard movement resumes immediately. Added a browser-fullscreen control
  and a start-time fullscreen attempt from the initiating user gesture.
  Fullscreen targets the document element so dialogue and Journal overlays
  remain visible; Escape exits fullscreen, disables stray movement, focuses
  Sound, and announces that Sound and Journal controls are available.
- Added compact but fully labelled top-bar controls so Sound, Expand, Journal,
  and Title remain visible at desktop and 360 px widths. The first refreshed
  screenshot exposed desktop clipping after adding the fourth button; Codex
  corrected the responsive labels and repeated the complete browser journey.
- Extended the existing campaign registry test without inflating the count.
  The existing 60-check smoke journey now verifies the guide's position and
  depth, Sound focus restoration plus real movement, fullscreen entry geometry,
  Escape exit state, and post-exit Sound focus.

**Verification and visual review:**

- The complete repository gate passed: strict TypeScript, all 75 unit tests,
  the production build, `npm audit` with 0 vulnerabilities, and all 60
  production-browser checks across the full and accelerated-demo campaigns.
- The current build is 98.71 kB initial JavaScript (30.42 kB gzip) and
  1,581.99 kB lazy campaign/Phaser code (370.64 kB gzip).
- Browser evidence reported
  `sound-focus={"focus":true,"movement":true,"guide":true}` and
  `fullscreen={"control":true,"entered":true,"exited":true}`. It also found
  seven aligned entrance destinations, 14 building collision zones, 95 total
  obstacle bodies, 56 façade colours, 226 façade edges, 25.4% dark pixels, and
  zero layout issues.
- Codex visually inspected the refreshed desktop, 360 px, hawker/kopitiam, and
  south-estate captures. The triangle is clear without covering the character;
  all four mobile controls fit; the bicycle remains on its outdoor rack; and
  the visible estate doors meet their façade thresholds.
- The in-app Browser connector was unavailable in this session
  (`Browser is not available: iab`). Codex therefore used the repository's
  self-contained production Chrome journey and its captured evidence instead
  of claiming an in-app-browser pass.
- Graphify rebuilt locally to 1,041 nodes, 1,868 edges, and 59 communities. It
  retained the existing one fail-closed node and reported 24 hub-based
  community renames; no semantic relabel was claimed.

**Judge-artifact synchronization:**

- Recaptured all eight HTML deck slides after the responsive correction, then
  replaced only the inherited full-slide images in the existing PowerPoint
  template. The artifact-tool export retained eight slides and all eight
  speaker-note records.
- Template fidelity passed with zero issues and the PowerPoint overflow test
  passed. Codex visually inspected the full eight-slide montage.
- Regenerated the matching PDF from the verified final slide renders. PyMuPDF
  confirmed eight unencrypted 1280x720 pages with the intended title, author,
  and subject metadata; the rendered PDF montage was visually inspected.

**Claim boundary:**

- This was AI-assisted implementation, automated production-browser evidence,
  and human inspection of rendered captures. It was not a human playtest,
  screen-reader session, 200% zoom pass, or real-device touch test.
- No runtime model, backend, account, analytics, data collection, timer,
  failure state, energy system, copied art, or new shipped in-game image asset
  was introduced. No deployment had occurred at the time of this entry.

## 2026-08-04 - Control-Clarity Deployment and Notion Reconciliation

**Deployment:**

- Codex committed the verified implementation as `e8601b4` under the required
  `ming3465` repository identity and pushed it to `main` with the user's
  explicit deployment authorization.
- GitHub Actions run
  [30870964882](https://github.com/ming3465/Tencent-Hackathon-9Aug/actions/runs/30870964882)
  completed both build and deploy jobs successfully. GitHub Pages returned
  HTTP 200 with a 2026-08-04 last-modified response; the served HTML exposed
  `btn-fullscreen`, and the served initial JavaScript exposed
  `requestFullscreen`, `fullscreen-active`, and the fullscreen control ID.
- The deployed game is
  [https://ming3465.github.io/Tencent-Hackathon-9Aug/](https://ming3465.github.io/Tencent-Hackathon-9Aug/);
  the full judge path remains the documented `?demo=1` URL.

**Todo Tencent reconciliation:**

- Codex fetched the live `Todo Tencent` schema and audited all 20 existing
  cards before changing status. The genuine Miora/nanobanana/refract pass,
  submission media, consented playtests, older-hardware profiling, manual
  accessibility/real-device work, and Actions-runtime maintenance remain open;
  no unfinished work was relabelled as complete.
- The shipped Genshin-inspired quest-display card moved from `In progress` to
  `Done`, with its map, bottom objective prompt, Journal tracking, 360 px
  evidence, and 2026-08-04 end date recorded.
- The existing fullscreen card remained `Done` but was corrected from generic
  room-fit wording to the actual browser-fullscreen, Escape, Sound-focus,
  Music/Effects, commit, workflow, and live-build evidence.
- Added four completed cards: main-character guide marker; audited/re-aligned
  estate entrances; restored WASD focus after Sound; and the deployed
  player-guide/control-clarity release.
- The verified final board count is 18 `Done`, 2 `In progress`, and 4
  `Not started [bugs/feat]`.

**Claim boundary:**

- This records repository deployment and connected-workspace task maintenance.
  It does not add or imply a playtest, real-device check, social outcome,
  external AI-tool run, or runtime AI feature.

## 2026-08-04 - Tactile Exploration and Surface-Audio Pass

**AI-assisted direction and implementation:**

- The user asked Codex to continue raising the exploration layer toward a
  Stardew-like quality bar while preserving Kampung SG's visual-novel
  conversations. Codex treated that reference as a standard for readable,
  tactile top-down movement—not permission to copy another game's assets,
  palette, map, characters, progression, or branding.
- Codex inspected the current production captures and broad public screenshot
  references for movement readability, environmental density, and character
  grounding. The existing original code-drawn art direction was retained; no
  reference image or generated bitmap was added to the game.
- Added a pure movement-feel module that mirrors the baked estate terrain
  grammar and classifies grass, estate paving, and indoor floors without pixel
  reads. Normal movement uses a 125 ms four-frame cadence; Shift hurry and
  accelerated demo movement use 92 ms. Unit assertions were folded into the
  existing 75-test headline.
- Added deterministic player idle blinks and made the player face the nearest
  NPC, door, exit, quest object, or flavour detail before the interaction
  opens. Reduced motion keeps a static directional frame and disables the idle
  blink.
- Replaced the generic walking circle with six reusable effect slots. Each
  slot owns one dust shape and two flecks; grass, paving, and indoor variants
  change colour and lift while remaining pooled and hidden under reduced
  motion. The player shadow changes width subtly across the walk cadence.
- Added three matching Web Audio footstep profiles. They share one
  deterministic noise buffer generated at audio unlock rather than allocating
  a new buffer on every step. The previously unused interaction cue now plays,
  line advance no longer repeats the overlay-open blip, UI tones bypass
  reverb, and the global send was reduced.

**Automated evidence and corrections:**

- Extended the existing 60-check production-browser journey without increasing
  its headline. It now proves all four player walk frames, a real idle blink,
  player-to-interaction facing, live grass and paving effects, and the absence
  of player blink/walking effects under emulated reduced motion.
- The first sandboxed smoke attempt could not bind Vite to localhost; Codex
  reran the same self-contained journey with approved local-browser access.
- Production journeys exposed two evidence-route assumptions. A monsoon route
  landed on either edge of a narrow prop gap, so Codex measured the player
  body and centred it in the authored 46 px opening between a frangipani trunk
  and flower bed. A new lawn capture initially stepped sideways into existing
  planting/bench collision lines; it was changed to move down open grass before
  returning along the already verified x=350 route. One overly broad patch
  briefly changed a Journal ArrowLeft sample; the next run caught the tracking
  failure, and Codex restored the key before the final journey.
- Repeated final repository gates passed strict TypeScript, all 75 unit tests, the
  production build, `npm audit` with zero vulnerabilities, and 60/60 browser
  checks across the complete full campaign,
  accelerated demo, persistence, all 12 locations, desktop, 360 px mobile,
  reduced motion, monsoon, collision, focus, fullscreen, and visual-novel
  states. One recorded passing gate measured 9.10 ms title p95, 9.10 ms
  resident-route p95, 9.30 ms monsoon p95, and 9.20 ms active-movement p95
  with 2.40 ms/frame main-thread work. Its 4× CPU-throttled active sample
  measured 9.30 ms p95 with 9.57 ms/frame work.
- The production bundle is 99.63 kB initial JavaScript (30.73 kB gzip) and
  1,585.13 kB lazy campaign/Phaser code (371.50 kB gzip). Codex visually
  inspected the refreshed world-scale, pond/lawn, and 360 px captures; the
  response stays subtle, the player guide remains clear, and the mobile
  composition is not crowded.
- Graphify rebuilt locally to 1,054 nodes, 1,919 edges, and 61 communities. It
  retained the known single fail-closed node and reported that saved semantic
  labels trail the changed topology; no semantic relabel was claimed.

**Claim boundary:**

- This is AI-assisted code authoring, deterministic automated
  production-browser evidence, and human inspection of rendered captures. It
  is not a human playtest, real-device touch test, screen-reader session,
  200%-zoom pass, or same-hardware comparison with Stardew Valley.
- No runtime model, network request, backend, account, analytics, data
  collection, timer, failure state, energy system, copied art, or new shipped
  image asset was introduced.

## 2026-08-04 - Tactile Release Deployment and Todo Tencent Reconciliation

**Deployment:**

- Codex committed the verified implementation as `654ce4b` under the required
  `ming3465` repository identity. The first push attempt was rejected because
  the machine's active HTTPS credential was `ming-precix`; Codex inspected the
  existing authenticated accounts, temporarily switched to the already
  configured `ming3465` account, pushed successfully, and restored the previous
  active account.
- GitHub Actions run
  [30875727660](https://github.com/ming3465/Tencent-Hackathon-9Aug/actions/runs/30875727660)
  completed both build and deploy jobs successfully. The existing Actions
  runtime deprecation annotation remains visible and is still tracked as open;
  it did not fail this release.
- The public endpoint returned HTTP 200 with a 2026-08-04 last-modified
  response. It served `index-B4i08O13.js` and
  `campaignScene-ZEj2hhib.js`; the latter exposed the new
  `playerIdleBlinking`, `movementSurface`, `activeStepSurfaces`, and
  `nearbyInteractionPoint` state.
- The deployed game remains
  [https://ming3465.github.io/Tencent-Hackathon-9Aug/](https://ming3465.github.io/Tencent-Hackathon-9Aug/).

**Todo Tencent reconciliation:**

- Codex fetched the live schema and audited all 24 pre-existing cards before
  writing. No unrelated work was moved: the Miora/nanobanana/refract pass and
  submission media remain `In progress`; manual accessibility/real-device QA,
  older-hardware profiling, consented playtests, and Actions-runtime
  maintenance remain `Not started`.
- Added three completed cards with commit, workflow, live-build, and
  verification evidence: tactile surface-aware movement; footsteps and
  interaction-audio polish; and the deployed tactile-exploration release.
- Added one explicit `Not started` follow-up for authored ambient-pad
  voice-leading, the only remaining part of the repository's P2-11 audio item.
- A final database query verified 21 `Done`, 2 `In progress`, and 5
  `Not started [bugs/feat]` cards.

**Claim boundary:**

- This records a repository deployment, public-asset probe, and connected
  project-tracker maintenance. It does not add or imply a human playtest,
  real-device check, screen-reader pass, older-hardware benchmark, Miora run,
  social outcome, or same-hardware comparison with another game.

---

## 2026-08-04 — Cohesive Title, Visual-Novel, Room, Marker, and Audio Pass

**Tools and real generation evidence:**

- A same-day built-in OpenAI image-generation workflow used the current
  `10-living-estate.png` gameplay capture and existing `key-art.jpeg` as
  references for a new title panorama. The exact production prompt is
  preserved in `docs/prompts/openai-title-panorama-v1.txt`.
- The first artifact, `call_lZ0RYqzisrGEG4wbjBSfspRZ.png`, was rejected for
  letter-like pseudo-writing on the noticeboard. It was not copied into the
  repository or shipped.
- A constrained edit changed only those noticeboard papers to non-text flower,
  rain-cloud, bench, and geometric pictograms. The accepted artifact,
  `call_wnOWVi7hlbIWirT1RzxYBLix.png`, became the reviewed 1668×943 source
  `docs/art/openai-kampung-estate-title-v1.png` (SHA-256
  `bfd6317f355a1d4cd78355f87f273f1e3365af12a69d2badb5aced1e267743ff`).
  Its metadata-free 326 kB WebP runtime export has SHA-256
  `90e273330716845242038f76a458e6bda823cab81b93fde14dcb2268f1c86b0f`.
- Human review accepted the HDB, void deck, sheltered link, garden,
  noticeboard, bicycles, warm light, responsive focal cluster, and older
  residents visibly contributing. It rejected generated interface text: the
  title, tagline, controls, and caption remain semantic HTML. This is OpenAI
  evidence, not Miora evidence.

**Curated implementation:**

- Integrated the panorama as a semantic figure with concise alternative text,
  high-priority preload, responsive cropping, slow image drift, eight
  decorative particles, and reduced-motion stillness. Removed roughly 350
  lines of retired CSS-scene clouds, buildings, trees, props, residents, and
  mobile overrides so the replaced illustration no longer ships as dead
  payload.
- Added neutral, thoughtful, and warm expressions to all 13 code-drawn named
  portraits; dialogue position and choice state select the expression while
  complete live-region text continues to carry meaning. Portrait frames and
  nameplates use each authored profile's accent colour.
- In direct response to the user's visual-novel convention request, replaced
  the full-width visible Continue bar with one literal `>` chevron. The
  transparent control remains 52×52, is named “Continue dialogue” for assistive
  technology, keeps a short high-contrast focus underline, supports the
  existing touch/Space path, and stops pulsing under reduced motion.
- Replaced square interaction-label backgrounds with one reusable
  cream/gold/ink code-drawn plate and nearby glow. The Graphics implementation
  remains visible under Canvas2D; smoke-only evidence proves exactly one plate
  is visible for the selected nearby target.
- Reworked reusable room backdrops with player-scale wood planks, tiles and
  carpet courses, deterministic grain/speckle, plaster courses, corner/contact
  shade, side falloff, and warm window shafts. Added deterministic tiny
  wildflowers to the already baked exterior terrain without per-frame work.
- A concurrent final in-world/UI pass increased room colour separation with
  warm rugs and saturated sofas, softened the dialogue panel with a restrained
  glass treatment, and added a subtle world vignette plus nine decorative CSS
  leaves/light motes. These elements do not own game state, ignore pointer
  input, and stop animating under reduced motion. Codex rebuilt and repeated
  the complete journey against the settled combined source before accepting
  the shared evidence.
- Visual inspection found that an in-progress 32% gold multiply flattened the
  whole estate to yellow-green. It was corrected to a chapter-progressive
  3–12% glaze so grass, teal, coral, skin tones, labels, and warm windows retain
  separation.
- Replaced unrelated random ambient notes with deterministic four-chord day
  and evening progressions. Three shared-tone sine voices plus one quiet
  triangle lead move by no more than a perfect fourth across adjacent
  chords; no audio file, runtime model, or network request was added.

**Evidence and corrections:**

- Unit coverage remains 75/75. It now proves three distinct portrait moods and
  the four-step day/evening progressions, including bounded adjacent voice
  motion.
- A complete production-browser journey passed 60/60 across the full campaign,
  demo, persistence, all 12 locations, desktop, 360 px, reduced motion,
  monsoon, fullscreen, focus, and performance profiles. It proved the reviewed
  WebP loaded at 1668×943, portrait expressions changed, the chevron had no
  visible Continue text while retaining its accessible name and target size,
  and the new marker plate followed the selected interaction.
- The in-app Browser was unavailable (`iab`), so Codex used the repository's
  production Chrome/CDP journey and local rendered-image inspection. One
  journey correctly stopped at a solid north-crossing prop while its
  axis-only evidence route tried to walk through it; the route now goes around
  the prop. A later run attached to an older browser because two stale smoke
  processes shared port 9222. Codex terminated only those exact stale test
  processes and repeated the journey in one isolated browser profile. The
  walker now sidesteps when an axis makes no headway, navigation waits on real
  page conditions, evidence captures wait for the complete authored line, and
  every CDP command has a 30-second fail-closed timeout.
- The final frozen-source journey, byte-identical to the deployed runtime,
  measured 9.00 ms title p95, 9.20 ms resident-route p95, 9.20 ms monsoon p95,
  and 9.10 ms active-movement p95 with 3.19 ms/frame main-thread work. The 4×
  CPU-throttled sample measured 9.20 ms p95 with 12.00 ms/frame work. These are
  headless Chrome regression signals, not real-device or cross-game
  benchmarks.
- The current production build is 104.71 kB initial JavaScript (31.97 kB gzip)
  and 1,587.98 kB lazy campaign/Phaser code (372.48 kB gzip). The HTML payload
  is 81.69 kB (14.79 kB gzip) after removing the retired illustration CSS and
  adding the final lightweight world-atmosphere layer.
- Codex visually inspected the desktop title, desktop/mobile Voice dialogue,
  nearest-resident marker, room materials, and evening capture. The first
  dialogue capture exposed the focused chevron's button-like circle; it was
  replaced by the smaller underline treatment. The evening capture drove the
  reduced lighting glaze described above.
- The eight-slide judge deck was refreshed from the final 1280×720 captures.
  Its template plan and final template-fidelity checks reported zero issues,
  the slide overflow test passed, and Codex inspected the complete PPTX and
  rendered eight-page PDF montages. Correcting an accidental 4× deck-capture
  scale reduced the final PPTX/PDF from 20/31 MB to 2.6/2.8 MB without changing
  slide composition.
- `graphify update .` rebuilt the local graph to 1,085 nodes, 1,960 edges, and
  59 communities. It retained the known one fail-closed node, reported one
  zero-node local settings file, and reported that 58 saved labels trail the
  current communities with 13 hub-based renames; no LLM relabelling is
  claimed.
- GitHub Pages workflow `30886434561` completed successfully for commit
  `d4ca458`. A concurrent agent wrote a stale commit subject/body saying that
  the visible Continue label had returned, but it committed the shared tree
  after Codex restored the requested sole `>` cue. Direct production
  inspection confirmed HTTP 200, `aria-label="Continue dialogue"` with only
  `>` visible, the exterior-only atmosphere layer, and the reviewed 333,666
  byte title WebP at
  `https://ming3465.github.io/Tencent-Hackathon-9Aug/`.
- Todo Tencent was re-audited after deployment. Demo moved to Done; authored
  ambient voice-leading moved only to In progress because its own acceptance
  criteria still require human speaker/headphone listening. Four evidence
  cards were added as Done for the OpenAI title panorama, visual-novel
  chevron, room/portrait/lighting/marker polish, and deployed release. Final
  board truth is 26 Done / 3 In progress / 5 Not started. Manual
  accessibility, real-device and older-hardware checks, consented playtests,
  submission, and broader Miora/AI-polish work remain open.
- The rubric release blockers were reconciled to current evidence: public
  deployment and the validated PPTX/PDF are complete, while video/social
  publishing, the named backup package, Miora-specific evidence, and human
  testing remain explicitly open.
- A concurrent untracked `scripts/capture-gameplay.mjs` draft was preserved
  locally but not staged or deployed: its labelled estate beats do not yet
  navigate out of Y's flat. No B-roll or finished-video claim is made.

**Claim boundary:**

- This is a real OpenAI image-generation workflow, Codex-assisted code and
  test authoring, deterministic production-browser evidence, and human review
  of rendered captures. It is not a Miora run, older-adult playtest,
  real-device touch test, screen-reader session, 200% zoom pass, calibrated
  display study, social-outcome measure, or same-hardware comparison with
  Stardew Valley or another game.
- The title panorama is the only new generated runtime raster. The playable
  world, residents, portraits, markers, rooms, weather, lighting consequences,
  and interactions remain original code-drawn systems. No backend, account,
  analytics, personal-data collection, runtime LLM, timer, failure state,
  energy system, copied game asset, or medical claim was introduced.
- The user's cozy three-quarter reference informed only future-facing visual
  direction: taller façades, roof planes, contact shadows, foreground
  occlusion, and dense clear prop lanes. No sprite, layout, text, or trademark
  from that reference was copied, and this pass does not claim a full
  isometric projection rewrite.

## 2026-08-04 — In-World Art Lane: Interiors, Markers, and a Red-Gate Fix

**Tool:** Claude Code (Opus 5), running concurrently with a separate Codex /
CodeBuddy session in the same working tree.

**Concurrency, stated honestly.** Two other agent processes were live in this
directory during this session. Rather than duplicate their work, this session
claimed the in-world art layer and backed out its own portrait edits after
discovering both sessions had independently added a vignette to the same
portrait file within five minutes of each other. The parallel session's commit
`694286c` swept up the interior and marker code from this session along with
its own title/dialogue work; that is recorded here so attribution stays
truthful rather than tidy.

**Interior materials.** Floor panels were 128×32 px against a ~46 px player —
roughly four player-heights per board, which read as masonry rather than
flooring. Replaced with 22 px plank courses of 132–236 px boards, staggered
end joints, deterministic per-board tone and two grain streaks per board.
Tiled floors moved to 46×34 px with grout shading and speckle; carpet pitch
tightened and bordered. Walls gained plaster courses and stepped corner
occlusion; the floor gained a five-band contact shadow at the wall line and
side falloff. The window wedge was a grey shadow polygon drawn where daylight
should fall — it is now a two-layer warm shaft.

**Furniture and rugs.** `addFurnitureBlock` and `addRug` are shared by all
twelve rooms, so both were improved once: a floor contact shadow under every
block, form shading proportional to the object (the fixed 4 px bands inside
`drawPixelBlock` disappear on anything sofa-sized), a panel seam on wide
pieces, and a woven cross-hatch plus banded diamond motif on rugs.

**Markers.** The square white text background behind interaction names was
replaced with a rounded cream nameplate — ink border, gold base, drop shadow —
plus a soft glow ring on the active marker. The first implementation used
`Phaser.GameObjects.NineSlice`, which is **WebGL-only**; this build runs
Canvas2D in headless and on GPU-less machines, so the plate rendered nothing
and the name floated bare on the path. The production capture caught it and it
was rewritten with `Graphics`. The player guide triangle also moved from depth
100_300 to 100_050 so it no longer covers the name it points at.

**A genuinely red gate on `main`.** `walkToAxis` in the smoke harness pushed a
single axis with no way around a solid, so the Chapter 2 travel leg stalled at
`y≈471` and failed depending on where the previous leg left the player. This
was **reproduced on clean `HEAD` in a throwaway `git worktree`** before any fix
was attempted, confirming a pre-existing defect rather than a regression from
this session. The harness now side-steps perpendicular when an attempt makes no
headway.

**Verification.** Run against a privately built and served bundle
(`vite build --outDir` + `python3 -m http.server` + `--url/--shots/--port`) so
it never raced the parallel session's `dist/` or `docs/screenshots/`. Strict
typecheck passed, 75 tests passed, `npm audit` found 0 vulnerabilities, and the
production-browser harness passed **60/60 three consecutive times** after the
route fix — against 2 failures in 4 runs before it, one of those on clean
`HEAD`. Desktop interior, estate, and cropped nameplate captures were visually
inspected at 1:1.

**Claim boundary:**

- Verified by automated production-browser evidence and human inspection of
  rendered captures. No human playtest, real-device or touch-hardware test,
  screen-reader session, older-hardware run, Miora generation, or same-hardware
  comparison with Stardew Valley, Terraria, or any other game is claimed.
- No copied art, shipped raster, backend, account, analytics, personal-data
  collection, runtime LLM, timer, failure state, energy system, or medical
  claim was introduced by this session.
- **2026-08-04** (Antigravity) — Applied Visual Novel UI layer polish. Added frosted glass `backdrop-filter` and warmer radial background to the main dialogue card. Refined portrait entrance animations with a smoother cubic-bezier slide-in curve and bottom-center transform origin. Re-applied text-shadow to dialogue text and enhanced hover interactions on choice buttons. Restored the title screen image overlay `title-art` which had been temporarily lost during CSS restoration. The entire journey was verified to pass 75 tests, 60/60 browser checks, and 0 vulnerabilities without breaking any smoke expectations.
- **2026-08-04** (Antigravity) — Lighting & Atmosphere Enhancement continuation: Added a subtle CSS vignette overlay to the `#world-shell` using a radial gradient to darken the edges and draw focus to the player. Added 9 animated floating ambient particles (dust motes, pollen, leaves) to the game world via CSS that float continuously, enhancing the "golden hour" vibe without impacting Phaser's canvas rendering or performance budgets. Handled accessibility properly by tying the particle animation to `prefers-reduced-motion: reduce`. The implementation ran smoothly, maintaining the p95 ≤28ms limit for frame rendering and passing all 60 smoke checks.

## 2026-08-04 - Shared Exterior Projection-Depth Pass

**Tool:** Codex (GPT-5), working under human direction.

**AI-assisted review and implementation:**

- Codex reviewed the current production façade captures, the centralized
  entrance/collision layout, the projection backlog, and the original
  code-drawn palette. The user's Stardew-like reference was treated as a
  quality bar for readable top-down architecture, not permission to copy its
  sprites, palette, buildings, map, text, systems, or branding.
- Added one geometry-only façade-depth registry keyed to all eight existing
  building visual-zone IDs. It records hipped or sawtooth roof style, roof
  depth/inset/segments, side-face width, and project-palette accent. The estate
  layout audit now rejects missing, duplicate, or invalid projection profiles.
- Added a separate renderer module for roof planes and seams, right-side faces,
  sheared ground contact shadows, and recessed thresholds. The pass is baked
  once into the four existing exterior textures, so it creates no per-frame
  façade objects. Seven usable entrances gain a dark entry bay behind their
  existing door art; Block 12 retains its non-enterable background role.
- Door coordinates, interaction points, collision shells, occlusion crops,
  return positions, and travel lanes were not moved. Existing fade behavior
  therefore applies to the added roof, wall, and entry pixels as one building.
- Extended the existing campaign registry assertion without increasing the
  75-test headline. The 60-check browser gate now requires eight depth
  profiles, seven entry recesses, and both roof styles in addition to its
  façade colour/edge/dark-value and physical collision assertions.
- Image generation was deliberately not used for this step: the target was a
  renderer-native geometry system that must share live building IDs and
  occlusion behavior. The result remains original code-drawn art.

**Rendered evidence and documentation:**

- A private production-browser journey passed 60/60 checks across the full and
  demo campaigns, all locations, 360 px layout, reduced motion, monsoon,
  fullscreen/focus, building collision, and façade fade/restore. It measured
  214 sampled façade colours, 270 horizontal edge transitions, 28.6% dark
  pixels, 95 obstacle bodies, and zero layout issues.
- That passing run measured 9.20 ms title p95, 9.20 ms resident-route p95,
  9.10 ms monsoon p95, 9.00 ms active-movement p95 at 2.68 ms/frame
  main-thread work, and 9.20 ms p95 at 8.52 ms/frame under 4x CPU throttle.
- Codex inspected refreshed landmark, occlusion, workshop, south-estate, and
  360 px renders. Roof silhouettes, entry recesses, signs, player guide,
  interaction prompts, and routes remained readable; no camera or collision
  correction was needed after the render.
- The documented build is 81.69 kB HTML (14.79 kB gzip), 106.23 kB initial
  JavaScript (32.29 kB gzip), and 1,591.09 kB lazy scene code (373.43 kB
  gzip). Current README, design, accessibility, demo, QA, evidence, playbook,
  deck-copy, and backlog figures were synchronized.
- The eight-slide deck was refreshed through its retained artifact-tool
  template/edit workspace. The template plan and fidelity checks reported zero
  issues, all eight 1280x720 slide renders were inspected, and the regenerated
  PDF passed eight-page, 1280x720, unencrypted, title/author/subject, and
  rendered-page checks.
- `graphify update .` rebuilt the local graph to 1,121 nodes, 2,026 edges, and
  61 communities. It retained the known fail-closed node, reported two
  zero-node local JSON files, and warned that 59 saved labels trail the current
  topology; no semantic relabel was claimed.
- During this lane, a separate agent committed gameplay B-roll capture as
  `dfc0fd9`. Codex preserved that commit and the remaining untracked
  `scripts/build-demo-video.mjs` without editing or staging the latter. This
  section makes no authorship, human-play-session, narration, caption, or
  finished-video claim for that concurrent work.

**Claim boundary:**

- This is AI-assisted code authoring, deterministic production-browser
  evidence, and human inspection of rendered captures. It is not a human
  playtest, real-device touch check, screen-reader session, 200%-zoom pass,
  calibrated display study, older-hardware run, or same-hardware comparison
  with Stardew Valley or another game.
- The connected in-app browser was unavailable, so verification used the
  repository's production Chrome/CDP harness and local rendered-image
  inspection.
- No copied or generated runtime raster, new dependency, backend, account,
  analytics, personal-data collection, runtime model, network request, timer,
  failure state, energy system, medical claim, or Miora claim was introduced.

## 2026-08-04 — Reproducible 90-Second Demo Review Cut

**Tool:** Codex (GPT-5), working in the video/evidence lane after the exterior
projection lane stabilized.

**Current-build capture:**

- Regenerated the scripted `?demo=1` gameplay B-roll from the cast-current,
  three-quarter-depth source state instead of reusing the earlier flat-façade
  recording. The current result is 1,262 frames / 63.1 s at 20 fps,
  1280×720 H.264, 5,006,804 bytes, with SHA-256
  `b81ffda1dad51c6ca7efc60dd565191839a5d02eb0abe45a2a54d8ac955d7d6c`.
- `broll-beats.json` records the nine actual screencast beats. Its timings
  shifted from the first capture because `Page.startScreencast` is
  acknowledgement-paced, so the final compositor derives every moving clip
  from named beat labels rather than hard-coded seconds.

**Review-cut compositor and honest edit:**

- Added `scripts/build-demo-video.mjs` and `npm run compose:video`. It validates
  all source files and source-duration bounds, renders high-contrast open
  caption cards through one isolated Chrome/CDP session, cuts named B-roll
  beats with ffmpeg, and probes the result before replacing the target.
- The first implementation used Chrome's one-shot `--screenshot` mode. That
  process remained on its first caption for nine minutes on the installed
  Chrome build; it was stopped by exact PID, the renderer was replaced with
  the repository's proven remote-debugging path, and the next run completed.
  The failed path is not presented as successful tooling.
- The exact 14-beat, 90.0 s edit covers title thesis, Voice dialogue, player
  choice, Mr. Long, the shared corridor, Grandma Ros, Ben and Mr. Tan, living
  estate movement, the new roof/side-face/recessed-door projection evidence,
  free exploration, AI receipts, engineering, claim boundaries, and QR end
  slate. Missing moving story footage is never fabricated: named verified
  production screenshots or judge-deck slides are used and identified.
- `docs/video/demo-review-beats.json` records every start, duration, open
  caption, source type, source file, named B-roll beat, media property, and
  claim boundary. `docs/video/README.md`, the rubric scorecard, and submission
  runbook distinguish the review cut from the final submission.

**Rendered evidence and verification:**

- `kampung-sg-demo-review.mp4` is 4,809,298 bytes, 1280×720 at 30 fps, exactly
  90.000 s, H.264 with a stereo 48 kHz AAC guide track. `volumedetect`
  measured both mean and peak at -91.0 dB, consistent with the intentionally
  silent source. SHA-256 is
  `7acfb9dc20f7efbf6227f94d07a6ce7694e58ec66f14463aca0a72689f79a23c`.
- One midpoint from every beat was extracted into a 14-frame contact sheet and
  inspected at original resolution. All captions were legible; the dialogue,
  three chapter frames, current estate, dedicated three-quarter-depth frame,
  four-workflow AI receipt, engineering/integrity slides, and QR end slate
  remained readable with no black frames or harmful crops.
- The complete repository gate then passed strict TypeScript, 75/75 unit
  tests, the production build, `npm audit` with 0 vulnerabilities, and 60/60
  production-browser checks. The gate measured eight façade-depth profiles,
  seven recesses, two roof styles, 95 obstacles, zero layout issues, and
  retained keyboard, touch, 360 px, reduced-motion, monsoon, focus, and
  campaign coverage.
- A later detached-worktree verification of commit `b73e9b3` passed the fast
  gates but missed the second journey's demo dialogue-open event; that single
  scheduling miss caused five dependent checks to stop at 34 passes / 5
  failures. No source changed. The immediate unchanged retry completed 60/60,
  matching the earlier passing full gate. Both outcomes are retained here;
  the failed run is not relabelled as a product pass.
- `graphify update .` rebuilt the local knowledge graph to 1,135 nodes, 2,044
  edges, and 60 communities. It retained the known fail-closed node, reported
  the local settings and two video-timeline JSON files as zero-node inputs,
  and warned that saved semantic labels trail the changed topology; no LLM
  relabel was claimed.

**Claim boundary:**

- This is Codex-assisted capture/compositor authoring, a scripted machine
  recording, deterministic media inspection, and production-browser evidence.
  It is not a human play session, human narration, human approval, older-adult
  playtest, real-device test, screen-reader session, 200% zoom pass, Miora run,
  social post, upload, or completed submission.
- The checked-in review cut has burned-in open captions and a silent guide
  track. A human still must record the voice-over, add and verify the sound mix
  by ear, approve the final export, use the required filename, upload it, and
  verify the public link while logged out.

## 2026-08-04 — Resident Silhouette and Grounded-Gait Release

**Tools:** Codex (GPT-5) for implementation, review, verification, evidence,
and deployment; one real OpenAI image-generation run for visual direction.

**Generated study and human gate:**

- The exact prompt is preserved at
  `docs/prompts/openai-character-silhouette-study-v1.txt`. It used the current
  `docs/screenshots/10-living-estate.png` only as a palette, outline-weight,
  gameplay-scale, and camera reference.
- The 1667×944 RGB result is preserved at
  `docs/art/openai-character-silhouette-study-v1.png`; SHA-256 is
  `efc0b95b6a6335186cc1913fbb41e81bb3339b8b73c56f0fa6d88c8dcd39ef61`.
- Human review accepted stepped heads and shoulders, connected limbs, grounded
  footwork, and clothing/hair shapes that remain readable near 44×58 px.
  Costume-like sash/cap treatments and any culturally stereotyped direct
  translation were rejected. The generated raster is evidence-only and is not
  loaded by the game.

**Curated runtime work:**

- Added a pure `characterArt.ts` registry for all 12 named residents. It
  records authored colours plus three builds, five hair silhouettes, five
  outfit grammars, four accessory states, and four residents carrying totes.
- Rebuilt the code-drawn player and resident anatomy with stepped profiles,
  connected sleeves/hands, clearer faces and hair, grounded shoes, and
  four-phase stride changes. The former shadow baked into every resident
  texture was removed; each character now uses one synchronized runtime
  contact shadow.
- Exposed the registry audit through the production motion snapshot. Existing
  campaign registry tests and the existing 60th browser check now fail unless
  all exact cast counts are present, without inflating the 75-test or 60-check
  headlines.
- Refreshed current screenshots, design/accessibility/demo/QA/evidence docs,
  the eight-slide judge PPTX, and the eight-page PDF. Stale instructions to
  repeat the already-completed age-signalling task in CodeBuddy were replaced
  with a requirement to select a genuinely open Todo Tencent item.

**Verification and tool failures retained:**

- One complete gate attempt reached the browser harness but timed out during an
  early `Runtime.evaluate` while a separate Chrome journey still held the
  harness's fixed CDP port. It stopped at three passes and was not counted as a
  product pass. No source changed for that result.
- After the competing process exited, the exact required gate passed:
  `npm run typecheck && npm test && npm run build && npm audit && npm run
  smoke`. Results were strict TypeScript, 75/75 unit tests, 0 vulnerabilities,
  and 60/60 production-browser checks.
- The production build is 81.69 kB HTML (14.79 kB gzip), 106.23 kB initial
  JavaScript (32.29 kB gzip), and 1,596.66 kB lazy scene code (374.83 kB
  gzip). The browser reported `cast=12/5 hair/5 outfits`, 10.10 ms active p95
  at 2.59 ms/frame main-thread work, and 9.70 ms p95 at 7.73 ms/frame under
  4× CPU throttling.
- The first deck template-plan invocation pointed at the default scratch path
  instead of the retained `tmp/template-inspect/` file and failed with one
  missing-file issue. The corrected invocation passed with zero issues, as did
  template fidelity and PowerPoint overflow checks. All eight slide renders
  were inspected. The PDF passed eight-page, 1280×720, unencrypted,
  title/author/subject, and rendered-page checks.
- `graphify update .` rebuilt 1,148 nodes, 2,082 edges, and 63 communities. It
  retained the known fail-closed node, reported three zero-node local JSON
  inputs, and warned that 60 saved labels trail the changed topology; no LLM
  relabel was claimed.

**Deployment and claim boundary:**

- Gameplay/art commit `b2fdf0d` deployed successfully through GitHub Pages run
  `30892004181`. The public full and `?demo=1` endpoints returned HTTP 200, and
  the served lazy bundle contained the four resident-audit field names. The
  workflow emitted GitHub's non-blocking Node 20 action-deprecation annotation.
- This is AI-assisted visual direction, original code-drawn implementation,
  deterministic production-browser evidence, and human inspection of rendered
  captures. It is not a human playtest, real-device pass, screen-reader
  session, 200% zoom check, calibrated-display study, Miora run, or
  same-hardware comparison with Stardew Valley or another game.
- No copied game art, generated runtime character raster, dependency, backend,
  account, analytics, personal-data collection, runtime model, network
  request, timer, failure state, energy system, or medical claim was added.

## 2026-08-04 — Fail-Closed Submission Backup and Media Refresh

**Tools:** Codex authored and validated the submission packager. A concurrent
Claude Code release-preparation lane recaptured the cast-current media,
refreshed browser evidence, and independently corrected the same stale
AI-workflow caption that Codex caught during review.

**Submission tooling:**

- Added `scripts/prepare-submission.mjs`, `npm run submission:review`, and
  `npm run submission:final` in Codex commit `f67759d`. Review mode creates an
  ignored, explicitly labelled non-submittable folder and ZIP. Final mode
  requires the exact final filename, human-voiced non-silent media, exported
  CodeBuddy history, completed human approvals, reachable logged-out URLs, a
  clean synchronized commit, and the complete repository gate.
- Added `docs/submission/FINAL_APPROVALS.example.json`; the completed
  `FINAL_APPROVALS.json` is gitignored. Miora, older-adult playtesting,
  real-device/accessibility evidence, a second successful CodeBuddy pass, and
  published social links remain visible scoring risks rather than fabricated
  blockers or claims.
- `npm run submission:review` passed deck/media/link/hash inspection and
  produced an ignored 10,751,834-byte review ZIP with
  `submissionReady: false`. Its manifest listed the four genuine human
  blockers and five optional evidence risks. ZIP SHA-256 was
  `16da17aaf3766da4e2e321f2239751a4cf7340d56373547f807de2c26bad3ed2`.
- `npm run submission:final` without the required inputs exited 1 as designed,
  naming the missing final video, CodeBuddy history, and approval record and
  explicitly refusing the silent review cut.
- Codex then used a clearly labelled synthetic `/tmp` fixture with two fake
  approval names and a hard link that renamed the silent review cut to the
  required final filename. Final mode rejected the file as byte-identical
  before running the expensive gate. The exact fixture was removed; its
  booleans are test data and do not claim any human approval.

**Current media verification:**

- The current B-roll is the 1,262-frame / 63.1-second cast-and-depth capture
  documented above. The 14-beat review cut is exactly 90.000 seconds at
  1280×720/30 fps, H.264 plus a stereo 48 kHz AAC guide track. The guide track
  remains intentionally silent at -91.0 dB mean/peak; human voice-over and an
  ear-checked mix are still required.
- The compositor source and generated provenance manifest now both say four
  reviewed OpenAI visual workflows. Fourteen accurately sought midpoint frames
  were inspected at original resolution; every source, open caption, crop,
  chapter frame, AI/engineering/integrity slide, and QR end slate matched.
- A representative six-frame post-smoke sheet covering title, visual-novel
  dialogue, living estate, depth façade, mobile monsoon, and mobile detail was
  also inspected. No crop, overflow, contrast, or route-cue regression was
  found.

**Exact verification and unavailable device lane:**

- A detached worktree pinned to `f67759d` passed the mandated sequence:
  strict TypeScript, 75/75 tests, the production build, `npm audit` with zero
  vulnerabilities, and 60/60 production-browser checks. It was removed after
  the run.
- The build is 81.69 kB HTML (14.81 kB gzip), 106.23 kB initial JavaScript
  (32.25 kB gzip), and 1,596.66 kB lazy scene code (372.89 kB gzip).
  Browser evidence retained 12 cast entries / five hair silhouettes / five
  outfits, eight depth façades / seven recesses / two roof styles, 95
  obstacles, zero layout issues, 360 px/touch/focus/reduced-motion/monsoon
  coverage, and both full and demo campaigns.
- The run measured 9.20 ms title and resident-route p95, 9.10 ms monsoon p95,
  9.00 ms active p95 at 2.61 ms/frame main-thread work, and 9.00 ms p95 at
  8.32 ms/frame under 4× CPU throttling.
- Codex inspected the `controlling-mobile-devices` skill and used deferred-tool
  discovery twice for its required MobAI `list_devices` and `execute_dsl`
  capabilities. This session exposed no MobAI connector, so no device was
  listed, launched, tapped, inspected, or screenshotted. That is an external
  blocker, not a device pass.
- `graphify update .` rebuilt 1,182 nodes, 2,143 edges, and 65 communities. It
  retained the known fail-closed node, reported four zero-node local JSON
  inputs, and warned that 63 saved labels trail the topology; no semantic
  relabel was claimed.

**Claim boundary:**

- The review ZIP and MP4 are not submission-ready. No human voice-over, audio
  ear-check, team approval, exported successful CodeBuddy history, public video
  upload, logged-out video-link check, Miora run, human playtest, real-device
  or emulator pass, screen-reader/200%-zoom session, or organiser submission
  is claimed.
- A conflicting uncommitted edit attempted to restore a visible `Continue`
  label. It was rejected because the user explicitly requested the sole `>`
  visual-novel cue; the existing accessible name and 52×52 target remain.

## 2026-08-04 — Cast Release Deployment and Todo Tencent Reconciliation

**Tools:** Codex, GitHub CLI, direct Node `fetch`, and the Notion connector.

**Deployment verification:**

- Pushed the cast-current runtime, media, submission tooling, and evidence to
  public `main` at commit `f565521`. GitHub Pages run `30894019126` passed its
  build and deploy jobs.
- Direct no-cache probes returned HTTP 200 for both the full URL and
  `?demo=1`. Both resolved `index-Cyrkh2Rs.js` and
  `campaignScene-BEnMC8vi.js`; the lazy bundle exposed all six resident-art
  audit fields (`residentCount`, `hairStyleCount`, `outfitCount`,
  `buildCount`, `accessoryCount`, and `carryingResidentCount`).
- The served HTML retained a visually sole `>` dialogue cue, its
  `Continue dialogue` accessible name, and no restored visible Continue label.

**Todo Tencent reconciliation:**

- Read the live database schema and all 36 pre-existing rows before mutating
  the board. Updated the existing final-video task from its stale 86.4-second
  note to the current 63.1-second cast B-roll and 90.000-second review cut.
  The card remains **In progress** because narration, audible mix and ear-check,
  approvals, CodeBuddy export, public publication, logged-out link checks, and
  organiser submission are not complete.
- Added three dated **Done** cards with commit, deployment, verification, and
  claim-boundary evidence: the curated OpenAI cast-silhouette study; the
  code-drawn cast refinement/deployment; and the fail-closed submission backup
  plus review-media refresh.
- Re-fetched every changed page and queried the final board totals:
  **31 Done / 3 In progress / 5 Not started**, 39 cards overall.

**Claim boundary:**

- The public game release is complete, but the review MP4 and review ZIP are
  not submission-ready. No human narration/mix approval, CodeBuddy success or
  export, Miora run, human playtest, real-device/emulator/accessibility pass,
  public video/social post, or organiser submission is claimed.

## 2026-08-04 — Elder-Led Check-Before-You-Act Consequence

**Tools:** Codex (GPT-5) for research, implementation, review, automated
verification, and evidence; the bundled Presentations and PDF workflows for
the existing judge artifacts. This lane was limited to Auntie Minah's safety
beat, its campaign/runtime evidence, and artifact synchronization. Concurrent
repository screenshot and video changes were preserved and are not claimed by
this lane.

**Official-source boundary:**

- The copy was checked against current official Singapore guidance: the SPF
  phishing advisory describes urgent messages and malicious links and advises
  verifying with the company directly; the SPF impersonation advisory says to
  use official sources for separate verification and never disclose OTPs; and
  ScamShield says to check before acting and lists its helpline as 1799.
- The resulting authored message has Minah identify urgency and an unfamiliar
  payment link, verify through the supplier number already in her own order
  book or ScamShield at 1799, and never share a one-time password. It makes no
  promise that a particular message is a scam or that the habit prevents loss.

**Implemented and independently reviewed:**

- Reworked Minah's existing mandatory Chapter 2 Ros clue into an elder-led
  `Check Before You Act` beat. The player chooses only how her window card is
  presented: three large numbered steps or icons with short words. Both are
  equally valid, have no penalty, and preserve Minah as the expert.
- One `publish-scam-check` reducer event now atomically stores the selected
  layout, persistent `CHECK FIRST` shop-window card, Minah memory, and Ros clue.
  It remains idempotent. Save loading repairs older clue-only states and
  interrupted card-only states in either direction, retaining a valid saved
  layout and defaulting only missing layouts to numbered steps.
- Added a persistent semantic Journal objective containing the complete
  PAUSE/CHECK/TELL habit and selected layout. The visual card is code-drawn,
  uses scale-2 labels in both variants, and follows the provision-shop façade's
  normal, animated-fade, reduced-motion, and recreation alpha paths.
- The first rendered review found that the card was behind the façade overlay
  and effectively invisible. It was moved to a standalone audited depth. A
  separate code review then found missing semantic revisit detail,
  one-layout-only coverage, one-way legacy migration, façade-alpha drift, and
  a crash-consistency gap between card and clue events. All were corrected
  before the final gate.
- Two otherwise passing gate attempts failed at the mocked browser-fullscreen
  exit because the harness assumed a fixed 140 ms transition. The harness now
  waits for the explicit entered/exited state and records both detail objects.
  An unchanged diagnostic run then passed. After final documentation and
  artifact synchronization, one further run stopped at seven passes when its
  prologue evidence-line wait expired even though dialogue and portrait state
  had rendered; the identical private build passed 60/60 on immediate retry.
  None of the three failed attempts is counted as a pass.

**Isolated gate and visual evidence:**

- To avoid racing shared `dist/` and `docs/screenshots/`, the gate used strict
  `npm run typecheck`, 75/75 Vitest tests, a private Vite production build,
  `npm audit` with 0 vulnerabilities, and the production browser harness with
  private output paths. The final journey passed 60/60 checks across full and
  demo campaigns.
- The build is 81.69 kB HTML (14.79 kB gzip), 108.33 kB initial JavaScript
  (32.96 kB gzip), and 1,598.55 kB lazy scene code (375.48 kB gzip). The final
  run measured 9.70 ms resident-route p95, 10.00 ms monsoon p95, 9.30 ms active
  p95 at 2.69 ms/frame main-thread work, and 10.20 ms p95 at 8.70 ms/frame under
  4× CPU throttling.
- Full mode rendered `icons-and-words`; demo mode rendered `numbered-steps`.
  The harness reported the card visible at alpha 1, faded with its façade to
  0.28, and restored to 1. The full-layout and occlusion captures in the
  private `/tmp` evidence folder were inspected at full frame and had no card,
  route-cue, or overflow regression.
- `graphify update .` rebuilt 1,186 nodes, 2,157 edges, and 66 communities. It
  retained the known fail-closed node, reported the same four zero-node local
  JSON inputs, and warned that the 65 saved labels trail the changed topology;
  no LLM relabel was claimed.

**Artifact refresh:**

- Updated the existing eight-slide deck source, its Minah and engineering
  rasters, PPTX, and PDF. The final engineering slide uses 108.33 kB initial
  JavaScript and the complete 81.69/14.79, 108.33/32.96, and
  1,598.55/375.48 build figures.
- The presentation workflow reported zero template-fidelity issues, no
  overflow, preserved notes, no placeholders, and render-identical untouched
  slides. The PDF workflow used a locally installed Poppler renderer and
  inspected all eight fresh 1280×720 pages; metadata, encryption, JavaScript,
  and form checks passed.
- PPTX SHA-256:
  `c8fa9b613fad76bd94318c744bb15560b180596a474bce3de3cc7250aef2c768`.
  PDF SHA-256:
  `9916f8a71ef803d51eb98c256b6bbef1f0d872f65c0dac6688950e6e56118ba7`.

**Concurrency and claim boundary:**

- Local `HEAD` contained a concurrent commit restoring a visible `Continue`
  label, one commit ahead of `origin/main`. This working-tree lane retained the
  accepted sole visual `>` cue, its `Continue dialogue` accessible name, and
  52×52 target. No history was rewritten and nothing was committed, pushed, or
  deployed.
- This is official-source research, AI-assisted authored content/code, an
  automated browser playthrough, and machine-rendered artifact inspection. It
  is not a human or older-adult playtest, real-device/emulator check,
  screen-reader or 200% zoom session, Miora/CodeBuddy run, generated-image run,
  scam-prevention outcome, public release, or organiser submission.

## 2026-08-04 — Integrated Consequence Art, Recoverable Loading, and Touch Navigation

**Tools:** Codex (GPT-5) coordinated three implementation/review lanes, local
TypeScript/Vitest/Vite/audit commands, the repository's dependency-free Chrome
DevTools Protocol harness, Graphify, and the bundled Presentations/PDF
workflows. The in-app browser bootstrap was attempted exactly as instructed but
returned `Browser is not available: iab`; the existing real-Chrome CDP harness
was therefore the local visual and interaction fallback.

**Implementation and review:**

- Preserved the concurrently dirty shared worktree by snapshotting its exact
  state, then integrated reviewed commits in a private worktree. No existing
  user changes were reset, stashed, overwritten, pushed, or deployed.
- Added `src/game/consequenceArt.ts` and state-driven scene integration for a
  three-quarter exterior ramp, matching interior ramp, raised-herb garden,
  flower-and-shaded-seat garden, and pitched sheltered-linkway extension.
  Independent review caught Phaser Container depth flattening; the final
  objects stay on the scene display list so rails/roof layers can occlude the
  player correctly. Stable smoke IDs prove pre-consequence absence, both
  garden variants, both ramp locations, the shelter, and location-specific
  absence. Collision and campaign rules were not changed by the art.
- Added one cached lazy scene import, connection-aware idle prefetch after the
  title image, Save-Data/2g suppression, atomic opening and 12-second slow
  states, cancel/back, failed-import retry, rejected-cache recovery, stale
  attempt guards, and full world/topbar focus isolation. Safe storage wrappers
  keep play available with an announced in-memory fallback if browser storage
  throws. Review caught unguarded later writes, incomplete focus isolation and
  retry-state edge cases before the final gate.
- Added short-viewport 100dvh reflow and height-aware interior zoom for
  320×568, 360×560 and 640×360. Primary canvas taps walk, redirect, follow a
  moving interaction, activate on arrival, cancel on keyboard/d-pad input, and
  stop after collision stalls. Long press, drag and multitouch are rejected;
  touch state clears on blur/visibility/title/start boundaries; the destination
  ring remains 28 screen pixels; grouped d-pad buttons respond to synthesized
  keyboard/assistive-technology clicks; and the visible Talk control keeps
  world focus. A nearby prompt's text area now lets world taps pass through
  while its actual Interact button remains clickable.
- Preserved the user-authoritative dialogue contract: the only visible advance
  text is `>`, with `aria-label="Continue dialogue"`, an exact 52×52 target,
  and an enclosing 3 px outline plus 6 px outer ring. Four source-contract
  tests now protect that cue, reduced-motion stillness and “Maybe later.”

**Failed attempts retained:**

- Two early loader-failure runs exposed that a one-shot storage fault could
  leave the title without Continue; fallback loading now re-persists the valid
  in-memory campaign when storage recovers.
- Several 59/60 touch runs first exposed a blanket document keydown cancel,
  then a visible prompt banner intercepting the NPC coordinate. Focused CDP
  probes reproduced each event path before the runtime fixes.
- The next 59/60 run passed every touch behavior but sampled the 200 ms Journal
  transition before it settled and included variable travel time in the
  collision-stall cutoff. The final harness waits for settled drawer geometry
  and starts beside the known wall; it still asserts the real 650 ms no-progress
  outcome. None of these failed runs is counted as a pass.

**Final local evidence:**

- Strict TypeScript passed.
- Vitest passed **79/79**: campaign 27, match engine 31, audio 17,
  accessibility contract 4.
- The production build is **84.76 kB HTML (15.26 kB gzip), 114.37 kB initial
  JavaScript (35.06 kB gzip), and 1,609.14 kB lazy scene (376.46 kB gzip)**.
- `npm audit` reported zero known vulnerabilities.
- The final production-browser journey passed **60/60** across full and demo
  campaigns. Its final performance evidence was title-baseline p95 9.90 ms,
  resident routes 10.10 ms, monsoon 9.90 ms, active movement 9.80 ms at
  2.90 ms/frame main-thread work, and 4×-throttled movement 9.80 ms at
  9.70 ms/frame.
- Full-frame screenshots of the consequence scene, monsoon shelter, mobile
  world, mobile dialogue and architecture were inspected. The ramp, garden,
  shelter, 360 px world, and sole focused chevron remained legible and unclipped.
- `graphify update .` rebuilt **1,174 nodes, 2,132 edges and 67 communities**.
  It warned that three local JSON evidence files produced zero nodes; no LLM
  semantic extraction or relabel was claimed.

**Artifact refresh:**

- Updated all eight deck rasters and the inherited one-image-per-slide PPTX via
  artifact-tool. Template inspection, one-to-one frame-map validation,
  template fidelity and overflow checks all passed with zero issues; all eight
  rendered slides were inspected.
- Rebuilt the raster PDF with ReportLab and rendered every page through
  Poppler. It has eight unencrypted 1280×720 pages, the expected title/author/
  subject metadata, and no form or JavaScript; the full montage was inspected.
- PPTX SHA-256:
  `96866ae2be84654ece784bcd1a62bb09be6fe4d01e544e9edd975d58caae1485`.
  PDF SHA-256:
  `62a8db9557196af6bddd267a7788795f185a9e7cf3aaa2fcf9e5ede1a4801735`.

**Claim boundary:**

- This is local automated and machine-rendered evidence, not a human or
  older-adult playtest, real-phone/tablet result, screen-reader or 200% zoom
  session, accessibility certification, Miora run, new CodeBuddy success,
  social outcome, health outcome, public release, or organiser submission.
- Nothing was pushed or deployed. The live GitHub Pages URL and the checked-in
  90-second review cut predate this loader/touch/consequence-art build and must
  not be presented as current-build evidence until an explicitly approved
  release and media refresh occur.
