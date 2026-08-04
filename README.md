# Kampung SG

**Every Small Act Grows the Kampung.**

### ▶ [Play it now — no install, no account](https://ming3465.github.io/Tencent-Hackathon-9Aug/)

Kampung SG is a cozy top-down Singapore HDB-estate campaign for the Tencent
Cloud “Age Well” Social Good Challenge, Game Track. Older residents are the
experts shaping the neighbourhood—not patients or passive recipients.

The five-part story begins in Y’s flat, follows three connected chapters, and
ends with free exploration. Players help residents open Mr. Long’s route,
gather neighbours around Grandma Ros’s cooking table, and reconnect Ben with a
craftsman through calm, supportive choices.

## KampungMind

**AI-authored personalities powered by a private, offline NPC
memory-and-decision engine.**

Each resident has authored personality, community role, expertise, knowledge,
memory rules, and dialogue intents. KampungMind deterministically selects an
eligible greeting, clue, request, reminder, contribution, remembered reaction,
or reflection from chapter context and player choices. Stable IDs break ties.
There is no runtime text generation, network call, API key, backend, or
hallucination path.

## What ships

- Prologue, three sequential chapters, ending, and post-story free exploration
- A 2560×1600 exterior plus an HDB corridor and unique code-drawn interiors for
  Y, Mr. Long, Grandma Ros, Ben, a craftsman, the community centre, kopitiam,
  provision shop, hawker centre, and prayer hall
- Eight resident-led optional routes; “Maybe later” never closes a route
- Chapter-persistent consequences including a ramp, garden choice, sheltered
  route, prepared kitchen, active workshop, gathered residents, and warmer light
- A deterministic Chapter 2 monsoon with wet paths, ten puddles, shelter-aware
  rain, stored laundry, sheltered cats, and previously helped residents gathering
  under cover; reduced motion keeps the overcast scene but removes falling rain
  and ripple animation
- Versioned autosave, Continue, confirmed Start Over, and corrupt-save fallback
- A quest-book Journal, opened only on request, with Story, Requests, People,
  and Places tabs; selected-quest detail, objective checklists, proportional
  progress, tracking, and context actions remain available without a timer
- A circular code-drawn estate minimap with seven landmark anchors, the current
  indoor building, live outdoor player movement, and a direct Places shortcut
- WASD, arrow-key, `E`, Space, visible buttons, and touch controls
- Equivalent Journal actions for every meaningful world interaction
- Surface-aware runtime Web Audio footsteps for grass, estate paving, and
  interiors; one reusable synthesized-noise buffer and no audio files ship.
  Separate deterministic four-chord day/evening progressions use shared-tone
  voice-leading instead of unrelated random notes
- Visual-novel conversations with 13 unique code-drawn bust portraits,
  resident-specific hair, build, age lines, accessories, and community-role
  motifs; neutral, thoughtful, and warm expression variants; and a sole
  visible `>` advance chevron with an accessible 52×52 control. A separate
  estate portrait supports object and place narration
- A reviewed OpenAI-assisted 1668×943 HDB-estate title panorama, optimized to
  WebP after a documented first-pass rejection and constrained pseudo-writing
  cleanup; the title, controls, tagline, and caption remain semantic HTML
- Original Canvas-rendered pixel art with speed-responsive four-frame
  directional player walks, deterministic idle blinks, interaction-facing,
  four-frame resident walks, stepped head-and-body silhouettes, connected
  limbs, grounded feet, five hair profiles, five outfit grammars, carried
  totes, and one runtime shadow per character; tiled room floors and
  code-drawn estate props; a baked 32 px terrain grammar gives grass, running-
  bond paths, planted edge growth, leaf litter, kerbs, drains, and utility
  covers tile-scale material detail; three layered tropical tree forms and 41
  collision-aware shrubs, flower beds, pandan clumps, and hedges add reusable
  landscaping with contact and sheared cast shadows; named Hawker, Kopitiam,
  Minah, Community, Prayer Hall, Workshop, and Block 12 façades use distinct
  code-drawn signs, roofs, awnings, windows, counters, and threshold details,
  with solid building shells and deliberate doorway gaps; three bicycle racks
  sit on marked, solid outdoor verge bays guarded against building and
  pedestrian-route overlap; the roadless estate intentionally has no moving
  motor vehicles; eight localized façade overlays soften while covering the
  player and return fully opaque after they step away, with instant changes
  under reduced motion;
  residents follow short authored routes and stop to face a nearby player;
  baked flower clusters, fluttering HDB laundry, and deterministic community
  cats keep the exterior alive; four two-frame activity vignettes show
  neighbours sweeping the void deck, discussing the noticeboard, tending the
  garden, and talking at the kopitiam; 12 collision-aware story clusters reuse
  six code-drawn forms for chess seating, bicycle planters, maintenance,
  utilities, stacked chairs, and shaded seating; 26 drain grates and 28 leaf
  patches add baked ground detail; eight deterministic butterflies and
  dragonflies move between those clusters; a layered, solid-edged pond adds
  lily pads and three deterministic ripple rings, while a six-slot pool
  provides surface-coloured dust and leaf flecks without per-step allocation;
  adaptive exterior
  framing uses 1.32× on wide desktop, 1.22× on tablet, and 1× on mobile;
  interiors use the full shell, a room-fit zoom, and balanced camera margins
  instead of cutting the room against one edge; district dressing includes a tray-return station,
  provision crates, mosaic dragon playground, and exercise corner. A persistent
  downward guide triangle keeps the main character readable in every room and
  district. Seven exterior entrances now share one audited doorway registry
  with their art, interaction points, and collision gaps. The playable world
  remains code-drawn after two generated visual-direction studies were
  selectively translated rather than copied; the separately reviewed title
  panorama is the only generated raster intentionally shipped at runtime
