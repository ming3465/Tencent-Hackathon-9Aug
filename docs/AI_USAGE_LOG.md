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
