# Agent Onboarding — Kampung SG

Read this first. It is the shared entry point for every AI agent (Claude Code,
CodeBuddy, Cursor, Codex, or anything else) working in this repository.

## What this is

**Kampung SG** — a cozy three-quarter Singapore HDB-estate campaign for the Tencent
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
Current truth: **85 unit tests, 60 smoke checks, 0 vulnerabilities.** The unit
split is campaign 27, match engine 31, audio 17, accessibility contract 4, and
world-layout/door/pause 6. If a doc
or deck quotes different numbers after your change, update them — stale
numbers are treated as defects.

## Working alongside other agents

More than one agent is often live in this working tree at the same time
(observed on 2026-08-04: Codex, CodeBuddy and Claude Code together). Assume it.

- **Claim a lane and say so** in your session-log entry. On 2026-08-04 two
  agents independently added a vignette to the same portrait file within five
  minutes; shipping both would have double-darkened every bust. Duplicated
  polish is the main failure mode here, not merge conflicts.
- **Re-read a file immediately before editing it.** Surgical string edits fail
  loudly on stale content, which is what you want; whole-file writes do not.
- **Never run the shared verification path while another agent may be running
  it.** `npm run smoke` writes `dist/` and `docs/screenshots/`. To verify
  without racing, build and serve somewhere private and point the harness at it:
  ```bash
  npx vite build --outDir /tmp/kampung-check --emptyOutDir
  (cd /tmp/kampung-check && python3 -m http.server 4399 --bind 127.0.0.1 &)
  node scripts/browser-smoke.mjs --url http://127.0.0.1:4399/ \
    --shots /tmp/kampung-shots --port 9333
  ```
- **Before blaming your own change for a failure, reproduce it on `HEAD`** in a
  throwaway worktree (`git worktree add --detach /tmp/head-wt HEAD`, symlink
  `node_modules`). That is how the flaky travel route below was correctly
  attributed rather than "fixed" by mistake.

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

- **2026-08-05 (Codex, registry world/doors/pause rebuild)** — Rebuilt the
  12-location campaign around a typed `2560×1600` registry: six pedestrian
  streets, eight independent baked three-quarter buildings, corrected
  consequence-specific shelters, derived minimap/rain/collision data, and 22
  idempotent contextual DoorViews with paired approaches and returns. Added
  Journal/Menu-only play chrome plus focus-safe Pause, Settings, fullscreen
  handling, transient audio ducking, exact overlay restoration, and a confirmed
  autosaved return to title. Default AUTO/WebGL and forced Canvas each passed
  the same 60/60 production-browser journey; strict TypeScript, 85/85 tests,
  the production build, and 0-vulnerability audit passed. Current screenshots
  and documentation were refreshed; video remains labelled earlier-build.
  Nothing was pushed or deployed, and no human/device/screen-reader/200%-zoom
  or public-release claim is made.
- **2026-08-04 (Codex, integrated consequence-art/loader/touch polish)** —
  Integrated three reviewed local lanes without disturbing the concurrently
  dirty shared worktree: state-specific three-quarter exterior/interior ramps,
  alternate raised-bed gardens and a pitched sheltered linkway; a cached,
  connection-aware lazy loader with opening/slow/cancel/retry/race/storage
  recovery; and 100dvh short-viewport tap navigation with target following,
  redirect, manual cancellation, collision stall, lifecycle cleanup, a stable
  28 px ring and keyboard/AT d-pad activation. Preserved the authoritative sole
  visible `>` dialogue cue, `Continue dialogue` accessible name, exact 52×52
  target and enclosing focus ring. Review and real-Chrome diagnostics also
  fixed world-depth loss, loader focus/storage gaps, global-key cancellation,
  a prompt banner intercepting canvas taps, and nondeterministic smoke setup.
  The final local gate passed strict TypeScript, 79/79 tests (27 campaign, 31
  match, 17 audio, 4 accessibility), 0 vulnerabilities and 60/60 full/demo
  browser checks. Build: 84.76 kB HTML (15.26 gzip), 114.37 kB initial JS
  (35.06 gzip), 1,609.14 kB lazy scene (376.46 gzip). The refreshed eight-slide
  PPTX/PDF passed template fidelity, overflow, metadata and full-page visual
  inspection. Graphify rebuilt 1,174 nodes / 2,132 edges / 67 communities with
  three known zero-node JSON warnings. Nothing was pushed or deployed; the
  public URL and checked-in review video remain earlier-build evidence. No
  human/older-adult playtest, real-device, screen-reader/200%-zoom, Miora,
  CodeBuddy-success, social-outcome or health claim.
