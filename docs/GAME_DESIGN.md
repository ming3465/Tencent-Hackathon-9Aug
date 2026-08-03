# Kampung SG Game Design

## Definition

Kampung SG is a cozy top-down Singapore HDB-estate campaign about ageing well
through connection, agency, comfort, and continued contribution.

Older residents organize, teach, repair, map, cook, grow, and welcome. The
player helps enact their ideas without scores for “correct” choices. There is
no combat, timer, failure state, energy pressure, medical score, account,
analytics, backend, or network dependency.

Tagline: **Every Small Act Grows the Kampung.**

## Experience pillars

1. **A connected place:** homes and landmarks are entered, revisited, and
   changed by the story.
2. **Older adults contribute:** residents are experts and co-authors of the
   estate, never passive recipients.
3. **Choice without punishment:** “Maybe later” keeps routes open and
   preferences change memories rather than produce failure.
4. **Private authored depth:** KampungMind selects authored NPC intent from
   deterministic context and remembered choices.
5. **Calm accessibility:** keyboard, touch, visible controls, and equivalent
   Journal actions can each complete the campaign.

## Campaign spine

| Part | Story objective | Completion |
| --- | --- | --- |
| Prologue — Y’s Flat | Meet the Voice, learn interaction, use the first door | Enter the Block 9 corridor |
| Chapter 1 — Open the Way | Hear Mr. Long’s account and recruit helpers for his broken step | Any 3 distinct helpers; a ramp appears and Mr. Long comes outside |
| Chapter 2 — A Place at the Table | Gather clues about Grandma Ros and invite neighbours to her kitchen | 2 clues and any 5 invitees; the cooking lesson is staged |
| Chapter 3 — Hands Remember | Reconnect Ben with the craftsman through a supportive approach | 2 clues, Ben’s agreement, and a calm no-failure weaving interaction |
| Ending — The Last Door | Return to Y’s flat for the Voice/Fading reveal | Residents arrive, the door opens, free exploration remains |

Demo mode lowers only the Chapter 1 and Chapter 2 thresholds to 2 and increases
walking speed. It never skips story content.

## Resident routes

| Resident | Expertise and optional request |
| --- | --- |
| Aunty Mei | Restore the garden; choose herbs or seating flowers |
| Uncle Ravi | Turn the noticeboard into a welcoming event |
| Mdm Siti | Inspect and improve the sheltered route |
| Pak Yusof | Inspect Mr. Long’s step and contribute directly |
| Coach Meng | Arrange accessible community-centre seating |
| Uncle Seng | Prepare a welcoming kopitiam morning table |
| Auntie Minah | Organize a community ingredient shelf and share Ros clues |
| Wei Ling | Complete a keepsake table and invite younger neighbours |

A side request may be required for one resident’s assistance while remaining
globally optional because another resident can fill the route.

## KampungMind

NPC profiles centralize qualitative personality, community role, expertise,
knowledge, memory rules, and authored intents. `selectNpcIntent(context)`:

1. filters intents by chapter, objective, request, contribution, and memory;
2. scores chapter relevance, expertise, prior help, active requests, and
   remembered choices;
3. uses stable intent IDs for deterministic tie-breaking.

Supported intents include greetings, clues, optional requests, reminders,
main-quest contributions, remembered reactions, and post-chapter reflections.
No dialogue is generated at runtime.

## State and progression

`CampaignStateV1` records chapter phase, objectives, unique contributions,
visited locations, player choices, NPC memories, and Kampung meters.
`reduceCampaign(state, event)` is pure and idempotent. Future events are rejected
until unlocked; earlier places and unfinished requests remain revisitable.

Stable progress autosaves to `kampung-sg.campaign.v1`. Continue restores it,
confirmed Start Over replaces it, corrupt saves fall back safely, and demo mode
uses isolated in-memory state.

## World structure

`EstateScene` owns the 2560×1600 exterior. Reusable `InteriorScene` instances
draw resident-specific rooms from data. `WalkableScene` provides shared input,
interaction, depth, collision, transition latching, and reduced-motion fades.

Enterable locations include:

- Y’s, Mr. Long’s, Grandma Ros’s, and Ben’s flats via the Block 9 corridor
- craftsman’s workshop
- community centre
- kopitiam
- provision shop
- hawker centre
- prayer hall

Exterior state sleeps while indoors and wakes at the correct return door.
Visual consequences and lighting persist across chapter progress.

## World-first interface

The game world is the primary desktop and mobile surface. The Journal is not a
permanent dashboard column: it opens on request as a right-side modal drawer
over a dimmed backdrop. Its Main Story, Optional Requests, People, and Places
sections remain scrollable at every viewport size. Opening it makes the world
inert, moves focus to the visible Close button, and traps focus inside; Escape,
the Close button, or the backdrop closes it and restores focus to the world.