- No timer, failure state, energy system, account, analytics, personal-data
  collection, backend, or runtime LLM

The project does not diagnose, measure, prevent, delay, or treat any medical
condition. See `docs/RESEARCH.md` for the claim guardrails written before code.

## Verified state

| Gate | Result |
| --- | --- |
| `npm run typecheck` | strict TypeScript passes |
| `npm test` | 75 tests across campaign, audio, and optional matching |
| `npm run build` | 106.23 kB initial JS (32.29 kB gzip); 1,596.66 kB lazy scene (374.83 kB gzip) |
| `npm audit` | 0 known vulnerabilities |
| `npm run smoke` | 60/60 production-browser checks |

The smoke harness drives complete full and demo campaigns through production
JavaScript, instantiates all 12 locations, proves resident route movement,
four-frame player/resident walks, deterministic player idle blinking,
player-to-interaction facing, marker synchronization, one nearest-target label
plate, a 12-resident cast registry spanning five hair and five outfit
silhouettes, the reviewed title image, the accessible visual-novel chevron, and
portrait expression changes,
cat movement, four two-frame community activity vignettes, laundry animation,
reduced-motion stillness, exterior wake-up, and physical travel to the east and
south. It also physically opens one of 14 approach-only estate details with
keyboard and touch evidence, then samples the generated terrain and reusable
landscape textures;
the documented pass found 11 grass colours, 26 path colours, 27 path-edge
transitions, and 41 placed landscape objects across four forms and 44 sampled
foliage colours. The same snapshot found 88 exterior props across 22 texture
forms, including 12 story clusters across six forms, plus 54 baked drain/leaf
accents. A generated-façade sample found 56 colours, 226 edge transitions, and
25.4% dark pixels; the scene exposed 95 obstacle bodies, and a real northward
movement sample stopped at the solid Minah storefront
(about `y=396` to `y=253`) while the east/south travel routes remained open.
The same snapshot proved three bicycle bays, zero motor-vehicle routes, and
zero semantic layout issues. It also proved eight localized building-occlusion
layers fade at a solid façade and restore after the player steps away. It also
proves 1.32× wide-desktop and 1× mobile exterior framing, three animated pond
rings, pooled walking feedback, all eight two-frame butterflies/dragonflies,
and reduced-motion stillness for those systems. It separately walks on grass
and estate paving to prove that the pooled visual effects and terrain
classification change together.
The same journey presses Sound, verifies focus returns to the world, and
proves movement resumes. It also exercises the full-screen viewport state,
exit contract, and Sound-button focus after leaving full screen.
Chapter 2 weather samples prove a fixed 64-streak pool with intentionally
culled desktop/mobile density, ten animated puddle rings, dry shelter masks,
three helped residents and both cats under cover, and stored activity tools
and laundry in the 360 px composition.
Its reduced-motion repeat keeps the wet surfaces and gathered estate state
while hiding falling rain and holding the puddle phase still.
It also proves that the estate fills the wide play area, a desktop interior
fits inside a full-width centred camera composition, and the quest-book Journal
opens with four keyboard-switchable tabs, tracked-quest state, objective
progress, inert background, wrapped focus, Escape/backdrop close, and
world-focus restoration. The circular map exposes seven landmark anchors,
highlights one current indoor anchor, and moves its player marker between
physical east/south travel samples.
The visual-novel check measures a 238×325 px code-drawn desktop bust inside a
940 px card, verifies 41 drawn primitives and Mr. Long's distinct profile
traits, and proves the responsive 88×120 px portrait remains inside a 360 px
viewport. The 360px path enters the game, exposes touch controls and the
room-aware map, opens both dialogue and the full-width stacked Journal, checks
48px targets and overflow, and captures all three states. The harness profiles
120 frames during resident and player movement and repeats the player sample
under a 4× CDP CPU throttle. Fixed cadence budgets remain 28 ms normal and
34 ms throttled. If the same-run title screen is itself capped slower, game p95
must stay within 3 ms of that measured scheduler baseline; main-thread work is
independently capped at 8 ms/frame normally and 20 ms/frame under 4×
throttling. This is an automated regression budget, not a real-device or
cross-game benchmark. No human playtest or real-device accessibility audit is
claimed.