- **2026-08-04 (Codex, elder-led safety consequence lane)** — Reworked Auntie
  Minah's mandatory Chapter 2 Ros clue into an official-source
  check-before-you-act teaching beat: she identifies urgency and an unfamiliar
  payment link, verifies through a separately held supplier contact or
  ScamShield at 1799, and never shares an OTP. Two equal no-failure choices now
  atomically save the Ros clue plus a numbered or icon-and-words card; the
  selected code-drawn card persists in her shop window, follows façade
  occlusion alpha, and remains available as complete semantic Journal text.
  Partial and legacy saves repair the card/clue pair in either direction. An
  independent review caught and drove fixes for hidden card depth, alpha drift,
  semantic revisit detail, alternate-layout coverage, one-way migration, and
  crash consistency. The isolated final gate passed strict TypeScript, 75/75
  tests, 0 vulnerabilities, and 60/60 full/demo browser checks; build is 81.69
  kB HTML / 108.33 kB initial JS / 1,598.55 kB lazy scene. Two earlier
  fullscreen-exit failures and one later prologue-line wait miss were retained;
  condition-based fullscreen waits and unchanged retries produced the final
  passes. The refreshed eight-slide PPTX/PDF passed template fidelity, overflow,
  metadata, and full-page render inspection. Graphify rebuilt 1,186 nodes /
  2,157 edges / 66 communities with the known fail-closed, four-zero-node-JSON,
  and stale-label warnings. The lane preserved concurrent screenshot/video
  work and the sole accessible `>` cue; nothing was committed, pushed, or
  deployed. No human/older-adult playtest, real-device, screen-reader/200%-zoom,
  Miora, CodeBuddy, generated-image, or scam-outcome claim.
- **2026-08-04 (Codex, release and Todo Tencent handoff)** — Pushed the
  cast-current game, review media, fail-closed submission tooling, and evidence
  to `main` at `f565521`. GitHub Pages run `30894019126` completed successfully;
  direct public probes returned HTTP 200 for full and `?demo=1`, loaded
  `index-Cyrkh2Rs.js` / `campaignScene-BEnMC8vi.js`, retained the sole visual
  `>` dialogue cue, and exposed the six resident-art audit fields. Reconciled
  Todo Tencent to 31 Done / 3 In progress / 5 Not started: added three
  evidence-backed Done cards for the OpenAI cast study, deployed cast
  silhouettes, and fail-closed submission/media work; refreshed the final-video
  card to the current 63.1 s B-roll and 90.000 s review cut while deliberately
  keeping it In progress. Human narration/mix/approval, CodeBuddy export,
  public video/social publication, link checks, and organiser submission remain
  external.
- **2026-08-04 (Codex packaging + Claude Code media integration)** — Codex
  added the fail-closed review/final submission builder in `f67759d`, including
  the ignored human-approval record, exact filename/media/deck/link/hash checks,
  and explicit score risks. Review mode produced a clearly labelled
  `submissionReady: false` ZIP; missing inputs and a synthetic renamed-silent
  cut were both rejected, and the exact `/tmp` fixture was removed. A
  concurrent Claude Code lane recaptured 1,262 frames / 63.1 s of cast-current
  B-roll and rebuilt the 90.000 s H.264/AAC review cut; its source and manifest
  now say four OpenAI workflows. Fourteen midpoint frames and a representative
  six-frame post-smoke sheet matched their sources/captions without visual
  regressions. A detached `f67759d` gate passed strict TypeScript, 75/75 tests,
  0 vulnerabilities, and 60/60 browser checks; active p95 was 9.00 ms at
  2.61 ms/frame work and 4× p95 was 9.00 ms at 8.32 ms/frame. Graphify reported
  1,182 nodes / 2,143 edges / 65 communities with the known fail-closed,
  four-zero-node-JSON, and stale-label warnings. MobAI tools were unavailable,
  so no device/emulator/accessibility pass is claimed. A conflicting
  uncommitted visible `Continue` label was rejected; the user-requested sole
  `>` cue, accessible name, and 52×52 target remain. Human narration/audio
  approval, final video publication, CodeBuddy export/success, Miora,
  playtests, devices/accessibility, social posts, and organiser submission
  remain external.
