# Accessibility Requirements

Kampung SG is designed for older adults and intergenerational play. These are
product requirements, not optional polish.

## Input and interaction

- Support WASD, arrow keys, `E`, Space, visible desktop buttons, and touch.
- Keep active controls at least 48×48 CSS pixels.
- Let a short primary tap set or redirect a straight-line walking destination;
  tapping an interaction follows a moving target and activates it on arrival.
  Nearby taps may activate immediately. Manual keyboard or directional-pad
  input, collision stalls, blur, visibility changes, and leaving or restarting
  the game clear pending navigation.
- Reject long presses over 600 ms, drags over 12 CSS pixels, and multi-touch as
  navigation gestures. Preserve browser pinch/pan on the stage with
  `touch-action: manipulation`; reserve `touch-action: none` for the grouped
  directional pad and Talk control. Directional buttons must also respond to
  zero-detail clicks from keyboard and assistive technology.
- Prevent movement-key browser scrolling and stop world movement while an
  overlay owns focus.
- Restore focus to the world after dialogue and after the Journal closes.
- Keep only Journal and a minimum 48×48 Menu control in the play topbar.
- Put Sound, Music, Effects, Fullscreen, and the controls reminder in Pause
  Settings. Fullscreen changes initiated there keep Settings open; leaving
  native fullscreen through browser Escape must land in Pause.
- Use a transition latch so the entry key cannot immediately trigger an exit.
- Show a nearby prompt with a text label and non-colour marker.
- Provide an equivalent Journal action for every meaningful NPC, door, exit,
  quest-object, and story interaction.
- Never require fast reactions, repeated tapping, or a timer.

## Semantics and information

- Use semantic headings, buttons, lists, progress bars, status text, and modal
  dialogue outside the Canvas world.
- Structure the Journal as a labelled modal quest book with Story, Requests,
  People, and Places tabs, an explicit selected entry, objective checklist,
  progress text, and context actions.
- Give Journal tabs `role="tab"`, `aria-selected`, labelled tab panels, and
  Left/Right/Home/End keyboard navigation.
- While the Journal is open, mark the background inert, expose
  `aria-modal="true"`, keep focus inside, and provide visible Close plus
  backdrop dismissal. Escape opens Pause above it. Resume restores the same
  selected Journal control; ordinary dismissal restores focus to the world.
- Pause is a separate `aria-modal` focus trap with `closed`, `paused`,
  `settings`, and `confirm-title` states. Opening it snapshots the underlying
  dialogue/Journal accessibility and focus state, marks every background
  surface inert and `aria-hidden`, pauses the active scene, and ducks only
  music. Escape moves Settings/confirmation back to Paused and Paused back to
  the exact underlying focus. The confirmation states that progress is
  autosaved and teardown never resumes the scene first.
- Show locked future chapters without spoilers.
- Announce location changes, progress, choices, and completion in a polite live
  region.
- Expose complete dialogue lines to assistive technology while the visual
  typewriter effect runs.
- Use a sole visible `>` chevron to advance authored lines rather than a
  labelled Continue bar. Its transparent button is exactly 52×52 CSS pixels,
  has `aria-label="Continue dialogue"`, and receives an enclosing high-contrast
  focus treatment (3 px outline plus 6 px outer ring) without exposing another
  visible label. Preserve the existing touch/Space activation path.
- Announce campaign loading through an atomic polite `role="status"` region.
  While opening, make world and topbar actions inert. After 12 seconds, expose
  and focus a return-to-title action; after import failure, expose focused Try
  again and Back to title actions. A failed save must warn without preventing
  gameplay, and retry/cancel must not create a late or duplicate Canvas.
- Keep code-drawn dialogue portraits decorative with `aria-hidden`; the
  speaker heading, complete live-region line, progress text, choices, and
  controls carry all conversational meaning. Neutral, thoughtful, and warm
  portrait expressions may reinforce tone, but never carry dialogue state by
  themselves.
- Keep the generated title panorama's HDB, gardening, and noticeboard scene
  described by concise alternative text. Keep the title, tagline, controls,
  and caption as semantic HTML rather than text baked into the image.
