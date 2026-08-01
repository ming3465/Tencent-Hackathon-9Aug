# Demo Mode — the Judge Path

> For any agent, teammate, or presenter picking this up. Demo mode exists so a
> judge on a timed window reaches the golden-hour ending in about 3 minutes
> instead of 6–8. It was built for the finalist video shoot and the Aug 16
> Demo Day stage run. See `docs/WINNING_PLAYBOOK.md` §2 action 2 for why.

## How to use it

Append `?demo=1` to any build of the game:

```
https://ming3465.github.io/Tencent-Hackathon-9Aug/?demo=1     # deployed
http://127.0.0.1:4173/?demo=1                                  # local preview
```

There is no in-game switch, no visible badge, and nothing stored. Removing the
query parameter is the entire off switch.

## Exactly what it changes (and nothing else)

| Lever | Real game | Demo mode | Where in code |
| --- | --- | --- | --- |
| Activities to unlock the evening | 3 | **2** | `createSandboxState(requiredForEvening)` in `src/game/sandboxState.ts` |
| Walking speed | 215 px/s | **260 px/s** | `SandboxGameOptions.playerSpeed` → `src/game/sandboxScene.ts` |

Everything else is the shipped game: same dialogue, same choices, same world
consequences, same meters, same evening reflection built from the player's real
choices, same audio, same art. The progress copy self-adjusts ("Complete any 2
activities…"), so the UI never lies about the threshold.

## Honesty boundary — read before filming

Demo mode is a **pacing** device, not a content device. It is acceptable to
film and stage-demo on `?demo=1` because every line, rule, and consequence a
judge sees is identical to the public build. Two things keep it honest:

1. **Never claim the full game is 3 minutes.** The full loop is 6–8 minutes by
   design ("one cup of kopi long" — deliberate for the audience). If asked, say
   so and say the demo path exists for the judging window.
2. **Never add demo-only content.** If a beat is worth showing, it ships in the
   real game. Demo mode may only compress, never fabricate.

## The 3-minute route (for video and stage)

The player spawns beside **Uncle Ravi** at the noticeboard, so the first
interaction is available within ~5 seconds:

1. **Uncle Ravi** (spawn point) → talk → choose → chess/story notice appears.
2. Walk south-east to **Aunty Mei** in the garden (~20 s at demo speed) → talk
   → choose → herbs/flower bed appears. *Second activity: golden hour begins.*
3. Journal → **"Gather for the evening"** → the reflection names both actual
   choices → end the day.

Alternative second stop: **Mdm Siti** at the shaded walk (south-west) if the
take needs the shelter consequence instead.

## How it is verified

- **5 unit tests** (`src/game/__tests__/sandboxState.test.ts`, "demo-mode judge
  path"): default stays 3; demo unlocks at 2; the real game does not unlock
  early; nonsense thresholds clamp; the day ends and the reflection names the
  two demo choices.
- **1 browser-smoke check** (`scripts/browser-smoke.mjs`): loads `?demo=1` in
  headless Chrome, completes two activities through the Journal, and asserts
  the evening unlocks. Run with `npm run smoke` (22 checks total).

## Change log

| Date | Change |
| --- | --- |
| 2026-08-01 | Created: `requiredForEvening` on `SandboxState`, `SandboxGameOptions.playerSpeed`, `?demo=1` parsing in `main.ts`, 5 unit tests, 1 smoke check. |
