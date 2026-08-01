# Kampung SG Game Design

## Definition

Kampung SG is a cozy top-down neighbourhood sandbox about ageing well through
connection, agency, comfort, and continued contribution.

The player explores one Singapore HDB estate at their own pace, meets older
residents as capable community mentors, and chooses which small acts of kampung
life to join. Friends and family can share decisions around one avatar without
the control friction of simultaneous local multiplayer.

Tagline: **Every Small Act Grows the Kampung.**

## Experience Pillars

1. **A place, not a menu:** The neighbourhood is walked through and discovered.
2. **Choice without punishment:** Activities can be completed in any order and
   dialogue choices express preference rather than right or wrong answers.
3. **Older adults contribute:** Residents offer expertise, organize activities,
   and shape the neighbourhood.
4. **Shared conversation:** Choices are short enough for companions to discuss
   while passing or sharing one device.
5. **Calm accessibility:** There is no combat, forced timer, energy pressure,
   medical score, or failure state.

## Sandbox Vertical Slice

The first sandbox version contains one scrollable map with an HDB block, void
deck, community garden, sheltered walkway, bus stop, and hawker corner.

The player can walk using arrow keys or WASD, use touch controls, approach an
activity marker, and interact with `E`, Space, or an on-screen button.

Four activities are available in any order:

| Activity | Resident | Player choice | Impact |
| --- | --- | --- | --- |
| Community garden | Aunty Mei | Grow cooking herbs or bright gathering flowers | Purpose and connection |
| Void-deck noticeboard | Uncle Ravi | Host a chess circle or story exchange | Connection and purpose |
| Shaded route | Mdm Siti | Add a rest point or improve the sheltered path | Comfort and independence |
| Memory table | Optional activity | Complete the existing matching mini-game | Connection |

After any three activities, the player can gather at the void deck and see a
short evening reflection. The map remains explorable before ending the day.

## Acceptance Criteria

- A responsive title screen introduces the sandbox clearly.
- The player can move around a world larger than the camera viewport.
- World geometry prevents walking through major buildings and boundaries.
- Camera follow is smooth and remains inside the world.
- Keyboard and touch controls both move and interact.
- A nearby prompt identifies the current interaction without colour alone.
- Three residents and four activities are discoverable in any order.
- Resident choices have visible but non-punitive effects on three Kampung
  Spirit meters: Connection, Purpose, and Comfort.
- Completed activities update the map, journal, and interaction dialogue.
- The matching engine is available only through the optional memory table.
- Completing any three activities unlocks an evening reflection.
- The full experience contains no timer, health claim, account, analytics,
  backend, or network dependency.
- The production bundle passes type checking, unit tests, browser smoke checks,
  and a security audit.

## Explicitly Out of Scope

Farming simulation, crops with day cycles, inventory crafting, shops, economy,
combat, romance, procedural worlds, online multiplayer, two independently
controlled avatars, NPC schedules, cloud saves, runtime LLM dialogue, final
Miora artwork, and medical assessment are not part of this vertical slice.

## Visual Direction

Use warm procedural pixel-style shapes for the working slice: deep teal
shadows, cream concrete, coral accents, garden green, and amber evening light.
The map should feel authored and inhabited even before Miora assets replace the
graybox. Do not imitate Stardew Valley assets, characters, map layouts, or
branding.