- Treat Minah's two safety-card choices as equivalent presentation
  preferences, not a correctness test. Both use full semantic button labels,
  advance the same story route, and preserve the complete safety wording in
  the dialogue live region. The code-drawn shop-window card is a persistent
  visual consequence; no instruction is available only through its icons,
  colour, or tiny in-world text. The Chapter 2 Journal repeats the PAUSE,
  CHECK, TELL habit, separate-verification/1799 route, OTP warning, and chosen
  card layout as semantic text.
- Treat the exterior/interior ramps, alternate raised-bed gardens, shaded seat,
  and sheltered-linkway extension as visual reinforcement of completed routes.
  Their rails, tactile edge, plant labels, flowers, roof, and shade never carry
  an instruction or outcome that is absent from dialogue, status, and Journal
  text.
- Use respectful non-medical language; never rank performance.
- Keep place names, prompts, status pills, and meter changes understandable
  without colour or animation.

## Visual and motion

- Keep essential body text at least 16px on narrow screens and 18px on larger
  screens.
- Maintain clear visible focus and WCAG AA text contrast.
- Avoid document overflow at 320×568 and 360×560 portrait and 640×360 landscape;
  keep the 100dvh shell, stage, topbar, touch controls, and Journal usable.
- Respect `prefers-reduced-motion`: location changes become instant and DOM
  motion is removed; player walking uses a static directional frame, resident
  routes and community cats stay at home, and deterministic blinks, four
  ambient task vignettes, laundry flutter, and eight butterflies/dragonflies
  hold static first-frame poses. Pond rings hold a static phase and walking
  effects remain hidden; the player's deterministic idle blink is also
  disabled. During the Chapter 2 monsoon, falling rain and ambient
  insects are hidden and puddle rings hold still while wet surfaces, overcast
  colour, shelter light, gathered residents, sheltered cats, and stored
  activity tools/laundry preserve the story state. Title-image drift,
  decorative particles, screen fades, and portrait-expression transitions
  also stop.
- Preserve responsive world legibility: the exterior uses 1.32× wide-desktop,
  1.22× tablet, and 1× mobile framing; responsive resize updates both Phaser
  scale and the active camera rather than relying on CSS stretching.
- Fit desktop interiors from both viewport dimensions and centre unused camera
  margins. Prefer a 0.56× phone readability floor, but cap it by available
  vertical fit on short landscape viewports so the room is not clipped.
- Keep characters and interaction markers legible on grass, paths, and rooms.
- Distinguish residents through stepped silhouettes, build, hair, clothing
  motifs, carried objects, and walking aids rather than colour alone. Keep one
  clear contact shadow per character so feet remain grounded without a dark
  duplicate underlay.
- Keep a high-contrast downward triangle directly above the main character in
  every location. It is a visual guide only; player position and interaction
  meaning remain available through the nearby prompt, location label, map,
  and Journal.
- Keep inactive story, NPC, and door interaction markers visible as a
  non-colour `!`/door cue, and reveal the plain-language target label when it
  is nearest. Low-priority flavour details reveal their same ring, icon, label,
  nearby text, and contextual “Look” action only on approach so 14 decorative
  cues do not overwhelm the route.
- Preserve code-drawn entrances with text/unit-number cues rather than relying
  on colour.
- Keep the visual-novel card within the viewport at desktop and 360 px, with a
  large portrait that never displaces the readable script, the chevron, or
  48 px controls.

## Canvas limitation and equivalent access

The circular estate overview is decorative and hidden from assistive
technology; it is not a semantic rendering of geometry or collision
boundaries. Its enclosing button announces the current place and opens that
place in the Journal. The nearby prompt, location label, live region, and
Journal provide semantic equivalents for every interaction required to
complete the story.

## Automated evidence

Four source-contract tests protect the dialogue's sole visible `>` text,
`aria-label="Continue dialogue"`, exact 52×52 geometry, enclosing focus ring,
reduced-motion pulse removal, and the continued availability of “Maybe later.”

