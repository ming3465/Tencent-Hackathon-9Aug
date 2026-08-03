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
- A world-first Journal drawer, opened only on request, with dynamic Main
  Story, Optional Requests, People, and Places sections
- WASD, arrow-key, `E`, Space, visible buttons, and touch controls
- Equivalent Journal actions for every meaningful world interaction
- Runtime Web Audio synthesis; no audio files ship
- Visual-novel conversations with 13 unique code-drawn bust portraits,
  resident-specific hair, build, age lines, accessories, and community-role
  motifs; a separate estate portrait supports object and place narration
- Original Canvas-rendered pixel art with four-frame directional player and
  resident walks, varied silhouettes, tiled room floors, and
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
  lily pads and three deterministic ripple rings, while a six-object pool
  provides subtle walking puffs without per-step allocation; adaptive exterior
  framing uses 1.32× on wide desktop, 1.22× on tablet, and 1× on mobile while
  keeping rooms intimate; district dressing includes a tray-return station,
  provision crates, mosaic dragon playground, and exercise corner. The current
  runtime remains code-drawn after two generated visual-direction studies were
  reviewed and selectively translated rather than copied into the scene
- No timer, failure state, energy system, account, analytics, personal-data
  collection, backend, or runtime LLM

The project does not diagnose, measure, prevent, delay, or treat any medical
condition. See `docs/RESEARCH.md` for the claim guardrails written before code.

## Verified state

| Gate | Result |
| --- | --- |
| `npm run typecheck` | strict TypeScript passes |
| `npm test` | 75 tests across campaign, audio, and optional matching |
| `npm run build` | 83.33 kB initial JS (26.08 kB gzip); 1,581.58 kB lazy scene (370.58 kB gzip) |
| `npm audit` | 0 known vulnerabilities |
| `npm run smoke` | 60/60 production-browser checks |

The smoke harness drives complete full and demo campaigns through production
JavaScript, instantiates all 12 locations, proves resident route movement,
four-frame player/resident walks, nearby stop/facing, marker synchronization,
cat movement, four two-frame community activity vignettes, laundry animation,
reduced-motion stillness, exterior wake-up, and physical travel to the east and
south. It also physically opens one of 14 approach-only estate details with
keyboard and touch evidence, then samples the generated terrain and reusable
landscape textures;
the documented pass found 11 grass colours, 26 path colours, 27 path-edge
transitions, and 41 placed landscape objects across four forms and 44 sampled
foliage colours. The same snapshot found 88 exterior props across 22 texture
forms, including 12 story clusters across six forms, plus 54 baked drain/leaf
accents. A generated-façade sample found 55 colours, 218 edge transitions, and
26.1% dark pixels; the scene exposed 93 obstacle bodies, and a real northward
movement sample stopped at the solid Minah storefront
(about `y=396` to `y=253`) while the east/south travel routes remained open.
The same snapshot proved three bicycle bays, zero motor-vehicle routes, and
zero semantic layout issues. It also proved eight localized building-occlusion
layers fade at a solid façade and restore after the player steps away. It also
proves 1.32× wide-desktop and 1× mobile exterior framing, three animated pond
rings, pooled walking feedback, all eight two-frame butterflies/dragonflies,
and reduced-motion stillness for those systems.
Chapter 2 weather samples prove a fixed 64-streak pool with intentionally
culled desktop/mobile density, ten animated puddle rings, dry shelter masks,
three helped residents and both cats under cover, and stored activity tools
and laundry in the 360 px composition.
Its reduced-motion repeat keeps the wet surfaces and gathered estate state
while hiding falling rain and holding the puddle phase still.
It also proves that the estate fills the wide play area, interiors are centred
without an unrendered canvas strip, and the Journal opens as a modal drawer
with inert background, wrapped focus, Escape/backdrop close, and world-focus
restoration.
The visual-novel check measures a 238×325 px code-drawn desktop bust inside a
940 px card, verifies 41 drawn primitives and Mr. Long's distinct profile
traits, and proves the responsive 88×120 px portrait remains inside a 360 px
viewport. The 360px path enters the game, exposes touch controls, opens both
dialogue and the 328px Journal, checks 48px targets and overflow, and captures
all three states. The harness profiles
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
centred-interior framing, adaptive exterior zoom, pond/step feedback, in-game
mobile layout, touch targets, Journal modal/focus behavior, and console-error
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
