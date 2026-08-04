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
| Auntie Minah | Organize a community ingredient shelf, model a check-before-you-act safety habit, and share Ros clues |
| Wei Ling | Complete a keepsake table and invite younger neighbours |

A side request may be required for one resident’s assistance while remaining
globally optional because another resident can fill the route.

Minah's Ros clue is also an elder-led scam-awareness beat. She spots urgency
and an unfamiliar payment link in a supplier message, then models checking the
request through the number already in her own order book or ScamShield at 1799
and never sharing an OTP. The player does not pass a scam quiz: both choices
are presentation preferences, either three large numbered steps or icons with
short words. Through one atomic campaign event, both collect the same clue,
advance the chapter, record the chosen layout, and pin the corresponding
code-drawn card in her shop window.
The safety wording is grounded in the official sources recorded in
`docs/RESEARCH.md`; it does not promise detection, prevention, or an outcome.
The Chapter 2 Journal keeps the complete PAUSE, CHECK, TELL habit and chosen
layout available as semantic text after the one-time conversation. Existing
version-1 saves with either half of the Minah card/clue pair receive the missing
objective and memories deterministically on load; clue-only saves use the
numbered layout, while card-only saves retain their chosen layout. Completed or
interrupted campaigns therefore cannot lose the consequence or its story gate.

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
permanent dashboard column: it opens on request as a wide quest book over a
dimmed backdrop. Story, Requests, People, and Places are real tabs with
arrow-key navigation. Each selected entry has a dedicated detail page,
objective checklist, proportional progress, status, context actions, and
optional tracked-quest state. Future chapters remain spoiler-free. Opening the
Journal makes the world inert, moves focus to the visible Close button, and
traps focus inside; Escape, the Close button, or the backdrop closes it and
restores focus to the world.

The exterior and interiors use the full available shell. Each 960×640 interior
computes a room-fit zoom from both viewport dimensions, caps desktop at 1.08×,
and centres any remaining horizontal or vertical margin around the room.
Portrait phones retain a 0.56× readability floor instead of shrinking the
player to an unusable size; short landscape viewports cap that floor by the
available vertical fit so the room is not clipped. At 320×568, 360×560, and
640×360, the shell reflows within 100dvh so the stage, topbar, touch controls,
and Journal remain usable without document overflow. Each location switch
explicitly resizes the Phaser scale and active camera viewport after the shell
changes; this prevents stale
camera framing when returning to the estate. The exterior camera uses 1.32×
zoom at 1180 px and wider, 1.22× from 760–1179 px, and 1× below 760 px. A
request-animation-frame resize latch keeps the renderer and active camera in
sync after responsive viewport changes.

On touch screens, a short primary tap sets or redirects a straight-line walking
destination; tapping an interaction follows its moving target and activates on
arrival, or activates immediately when already nearby. Keyboard or
directional-pad input, collision stalls, blur, visibility changes, and game transitions
clear the pending destination. Long presses, drags, and multi-touch are rejected,
the Canvas stage retains browser pinch/pan, and the grouped directional pad and
Talk control reserve their own gestures. The destination ring remains 28 CSS
pixels across camera zoom levels.

A labelled browser-fullscreen control expands the game to the complete
viewport. The document root is the fullscreen target so dialogue and Journal
overlays remain valid descendants. Fullscreen hides the topbar for an
uninterrupted world view and shows an Escape hint; leaving fullscreen restores
the topbar and focuses Sound, while toggling Sound returns focus to the world
so movement resumes immediately.

A circular, code-drawn estate map sits inside the world HUD. Seven landmark
anchors follow the same doorway coordinates as the playable exterior. Outdoors,
the player marker projects the live 2560×1600 position into the map; indoors,
the corresponding landmark is highlighted and Block 9 homes share their real
building anchor. Activating the map opens that place in the Journal. The SVG is
decorative; its button label and the Places tab carry the semantic location.

## Art and runtime direction

The exploration layer uses an original Singapore-estate visual language:
stepped pixel edges, deep-teal outlines, warm upper-left light, contact shadows,
and restrained ramps derived from the project palette. “Stardew-like” means a
readable top-down interaction rhythm and a high bar for environmental density;
it does not mean copying another game’s art, characters, tiles, maps, systems,
or branding.

