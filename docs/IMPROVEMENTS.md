# Kampung SG — Improvement Backlog

> **For any agent or contributor picking this up.** This is the single source of
> truth for outstanding work on Kampung SG. Read this file before proposing
> changes. It was compiled 2026-08-01 from four independent audits (art,
> UX/accessibility, code health, content/narrative) and a merge pass.

## How to use this file

1. **Check "Already done" below before starting anything** — a chunk of P0 has
   already landed and the audit text further down still describes the old state.
2. Work top-down: P0 before P1 before P2. Inside a tier, order is by score-per-hour.
3. **Never break these project constraints**, which are published in the deck and
   the design docs: no timer, no failure state, no energy system, no punishment,
   no dark patterns, no medical/cognitive/dementia claim, no data collection, no
   account, no backend, no runtime LLM. Older adults are contributors and
   experts, never passive recipients.
4. After ANY change, re-run the full gate and re-sync anything that quotes a
   number (see "Verification" at the end).

## Verification gate — run all of these

```bash
npm run typecheck    # strict TypeScript
npm test             # unit tests
npm run build        # production build
npm audit            # dependency audit
npm run smoke        # self-contained headless-Chrome run of the built bundle
```

`npm run smoke` builds, starts its own preview server, drives a full playthrough
plus an isolated demo playthrough, and writes fresh screenshots to
`docs/screenshots/`.

**Current verified architecture (2026-08-03):** the sandbox loop described by
the original audit has been superseded by a prologue, three chapters, an
ending, KampungMind, versioned persistence, and enterable estate/interior
scenes. Historical findings below remain useful as an audit record; line
numbers and `sandboxState`/`SandboxScene` references describe the earlier
baseline rather than current code.

## Already done (do not redo)

| Item | Landed |
| --- | --- |
| Talk to residents rather than fixed ground positions; residents stop and face the player | 2026-08-01 |
| Visual-novel dialogue: portraits, line-by-line advance, typewriter, choices withheld until read | 2026-08-01 |
| Map expanded to 2560×1600 with six new districts; five ambient neighbours added | 2026-08-01 |
| Custom art pass: palette constants, ground tufts/patches, kerbed paths, laundry poles, striped awnings, layered rain trees, structure outlines | 2026-08-01 |
| Character pass: ink outlines, eyes, four skin tones across eight residents, player no longer the palest person on screen | 2026-08-01 |
| Typography: monospace debug labels replaced with estate signage; in-world text raised to 14px+; UI type scale raised; `"OK"` badge replaced with a check glyph | 2026-08-01 |
| Focus ring removed from the world canvas (kept on buttons/links) | 2026-08-01 |
| **P0-3** dialogue focus trap now filters `display:none` | 2026-08-01 |
| **P0-4** dialogue line node has `aria-live` and is the `aria-describedby` target | 2026-08-01 |
| **P0-8** 320px meter-row overflow fixed | 2026-08-01 |
| **P0-12** Singlish error (`kopi-o kosong, half sugar`) and state-false neighbour lines fixed | 2026-08-01 |
| **P0-13** resident follow-up lines are choice-aware | 2026-08-01 |
| **P0-15** touch d-pad tracks held directions, so diagonals work | 2026-08-01 |
| **P0-16** player shirt hex typo; per-frame label hiding; ending could be un-ended | 2026-08-01 |
| **P0-17** duplicate interact button hidden on touch devices | 2026-08-01 |
| **Judge path** — `?demo=1` compresses the session (2-of-3 evening, faster walk) for timed judging; documented in `docs/DEMO_MODE.md`; 5 unit tests + 1 smoke check | 2026-08-01 |
| Solid world — collision for tree trunks, tables, playground/fitness equipment, walkway posts, garden fence with gate, bus-stop furniture | 2026-08-02 |
| **Roadless campaign correction** — retired the old ambient bus after the campaign map removed its vehicular lane; the estate now explicitly reports zero motor routes instead of sending traffic across a garden | 2026-08-03 |
| Hold-Shift hurry (215 -> 260 px/s, no stamina); hints updated on title + canvas label | 2026-08-02 |
| Journal status circles replaced with slim colour-coded pills (OPEN / OPTION / done-check) | 2026-08-02 |
| **Campaign upgrade** — versioned pure reducer; prologue, three chapters and ending; 8 optional resident routes; dynamic Main Story/Requests/People/Places Journal; Continue and confirmed Start Over; isolated demo state | 2026-08-03 |
| **KampungMind** — authored NPC profiles, memories and intent scoring with stable deterministic ties; no runtime generation or network | 2026-08-03 |
| **Enterable estate** — exterior plus corridor, four flats, workshop, community centre, kopitiam, provision shop, hawker centre and prayer hall; shared controls, collision, transition latch and correct return doors | 2026-08-03 |
| **Character and world consequences** — varied code-drawn resident details plus ramp, route, kitchen, workshop, gathering and lighting progression | 2026-08-03 |
| **Original pixel-art/runtime pass** — six directional player frames, larger varied residents, shared light/shade/outline rules, three tree silhouettes, HDB/estate dressing, room-specific patterned floors and landmark furniture; all 12 locations visually inspected from production captures | 2026-08-03 |
| **Automated performance budget** — no per-frame movement-vector allocation, squared/throttled proximity scans, baked exterior layers, reusable room backdrop, and 120-frame active-movement profiling folded into the existing 60-check smoke gate | 2026-08-03 |
| **Living-estate payoff** — deterministic resident blinks and facing, progressive HDB window lights, quieter world markers, reduced evening wash, and an actual post-ending void-deck gathering around a shared table and string lights | 2026-08-03 |
| **Low-end regression signal** — the active movement profile now repeats under a 4× CDP CPU throttle with a separate p95 budget, still inside the existing 60-check headline | 2026-08-03 |
| **Resident life pass** — all named residents gained directional walk/blink frames and short deterministic estate routes; proximity pauses movement and faces the player while sprite, shadow, NPC hit point and marker remain synchronized; smoke snapshots and profiles the behavior without adding a production debug hook | 2026-08-03 |
| **Living-environment pass** — 23 hand-placed flower clusters baked into the exterior tiles, seven two-frame HDB laundry lines, and two deterministic community cats; the full/demo smoke proves normal animation and reduced-motion stillness while keeping the same 60-check headline | 2026-08-03 |
| **East/south district pass** — code-drawn tray return, provision crates, mosaic dragon playground and exercise corner with collision/depth; production smoke physically walks to and captures both districts, caught and fixed a black-camera/stale-label exterior wake bug, and now guards rendered colour diversity | 2026-08-03 |
| **Scheduler-calibrated performance evidence** — preserves fixed 28/34 ms cadence budgets on normal hosts; if Chrome's title screen is already capped slower, requires game cadence within +3 ms plus independent 8/20 ms main-thread budgets | 2026-08-03 |
| **Baked terrain grammar** — deterministic 32 px grass variation, running-bond concrete/sheltered-walk pavers, kerbs, drains and utility covers across all four quadrants; smoke measures generated-texture colours/edges while retaining the same frame budgets | 2026-08-03 |
| **World-first quest Journal/HUD pass** — replaces the permanent desktop column with an accessible four-tab quest book at every width; selected quests show objectives, progress and tracking; the circular map follows outdoor movement and opens Places; rooms use full-width fit-to-viewport cameras; smoke proves keyboard tabs, focus/Escape/backdrop, live map movement and real 360 px game/Journal states | 2026-08-03 |
| **Player/control/entrance clarity pass** — persistent downward player guide; seven exterior doors centralized with their façade thresholds and 14 collision zones; Sound immediately restores world focus and movement; browser fullscreen fills the viewport while Escape restores Sound/Journal access | 2026-08-04 |
| **Tactile exploration/audio pass** — speed-responsive four-frame player cadence, deterministic idle blink, player-facing before interactions, six pooled grass/paving/indoor dust-and-fleck effects, three surface-specific synthesized footstep profiles from one reusable buffer, less UI reverb, wired interaction audio, and no repeated line-advance blip; smoke proves normal and reduced-motion behavior without increasing the 60-check headline | 2026-08-04 |
| **Tropical landscape/depth pass** — richer grass, baked path-edge growth and leaf litter, rebuilt rain-tree/palm/frangipani silhouettes with directional shadows, and 41 collision-aware shrubs/flower beds/pandan/hedges; smoke proves all four forms, 44 foliage colours, open district travel and unchanged frame budgets | 2026-08-03 |
| **Architectural identity/solidity pass** — code-drawn pixel signs and distinct Hawker/Kopitiam/Minah/Community/Prayer/Workshop/Block 12 façades baked into exterior tiles; aligned usable doors; 12 building collision shells with doorway gaps; smoke measures 55 façade colours, 218 edges, 26.1% dark pixels and a physical storefront stop | 2026-08-03 |
| **Visual-novel portrait pass** — 13 unique code-drawn resident/Voice busts plus an estate narration panel; authored hair, build, skin, age lines, accessories and role motifs; 940 px desktop staging and compact 360 px layout; smoke verifies dimensions, detail count, named traits and mobile fit | 2026-08-03 |
| **World-scale and movement-feedback pass** — responsive exterior framing at 1.32× wide / 1.22× tablet / 1× mobile while interiors retain their intimate framing; resize-latched scale/camera updates; rebuilt collision-aware layered pond with three deterministic rings; six-object walking-puff pool; smoke physically captures the pond and proves normal/reduced motion plus 78 obstacle bodies | 2026-08-03 |
| **Chapter 2 monsoon pass** — deterministic 64-object screen-space rain pool, wet paths, ten puddles, cool haze, warm dry-shelter masks, helped residents and cats under cover, and stored laundry; mobile keeps a lighter but legible density, reduced motion retains the wet story state without falling rain, and smoke profiles/captures all three presentations | 2026-08-03 |
| **Four-frame interaction-density pass** — player and every named resident now use four distinct walk phases; 14 zero-consequence estate details reveal one marker only on approach and open through keyboard/touch; four two-frame community vignettes show sweeping, noticeboard discussion, gardening and kopitiam conversation; smoke proves normal, reduced-motion and monsoon states | 2026-08-03 |
| **OpenAI visual-direction pass** — one generated neighbourhood style key, exact prompt, source references, accepted/rejected details and human translation decision are preserved; the generated image informed the four deterministic activity vignettes but was not mislabeled as Miora or dropped unreviewed into runtime | 2026-08-03 |
| **Estate story-cluster density pass** — a second, targeted OpenAI reference used three current gameplay captures; human review translated its cluster grammar into six original code-drawn prop forms placed 12 times, 26 baked drain grates, 28 baked leaf patches, and eight deterministic two-frame butterflies/dragonflies. Smoke proves 88 exterior props across 22 forms, 54 ground accents, 93 colliders, open full-campaign/district routes, reduced-motion stillness, monsoon storage, and unchanged frame budgets. A follow-up spatial audit moved all three bicycle racks onto marked outdoor verges and removed the roadless bus. This is a strong first P2-5 pass, not the original 4–5× raw-density target | 2026-08-03 |