- **2026-08-04 (Codex, cast-silhouette release)** — Used one current estate
  capture in a real OpenAI visual-direction run; preserved the exact prompt,
  1667×944 output, hash, and accepted/rejected human decisions. The generated
  raster remains evidence-only. Added a pure 12-resident art registry with
  three builds, five hair silhouettes, five outfit grammars, four accessory
  states, and four carried totes; rebuilt code-drawn stepped anatomy,
  connected limbs, grounded four-phase walks, and removed the duplicate baked
  shadow so every resident has one synchronized contact shadow. The exact gate
  passed strict TypeScript, 75/75 tests, 0 vulnerabilities, and 60/60 browser
  checks; build is 81.69 kB HTML / 106.23 kB initial JS / 1,596.66 kB lazy
  scene, while active movement measured 10.10 ms p95 at 2.59 ms/frame work and
  4× CPU throttle measured 9.70 ms p95 at 7.73 ms/frame. The refreshed
  eight-slide PPTX and eight-page PDF passed template-plan, fidelity, overflow,
  metadata, and visual checks. Graphify rebuilt to 1,148 nodes / 2,082 edges /
  63 communities with the known fail-closed, zero-node-JSON, and stale-label
  warnings. Commit `b2fdf0d` deployed successfully through Pages run
  `30892004181`; live full/demo endpoints returned HTTP 200 and served the new
  audit fields. No runtime character raster, copied art, human/real-device
  playtest, screen-reader/200%-zoom pass, Miora claim, or cross-game
  equivalence claim.
- **2026-08-04 (Codex, video/evidence lane)** — Regenerated the scripted judge
  B-roll from the cast-current three-quarter-depth build (1,262 frames / 63.1 s /
  1280×720) and added a deterministic compositor whose moving clips resolve
  from named `broll-beats.json` entries rather than fragile fixed timestamps.
  The resulting narration-ready review cut contains 14 open-captioned beats:
  title, visual-novel dialogue/choice, all three resident chapters, corridor,
  living estate, dedicated roof/side-face/recessed-door evidence, free
  exploration, AI receipts, engineering, integrity, and QR end slate. It is
  exactly 90.000 s at 1280×720/30 fps, H.264 with an intentionally silent
  stereo AAC guide track (-91.0 dB peak), and has a complete provenance
  manifest. All 14 midpoint frames were inspected; captions, crops, current
  façade art, deck evidence, and QR remained readable. The full gate passed
  strict TypeScript, 75 tests, the 81.69/106.23/1,591.09 kB build, 0
  vulnerabilities, and 60/60 browser checks. A later detached verification
  missed the second demo dialogue-open event (34 pass / 5 dependent failures);
  no source changed and its immediate unchanged retry passed 60/60, so both
  outcomes are logged rather than hiding the scheduler miss. Graphify rebuilt
  to 1,135 nodes / 2,044 edges / 60 communities with the known fail-closed,
  zero-node-JSON, and stale-label warnings. The review cut is not the final
  submission video: human voice-over, an ear-checked mix, team approval,
  required filename, upload, and logged-out link verification remain open, as
  do playtests, real devices, screen reader, 200% zoom, Miora, and social
  publishing.
- **2026-08-04 (Codex, exterior projection lane)** — Replaced the remaining
  flat-card treatment on all eight major exterior structures with one audited
  shallow three-quarter contract: hipped or sawtooth roof planes and seams,
  right-side faces, sheared contact shadows, and seven recessed usable
  thresholds. Geometry is centralized by the existing visual-zone IDs and
  rendered from a separate code-drawn helper into the four baked estate
  textures; no door, prompt, collision shell, occlusion crop, return point, or
  route moved. Registry assertions remain inside the 75-test headline, while
  the 60-check browser gate now requires 8 depth profiles / 7 recesses / 2 roof
  styles alongside physical collision and fade/restore. A private passing run
  measured 214 façade colours / 270 edges / 28.6% dark pixels, 9.00 ms active
  p95 at 2.68 ms/frame work, and 9.20 ms p95 at 8.52 ms/frame under 4x CPU
  throttle. Desktop landmark/occlusion/workshop/south and 360 px captures were
  inspected. Build is 81.69 kB HTML (14.79 kB gzip), 106.23 kB initial JS
  (32.29 kB gzip), and 1,591.09 kB lazy scene code (373.43 kB gzip). The
  eight-slide PPTX and eight-page PDF were synchronized; artifact-tool template
  plan/fidelity and PDF page-size/metadata/render checks passed, and all slide
  renders were inspected. Graphify rebuilt to 1,121 nodes / 2,026 edges / 61
  communities with the known fail-closed/stale-label warnings. A concurrent
  agent committed B-roll capture as `dfc0fd9`; its remaining untracked
  composition script was preserved and excluded from this lane. No copied
  game art, new generated runtime image, real-device/human playtest, Miora,
  screen-reader, 200%-zoom, or cross-game-equivalence claim.