The exterior uses the full available wide shell. The more intimate 960 px
interiors use a centred 1085 px shell so room composition does not stretch into
empty space. Each location switch explicitly resizes the Phaser scale and
active camera viewport after the shell changes; this prevents stale camera
letterboxing when returning to the wider estate. The exterior camera uses
1.32× zoom at 1180 px and wider, 1.22× from 760–1179 px, and 1× below 760 px;
interiors retain their existing 1.12× desktop and 1× mobile framing. A
request-animation-frame resize latch keeps the renderer and active camera in
sync after responsive viewport changes.

## Art and runtime direction

The exploration layer uses an original Singapore-estate visual language:
stepped pixel edges, deep-teal outlines, warm upper-left light, contact shadows,
and restrained ramps derived from the project palette. “Stardew-like” means a
readable top-down interaction rhythm and a high bar for environmental density;
it does not mean copying another game’s art, characters, tiles, maps, systems,
or branding.

The player has down, up, and side-facing four-frame walks (side frames flip for
left/right). Resident sprites vary build, height, hair, skin tone, posture, and
everyday accessories. Each resident has directional four-frame walks and a
short deterministic estate route. Residents pause, face the nearby player, and
blink on authored schedules; their interaction coordinates and non-colour
markers move with them. Reduced motion keeps them at a static home frame.
After the ending they gather around a void-deck table. HDB windows light
progressively and the completed estate adds string lights. HDB details, drains,
path joints, three tree silhouettes, benches, lamps, bins, bicycles, planters,
counters, shelves, tools, tables, and room-specific floors are drawn in code.
Twenty-three hand-placed flower clusters are baked into the four exterior
textures. Seven code-drawn laundry lines and two community cats use
deterministic two-frame motion. Four additional two-frame vignettes show a
neighbour sweeping the void deck, two neighbours discussing the noticeboard,
an older garden steward tending a bed, and regulars talking at a kopitiam
table. Six reusable code-drawn story-cluster forms—chess seating, bicycle
planters, a maintenance trolley, a utility service point, stacked community
chairs, and shaded seating—appear in 12 collision-aware placements beside
paths and thresholds. Twenty-six drain grates and 28 leaf patches are baked
into the ground. Eight deterministic butterflies and dragonflies orbit those
garden and service pockets using two-frame textures. Reduced motion keeps
every ambient system static; the monsoon hides the insects and stores the
activity tools. The rebuilt pond has a layered water ramp, kerbed outline,
highlights, lily pads, flowers, and two collision rectangles around its
walkable silhouette.
Three manually phased ripple rings animate without tweens; reduced motion holds
them as static water marks. A six-object pool adds short walking puffs without
creating a new object on each step and hides them under reduced motion.
Chapter 2 changes the same estate into a deterministic tropical monsoon rather
than a separate or random map state. A fixed pool of 64 screen-space streaks,
ten puddles with manually phased rings, wet path bands, a cool multiply tint,
light haze, and warm shelter glows create the weather without per-frame object
allocation. Rain is masked from the original and resident-improved sheltered
routes. Helped residents gather under the original shelter, both community cats
move under cover, and the activity tools and seven laundry lines are stored
until the chapter changes. Reduced motion retains wet surfaces, haze, shelter
light, gathered residents, and sheltered cats while hiding falling rain and
freezing puddle rings.
East/south dressing adds a tray-return station, provision crates,
original mosaic dragon playground, and exercise corner with collision and
y-derived depth. The landscaping pass gives rain trees, palms, and frangipani
stepped canopies, branch structure, contact shade, and directional cast shadows.
Forty-one collision-aware shrubs, flower beds, pandan clumps, and hedges use
four reusable generated textures to plant building and path edges without
closing travel routes. Named landmarks no longer share generic block fronts:
the Hawker Centre, Kopitiam, Minah's shop, Community Centre, Prayer Hall,
Workshop, and Block 12 have distinct roofs, awnings, glazing, counters, lattice,
tools, thresholds, and code-drawn pixel signs. Twelve building collision shells
make the architecture physically solid while leaving intentional gaps aligned
with usable doors. The visual-novel layer is a distinct close-up mode: every
named NPC, including the Voice, has a unique 220×300 code-drawn SVG bust with
authored build, hair, skin tone, age lines, accessory, palette, and a small
community-role motif. Mr. Long's portrait, for example, carries his side-part,
ramp motif, and cane. Place/object narration uses a separate estate portrait
rather than assigning an NPC face. Desktop conversations stage the portrait
beside the script in a 940 px card; at 360 px the portrait becomes an 88×120 px
header companion while the full dialogue area spans the card below.

Two 2026-08-03 OpenAI image-generation passes used current gameplay captures
and project art as references. The first produced an original neighbourhood
style key; human review translated its visible-community-activity idea into
the four deterministic vignettes above. The second focused on estate density;
human review translated its story-cluster grammar, drain/leaf accents, and
tiny ambient life into the code-drawn systems above. Direct runtime use was
rejected because the richer texture, pseudo-writing, generated residents, and
flat raster would not preserve the scene's authored silhouettes, collision, or
chapter state. Exact prompts, outputs, accepted ideas, and rejected ideas are
preserved under `docs/prompts/`, `docs/art/`, and `docs/AI_USAGE_LOG.md`.