**Biggest remaining items:** human accessibility inspection at 200% zoom,
reduced motion, screen reader and a real touch device; consented playtesting;
Miora-specific visual evidence; and performance verification on older
hardware. Repeated headless-Chrome runs
have stayed inside either the fixed cadence budgets or the same-run scheduler
baseline margin and independent CPU-work budgets. That does not substitute for
those human and real-device checks.

---

# Unified Improvement Backlog


**Repo:** `/Users/elbertwidjaja/Project/Tencent-Hackathon-9Aug`
**Compiled:** 2026-08-01, from four independent audits (art, UX/accessibility, code health, content/narrative).
**Baseline verified at compile time:** 65 unit tests passing (sandboxState 17 · audio 17 · matchEngine 31), `sandboxScene.ts` 1455 lines, `main.ts` 779, `index.html` 1425, HEAD `70768d6`.
**Judging weights this backlog optimises for:** Impact & Relevance 30 · Use of AI Tools 40 · Project Quality 30 · +5 social.

Items are deduplicated across all four audits — where three auditors found the same defect it appears once, with all evidence merged. Effort is one developer-hour, honestly estimated including verification.

> Historical snapshot: paths, line counts, and test totals in the unified
> backlog below describe the 2026-08-01 audit baseline. The completed-work table
> above and the verification section at the end are the current source of
> truth.

---

## If you only do five things, do these

