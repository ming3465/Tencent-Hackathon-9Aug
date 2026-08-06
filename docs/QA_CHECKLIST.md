# Campaign QA Checklist

## Automated unit coverage — 90/90 passing

The total comprises 30 campaign, 31 match-engine, 17 audio, 4
accessibility-contract, and 8 world-layout/door/pause tests.

- [x] Chapter ordering and future-event rejection
- [x] Full and demo thresholds
- [x] Alternative helper and attendee combinations
- [x] Optional-route skipping and revisiting
- [x] Idempotent events and bounded meters
- [x] KampungMind intent eligibility, scoring, stable ties, and memory reactions
- [x] Campaign content references and location graph integrity
- [x] Minah's Chapter 2 safety beat exposes official-source wording, two
      equivalent card-layout choices, one atomic card-plus-clue outcome,
      idempotent persistence, a semantic Journal objective/layout note,
      bidirectional partial/legacy-save repair, and safe rejection before the
      chapter unlocks
- [x] Journal view grouping, threshold-aware objective progress, spoiler-free
      future entries, and default active selection
- [x] All map anchors project inside the circular overview and Block 9 homes
      share their correct building anchor
- [x] Fourteen estate flavour details have unique IDs, useful authored
      narration, and in-bounds coordinates
- [x] All 13 NPC profiles have unique, detailed code-drawn portrait definitions,
      neutral/thoughtful/warm expression variants, and place narration has a
      separate estate portrait
- [x] Versioned saves, corrupt-save fallback, Start Over, and demo isolation
- [x] Optional keepsake matching, audio rules, and bounded four-chord
      day/evening voice-leading
- [x] Dialogue source contract keeps the sole visible `>` advance text,
      `aria-label="Continue dialogue"`, exact 52×52 target, enclosing focus
      ring, reduced-motion pulse removal, and the “Maybe later” route
- [x] Exact six-street/eight-building geometry, non-overlap, connected walking
      network, 22 paired contextual doors, approach/return spawns, 20 px
      shelter continuity, distinct choice masks, and 96 px minimum clearance
- [x] Door opening/transition idempotency, four-state Pause Escape semantics,
      and transient 35% music-only ducking
- [x] All 11 tree sprite bounds clear streets, buildings, shelters, lamp
      aprons, and world edges while preserving species, depth, and trunk data
- [x] All six lamp bases sit inside their tiled stone aprons and clear streets
      and door approaches
- [x] Automatic story tracker selection across every chapter, sequential
      Chapter 2 quests, one session-only optional request, fallback action, and
      post-ending free exploration

## Production-browser smoke — 60/60 passing

- [x] Production bundle creates exactly one Phaser Canvas
- [x] Production build measures 91.64 kB HTML (16.14 kB gzip), 141.46 kB
      initial JavaScript (41.48 kB gzip), and a 1,613.26 kB lazy scene
      (379.79 kB gzip)
- [x] Reviewed 1668×943 WebP title artwork loads without desktop overflow
- [x] Cached idle campaign prefetch runs after title-art settlement, skips
      Save-Data and 2g-class connections, reports opening and 12-second slow
      states, supports cancel/back and failed-import retry, suppresses stale or
      duplicate Canvas creation, and survives rejected browser storage
- [x] Prologue Voice, authored-line progression, sole visible `>` chevron with
      `aria-label="Continue dialogue"`, an exact 52×52 target and enclosing
      focus ring, 238×325 px desktop portrait in a 940 px card, expression
      changes, choice, and reduced-motion stillness
- [x] Keyboard and touch entry/exit with correct return positions
- [x] Mr. Long, Grandma Ros, Ben, and craftsman interiors
- [x] Locked progression and two independent clue gates
- [x] Full and demo routes read Minah's complete check-before-you-act beat,
      expose two no-failure presentation choices, keyboard-activate and render
      one layout each, revisit the semantic Journal note, retain the chosen
      shop-window card, and synchronize its alpha with the Minah façade fade
- [x] Full 3-helper and 5-attendee route
- [x] Consequence art is state- and location-specific: matching exterior and
      interior three-quarter ramps include rails/tactile edges; herb and
      flower-plus-shaded-seat gardens remain mutually exclusive; and the
      five-post pitched-teal-roof sheltered extension appears only when earned
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
- [x] The player blinks while idle, faces the selected interaction before its
      overlay opens, and uses faster four-frame cadence while hurrying
- [x] Physical grass and paving movement expose the matching pooled visual
      response; all three synthesized footstep profiles use one reusable buffer
- [x] A real approach to the shared bicycles reveals exactly one low-priority
      marker and exactly one tactile label plate, a contextual “Look” touch
      action, complete accessible narration, and an in-bounds 360 px modal
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
      all five activity vignettes, all eight ambient insects, and seven laundry
      lines are stored during the monsoon
- [x] The 360px weather capture retains at least 18 visible streaks without
      overflow (documented density-evidence pass: 26)
- [x] Residents, cats, laundry, pond phase, and walking puffs remain static or
      hidden under emulated reduced motion; all five activity vignettes and
      eight ambient insects hold a static first frame; player idle blinking is
      disabled
- [x] Reduced-motion monsoon keeps the overcast/wet story state while falling
      rain is hidden and puddle phase remains static
- [x] A slept exterior wakes with its location label, controls, camera image,
      consequence state, and authored door resting states restored
- [x] The Journal opens from its visible control as a modal quest book, makes
      the world inert, focuses Close, exposes four keyboard-switchable tabs,
      selected objectives/progress and tracked state, and wraps focus. Escape
      opens Pause above it; Resume preserves the Journal and exact focus;
      backdrop dismissal restores world focus