The 2026-08-03 density-evidence run measured 9.90 ms title p95, 10.00 ms
resident-route p95, 9.80 ms monsoon p95, and 10.10 ms active-movement p95
with 3.60 ms/frame main-thread work; its 4× CPU-throttled sample measured
10.00 ms p95 with 8.10 ms/frame work.

One passing 2026-08-04 tactile-movement gate measured 9.10 ms title p95,
9.10 ms resident-route p95, 9.30 ms monsoon p95, and 9.20 ms active-movement
p95 with 2.40 ms/frame main-thread work. Its 4× CPU-throttled active sample
measured 9.30 ms p95 with 9.57 ms/frame work. This is headless desktop-Chrome
regression evidence, not a real-device or cross-game performance comparison.

## Requirements and local setup

- Node.js 20+ and npm 10+
- Node.js 22+ and Chrome for the smoke harness

```bash
npm ci
npm run dev
```

## Controls

- Move: `WASD`, arrow keys, or the on-screen direction pad
- Interact: `E`, Space, nearby `Interact`, or the touch action button
- Map: activate the circular map to open the current place in the Journal
- Accessible alternative: use the Journal for any meaningful interaction
- Close an overlay: `Escape` or its visible return button

## Verification

```bash
npm run typecheck && npm test && npm run build && npm audit && npm run smoke
```

`scripts/browser-smoke.mjs` starts a production preview and drives headless
Chrome through keyboard and touch doors, unique interiors, locked chapter
ordering, alternate resident routes, saved Continue/Start Over state, demo
isolation, all-location rendering, resident/ambient movement, reduced-motion
stillness, Chapter 2 monsoon behavior and pacing, full-width exterior and
centred room-fit interior framing, adaptive exterior zoom, live circular-map
movement, pond/step feedback, in-game mobile layout, touch targets, quest-tab
keyboard navigation/tracking, Journal modal/focus behavior, and console-error
checks.
It refreshes the evidence images in `docs/screenshots/`.

`scripts/browser-smoke.ps1` is retained only as historical evidence for the
superseded card-game build.

## AI creation record

| Tool | Verified contribution |
| --- | --- |
| CodeBuddy CLI 2.127.0 | Authored the first 10 pre-pivot files, including the optional matching engine. Its limit overrun, errors, and failed correction run remain documented. |
| OpenCode | Built the original neighbourhood-sandbox pivot. |
| Claude Code (Opus 5) | Added audio, reactive residents, lighting, smoke automation, deployment, and the first deck. |
| Codex (GPT-5) | Built the versioned campaign reducer, KampungMind, enterable scene architecture, persistence, accessible campaign UI, original world/landmark art, visual-novel portraits, campaign tests, and expanded production smoke path. |
| OpenAI image generation | Produced two visual-direction studies: a neighbourhood style key and a targeted estate-density reference. Human review rejected direct runtime use and translated selected activity, prop-cluster, ground-detail, and ambient-life ideas into deterministic code-drawn systems. |
| Gemini CLI 0.53.1 | An authoring pass was attempted on 2026-08-03 but blocked at Google authentication; it produced no draft and no content was used. |

Humans set the product thesis, ethics, constraints, and final content. Prompts,
failures, generated outputs, curation decisions, and verification are recorded
in `docs/AI_USAGE_LOG.md`. The reviewed visual-direction outputs are
`docs/art/openai-neighbourhood-style-key.png` and
`docs/art/openai-estate-density-reference.png`; their exact prompts and
acceptance/rejection decisions are preserved in `docs/prompts/`.

## Project references

- `docs/GAME_DESIGN.md` — current campaign and system contract
- `docs/DEMO_MODE.md` — isolated judge path
- `docs/ACCESSIBILITY.md` — input, semantic, motion, and manual requirements
- `docs/QA_CHECKLIST.md` — automated evidence and outstanding manual checks
- `docs/submission/` — runbook, deck/video/social copy, and AI evidence
- `docs/deck/` — judge deck source, PPTX, and PDF
- `docs/AI_USAGE_LOG.md` — truthful AI attribution and verification history