| # | Bundle | Why this five | Est |
|---|---|---|---|
| 1 | **Rebuild the eight residents** — faces, four skin tones, three builds, age signalling (glasses, greying hair, apron, walking stick), ink outline, one correct shadow *(P0-1)* | The pitch is "older adults as visible contributors" and the game currently ships eight identical faceless blobs sharing one skin tone, with the player rendered as the palest person on screen. Hits Impact & Relevance (30) and Project Quality (30) simultaneously, and it is the first thing in every screenshot. | 6h |
| 2 | **The keyboard + screen-reader blocker bundle** *(P0-2, 3, 4, 5, 6)* — arrow-key capture, dialogue focus trap, dialogue live region, focus-ring contrast, primary-button contrast | `docs/ACCESSIBILITY.md` is a published deck asset. Today a keyboard user gets stuck on the choice screen (the decision moment of the game), a blind user hears "Continue, button" four times instead of the story, and the focus ring measures 1.66:1. A judge who reads the doc and then tests it finds five failures in ninety seconds. | 3h |
| 3 | **Bake the static world to textures and drop forced `Phaser.CANVAS`** *(P1-2)* | ~9,000 Graphics commands replay every frame — ~540k canvas ops/sec, most of them 2×6px grass tufts outside the viewport — with GPU batching explicitly disabled at `sandboxScene.ts:1436`. The stated audience is older adults on older phones. This is the difference between the demo running and the demo stuttering. | 4h |
| 4 | **The kampung-feels-like-a-place bundle** *(P1-7, 8, 9)* — eight NPC cross-reference lines, make the five ambient neighbours talkable, make the evening gathering physically gather | Highest depth-per-hour in the whole backlog. Eight strangers on a lawn become a neighbourhood, two-thirds of the best writing in the game stops being statistically invisible, and the emotional climax stops being a colour filter. Also supplies the video's money shot. | 6h |
| 5 | **The credibility sweep** *(P0-11, 12, 13)* — purge `"OK"` / `"  DONE"` / 11 debug map labels, fix `"Kopi-o kosong, half sugar"`, make `afterChoice` choice-aware so the world stops lying about mint and pandan | Each of these is individually a five-minute fix that a Singaporean judge catches instantly. `kosong` means *zero sugar*; the line is self-contradictory and it is the first ambient line in the game. `"OK"` at fontSize 10 is placeholder text shipped as final UI. | 4h |

**Five-thing total: ~23 hours.** That is the minimum viable "this is a finished product, not a hackathon blockout."

---

## P0 — Ship-blocking or embarrassing

Things that make the game look broken, contradict a published claim, or exclude a player outright.

