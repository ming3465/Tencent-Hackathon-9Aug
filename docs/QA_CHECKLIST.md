# Campaign QA Checklist

## Automated unit coverage — 75 passing

- [x] Chapter ordering and future-event rejection
- [x] Full and demo thresholds
- [x] Alternative helper and attendee combinations
- [x] Optional-route skipping and revisiting
- [x] Idempotent events and bounded meters
- [x] KampungMind intent eligibility, scoring, stable ties, and memory reactions
- [x] Campaign content references and location graph integrity
- [x] Fourteen estate flavour details have unique IDs, useful authored
      narration, and in-bounds coordinates
- [x] All 13 NPC profiles have unique, detailed code-drawn portrait definitions
      and place narration has a separate estate portrait
- [x] Versioned saves, corrupt-save fallback, Start Over, and demo isolation
- [x] Optional keepsake matching and audio rules

## Production-browser smoke — 60 passing

- [x] Production bundle creates exactly one Phaser Canvas
- [x] Prologue Voice, authored-line progression, 238×325 px desktop portrait
      in a 940 px card, choice, and focus
- [x] Keyboard and touch entry/exit with correct return positions
- [x] Mr. Long, Grandma Ros, Ben, and craftsman interiors
- [x] Locked progression and two independent clue gates
- [x] Full 3-helper and 5-attendee route
- [x] Complete Chapter 3 supportive approach and no-failure weaving
- [x] Ending and post-story free exploration
- [x] Reload/Continue, confirmed Start Over, and valid versioned save
- [x] Demo 2-helper/2-attendee route with every chapter retained
- [x] Demo save isolation
- [x] All 12 locations instantiate in completed free exploration
- [x] Authored resident routes change position while a nearby resident stops,
      faces the player, and keeps its marker synchronized
- [x] Physical keyboard movement exposes all four player frames, and sampled
      moving residents expose all four directional walk frames
- [x] A real approach to the shared bicycles reveals exactly one low-priority
      marker, a contextual “Look” touch action, complete accessible narration,
      and an in-bounds 360 px modal
- [x] Both community cats move and HDB laundry advances in normal motion
- [x] Sweeping, noticeboard, garden, and kopitiam activity vignettes each expose
      both deterministic animation frames in normal motion
- [x] Eight butterflies/dragonflies move around authored estate pockets and
      each exposes both deterministic animation frames in normal motion
- [x] Three pond rings change phase and pooled walking puffs appear during
      normal movement
- [x] Chapter 2 exposes a fixed 64-streak rain pool, ten animated puddle rings,
      wet surfaces, and dry original/restored shelter masks
- [x] Three previously helped residents and both cats gather under cover while
      all four activity vignettes, all eight ambient insects, and seven laundry
      lines are stored during the monsoon
- [x] The 360px weather capture retains at least 18 visible streaks without
      overflow (documented density-evidence pass: 26)
- [x] Residents, cats, laundry, pond phase, and walking puffs remain static or
      hidden under emulated reduced motion; all four activity vignettes and
      eight ambient insects hold a static first frame
- [x] Reduced-motion monsoon keeps the overcast/wet story state while falling
      rain is hidden and puddle phase remains static
- [x] A slept exterior wakes with its location label, controls, camera image,
      and consequence state restored
- [x] The Journal opens from its visible control as a modal drawer, makes the
      world inert, focuses Close, wraps focus, closes via Escape and backdrop,
      and restores world focus
- [x] Wide estate and centred-interior shells render real canvas pixels to
      their intended right edges after location-driven scale/camera resizing
- [x] Exterior camera reports 1.32× at wide desktop and 1× at 360px mobile
- [x] Player movement physically reaches and captures the layered pond before
      continuing through the open east/south travel spine
- [x] Keyboard movement physically reaches the eastern and southern districts
- [x] Generated terrain exposes at least 3 grass colours, 6 path colours, and
      12 path-edge transitions (documented pass: 11 / 26 / 27)
- [x] All 41 collision-aware landscape objects instantiate across four
      generated forms with at least 12 foliage colours (documented pass: 44)
- [x] All 88 exterior props instantiate across 22 generated forms, including
      12 collision-aware story clusters across six forms; 54 baked drain/leaf
      accents add surface detail without adding per-frame objects
- [x] Generated landmark façade exposes at least 20 colours, 180 edge
      transitions, and 8% dark pixels (documented pass: 55 / 218 / 26.1%)
- [x] All 90 obstacle bodies instantiate; a real northward movement sample
      stops at the Minah storefront (about `y=396` to `y=253`) while east/south
      travel remains reachable
- [x] Mr. Long's runtime portrait exposes his stable ID, cane, side-part, and
      at least 30 code-drawn primitives
- [x] 120 resident-route frames stay inside the normal p95 budget
- [x] 120 Chapter 2 monsoon frames stay inside the normal p95 budget
- [x] 120 active-movement frames stay inside the normal p95 budget
- [x] A repeated 120-frame sample stays inside the 4× CPU-throttled budget
- [x] Scheduler-capped runs stay within 3 ms of the same-run title baseline
      and within 8/20 ms per-frame main-thread budgets
- [x] Desktop and 360px overflow, 48px targets, and console errors
- [x] The 360px path enters gameplay with touch controls and verifies/captures
      the world, an in-bounds 88×120 px visual-novel portrait, and the 328px
      Journal drawer

## Manual — not yet claimed

- [ ] Inspect all locations at desktop, 360px mobile, tablet, and wide desktop
- [ ] Complete a keyboard-only playthrough through world navigation
- [ ] Complete a real-device touch playthrough
- [ ] Inspect interior collision boundaries manually
- [ ] Inspect every named exterior doorway and building boundary manually
- [ ] Test at 200% browser zoom
- [ ] Test with reduced motion
- [ ] Run a screen-reader pass
- [ ] Confirm the complete experience remains understandable without colour
- [ ] Conduct consented older-adult playtests using `docs/PLAYTEST_PROTOCOL.md`

## Evidence integrity

- [x] Original CodeBuddy prompt, failure, and correction limit are recorded
- [x] KampungMind/Codex work and verification are recorded
- [x] Original pixel-art and frame-pacing work is recorded without a
      real-device or cross-game performance claim
- [x] Gemini CLI authentication-blocked attempt is recorded without claiming output
- [x] Both OpenAI image-generation studies, exact prompts, accepted/rejected
      details, and curated code translations are recorded without a Miora
      claim
- [x] Automated counts match the current repository
- [x] Known manual limitations remain explicit
- [x] No playtest, metric, or AI-tool run is invented