- **2026-08-04 (Codex, integration and evidence lane)** — Accepted the user's
  cozy three-quarter reference as direction for a future faux-3/4 façade pass,
  without copying its sprites/layout or claiming a true-isometric rewrite.
  Finished the current cohesive aesthetic release: one reviewed OpenAI HDB
  title panorama with semantic HTML copy, 13 portraits with three authored
  expressions, a visual-novel chevron, richer deterministic room materials,
  warm/cool furniture separation, tactile interaction plates, restrained
  chapter lighting, deterministic four-chord ambient music, and a subtle
  reduced-motion-safe world vignette with nine decorative leaves/light motes.
  Hardened the browser harness around collision-aware monsoon travel,
  navigation readiness, CDP timeouts, and fully rendered dialogue evidence.
  The settled combined source passed strict TypeScript, 75/75 unit tests,
  60/60 isolated production-browser checks, and `npm audit` with 0
  vulnerabilities. Build is 81.69 kB HTML (14.79 kB gzip), 104.71 kB initial
  JavaScript (31.97 kB gzip), and 1,587.98 kB lazy scene (372.48 kB gzip).
  The eight-slide PPTX and eight-page PDF were refreshed at 1280×720 and
  passed template-fidelity, overflow, metadata, and complete montage review.
  Graphify rebuilt to 1,085 nodes / 1,960 edges / 59 communities, retaining
  the known fail-closed node and stale-label warning. GitHub Pages run
  `30886434561` deployed commit `d4ca458`; despite that concurrent commit's
  stale subject/body, its actual and production dialogue markup contains only
  the visible `>` cue with an accessible name. The public endpoint and title
  asset both returned HTTP 200. Todo Tencent was reconciled to 26 Done /
  3 In progress / 5 Not started, preserving manual QA, older-hardware,
  playtest, submission, broader Miora/AI-polish, and human audio-listening work
  as open. OpenAI work is not claimed as Miora; no older-adult playtest,
  real-device, screen-reader, 200%-zoom, social-outcome, or
  cross-game-equivalence claim.
- **2026-08-04 (Claude Code, in-world art lane)** — Ran the aesthetic pass on
  the world layer while a parallel agent session held the title/dialogue/UI
  layer; portrait and overlay edits were deliberately backed out to avoid
  duplicating their vignette work. **Interiors:** replaced the 128×32 px floor
  panels — roughly four player-heights wide — with 22 px plank courses of
  varying 132–236 px boards, staggered end joints, two grain streaks per board
  and deterministic per-board tone; tiled floors moved to 46×34 px with grout
  shading and speckle; carpet pitch tightened with a border. Added plaster
  courses and stepped corner occlusion on walls, a five-band wall-to-floor
  contact shadow, side falloff across the floor, and turned the window wedge
  from a grey shadow into a two-layer warm daylight shaft. **Furniture:**
  `addFurnitureBlock` now casts a floor contact shadow and shades proportional
  to the object (the fixed 4 px bands vanished on anything sofa-sized), with a
  panel seam on wide pieces; `addRug` gained a woven cross-hatch and a banded
  diamond motif. **Markers:** the square white text background was replaced by
  a rounded cream nameplate with ink border, gold base and drop shadow, plus a
  soft glow ring on the active marker. The nameplate is drawn with `Graphics`,
  **not** `NineSlice` — NineSlice is WebGL-only and this build runs Canvas2D in
  headless and on GPU-less machines, where a nine-slice plate renders nothing;
  the first attempt shipped exactly that bug and the production capture caught
  it. The player guide triangle dropped from depth 100_300 to 100_050 so it no
  longer covers the name it is pointing at. **Harness:** `walkToAxis` pushed a
  single axis with no way around a solid, so the Chapter 2 travel leg failed
  about half of all runs depending on where the previous leg left the player —
  `main` was intermittently red at its own gate. It now side-steps
  perpendicular when an attempt makes no headway. **This was reproduced on
  clean `HEAD` in a throwaway worktree before being touched**, so it is a
  pre-existing defect and not a regression from this session. Verification ran
  against a privately built and served bundle to avoid racing the other agent:
  strict typecheck, 75 tests, 0 vulnerabilities, and three consecutive
  60/60 production-browser runs after the fix (it failed 2 of 4 runs before).
  Desktop interior, estate and nameplate captures were visually inspected at
  1:1 and cropped. No human playtest, real-device, screen-reader, Miora, or
  cross-game equivalence claim.
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