| # | Item | Why it matters | Est | Risk |
|---|---|---|---|---|
| **P0-1** | **Rebuild character textures.** `createResidentTexture` (`sandboxScene.ts:469`) takes two params and produces eight identical faceless bodies. Add: eyes + mouth, 4 skin tones, 3 heights/builds, varied hair silhouettes, 2px ink outline, arms connected to torso (they currently float as yellow bars), age signalling on Mei/Ravi/Siti. Delete the baked clipped shadow at `:473` (centred x=4, width 34 → chopped at the texture's left edge) **and** the second runtime shadow at `:1054`; ship one correctly-offset shadow. | Impact & Relevance: the entire pitch is elder visibility, and nobody in the estate has a face or a discernible age. Accessibility: Mei's shirt measures 2.39:1 on grass, Ravi 2.87:1, against `ACCESSIBILITY.md:36`'s own legibility requirement — the outline fixes both the a11y failure and the "programmer art" read. | 6h | Med — one function feeds all 9 sprites. Regenerate screenshots; smoke only asserts canvas presence, so visual check is manual. |
| **P0-2** | **Release arrow-key capture and gate movement on focus.** `createCursorKeys()` (`sandboxScene.ts:399`) captures arrows on `window` for the scene's whole life with no `event.target` check. `setControlsEnabled` manages SPACE only. | Excludes keyboard users: tabbing to a volume slider and pressing Right does not move the slider (preventDefault) **and** walks the player east. Any arrow press anywhere in the document moves the character. Also a Space race — a focused journal button fires `tryInteract()` then a different `openInteraction()`. | 1.5h | Med — input regression risk. Re-run the current browser-smoke gate. |
| **P0-3** | **Fix the dialogue focus trap.** `trapModalFocus` (`main.ts:661`) filters `.hidden` and `:disabled` but not `display:none`, so `.dialog-advance` (`index.html:860`) stays in the focusable list. Filter on `el.getClientRects().length > 0`. | Tab dies on the choice screen — the single decision moment of the game — and Shift+Tab escapes the modal into the page behind it. | 0.5h | Low |
| **P0-4** | **Give dialogue a live region.** `#dialog-text` is `aria-hidden="true"` yet is the dialog's `aria-describedby` target (`index.html:1359, 1373`). `#dialog-text-a11y` holds the real line but has no `aria-live`. Add `aria-live="polite"`; repoint `aria-describedby`. | A blind player hears "Continue, button" four times through Aunty Mei's introduction. The narrative — the product — is silent. | 0.5h | Low |
| **P0-5** | **Restore and fix focus visibility.** Global ring is gold on cream = **1.66:1** (needs 3.0). And `index.html:77-80` sets `outline: none` on `#sandbox-stage:focus-visible` — the `tabindex="0"` element that *is* the game's keyboard control surface. Use `outline: 3px solid var(--ink)` (10.46:1) + `box-shadow: 0 0 0 6px var(--gold)`; inset ring on the stage. | Direct WCAG 2.4.7 AA failure on the primary control, against `ACCESSIBILITY.md:22`'s "clear visible focus". | 0.5h | Low |
| **P0-6** | **Fix primary-button text contrast.** White on `--coral #d96756` = **3.49:1** at 16–18px/800. Move to `--coral-dark #ad493d` (5.53:1) and shift the existing `box-shadow: 0 5px 0` to `--coral` to keep the depth. | Fails 1.4.3 AA on "Begin a neighbourhood day", "Gather for the evening" and "End the day" — the game's entry point and its ending. | 0.25h | Low |
| **P0-7** | **Raise every string to the team's own committed floor.** `ACCESSIBILITY.md:32` promises 16px narrow / 18px large. Shipping: meter labels **9.9px** on phone, journal instruction 12.2px, interaction prompt 12.8px, the only control hint 13.4px. In-world Phaser text: nameplates and speech bubbles 13px, choice labels 12px, the `"OK"` badge **10px**. | The most defensible single finding a judge can raise against the accessibility claim, and it is self-inflicted — the doc states the rule the build breaks. | 2h | Med — larger type reflows the topbar and journal. Re-check 320/360px after. |
| **P0-8** | **Fix 320px horizontal overflow.** `.meters { grid-template-columns: repeat(3, minmax(100px, 1fr)) }` (`index.html:380`) needs 317.6px; available at 320px viewport is 285.6px. `html { min-width: 320px }` claims support. Change to `minmax(0, 1fr)`. | Overflows on Galaxy Fold outer screen and any 320px device; 360px passes by 8 pixels of luck. `ACCESSIBILITY.md:35` promises no horizontal scroll at 360. | 0.1h | Low |
| **P0-9** | **Honour `prefers-reduced-motion` inside Phaser.** `main.ts:256` uses it only to skip the typewriter. Still running unconditionally: infinite pond ripples, two infinite tweens per butterfly, resident bob at 2.4 rad/s, 13Hz player squash-and-stretch, camera lerp, 2.6s full-screen colour tween. | Vestibular sensitivity is materially more common in the target audience — this is the largest motion risk in the product and the docs claim it is handled. Secondary win: the `repeat: -1` tweens mean the game never idles, burning full CPU and battery while the player stands still reading. | 1.5h | Low — gate at tween creation. |
| **P0-10** | **Make the meters reachable.** Across all 8 possible complete playthroughs, max achievable is Connection 6 / Purpose 5 / **Comfort 4** against `METER_MAX = 6`, and no run fills more than one. Either set per-meter maxima from actual reachable values, or drop the `/6` denominator and present growth rather than completion. Add a one-line legend — nothing in the UI explains what "Purpose 0/6" means. | A player who completes 100% of the content is shown a one-third-empty bar labelled *Comfort* in a game about ageing. That is an accidental failure state inside a product that publicly commits to having none — a judge can read it as the exact dark pattern the team promised to avoid. | 1h | Low — `sandboxState.test.ts:74-76` asserts against `METER_MAX`; update tests with the change. |
| **P0-11** | **Purge placeholder and debug text from the world.** Delete the 11 monospace map labels (`HDB COMMONS`, `VOID DECK`…), the `"OK"` badge at fontSize 10, and the `"  DONE"` string suffix. Replace zone identity with architecture and colour temperature; replace completion with a visual state change (a lit lamp, a filled notice case, a finished bed). | The loudest "level editor / debug view" tell in the build. `hero-day.png` shows the world label "VOID DECK" and the HUD chip "VOID DECK" in frame simultaneously; `hero-evening.png` renders `"OK"` as an illegible smudge. This is what a judge screenshots. | 1h | Low — browser-smoke asserts prompt strings, not map labels; confirm before deleting. |
| **P0-12** | **Fix the Singlish error and the state-false lines.** `sandboxScene.ts:148` — *"Kopi-o kosong, half sugar"* is self-contradictory (`kosong` = zero sugar; half sugar is *siew dai*). `sandboxScene.ts:166` — *"Aunty Mei gave us pandan from the garden"* is false at load and false in the flowers branch. `sandboxState.ts:55` — *"Two days and the block is already…"* is triggerable four seconds after the choice. | A Singapore-set entry judged in Singapore, and the kopi error is on the first line of the first ambient neighbour. Pure credibility loss for a five-minute fix. | 0.5h | Low |
| **P0-13** | **Make `afterChoice` and `completedLines` choice-aware.** `applyActivityChoice` already receives `choiceId`, and `EVENING_MOMENTS` already proves the pattern. `sandboxScene.ts:68` currently promises *"Taste the mint next week"* in the flowers branch, where no mint exists. | The world contradicts the player's own decision moments after they make it — it makes the choice feel cosmetic, which undercuts the agency pillar. ~20 LOC on plumbing that already exists. | 1.5h | Low |
| **P0-14** | **First-run objective + a touch control hint.** The only statement of the goal is `#day-progress`, which lives inside a journal that is a closed off-canvas drawer below 1000px. `.control-note` names WASD/arrows and never mentions the on-screen d-pad. | A phone player currently sees three unexplained meters, a character and a map, with no goal and no stated controls. The one thing carrying onboarding today is accidental — the player happens to spawn 85px from Uncle Ravi against a 130px talk radius. | 2h | Low |
| **P0-15** | **Fix the touch d-pad release bug.** Every `pointerup`/`pointercancel` in `main.ts:746-761` calls `stopMovement()` unconditionally, so releasing one of two held buttons halts the player. Track pressed directions. | Diagonal movement is impossible on touch, and the d-pad behaves as if it is broken. 4-way movement across a 2560px map is already ~12 seconds end-to-end. | 0.5h | Low |
| **P0-16** | **Three one-line embarrassments.** (a) `sandboxScene.ts:442` — player shirt is `0x173f5f`, one hex digit off the brand `0x173f4f`. (b) `sandboxScene.ts:999/1162` — `marker.label.setVisible(false)` every frame means "Noticeboard", "Shaded route" and "Garden" **never render**. (c) `main.ts:626-636` — pressing Escape on the ending screen and reopening it reverts the completed ending back to "Keep exploring". | (a) the protagonist wears a typo; (b) three of four activity markers have no label at all; (c) the game's ending can be un-ended. | 0.5h | Low |
| **P0-17** | **Hide the duplicate interact button on tablets.** `.touch-controls` show at any width under `@media (pointer: coarse)` but `.interact-button` only hides at ≤680px. | An iPad — a very likely demo device for this audience — shows a d-pad, a "Talk" button and an "Interact" button at once. | 0.25h | Low |

**P0 total: ~20 hours.**

---

## P1 — Highest score-per-hour

The items that most move Impact (30), Use of AI Tools (40) and Project Quality (30).

| # | Item | Why it matters | Est | Risk |
|---|---|---|---|---|
| **P1-1** | **Render the journal from `ACTIVITIES`, and merge the seven content sites into one chapter module.** `renderJournal()` does `byId(\`journal-${activity.id}\`)` and `byId` **throws** (`main.ts:36-40, 444`), against hand-authored `<li>`s in `index.html:1296`. An activity is currently declared in seven unlinked places; two of them (`EVENING_MOMENTS`, `PORTRAIT_PALETTE`) fail *silently*. | Adding a single Chapter 2 activity today throws **after** state has mutated and **after** the world change has been drawn — unrecoverable soft-lock, mid-transaction, controls disabled. Three chapters × ~4 activities = ~84 hand-synchronised edit sites. This is the enabler for everything the user is planning. | 4h | Med — touches journal markup and state. Add exhaustiveness tests (every activity has an evening moment per choice, a portrait, a world position, a journal line). |
| **P1-2** | **Bake the static world to tiled textures; drop forced `Phaser.CANVAS`.** Draw once into `this.make.graphics()` → `generateTexture()` → add as Images → destroy the graphics. Tile as 4× 1280×800 (older mobile GPUs cap `MAX_TEXTURE_SIZE` at 2048). Then reconsider `Phaser.AUTO`. | ~9,000 draw commands per frame → 1 blit. Graphics objects are never camera-culled, so most of that is 2×6px grass tufts outside the viewport. `sandboxScene.ts:1436` disables GPU batching entirely while still shipping the whole WebGL renderer unused. The audience is explicitly older adults on older phones — this is an Impact item as much as a Quality one. | 4h | **High** — renderer switch. Verify smoke, verify visuals on a real phone, keep the CANVAS fallback path available. Do this on a branch. |
| **P1-3** | **Build the covered linkway properly, and introduce real darks.** `drawShelteredRoute` is currently a teal bar on posts that reads as a fence. A real linkway is repeating Y/L columns + a pitched roof, and the payoff is the **striped bands of shade it casts on the concrete**. Then add darks generally: void-deck ceiling, doorways, drain interiors, under eaves and canopies. Target ~15% of pixels below L\*40. | ~95% of the 4.1M-pixel world is currently one of three near-identical light values; the darkest large area is `0x9c8874`. That is *the* reason the screenshots look washed out. This one prop delivers Singapore identity, fixes the value-contrast problem, and is literally Mdm Siti's activity. Highest single visual ROI in the file. | 5h | Low |
| **P1-4** | **`palette.ts` + a `block()` helper + one outline rule + a compliance test.** 147 colour calls, **87 unique literals**, against a bible that defines 8 — and the comment claiming "Everything drawn in this scene comes from here" is false. Ship: the 8 bible colours plus a generated 5-step ramp each; `block(g,x,y,w,h,fill)` that bakes cast shadow → body → lit top/left band → shaded bottom/right band → outline; `outlineOf(fill)` derived, two weights only (3px props, 4px structures); a unit test that greps for raw `0x` literals. | Project Quality: `index.html`'s UI follows the bible almost exactly while the game world does not — the HUD looks designed and the canvas inside it looks generated, and that mismatch is visible in every screenshot. Replacing ~40 bare `fillRect` calls with `block()` transforms the look in one commit. The palette test is a cheap, judge-visible quality signal that permanently prevents the drift. | 6h | Med — wide diff across the draw code. Land after P1-2 so the bake catches it. |
| **P1-5** | **Depth layering and collision.** Everything renders on one `Graphics` at depth 0 (`sandboxScene.ts:491`) with the player at `y+24`, so **the player renders in front of every tree canopy, awning and roof, permanently**. Only 6 objects have collision — the player walks through 25 trees, the swing set, climbing frame, exercise machines, bus shelter, walkway posts, 6 garden beds and the memory table. Split into y-derived depth layers; extract `depthFor(y, layer)` to replace the scattered magic numbers (842, 348, 810, 553, 99_000). | The world has no depth and no solidity — it reads as a diorama the player floats over. Also the precondition for three chapters of props not breaking an undocumented, unenforced depth convention. | 3h | Med — collision changes can trap the player. Walk the full map after. |
| **P1-6** | **Rework golden hour.** Replace the single flat `0xffa95e` MULTIPLY at alpha 0.42 / depth 99,000 with three layers: warm multiply on ground/structures only (below the text layers), an additive `#F2B84B` rim pass on upper-left edges, and **windows that light up** — make daytime windows unlit, then switch a growing subset to gold as each activity completes. Lengthen and shear the shadows. | The current overlay desaturates rather than warms: blue windows go dead grey, Ravi's teal shirt goes grey-green, nameplates go muddy. It reads as a dust storm at the emotional climax. And it sits **above every in-world nameplate, speech bubble and label** — shifting the contrast ratio of all in-world text at the exact moment the deck calls the payoff. Windows turning on one by one is a far stronger "you changed this place" beat, for ~15 lines. | 3h | Low |
| **P1-7** | **Give every NPC one line about another NPC.** Eight strings. Total current cross-references: three — one of which points at Mdm Tan, who does not exist in the game, and one of which points at Wei Ling 500px away and never connects. | A kampung is definitionally people who know each other's business. This is the highest depth-per-word change available and it will do more for "a place with a history" than the 2.56× map expansion did. Impact & Relevance. | 1h | Low |
| **P1-8** | **Make the five ambient neighbours talkable.** They already have three lines each and the dialogue overlay + portrait generator already exist. Cheapest variant (~6 LOC): cycle their lines every 4s while the player is nearby. Better: a parallel conversation list alongside `WORLD_INTERACTIONS`. | Today `updateNeighbours` advances `lineIndex` only on a hidden→visible transition, so reading all three of Uncle Seng's lines requires leaving 190px and returning twice, with no cue that he has more to say. **A typical player reads 5 of 15 ambient lines — two-thirds of the best writing in the game is never seen.** It also removes the two-tier citizenship problem (three people you can talk to, five who talk *at* you) and kills the false affordance in the prompt "Move closer to a neighbour or activity", which does nothing for five of the eight. | 3h | Low |
| **P1-9** | **Make the evening gathering actually gather.** When `eveningReady` fires, retarget all 8 NPCs' `home`/`target` to void-deck positions and let the existing wander system walk them there. | The climax is currently a 42%-alpha orange rectangle and a paragraph — told, not shown, at the moment where showing matters most. The movement system already exists; ~15 LOC. Biggest emotional payoff per line of code in the backlog, and it is the video's money shot. | 2h | Low |
| **P1-10** | **"Block Notes" — one findable memory per empty district.** A small marker at the bus stop, playground, community centre, pond, kopitiam, provision shop and exercise corner; 1–2 sentences of estate history each, collected into a journal list ("6 of 8 found"). Reuses the existing marker + dialogue overlay + journal list; no new art. | Four districts contain literally zero content after the expansion, including the **community centre — the second-largest building in the game and the real-world institution for exactly this brief — which is a solid collision box with a drawn door and no way in.** This converts walking into discovery and is literally "the place has a history". **Ending the day with 0 of 8 must be fine** — no nudge, no percentage, no failure. | 5h | Low |
| **P1-11** | **Navigation: minimap, off-screen indicators, directional journal hints.** At zoom 1 a 1512px laptop sees 45%×47% of the world; a 360px phone sees **13%×29%**. All four activities sit in a 692×383px box = **6.5% of the world**; activity density dropped 61% with the expansion. | The entire eastern half and the entire south contain zero interactions. A phone player who walks east past the kopitiam is four to five screens from anything actionable with no cue they have left the game. The journal names places but never directions; the area chip says where you *are*, never where anything *is*. | 5h | Med — ship with P1-14 (zoom), since raising zoom makes navigation worse. |
| **P1-12** | **Player identity cold open — an RC (Residents' Committee) volunteer on a walkabout.** ~4 lines before the world loads. | The player is currently a nameless stranger (*"Ah! A face I do not know"*) who nonetheless decides what goes in the community garden, on the void-deck noticeboard, and where the town council places benches. This one framing explains why you are a stranger, why you carry a journal, why you have decision authority, why Siti's town-council line lands, and why an evening gathering happens — with zero new systems. | 2h | Low |
| **P1-13** | **Rewrite the patronising lines, the three "nobody asked" beats, and the duplications.** Worst offenders: *"My hands still know what to grow, though"* (concede-then-console), *"Now somebody is finally writing it down"* (elder waited years for a stranger to validate her), *"A thing that still works is a thing somebody kept working"* (fortune cookie whose metaphor is transparently about the speaker), *"There is no timer on the table and nobody is keeping score"* (the design doc talking through a character). Plus the collisions: Mei and Siti share an identical "four o'clock shade + bench" insight; "thirty-one years" appears 4×; "forty years" 2×. | Collectively the three "nobody ever asked" beats establish that the estate failed its elders until the player arrived — a mild white-saviour shape inside a game explicitly about elders as contributors. Directly at risk under Impact & Relevance (30). Keep Ravi's first one; rewrite the rest. | 2h | Low |
| **P1-14** | **Camera: responsive zoom, faster lerp, kill the shimmer.** `setZoom(1)` makes the 32×42 player **2.7% of desktop screen width**; `startFollow(…, 0.09, 0.09)` leaves the camera ~40px behind while walking and sliding 0.4s after stopping; `roundPixels: true` then quantises every frame so 1px grass detail and 13px text shimmer in motion. Target ~1.75–2 desktop, 1.25–1.5 phone; lerp ~0.15 with a small deadzone. | The pixel art reads as noise rather than art at current scale, and it is the first thing a judge sees in a screenshot. Once P0-1 lands, the character work is invisible without this. | 1.5h | Med — pairs with P1-11. |
| **P1-15** | **Cover the memory table with tests and fix its focus behaviour.** `grep -c memory scripts/browser-smoke.mjs` = 1, and that hit is a prompt-string assertion — the overlay is never opened. Zero unit tests. Also: on a mismatch all 8 cards become `disabled`, focus falls to `<body>` for the full 1000ms delay, and the 1s timer then **steals focus back to a card** even if the player has tabbed to "New shuffle". And `renderMemoryBoard` does `innerHTML = ""` on every flip, destroying and rebuilding 8 buttons four times per pair. | This is the only place in the codebase with an async timer racing user input — the single most likely spot for a live-demo bug — and it is the least tested at both levels. The focus steal is a WCAG 3.2.5 failure; the rebuild resets NVDA/VoiceOver virtual cursors on every click. | 3h | Low |
| **P1-16** | **Modal hygiene: inert background + focus restore.** The three overlays are siblings of `<main>`, which is never `aria-hidden`/`inert` while a modal is open. And `closeDialog`/`closeMemory`/`closeEvening` all call `focusWorld()` — open an activity from a journal button and you are dumped on the canvas with your place lost, every time. Store and restore the trigger element. | Screen-reader users wander into the HUD behind the dialogue; keyboard users lose their place after every single activity. Both are basic modal contract failures a judge testing accessibility will find immediately. | 1.5h | Low |
| **P1-17 (done)** | **Fix the keepsakes.** `keepsakes.ts` now defines six inclusive code-native line glyphs rather than platform emoji, and the optional table uses all six pairs. | Keeps the optional activity visually consistent without treating either code-drawn or reviewed AI-generated assets as forbidden. | Done | Verified by the match-engine suite. |
| **P1-18 (done)** | **Refresh the AI evidence for the art pass.** The evidence now distinguishes the procedural runtime, the real OpenAI neighbourhood style-key run, the human curation decision, and the still-unmet Miora-specific evidence item. | **Use of AI Tools is the single largest bucket at 40 points**; exact prompts, outputs, failures, accepted ideas and rejected ideas are stronger than inflated tool claims. | Done | OpenAI usage is genuine; no Miora output is claimed. |
| **P1-19** | **Decide the chapter structure before writing chapter content: three times of day on one map, not three maps.** Ch1 Morning (existing, north-west). Ch2 Afternoon — Rosnah's *"That new family in Block 12 — nobody has said hello yet. Somebody should"* becomes the inciting line, Wei Ling is the destination, activities live in the **east** (kopitiam, provision shop, playground). Ch3 Evening — the gathering; activities in the **south** (community centre unlocked, exercise corner, bus stop), with Ch1–2 choices determining who turns up. | Reuses 100% of the procedural art, needs no save file to feel different, and fixes the two biggest structural problems at once: it distributes activities across the whole map instead of 6.5% of it, and it pays off five hooks that are already written and currently dead ends (*"one very memorable Chinese New Year"*, *"Twice it mattered"*, *"My son says retire lah"*, Yusof's uninvited repairs, Block 12). Depends on P1-1 landing first. | 2h | Low — this is a decision + a written plan, not code. |

**P1 total: ~59 hours.**

---

## P2 — Real improvements, safe to defer

| # | Item | Why | Est | Risk |
|---|---|---|---|---|
| P2-1 | **Void-deck fit-out**: letterbox bank, glass notice case on legs (this *is* Uncle Ravi's activity and it is currently a brown rounded rect), ceiling fans, stone chess table, stacked red chairs, bicycle rack, floor-tile grid | The most story-important location is the least-detailed one | 4h | Low |
| P2-2 | **Dragon playground with mosaic tiles + sand pit** | The strongest emotionally-loaded image available to put in front of a Singaporean judge on an "Age Well" brief; highest-ROI hero prop after the linkway | 4h | Low |
| P2-3 | **Real exercise-corner machines** — air-walker, waist twister, shoulder wheel, on a green rubber mat with a yellow border | Every Singaporean over 50 recognises the air-walker instantly; currently two abstract bars and two circles | 2h | Low |
| P2-4 | **Monsoon drains along path edges; delete the road centre-lines** (there are no vehicles, and at y=1200 the dashes run 0→2560 while the path is 150→2430, painting dashes onto bare grass) | Instantly tropical-Asia for ~1 strip per path; gives the huge empty plazas an edge condition; removes a visible bug | 2h | Low |
| P2-5 (partial) | **Fill the dead plazas.** The 2026-08-03 story-cluster pass added 12 composite placements, 54 baked ground accents, and eight ambient insects while preserving clear routes. The original 4–5× raw-density target remains intentionally unmet; continue with a few district-specific clusters only if real-device performance and route clarity stay green | The lower-left 40% of the old frame was empty beige; the new clusters materially improve it without uniform clutter | 2h remaining | Low |
| P2-6 | **Tree variation** — 3 species, flat wide rain-tree crown (currently a broccoli lollipop), scale/tint/rotation jitter | 25 trees from one identical call is the literal definition of procedural art to a viewer | 2h | Low |
| P2-7 | **Corridor potted plants, painted block number, town-council livery, community cat, bicycle racks** | High recognisability per pixel; makes the estate look *administered* rather than invented | 3h | Low |
| P2-8 | **Hawker / kopitiam / provision-shop dressing** — numbered stall plates, roller shutters, tray-return station, kopi cups, a tissue packet choping a seat, red awning valance, gas cylinders | The kopitiam's marble tables with fixed swing-out stools are the best-observed prop in the game; extend that quality outward | 3h | Low |
| P2-9 | **`localStorage` persistence + rename "Exit" → "Back to title" with a confirm** | "Exit" sits 8px from "Journal", silently destroys the day, and nothing but audio volume is saved. A refresh or a phone call loses the session. Becomes mandatory infrastructure with three chapters | 3h | Med — save-format decisions are hard to reverse; version the schema from day one |
| P2-10 | **Vitest → jsdom; extract `dialogueController.ts` and `sceneGeometry.ts`** | **Zero of the 65 tests import `sandboxScene.ts` or `main.ts` — 2,234 lines (68% of TS) have no unit test.** This makes ~500 lines of `main.ts` testable in-process and converts the top-3 untested risk paths (nearest-interaction scoring, `areaAt`, wander) into pure functions | 5h | Low |
| P2-11 (mostly complete) | **Audio polish:** visibility now suspends/resumes the audio context; dialogue advances no longer replay the 440 Hz open blip; `interact` is wired; UI tones bypass reverb; the global send is reduced; and surface footsteps reuse one buffer. Optional remaining refinement: authored voice-leading for the ambient pad | The live-demo burst and repetitive UI risks are closed; pad composition can still improve | 0.5h | Low |
| P2-12 | **Text speed control (Slow/Normal/Instant) + dialogue history/backlog** | The typewriter is a fixed 1.44s per line regardless of length, and the only skip is a click on an undiscoverable `<div>` with no role and no cursor change. Each intro is 4 lines; miss one and it is gone. Backlog is standard VN convention and matters more, not less, for this audience | 3h | Low |
| P2-13 | **World announcements for screen readers**: `aria-live="polite"` on the area chip, announce the nearby target on change | Today the world is genuinely invisible and `ACCESSIBILITY.md`'s mitigation is "use the journal buttons" — i.e. skip the entire game and press four buttons | 1h | Low |
| P2-14 | **Prefetch the scene chunk + real load progress.** `sandboxScene-*.js` is 1.5MB raw / 346KB gzipped, dynamically imported on Start, with **no `modulepreload`/`prefetch` in `dist/index.html`**, no progress indicator, no timeout — and `btnStart` re-enables in `finally` before `onReady` fires, so the state lies | A judge on hotel wifi sits on a disabled button reading "Opening the neighbourhood…" with no feedback | 2h | Low |
| P2-15 | **Delete or wire up the dead config and dead code.** `config.ts` `pairCount` (says 6, game uses 4), `previewDurationMs`, `hintDelayMs` — all unread. `matchEngine.replayGame`, `GameMode: "together"`, `currentPlayer` — unreferenced outside their own tests, and **~6 of the 65 tests cover them**. Also `completedActivities`, `ripples`, `focusPlayer()` in the scene | The config file already contradicts the game, and unreachable code inflates the "65 tests" figure that appears in the deck. Honest 59 beats padded 65 under Project Quality | 1.5h | Low — deleting tests lowers the headline number; update the deck in the same commit |
| P2-16 | **Sweep the correctness/leak table**: `JustDown` short-circuit in `.some()` (`sandboxScene.ts:333`), non-delta-scaled marker lerp (`:1165`, 2× faster at 60fps than 30), tween stacking on bubble-radius crossings, `Vector2` allocated every frame (`:314`), `onStep()` firing 60×/s into a 290ms throttle (`:327`), destroy-then-`innerHTML=""` teardown race (`main.ts:194`), `announceTimer` never cleared on `returnToTitle()`, `KampungAudio.dispose()` called from nowhere | Individually minor, collectively the difference between "works" and "engineered". Several are one-line | 3h | Low |
| P2-17 | **Unify the title-screen CSS illustration with the in-game art style** | The title promises one look and the game delivers another; with original art now in flight this is the moment to converge | 2h | Low |
| P2-18 | **Small-phone vertical fit + tap-to-move / tap-to-interact.** `.world-shell { min-height: 470px }` plus a two-row topbar ≈ 590px against ~560px visible on a 360×640 Android, so the page scrolls and the d-pad starts below the fold — and `touch-action: none` on the stage leaves only the topbar draggable. Drop `min-height`. Add tap-to-move, the first instinct on touch | Currently the d-pad is the smallest, most demanding target in the product (52×52, 5px gaps) and it is the one a player with tremor must use continuously | 4h | Med — `touch-action: none` also blocks pinch-zoom, removing the standard low-vision magnification route; solve both together |
| P2-19 | **Sheared cast shadows + contact shadows on everything vertical** — replace the axis-aligned drop-shadow rects (which read as CSS stickers) with `fillPoints` quads; two stacked ellipses at the base of every post, bench, stall, table, crate, pillar, machine and person | Form and contact shadows are what make flat fills read as objects | 3h | Low |
| P2-20 | **Pay off two dead hooks** — easiest is Rosnah → Wei Ling. Introduce them and both characters gain a reason to exist | Proves the world has causality, not just flavour. ~6 strings + 1 flag | 1h | Low |

**P2 total: ~54 hours.**

---

## P3 — Only with a comfortable deadline

| # | Item | Est |
|---|---|---|
| P3-1 | **Data-driven prop library** — `PROPS: {kind, x, y, seed}[]` + a `drawProp()` switch, plus `WORLD_LAYOUT` and `AREAS: {name,x,y,w,h}[]` replacing the 12-branch `updateArea` coordinate cascade and ~700 lines of inline `fillRect` literals. Would let three chapters restage the estate (rain, night, festival) by swapping a placement table and a lighting profile. **Do it before Chapter 2, not after** — if Chapter 2 is happening, promote this to P1. | 8h |
| P3-2 | **Rain state for Chapter 2** — puddles, ripples, everyone gathered under the linkway. Strongest atmospheric SG marker available, and it makes Mdm Siti's shelter route mechanically meaningful | 6h |
| P3-3 | **Baked `RenderTexture` grass/concrete tiles + a Bayer 4×4 dither helper** for path→grass edges, water and shade bands; concrete expansion joints every ~96px (concrete without joints is the #1 tell of fake concrete) | 4h |
| P3-4 | **Commit to one projection** — rewrite the HDB as a 3/4 block rather than a facade lying on the ground; trunk plants at the base, crown offsets up-and-left. Four projections currently coexist and the bible's stated ~35° appears nowhere | 6h |
| P3-5 | **PWA manifest + apple-touch-icon** — `theme-color` is set with nothing behind it; no add-to-homescreen story for a phone demo | 1h |
| P3-6 | **Multi-storey carpark with sloped ramp and numbered lots**; corridor parapet, handrail and service pipes down the block | 4h |
| P3-7 | **Pause state, camera recentre after a journal-initiated activity, and portrait pose/blink changes between intro/choice/response** | 3h |
| P3-8 | **Polish sweep**: `aria-valuetext` on meters, `role="group"` on `.meters` and `.touch-controls`, `role="application"` on the stage, `h1` in `#screen-sandbox`, skip-link retarget, `aria-expanded` on desktop journal, mobile drawer focus trap, `announce()` 40ms collision, remaining 3.2–3.8:1 text (`.journal-status` DONE, `.eyebrow`, `.dialog-kicker`, `.dialog-progress`) | 4h |

---

## Explicitly NOT doing — and why

| Not doing | Why |
|---|---|
| **A timer, score, streak, star rating or difficulty setting on the memory table** | Violates the publicly committed "no timer, no failure state, no punishment". `DEFAULT_CONFIG.previewDurationMs` and `hintDelayMs` exist but are unread — **delete them, do not wire them up.** |
| **A completion percentage, "you missed 3 notes" nudge, or any collection meter on Block Notes** | Reintroduces the failure state through the back door. Ending the day having found 0 of 8 must be a legitimate ending with no negative framing. |
| **An energy / stamina / hunger system, or any resource the player can run out of** | Committed constraint. Also actively hostile to the audience. |
| **Runtime LLM dialogue or "AI neighbours"** | Committed constraint: no runtime LLM, no backend, no network calls at play time. AI tooling is credited for *authoring* the build, which is what the 40-point criterion actually rewards — and the log already documents it honestly. |
| **Any memory-training, cognitive-benefit, dementia-prevention or health-outcome claim** | Committed constraint and a regulatory risk. The memory table is a shared-keepsake conversation, not an assessment. Keep the word "memory" attached to *keepsakes*, never to *function*. Do not let a rewrite of the memory-table framing drift here. |
| **Accounts, leaderboards, analytics, telemetry, or any data collection** | Committed constraint. `localStorage` (P2-9) is device-local save state, not collection — keep it that way and say so. |
| **Claiming Miora-generated art in the deck, video or social post** | `docs/submission/DECK_COPY.md:224` and `VIDEO_SCRIPT.md:326` are deliberately written so no false claim can ship. **Zero Miora assets have been generated.** If that is still true at submission, the conditional branches stay deleted. Do not "round up" the recent procedural art pass into an image-generation claim. |
| **Claiming older-adult playtests** | None have occurred (`AI_USAGE_LOG.md`, `DECK_COPY.md:413`). The docs are honest about this today; keep them honest. |
| **Reviving Together Mode / `replayGame` / `currentPlayer`** | Shipped-but-unreachable code covering ~6 of the 65 tests. Delete it (P2-15) rather than build on it — a second player mode before three chapters exist is scope suicide. |
| **Expanding the map again, or adding more ambient one-liners to empty districts** | The 2.56× expansion added 0 activities and dropped activity density 61%. More one-liners is what created the problem. Fix density first (P1-8, P1-10). |
| **Building three separate maps for three chapters** | Three times of day on one map (P1-19) reuses 100% of the art and needs no save file. Three maps triples the art surface for no narrative gain. |
| **Copying Stardew Valley or any existing game's art** | The user's explicit direction, and the bible's. The palette module + `block()` helper (P1-4) is the route to a distinct, defensible original look. |
| **Removing the journal shortcut that completes activities without moving** | It is the accessibility route and the live-demo backup (`DEMO_SCRIPT.md:127`) — **keep it**. The fix is to make the walking path attractive (P1-10, P1-11), not to close the door on players who cannot walk it. |
| **Rewriting the whole scene into components before the deadline** | The extraction order in P1-1 (content module) and P2-10 (dialogue controller, scene geometry) captures the value. A full architectural rewrite of 1455 lines is not a hackathon activity. |

---

## What must be re-verified after any change

Run this before every push, and in full before submission.

**Automated gates — all five must be green:**
- `npm run typecheck` — clean
- `npm test` — currently **75/75** (campaign 27 · audio 17 · match engine 31)
- `npm run build` — production bundle succeeds
- `npm audit` — 0 vulnerabilities
- `npm run smoke` — currently **60/60** against the production build,
  including full/demo campaigns, save isolation, all 12 locations, living and
  reduced-motion environment evidence, adaptive exterior zoom, physical
  pond/district travel, grass/paving movement feedback, player
  interaction-facing/idle blink, 360 px layout, and
  active/4×-throttled performance budgets

**Manual gates that no test covers:**
- **Renderer**: after P1-2, confirm the world still draws under both `Phaser.AUTO` and the Canvas fallback, and check frame rate on a real mid-range Android — not a desktop throttle profile.
- **Keyboard-only run**: title → move → talk → choose → journal → memory table → evening → end day, without touching the mouse. Tab must never die and never escape a modal.
- **Screen-reader run** (VoiceOver or NVDA): one full activity, confirming dialogue lines are announced and focus returns to the opener.
- **Reduced-motion run**: OS setting on, confirm nothing in the Phaser scene animates and the game idles at low CPU when the player stands still.
- **Widths 320 / 344 / 360 / 680 / 1512**: no horizontal scroll, no duplicate interact buttons, d-pad above the fold.
- **Contrast re-measure** (computed, not eyeballed) on anything restyled: focus ring ≥3.0:1, all body text ≥4.5:1.
- **Full-map walk** after any collision or depth change — confirm the player cannot be trapped and does not render in front of canopies.

**Documents that go stale on almost every change:**
- `docs/submission/DECK_COPY.md` — line 32 currently reports the test split as "sandboxState 11" against an actual **17**; the totals also appear at lines 190, 251, 268, 283. Fix that discrepancy now regardless.
- `docs/submission/AI_EVIDENCE.md:46` and `docs/AI_USAGE_LOG.md` — the art row predates the procedural art pass (P1-18).
- `docs/ACCESSIBILITY.md` — lines 32–36 state text-size, focus, motion and sprite-legibility rules the build currently breaks. **Fix the build to match the doc; do not weaken the doc to match the build.** Line 34 has already been scoped to "DOM transitions" to match the implementation rather than the need — reverse that when P0-9 lands.
- `docs/screenshots/` — every hero image is invalidated by P0-1, P0-11, P1-3, P1-6 and P1-14. Regenerate all ten and re-check that no placeholder string, debug label or duplicated area chip is in frame.
- `docs/submission/VIDEO_SCRIPT.md` — the evening beat is the money shot and it changes materially with P1-9. Re-time the script after.
- `docs/MIORA_ASSET_BIBLE.md` — if P1-4 ships a real `palette.ts`, the bible becomes the source of truth for a module that enforces it. Reconcile, and delete the false claim at `sandboxScene.ts:8-10` that "everything drawn in this scene comes from here" until it is actually true.
