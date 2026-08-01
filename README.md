# Kampung SG

**Every Small Act Grows the Kampung.**

Kampung SG is a cozy top-down neighbourhood sandbox for the Tencent Cloud
"Age Well" Social Good Challenge Singapore. Explore one HDB estate, meet older
residents as community mentors, and choose activities that strengthen
connection, purpose, and everyday comfort.

The project encourages shared play and positive engagement. It does not
diagnose, measure, prevent, delay, or treat any medical condition.

## Current Vertical Slice

- Scrollable Phaser neighbourhood with an HDB block, void deck, hawker corner,
  sheltered route, pond, and community garden
- WASD, arrow-key, and touch movement
- Nearby interaction prompts and collision boundaries
- Three resident-led activities with non-punitive shared choices
- Optional four-pair memory-table mini-game
- Kampung Spirit meters, journal, and evening reflection progression
- Semantic HTML dialogue, journal shortcuts, focus management, and reduced
  motion support
- Procedural fallback art designed to be replaced by Miora components

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

```powershell
npm run typecheck
npm test
npm run build
npm audit
```

The Windows browser smoke script uses an installed Google Chrome and a running
Vite preview. It checks the production bundle at a 360px viewport, including
Phaser startup, layout overflow, touch targets, dialogue choices, meter and
journal progression, touch movement, the memory activity, focus restoration,
and scene teardown.

```powershell
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

Start Chrome with remote debugging on port `9223`, then run:

```powershell
.\scripts\browser-smoke.ps1 -Port 9223 -AppPort 4173
```

## Miora Art Pipeline

Miora will provide the final environment cutouts, resident and player art,
portraits, props, keepsake cards, and title illustration. Generate isolated
transparent components rather than full UI screens so code retains responsive
layout and accessibility control.

See `docs/MIORA_ASSET_BIBLE.md` for the style key, prompt templates, filenames,
export rules, representation safeguards, and evidence requirements.

## Project References

- `docs/MASTER_CHECKLIST.md`: all requirements split by user, OpenCode, CodeBuddy, Miora, and submission owner
- `docs/GAME_DESIGN.md`: sandbox scope and acceptance criteria
- `docs/ACCESSIBILITY.md`: interaction and manual test requirements
- `docs/MIORA_ASSET_BIBLE.md`: final art direction and asset contract
- `docs/HACKATHON_BLUEPRINT.md`: daily execution, gates, owners, and submission plan
- `docs/RUBRIC_SCORECARD.md`: evidence-based judging readiness and blockers
- `docs/PLAYTEST_PROTOCOL.md`: privacy-safe usability and engagement testing
- `docs/DEMO_SCRIPT.md`: timed 90-second video and live-demo fallback
- `docs/AI_USAGE_LOG.md`: truthful AI attribution and verification history
- `docs/QA_CHECKLIST.md`: automated and manual quality gates