The production-browser harness verifies keyboard and touch entry,
Space-key choices, visible modal state, focus return, correct return doors,
Journal completion paths, all 12 locations rendering, 360px overflow, 48px
targets, saved progress, demo isolation, normal and 4×-CPU-throttled active
frame pacing, resident stop/facing and marker synchronization, ambient
cat/laundry/pond motion, all four two-frame community task vignettes, all eight
two-frame butterflies/dragonflies, all four player/resident walk frames, an
emulated reduced-motion stillness sample, deterministic player idle blinking,
player-to-interaction facing, separate grass/paving walking effects, successful
exterior wake-up, physical
pond/east/south travel,
responsive desktop/mobile camera zoom, and absence of uncaught console errors.
It also verifies loader idle prefetch and cache reuse, Save-Data/2g-class
prefetch suppression, opening and 12-second slow status, cancellation, retry,
failed-import cache clearing, stale-attempt suppression, inert world controls,
and recovery when browser storage rejects a save.
The same full and demo journeys read Minah's complete check-before-you-act
dialogue, expose two no-failure presentation choices, render a different large
layout in each route, select it by keyboard, revisit the semantic Journal note,
and verify that the saved card stays visible at rest while matching Minah's
façade fade and restore alpha.
The surface effects and footstep timbres are redundant ambience: paths retain
their kerbs and texture, and no objective, collision, or interaction depends on
seeing or hearing the surface response.
It physically approaches one of 14 low-priority estate details, verifies that
only its marker appears, opens it with `E`, checks the complete accessible
estate narration and contextual touch label, and repeats the open card at
360 px.
It also verifies the Chapter 2 monsoon's fixed rain pool, dry shelter masks,
ten puddles, sheltered residents and cats, stored activity tools and laundry,
stored ambient insects, mobile density, and an equivalent static
no-falling-rain state under emulated reduced motion.
Consequence snapshots separately prove the exterior ramp, interior-only ramp
in Mr. Long's flat, mutually exclusive herb and flower-plus-shaded-seat beds,
five-post pitched-roof linkway extension, and their absence outside the correct
story and location states.
It opens the Journal through its visible control, checks four tabs and their
selected state, uses arrow keys to switch categories, verifies selected-quest
objectives/progress and tracked state, checks `aria-hidden`/`inert` state and
Close-button focus, wraps focus from the final control, opens Pause with Escape
without losing the Journal, resumes to the same focus, dismisses with the
backdrop, and confirms world-focus restoration. It also proves Pause freezes
the scene snapshot, traps focus, keeps Settings open across its fullscreen
toggle, restores movement/focus on Resume, and exposes only Journal/Menu in the
topbar. It also proves a
desktop room fits the full-width camera and the circular map has seven
landmarks, one current indoor anchor, and a marker that changes between
physical east/south positions. Runs at 320×568, 360×560, and 640×360 verify the
100dvh fit, no document overflow, reachable Journal, 48 px topbar/touch targets,
and the short-landscape interior fit. Touch evidence covers tap redirection,
target following and auto-interaction, manual/collision cancellation, rejection
of drag/long-press/multi-touch input, grouped directional-pad activation from
assistive-technology-style clicks, preserved stage pinch/pan, and a constant
28 px destination-ring diameter across zoom. The 360px run also opens an
in-bounds dialogue card and the full-width stacked Journal and captures all
three states. The grass/paver micro-texture
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
counts all eight shared depth profiles, both roof styles, and seven recessed
entry bays,
counts 95 live obstacle bodies, confirms all three solid bicycle bays remain
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
information depends on its colours, motif, age lines, accessory, or expression.
The same dialogue journey verifies a neutral-to-thoughtful expression change
and the exact chevron target, accessible name, enclosing focus treatment, and
reduced-motion stillness without increasing the 60-check headline. The title
check confirms the
reviewed 1668×943 WebP loads and that the page has no desktop overflow; the
existing 360 px capture and overflow assertion remain the mobile evidence.
The same run toggles Sound inside Settings while the scene remains frozen. It
verifies the main-character triangle follows the player above the sprite,
then exercises Settings-owned full-screen entry/exit and exact Resume focus.

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
