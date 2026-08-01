# Kampung SG

**Every Small Act Grows the Kampung.**

### ▶ [Play it now — no install, no account](https://ming3465.github.io/Tencent-Hackathon-9Aug/)

Kampung SG is a cozy top-down neighbourhood sandbox for the Tencent Cloud
"Age Well" Social Good Challenge Singapore, Game Track. Explore one HDB estate,
meet older residents as community mentors, and choose activities that strengthen
connection, purpose, and everyday comfort.

Older adults here are the experts, not the errands. Aunty Mei decides what the
garden grows, Uncle Ravi hosts the void deck, and Mdm Siti maps shade and rain
from walking the route every day. You help enact *their* ideas.

The project encourages shared play and positive engagement. It does not
diagnose, measure, prevent, delay, or treat any medical condition. See
`docs/RESEARCH.md` for the claim guardrails, written before any code.

## Current Vertical Slice

- Scrollable Phaser neighbourhood with an HDB block, void deck, hawker corner,
  sheltered route, pond, and community garden
- WASD, arrow-key, and touch movement
- Nearby interaction prompts and collision boundaries
- Three resident-led activities with non-punitive shared choices
- Residents who drift around their own corner of the estate, turn to face the
  player, and change what they say once you have acted on their invitation
- Golden-hour lighting pass that fades the whole estate to dusk when a third
  activity unlocks the evening gathering
- Optional four-pair memory-table mini-game
- Kampung Spirit meters, journal, and evening reflection built from the player's
  actual choices
- Centralized audio synthesized at runtime with the Web Audio API — music, world
  and interface buses, mute, and per-category volume. **No audio files ship.**
- Semantic HTML dialogue, journal shortcuts, focus management, and reduced
  motion support
- Procedural art kept in its own layer so generated assets can replace it
  without touching collision or game rules

## Verified State

| Gate | Result |
| --- | --- |
| `npm run typecheck` | passes, strict TypeScript |
| `npm test` | 59 tests across 3 files |
| `npm run build` | 24.4 kB initial JS, Phaser lazy-loaded |
| `npm audit` | 0 vulnerabilities |
| `npm run smoke` | 19/19 production-browser checks |

No human playtest has taken place, and no generated art asset ships in this
build. Both are stated plainly rather than implied away.

Farming simulation, inventory crafting, combat, economy, online multiplayer,
and complex NPC schedules are intentionally outside the hackathon slice.

## Requirements

- Node.js 20 or newer
- npm 10 or newer

## Run Locally

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite.

## Controls

- Move: `WASD`, arrow keys, or the on-screen direction pad
- Interact: `E`, `Space`, the nearby `Interact` button, or the touch `Talk`
  button
- Accessible alternative: open any invitation directly from the Journal
- Close a dialog: `Escape` or its visible return button

## Verification

```bash
npm run typecheck
npm test
npm run build
npm audit
```

### Production-browser smoke test

`scripts/browser-smoke.mjs` drives a real headless Chrome over the Chrome
DevTools Protocol against the built bundle, so it exercises the same JavaScript
a player loads. It uses only Node built-ins — no Puppeteer to install or audit.

```bash
npm run build
npx vite preview --port 4173 --strictPort --host 127.0.0.1 &
npm run smoke
```

The 19 checks cover Phaser startup, keyboard and touch movement, resident
dialogue, Space-key operability of focused buttons, meter and journal
progression, the golden-hour evening transition, a full second playthrough,
scene teardown, 360px layout overflow, touch-target size, and console errors.
It also writes the gameplay stills in `docs/screenshots/`.

`scripts/browser-smoke.ps1` is the superseded Windows harness for the pre-pivot
card game and is retained only as history. Do not treat it as current evidence.

## Art Pipeline

**No generated art ships in this build.** Every visual is procedural Phaser
geometry authored by the team. `public/assets/miora/` contains only a README.

The pipeline is nonetheless ready: `docs/MIORA_ASSET_BIBLE.md` locks the style
key, palette, camera angle, lighting direction, representation safeguards,
transparent-export rules, filename contract, and acceptance checklist. Rendering
is kept in its own layer, so approved components drop in without touching
collision geometry or game rules.

We would rather ship an honest procedural build than claim assets we did not
generate.

## AI Creation

| Tool | What it did |
| --- | --- |
| CodeBuddy CLI 2.127.0 | Authored the first 10 files, pre-pivot. Overran its 50-turn limit and shipped 2 type errors, 3 failing tests, and a timer race. Our gate caught all of it. A correction run returned `429 Credits exhausted`; no credits were purchased. |
| OpenCode | The sandbox pivot: world, movement, collision, residents, meters, journal, evening flow. |
| Claude Code (Opus 5) | Audio system, reactive residents, golden-hour lighting, the Node CDP smoke harness, deployment, and the submission deck. |

Humans set the scope, the ethics, and the claim guardrails. Every prompt,
failure, and correction is recorded in `docs/AI_USAGE_LOG.md` — including the
run that went wrong.

## Project References

- `docs/submission/`: deck copy, video script, social copy, and AI evidence page
- `docs/deck/`: the exported Project Introduction Deck (`.pptx` and `.pdf`)
- `docs/MASTER_CHECKLIST.md`: all requirements split by owner
- `docs/GAME_DESIGN.md`: sandbox scope and acceptance criteria
- `docs/ACCESSIBILITY.md`: interaction and manual test requirements
- `docs/RESEARCH.md`: claim guardrails and verified source quotations
- `docs/MIORA_ASSET_BIBLE.md`: art direction and asset contract
- `docs/HACKATHON_BLUEPRINT.md`: daily execution, gates, owners, and submission plan
- `docs/RUBRIC_SCORECARD.md`: evidence-based judging readiness and blockers
- `docs/PLAYTEST_PROTOCOL.md`: privacy-safe usability and engagement testing
- `docs/AI_USAGE_LOG.md`: truthful AI attribution and verification history
- `docs/QA_CHECKLIST.md`: automated and manual quality gates
