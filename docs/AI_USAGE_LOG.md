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
