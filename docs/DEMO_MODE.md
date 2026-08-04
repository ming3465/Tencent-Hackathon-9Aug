# Demo Mode — the Judge Path

Append `?demo=1` to any build:

```text
https://ming3465.github.io/Tencent-Hackathon-9Aug/?demo=1
http://127.0.0.1:4173/?demo=1
```

Only the exact value `demo=1` enables the mode. `?demo=0`, missing values, and
other strings use the full campaign.

## What changes

| Lever | Full campaign | Demo mode |
| --- | --- | --- |
| Helpers needed in Chapter 1 | 3 distinct residents | 2 distinct residents |
| Invitees needed in Chapter 2 | 5 residents | 2 residents |
| Walking speed | 215 px/s | 260 px/s |
| Chapters, dialogue, choices, locations, art, and consequences | All included | Identical |

Demo mode never skips the prologue, any chapter, or the ending. It adds no
demo-only dialogue or consequence.

## Save isolation

Demo mode creates temporary campaign state in memory. It never reads, writes,
or clears `kampung-sg.campaign.v1`. A judge can complete the accelerated route
without affecting a full saved campaign.

## Suggested route

1. Listen to the Voice in Y’s flat and use the first door.
2. Enter Mr. Long’s flat and hear about the broken step.
3. Complete any two resident routes; the ramp appears and Chapter 2 opens.
4. Let Auntie Minah teach her check-before-you-act habit and choose either
   readable shop-card layout, gather Uncle Seng's clue, enter Grandma Ros's
   kitchen, and invite any two residents.
5. Visit the workshop, collect two clues about Ben, choose a supportive
   approach in his flat, and complete the no-failure weaving interaction.
6. Return to Y’s flat for The Last Door, then continue exploring.

## Honesty boundary

Demo mode is a pacing device, not a content device. Never claim it is the full
campaign length, and never add content that exists only behind `?demo=1`.

## Automated evidence

Campaign unit tests cover strict parsing, thresholds, chapter ordering, and
save isolation. The 60-check production-browser harness completes both the
full 3-helper/5-attendee campaign and the demo 2-helper/2-attendee campaign,
asserts every chapter remains present, and verifies the persistent save is
unchanged. The same run instantiates every location and applies the same normal
and 4×-CPU-throttled frame-pacing budgets. The resident routes, directional
frames, nearby attention, baked terrain details, community cats, and HDB
laundry are the same in both modes; demo mode receives no lighter visual path.
The same eight building-occlusion layers soften when covering the player;
reduced-motion users receive that state change instantly.
The shared roof planes, side faces, contact shadows, and recessed entry bays
are baked into both modes; demo mode does not simplify the estate projection.
Chapter 2 also uses the same deterministic monsoon, wet surfaces, puddles,
shelter masking, resident/cat responses, and reduced-motion fallback. Only the
helper and invitee thresholds change.
The circular map, room-fit interior camera, and four-tab quest Journal are also
identical in full and demo modes; threshold-aware Journal progress simply reads
the active campaign state's 3/5 or 2/2 requirements.
The main-character guide triangle, audited exterior door alignment, Sound
focus restoration, and browser-fullscreen/Escape flow are likewise shared
unchanged.
Surface-aware footsteps, interaction-facing, and idle behavior are also shared.
The existing faster demo walk uses the matching faster animation cadence; it
does not remove an animation, effect, location, or conversation.
The 12-resident silhouette registry, stepped anatomy, outfit details, carried
totes, and single runtime contact shadows are identical in both modes.
Minah's sourced safety dialogue, two equally valid presentation choices, saved
layout preference, and persistent shop-window card are also identical. The
browser journey completes and verifies the beat in both modes.

## Change log

| Date | Change |
| --- | --- |
| 2026-08-01 | Original two-activity sandbox judge path. |
| 2026-08-03 | Replaced with isolated full-campaign pacing: 2 helpers, 2 attendees, every chapter retained. |
| 2026-08-03 | Confirmed the visual/runtime pass is shared unchanged by full and demo modes. |
| 2026-08-03 | Confirmed Chapter 2 monsoon content and accessibility behavior are shared unchanged. |
| 2026-08-03 | Confirmed the circular map, room-fit interiors, and quest-book Journal are shared unchanged. |
| 2026-08-04 | Confirmed the player guide, aligned entrances, sound focus, and full-screen flow are shared unchanged. |
| 2026-08-04 | Confirmed surface feedback, interaction-facing, idle behavior, and the speed-matched walk cadence are shared unchanged. |
| 2026-08-04 | Confirmed the shared exterior projection-depth pass is identical in full and demo modes. |
| 2026-08-04 | Confirmed the cast-silhouette and grounded-walk pass is identical in full and demo modes. |
| 2026-08-04 | Added the same elder-led check-before-you-act beat and persistent Minah shop card to both modes. |