The player has down, up, and side-facing four-frame walks (side frames flip for
left/right). Normal walking advances at a calmer 125 ms per frame, while Shift
hurry and accelerated demo movement use a 92 ms cadence. When standing still,
the player blinks on a deterministic authored interval; approaching an NPC,
door, or detail turns the player toward it before the visual-novel or location
transition opens. A persistent gold-and-cream downward triangle follows above the
player at a fixed high depth so the protagonist stays readable through dense
props and softened façades; reduced motion removes its subtle bob. Resident
sprites use stepped head and shoulder profiles, connected sleeves and hands,
grounded two-foot phases, and one runtime contact shadow rather than a second
baked shadow. A pure art registry gives the 12 residents three builds, five
hair silhouettes, five outfit grammars, four accessory states, and optional
carried totes while retaining authored skin, hair, and clothing colours.
Each resident has directional four-frame walks and a short deterministic
estate route. Residents pause, face the nearby player, and blink on authored
schedules; their interaction coordinates and non-colour markers move with
them. Reduced motion keeps them at a static home frame.
The nearest interaction reveals one shared cream-and-gold code-drawn label
plate. It replaces square debug-like text backgrounds without creating
separate textures for every name and stays visible in the Canvas2D fallback.
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
them as static water marks. A six-slot effect pool adds short dust and fleck
responses without creating a new object on each step. Its grass, estate-paving,
and indoor variants mirror the baked terrain geometry and pair with three
Web Audio footstep profiles generated from one reusable deterministic noise
buffer. Reduced motion hides the visual effects and player idle blink. Audio
remains available because it does not convey quest state by itself. The
ambient pad follows separate four-chord day and evening progressions. Three
shared-tone voices and one quiet lead move by no more than a perfect fourth
between adjacent chords, replacing unrelated random notes with a calm,
deterministic musical identity.
Completed routes add code-drawn consequence art without changing story or
collision semantics. Mr. Long's route uses matching exterior and interior
three-quarter ramps with rails, a tactile gold edge, shading, and contact
shadows. The garden choice renders either two labelled raised herb beds with
varied plants or two flower beds plus a shaded bench. The sheltered-route
choice adds a five-post extension with a pitched teal roof, ground shadow, and
striped shade bands. Each asset is location- and state-specific, so unrelated
rooms and incomplete routes remain visually unchanged.

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
tools, thresholds, and code-drawn pixel signs. Seven exterior entrances share
one registry for their code-drawn door, prompt point, named building, and
placard. Fourteen building collision zones make the architecture physically
solid while leaving explicit audited gaps aligned with those usable doors.
All eight large exterior structures now also share one shallow three-quarter
projection contract. Hipped or sawtooth roof planes, seam lines, right-side
faces, ground contact shadows, and seven recessed entry bays are baked into the
same quadrant textures as their original façades. The depth registry keys each
profile to the existing visual-zone ID, and the layout audit rejects duplicate,
missing, or invalid geometry without moving a doorway or collision shell.
Three bicycle racks use centralized outdoor-verge
placements, marked concrete bays, and solid collision. Their ground footprints
are checked against the larger visual bounds of all eight exterior buildings
and both pedestrian crossings/spines. Because this campaign estate contains no
vehicular road, its motor-vehicle route registry is intentionally empty; the
old bus actor and texture were removed instead of letting traffic cross a
garden. Each of the eight building crops is also repeated as a y-sorted
foreground occlusion layer. It is pixel-identical at rest, softens to 28%
opacity only while covering the player, and returns fully opaque after they
step away. Normal motion uses a 180 ms ease; reduced motion applies the state
instantly. Runtime doors, laundry, lit windows, and string lights remain above
the crop so interaction cues stay crisp. The visual-novel layer is a distinct
close-up mode: every
named NPC, including the Voice, has a unique 220×300 code-drawn SVG bust with
authored build, hair, skin tone, age lines, accessory, palette, and a small
community-role motif. Mr. Long's portrait, for example, carries his side-part,
ramp motif, and cane. Place/object narration uses a separate estate portrait
rather than assigning an NPC face. Desktop conversations stage the portrait
beside the script in a 940 px card; at 360 px the portrait becomes an 88×120 px
header companion while the full dialogue area spans the card below. Each named
portrait has neutral, thoughtful, and warm code-drawn expressions selected
from dialogue position and choice state. The expression is decorative; the
speaker heading, complete live-region line, progress text, choices, and
controls remain the semantic conversation. A single visible `>` chevron
replaces the former full-width Continue bar; its exact 52×52 transparent button
has `aria-label="Continue dialogue"` and an enclosing 3 px outline plus 6 px
outer focus ring, while reduced motion removes the horizontal pulse.