- [x] Play topbar contains only Journal and a 48×48 Menu; Pause freezes the
      motion snapshot, traps focus, exposes Settings/confirmation, ducks only
      music, retains Settings through its fullscreen toggle, and resumes exact
      focus and movement
- [x] Wide estate and full-width interiors resize the active camera; the
      desktop 960×640 room fits and unused margins remain centred
- [x] The circular map exposes seven anchors, highlights one current indoor
      landmark, opens Places, remains in bounds at 360px, occupies the top-left
      with the two-card Journal list, clears the top-right area label, and
      follows physical east/south player movement
- [x] Exterior camera reports 0.94× at wide desktop and 0.84× at 360px mobile
- [x] Player movement physically reaches and captures the layered pond before
      continuing through the open east/south travel spine
- [x] Keyboard movement physically reaches the eastern and southern districts
- [x] Generated terrain exposes at least 3 grass colours, 6 path colours, and
      12 path-edge transitions (documented pass: 14 / 36 / 64)
- [x] All 41 collision-aware landscape objects instantiate across four
      generated forms with at least 12 foliage colours (documented pass: 44)
- [x] Complete bounds for all 41 landscape sprites, 23 baked flower clumps,
      three standalone planters, the planted chess bed, two bicycle-planter
      groups, and two planted seating groups stay inside green verges and
      outside every street, building, shelter, lamp apron, tree sprite, and
      world boundary
- [x] All 90 exterior props instantiate across 24 generated forms, including
      12 collision-aware story clusters across six forms; 54 baked drain/leaf
      accents add surface detail without adding per-frame objects
- [x] All three bicycle racks occupy marked outdoor verge bays, with zero
      overlap against building footprints or pedestrian spines; the roadless
      estate reports zero motor-vehicle routes
- [x] All eight exterior building crops remain opaque at rest, soften while
      covering the player at a physical façade stop, restore after departure,
      and switch instantly under reduced motion
- [x] All 22 exterior, corridor, lift, flat, and interior-exit DoorViews resolve
      from one audited registry with style, anchor, approach, return spawn,
      collider, placard, and target; closed blockers open idempotently before
      the entry step and fade
- [x] Real Chrome completes estate → kopitiam → estate → kopitiam → estate;
      both returns show a closed exterior leaf, enabled blocker, focused stage,
      focused document, and enabled keyboard/touch controls
- [x] Hawker `ENTRY` starts closed with full-size leaves and an enabled blocker,
      opens through the original horizontal slide-collapse, and returns closed;
      every reusable returned leaf resets to 0° and 1×/1× before controls resume
- [x] The former bottom interaction banner has no visible box at desktop,
      320×568, 360×560, or 640×360; in-world labels, keyboard interaction, the
      contextual touch action, and visually hidden nearby status remain active
- [x] All eight exterior structures resolve one audited projection profile,
      spanning two roof styles and seven baked entry recesses without changing
      the entrance or collision registries
- [x] The persistent downward guide triangle follows the player in rooms and
      outdoors and remains above façade-occlusion layers
- [x] The production snapshot exposes all 12 resident art definitions with
      three builds, five hair silhouettes, five outfit grammars, four
      accessory states, and four carried totes; refreshed captures show one
      synchronized contact shadow per resident
- [x] All eight structures are independently baked roof/front/right-face
      sprites with recessed entries, contact shadows, y-sorted occluders, and
      destroyed builder Graphics; the terrain tiles contain only ground detail
- [x] The live obstacle set includes building shells, shelter posts, props, and
      closed door blockers; a real northward movement sample stops at the Minah
      storefront while east/south travel remains reachable
- [x] Mr. Long's runtime portrait exposes his stable ID, cane, side-part, and
      at least 30 code-drawn primitives
- [x] 120 resident-route frames stay inside the normal p95 budget
- [x] 120 Chapter 2 monsoon frames stay inside the normal p95 budget
- [x] 120 active-movement frames stay inside the normal p95 budget
- [x] A repeated 120-frame sample stays inside the 4× CPU-throttled budget
- [x] Scheduler-capped runs stay within 3 ms of the same-run title baseline
      and within 8/20 ms per-frame main-thread budgets
- [x] Desktop and 360px overflow, 48px targets, and console errors
- [x] 320×568, 360×560, and 640×360 layouts keep the 100dvh shell, stage,
      topbar, touch controls, and Journal usable without document overflow;
      short-landscape interior zoom remains vertically fitted
- [x] Touch navigation redirects walking, follows and activates moving targets,
      cancels on manual input or collision, rejects drag/long-press/multi-touch,
      preserves browser pinch/pan, supports grouped directional-pad activation
      from keyboard/assistive-technology clicks, keeps Talk usable, and holds a
      28 px destination ring across zoom levels
- [x] Settings Sound/volume controls stay available while paused; Settings-owned
      fullscreen entry/exit leaves Settings open and Resume restores movement
- [x] Default `Phaser.AUTO` selects WebGL in capable Chrome and the forced
      `?renderer=canvas` fallback completes the same 60/60 route within the
      same frame and main-thread budgets
- [x] The 360px path enters gameplay with touch controls and verifies/captures
      the world and circular map, an in-bounds 88×120 px visual-novel portrait,
      and the full-width stacked Journal

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
- [x] All four OpenAI image-generation workflows, exact prompts,
      accepted/rejected details, and curated code or title-asset uses are
      recorded without a Miora claim
- [x] Automated counts match the current repository
- [x] Known manual limitations remain explicit
- [x] No playtest, metric, or AI-tool run is invented