The four exterior quadrants are baked into static textures. Their shared 32 px
terrain grammar places deterministic grass patches and tufts, running-bond
concrete and sheltered-walk pavers, outlined kerbs, drain grates, and utility
covers. Grass fringe and sparse leaf litter are baked over path edges, so the
extra surface detail adds no per-frame work. Landmark façades are baked into
those same static quadrant textures. Reusable character, tree, landscape, and
prop textures are generated once, and interiors reuse one rebuilt backdrop
texture instead of retaining a full-size texture for every room. Movement
reuses one vector, interaction distance uses squared comparisons on a 50 ms
cadence, and the camera uses a small deadzone. Canvas remains the renderer until
a real-device comparison justifies changing it.

The production smoke harness instantiates all 12 locations, snapshots resident
routes to prove movement/attention/marker synchronization, samples all four
player and resident walk frames, proves both cats, four activity vignettes, and
laundry animate, proves all eight butterflies/dragonflies move and expose both
frames, and repeats that scene under emulated reduced motion to prove every
ambient system stays still. It verifies a woken exterior has a diverse rendered
palette, samples the generated grass/path texture for material and edge
variation, counts the four generated landscape forms and their sampled colours,
counts 88 exterior props, 12 story-cluster placements across six forms, and 54
baked ground accents, samples a generated landmark façade for colour, edge,
and dark-value structure, counts 90 live obstacle bodies, physically pushes
the player into a solid storefront, physically walks to a pond capture, and
walks the player to east and south captures. It also samples
pixels at the room and estate edges, exercises the Journal's complete
modal/focus contract, verifies the desktop portrait/card geometry and a named
NPC's profile traits, and captures the actual game, visual-novel card, and open
Journal at 360 px. Motion snapshots prove 1.32× wide-desktop and 1× mobile
exterior framing, three pond rings with changing phase in normal motion, static
pond phase and zero walking puffs under reduced motion, and pooled puffs during
normal walking. Chapter 2 snapshots also prove the fixed 64-streak rain pool,
ten puddle rings, dry shelter masks, sheltered helped residents and cats,
stored activity tools and laundry, a readable 360 px rain composition, and a
static no-falling-rain reduced-motion alternative. It samples 120 frames during resident,
monsoon, and player movement and repeats the player sample under a 4× CDP CPU
throttle.

The fixed cadence budgets are p95 ≤28 ms normally and p95 ≤34 ms throttled.
The harness first samples the static title screen to identify a host-wide
browser scheduler cap. Only when that baseline is already slower than a fixed
budget may game cadence use baseline p95 +3 ms; main-thread task work remains
independently capped at 8 ms/frame normally and 20 ms/frame under 4× CPU
throttling. A passing visual-novel portrait run measured 8.80 ms title p95,
8.90 ms resident-route p95, and 9.20 ms active p95 with 2.26 ms/frame
main-thread work; the 4× sample measured 9.10 ms p95 with 7.43 ms/frame work.
The later world-scale evidence run measured 9.00 ms title p95, 8.90 ms
resident-route p95, and 9.10 ms active p95 with 2.43 ms/frame work; the 4×
sample measured 9.20 ms p95 with 8.18 ms/frame work. It exposed 1.32× exterior
zoom, two visible pooled puffs, three pond rings, and 78 obstacle bodies before
the later story-cluster collision pass increased that count to 90.
Repeated activity-vignette evidence runs remained inside the configured
cadence and main-thread budgets on both normal and 4×-throttled samples. They
proved the fixed 64-streak pool, intentionally culled but legible desktop and
mobile density, dry shelter regions, and stored activity tools without turning
animation-phase-dependent visible-streak counts into a product claim.
It rendered the desktop bust at 238×325 px with 41 drawn primitives inside a
940 px card and the mobile bust at 88×120 px without horizontal overflow.
Its façade sample contained 55 colours, 218 edge transitions, and 26.1% dark
pixels; a real storefront collision moved the player from about `y=396` to
`y=253` before stopping outside the wall.
An earlier host-capped 30 Hz run remains logged as evidence that calibration
distinguishes scheduler cadence from game CPU work. These are regression
signals, not proof of performance on older hardware or equivalence to another
game.

## Acceptance criteria

- All five story parts progress only in order.
- Alternative 3-helper and 5-invitee combinations work without closing optional
  routes.
- Every named interior is visually distinct, code-drawn, and collision-aware.
- `E`, Space, desktop buttons, touch, and Journal equivalents work throughout.
- Location changes use a short fade, instant under reduced motion, and are
  announced in the live region.
- Chapter 2 weather remains deterministic and non-punitive; reduced motion
  preserves its story and visual state without falling-rain or puddle motion.
- The Journal opens only on request, behaves as a modal drawer, and shows Main
  Story, Optional Requests, People, and Places; future chapters are locked
  without spoilers.
- The full gate—typecheck, tests, build, audit, and production smoke—passes.

## Explicitly out of scope

Farming day cycles, inventory crafting, economy, combat, romance, procedural
world generation, online multiplayer, cloud saves, runtime-generated dialogue,
NPC surveillance schedules, and medical assessment.
