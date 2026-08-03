# Accessibility Requirements

Kampung SG is designed for older adults and intergenerational play. These are
product requirements, not optional polish.

## Input and interaction

- Support WASD, arrow keys, `E`, Space, visible desktop buttons, and touch.
- Keep active controls at least 48×48 CSS pixels.
- Prevent movement-key browser scrolling and stop world movement while an
  overlay owns focus.
- Restore focus to the world after dialogue and after the Journal closes.
- Use a transition latch so the entry key cannot immediately trigger an exit.
- Show a nearby prompt with a text label and non-colour marker.
- Provide an equivalent Journal action for every meaningful NPC, door, exit,
  quest-object, and story interaction.
- Never require fast reactions, repeated tapping, or a timer.

## Semantics and information

- Use semantic headings, buttons, lists, progress bars, status text, and modal
  dialogue outside the Canvas world.
- Structure the Journal as a labelled modal drawer with Main Story, Optional
  Requests, People, and Places.
- While the Journal is open, mark the background inert, expose
  `aria-modal="true"`, keep focus inside, and provide visible Close plus Escape
  and backdrop dismissal. Restore focus to the world after dismissal.
- Show locked future chapters without spoilers.
- Announce location changes, progress, choices, and completion in a polite live
  region.
- Expose complete dialogue lines to assistive technology while the visual
  typewriter effect runs.
- Keep code-drawn dialogue portraits decorative with `aria-hidden`; the
  speaker heading, complete live-region line, progress text, choices, and
  controls carry all conversational meaning.
- Use respectful non-medical language; never rank performance.
- Keep place names, prompts, status pills, and meter changes understandable
  without colour or animation.

## Visual and motion

- Keep essential body text at least 16px on narrow screens and 18px on larger
  screens.
- Maintain clear visible focus and WCAG AA text contrast.
- Avoid horizontal scrolling at 360px.
- Respect `prefers-reduced-motion`: location changes become instant and DOM
  motion is removed; player walking uses a static directional frame, resident
  routes and community cats stay at home, and deterministic blinks, four
  ambient task vignettes, laundry flutter, and eight butterflies/dragonflies
  hold static first-frame poses. Pond rings hold a static phase and walking
  puffs remain hidden. During the Chapter 2 monsoon, falling rain and ambient
  insects are hidden and puddle rings hold still while wet surfaces, overcast
  colour, shelter light, gathered residents, sheltered cats, and stored
  activity tools/laundry preserve the story state.
- Preserve responsive world legibility: the exterior uses 1.32× wide-desktop,
  1.22× tablet, and 1× mobile framing; responsive resize updates both Phaser
  scale and the active camera rather than relying on CSS stretching.
- Keep characters and interaction markers legible on grass, paths, and rooms.
- Keep inactive story, NPC, and door interaction markers visible as a
  non-colour `!`/door cue, and reveal the plain-language target label when it
  is nearest. Low-priority flavour details reveal their same ring, icon, label,
  nearby text, and contextual “Look” action only on approach so 14 decorative
  cues do not overwhelm the route.
- Preserve code-drawn entrances with text/unit-number cues rather than relying
  on colour.
- Keep the visual-novel card within the viewport at desktop and 360 px, with a
  large portrait that never displaces the readable script or 48 px controls.

## Canvas limitation and equivalent access

The estate is not exposed as a semantic spatial map. Decorative geometry and
collision boundaries are not announced. The nearby prompt, location label,
live region, and Journal provide semantic equivalents for every interaction
required to complete the story.

## Automated evidence

The 60-check production-browser harness verifies keyboard and touch entry,
Space-key choices, visible modal state, focus return, correct return doors,
Journal completion paths, all 12 locations rendering, 360px overflow, 48px
targets, saved progress, demo isolation, normal and 4×-CPU-throttled active
frame pacing, resident stop/facing and marker synchronization, ambient
cat/laundry/pond motion, all four two-frame community task vignettes, all eight
two-frame butterflies/dragonflies, all four player/resident walk frames, an
emulated reduced-motion stillness sample, normal walking puffs, successful
exterior wake-up, physical
pond/east/south travel,
responsive desktop/mobile camera zoom, and absence of uncaught console errors.
It physically approaches one of 14 low-priority estate details, verifies that
only its marker appears, opens it with `E`, checks the complete accessible
estate narration and contextual touch label, and repeats the open card at
360 px.
It also verifies the Chapter 2 monsoon's fixed rain pool, dry shelter masks,
ten puddles, sheltered residents and cats, stored activity tools and laundry,
stored ambient insects, mobile density, and an equivalent static
no-falling-rain state under emulated reduced motion.
It opens the Journal through its visible control, checks
`aria-hidden`/`inert` state and Close-button focus, wraps focus from the final
control, dismisses with both Escape and backdrop, and confirms world-focus
restoration. Its 360px run enters gameplay, verifies visible touch controls,
opens an in-bounds dialogue card and the 328px drawer, and captures all three
states. The grass/paver micro-texture
and tropical planting are decorative: walkable routes retain outlined kerbs
and geometry, plant bases have collision, and the new path-edge growth leaves
the complete physical travel route open. The nearby prompt, location label,
and Journal carry the semantic information without relying on those colours.
The harness also proves that 41 placed landscape objects instantiate across
four generated forms while keyboard travel still reaches both far districts.
It separately proves 88 exterior props across 22 texture forms, 12
collision-aware story clusters across six forms, and 54 baked drain/leaf
accents while the same keyboard travel lanes remain open.
The code-drawn landmark names, awnings, glazing, and structural details are
decorative reinforcement rather than the only route to meaning. Visible
runtime door prompts, location announcements, and equivalent Journal actions
remain the semantic path. The harness samples façade value/edge structure,
counts 93 live obstacle bodies, confirms all three solid bicycle bays remain
outside pedestrian spines and building footprints, and physically proves the
Minah storefront is
solid while deliberate doorway gaps and both far-district routes remain open.
All eight façade-occlusion layers restore automatically after the player steps
away. Their 180 ms visual ease becomes an instant alpha change under reduced
motion; doors, labels, and equivalent Journal actions do not depend on the
effect.
It also verifies a 238×325 px desktop portrait in a 940 px card, checks a named
NPC's deterministic portrait traits, and proves the responsive 88×120 px
portrait, complete text, and controls remain inside the 360 px viewport. The
portrait itself remains hidden from assistive technology; no dialogue
information depends on its colours, motif, age lines, or accessory.

## Manual checks still required

- [ ] Complete the full campaign by keyboard-only world exploration.
- [ ] Complete it using touch on a real phone or tablet.
- [ ] Complete every required beat using Journal equivalents.
- [ ] Inspect every interior at desktop, 360px portrait, tablet landscape, and
      wide desktop sizes.
- [ ] Test at 200% browser zoom.
- [ ] Test with reduced motion enabled.
- [ ] Run a screen-reader pass through title, HUD, Journal, dialogue, location
      announcements, Continue, and Start Over.
- [ ] Confirm meaning remains clear without colour and with audio muted.

No real-device, 200%-zoom, or screen-reader completion is claimed until these
boxes are checked by a human.