Four OpenAI image-generation workflows used current gameplay captures and
project art as references. Two 2026-08-03 studies produced an original
neighbourhood style key and an estate-density study. Human review translated
their community-activity, story-cluster, drain/leaf, and ambient-life ideas
into the code-drawn systems above; direct runtime use was rejected because
their richer texture, pseudo-writing, generated residents, and flat raster
would not preserve authored silhouettes, collision, or chapter state. A
2026-08-04 title-panorama workflow used a separate production path: the first
output was rejected for pseudo-writing, a constrained edit replaced only the
noticeboard papers with non-text pictograms, and the accepted 1668×943 source
was optimized to a 326 kB WebP. It is the first reviewed generated raster
intentionally shipped in the playable build. The title, tagline, controls, and
caption remain semantic HTML over the responsive artwork. Exact prompts,
artifacts, hashes, accepted/rejected decisions, and runtime use are preserved
under `docs/prompts/`, `docs/art/`, `public/assets/generated/`, and
`docs/AI_USAGE_LOG.md`. A fourth 2026-08-04 cast study used a current estate
capture to explore silhouette and gait. Human review accepted stepped
heads/shoulders, connected limbs, grounded footwork, and readable outfit
families, while rejecting costume-like or culturally stereotyped details.
Those decisions informed the original code-drawn resident registry; the raster
study remains evidence-only. All four workflows are OpenAI evidence, not
Miora.

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

The production build intentionally keeps Phaser and the complete campaign
scene in one cached lazy chunk. After the title art settles, idle time prefetches
that import unless Save-Data or a 2g/slow-2g effective connection is reported.
Starting play shows an atomic polite opening status and inerts world/topbar
actions; after 12 seconds a focused action can return to the title, while a
failed import clears the cached rejection and exposes focused Try again and
Back to title actions. Attempt tokens prevent retry/cancel races and late or
duplicate Canvases. Browser-storage failure produces a warning but does not
block play. The chunk still triggers Vite's generic 500 kB warning; keeping its
tightly coupled textures and registries together remains an accepted tradeoff
until real-device profiling justifies another split.

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
and dark-value structure, counts 95 live obstacle bodies, proves three
building/path-safe bicycle bays and zero roadless motor routes, proves all
eight façade layers fade and restore at a physical building stop, physically pushes
the player into a solid storefront, physically walks to a pond capture, and
walks the player to east and south captures. It also proves the desktop
room-fit relationship, exercises the Journal's complete
modal/focus/tab/tracking contract, verifies live minimap movement, verifies the
desktop portrait/card geometry and a named NPC's profile traits, and captures
the actual game, visual-novel card, circular map, and stacked Journal at 360
px. Short-viewport runs at 320×568, 360×560, and 640×360 prove 100dvh fit,
usable controls and Journal, and no document overflow. Touch checks prove tap
redirection, target following and activation, cancellation and gesture
rejection, assistive-technology activation of the grouped directional pad,
preserved stage pinch/pan, and the constant-size destination ring. Loader
checks prove prefetch/cache behavior, connection-aware suppression, opening,
slow, cancel, retry, stale-attempt, inert-state, and storage-recovery paths.
Consequence snapshots prove the two ramp locations, both exclusive garden
choices, the sheltered linkway extension, and absence outside the appropriate
story/location states. Motion snapshots prove 1.32× wide-desktop and 1× mobile
exterior framing, three pond rings with changing phase in normal motion, static
pond phase, zero walking effects, and no player idle blink under reduced
motion. Normal-motion snapshots prove the player's interaction-facing and
idle blink plus separate grass and paving effects. Chapter 2 snapshots also
prove the fixed 64-streak rain pool,
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
the story-cluster pass increased that count to 90, solid bicycle bays raised
it to 93, and audited hawker/workshop doorway gaps split the final shells into
95 bodies.
One passing 2026-08-04 tactile-movement gate measured 9.10 ms title p95,
9.10 ms resident-route p95, 9.30 ms monsoon p95, and 9.20 ms active p95 with
2.40 ms/frame main-thread work. Its 4× CPU-throttled sample measured 9.30 ms
p95 with 9.57 ms/frame work while both grass and paving responses were live.
Repeated activity-vignette evidence runs remained inside the configured
cadence and main-thread budgets on both normal and 4×-throttled samples. They
proved the fixed 64-streak pool, intentionally culled but legible desktop and
mobile density, dry shelter regions, and stored activity tools without turning
animation-phase-dependent visible-streak counts into a product claim.
It rendered the desktop bust at 238×325 px with 41 drawn primitives inside a
940 px card and the mobile bust at 88×120 px without horizontal overflow.
The current façade sample contains 214 colours, 270 edge transitions, and 28.6% dark
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
- The Journal opens only on request, behaves as a modal quest book, and shows
  Story, Requests, People, and Places with selection, objectives, progress,
  tracking, and context actions; future chapters are locked without spoilers.
- The circular map uses the playable estate coordinates, follows outdoor
  movement, identifies the correct indoor landmark, and opens Places.
- The full gate—typecheck, tests, build, audit, and production smoke—passes.

## Explicitly out of scope

Farming day cycles, inventory crafting, economy, combat, romance, procedural
world generation, online multiplayer, cloud saves, runtime-generated dialogue,
NPC surveillance schedules, and medical assessment.
