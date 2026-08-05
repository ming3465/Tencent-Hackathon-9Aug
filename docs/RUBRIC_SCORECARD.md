# Kampung SG Rubric Scorecard

Use this file as a release gate, not as a claim about the judges' final score.
Only mark evidence that can be shown in the game, deck, video, logs, or a
reproducible test.

## Impact and Relevance - 30 Points

### Theme Alignment

- [x] Defines Age Well through agency, connection, dignity, purpose, and
  everyday comfort.
- [x] Portrays older residents as organizers, mentors, and route or gardening
  experts.
- [x] Avoids diagnosis, treatment, dementia-prevention, and health-outcome
  claims.
- [x] Uses a calm loop without failure pressure, energy limits, or retention
  mechanics.

### Singapore Relevance

- [x] Uses an HDB estate, void deck, sheltered walkway, hawker corner,
  community garden, and shared noticeboard.
- [x] Connects activities to practical Singapore conditions such as shade,
  rain, social space, and intergenerational neighbourhood life.
- [x] Four human-reviewed OpenAI visual workflows are contemporary and
  grounded: three studies have verified code-drawn activity, density, and cast
  results, and the reviewed HDB-estate panorama is integrated into the
  playable title.
- [x] Auntie Minah contributes a Singapore-grounded safety habit: she models a
  separate-channel check, cites ScamShield at 1799, and never asks the player
  to prove, diagnose, or guarantee that a message is safe.
- [ ] Final Miora assets look contemporary and grounded rather than like a
  tourist poster.
- [x] Singapore ageing context and one-in-four-by-2030 source are cited in the
  final deck.

### Depth and Public Engagement

- [x] Supports one-avatar shared discussion around non-punitive choices.
- [x] Provides a prologue, three sequential chapters, an ending, and revisitable
  optional resident routes.
- [x] Gives resident choices persistent memories and visible world
  consequences: code-drawn three-quarter ramps inside and outside, two garden
  treatments, a sheltered linkway, and Minah's persistent shop-window card.
- [x] The mandatory Minah beat asks only which accessible card layout neighbours
  will read fastest; both choices advance and persist visibly in her shop.
- [x] Keeps free exploration available after The Last Door.
- [ ] Human playtesting shows whether players understand resident contribution.
- [ ] At least one consented older-adult perspective is included if feasible.
- [x] Impact limitations are stated honestly in the deck.

### Current Risk

The product concept is aligned, but impact remains a design hypothesis until
human playtesting is recorded. Do not substitute automated tests for social
evidence.

## Use of AI Tools - 40 Points

### CodeBuddy Evidence

- [x] Exact Phase 1 CodeBuddy prompt is preserved.
- [x] CodeBuddy-authored files are listed.
- [x] Initial failures, max-turn limit, and independent corrections are listed.
- [x] CodeBuddy version is recorded.
- [ ] Organizer credits are restored.
- [ ] CodeBuddy completes one additional bounded sandbox task with tests.
- [ ] Before, prompt, output, human correction, and after evidence is captured
  visually for the deck.

### Miora Evidence

- [x] Asset bible, palette, prompt templates, representation safeguards, and
  filenames exist.
- [x] Procedural fallback makes before-and-after comparison possible.
- [ ] Miora neighbourhood style key is approved.
- [ ] Resident and player references are consistent.
- [ ] Environment, prop, portrait, card, and title assets are integrated.
- [ ] Every accepted asset has its Miora prompt, link or ID, rejection notes,
  cleanup, filename, and game use recorded.
- [ ] Deck shows procedural-before and Miora-after comparisons.

### Cross-tool Visual Evidence

- [x] Four real OpenAI image-generation workflows have exact prompts, labelled
  project references, preserved accepted outputs and artifact IDs, and
  acceptance/rejection notes.
- [x] Human review rejected direct runtime use and translated selected ideas
  into four deterministic activity vignettes, six story-cluster forms, 54
  baked ground accents, and eight ambient insects.
- [x] The title workflow records a rejected pseudo-writing pass, constrained
      cleanup, source/runtime hashes, actual-scale review, WebP optimization, and
      verified playable integration with semantic HTML copy.
- [x] The cast workflow records the accepted stepped anatomy, connected limbs,
      grounded gait, and outfit variation plus the rejected costume-like
      treatments; the runtime result remains original code-drawn art.
- [x] Production smoke proves all four vignettes and eight insects animate,
  respect reduced motion, store during the monsoon, and coexist with 12
  collision-aware cluster placements on open campaign routes.
- [x] All four OpenAI workflows are explicitly not relabelled as Miora.

### AI Attention to Detail

- [x] AI instructions include accessibility, privacy, medical-claim, testing,
  scope, and evidence constraints.
- [x] Domain logic is deterministic and independently tested.
- [x] Browser automation verifies keyboard, touch, progression, focus, and end
  flow.
- [x] Final deck separates CodeBuddy code work, OpenAI visual work, the absence
  of Miora output, and human review decisions.
- [x] No WorkBuddy use is claimed for the Game Track build.

### Current Risk

This remains the largest scoring risk. CodeBuddy credits are exhausted and no
Miora asset has been generated yet. Three OpenAI direction studies → human
review → verified code-drawn translations, plus the fourth
reject/edit/optimize → playable-title pipeline, provide strong visual AI
evidence. They do not replace the planned second CodeBuddy task or
Miora-specific before-and-after pipeline.

## Project Quality - 30 Points

### Completeness and Interactivity

- [x] Title-to-prologue-to-three-chapters-to-ending loop works.
- [x] Phaser world, camera, collision, keyboard, d-pad and tap navigation,
  enterable locations, residents, Journal, choices, meters, autosave, and free
  exploration are implemented.
- [x] Any 3 distinct helper routes and any 5 invitees advance the full campaign.
- [x] Journal shortcuts allow non-spatial completion.
- [x] Resident choices visibly alter the procedural world.

### Technical Execution

- [x] Strict TypeScript passes.
- [x] 90/90 tests pass: 30 campaign, 31 match, 17 audio, 4 accessibility, and 8 world/door/pause.
- [x] 60/60 production-browser checks drive complete full and demo campaigns.
- [x] Dependency audit has zero known vulnerabilities.
- [x] Phaser is lazy-loaded after the title screen with visible opening and
  slow states, cancellation, retry after failure, focus restoration, and
  duplicate-start protection covered by browser automation.
- [x] Latest verified production build is HTML 93.04 kB (16.28 kB gzip),
  initial JS 135.02 kB (39.95 kB gzip), and lazy campaign scene 1,602.10 kB
  (374.15 kB gzip).
- [x] No backend or network dependency is required to play.
- [x] The Phaser bundle-size warning is accepted or reduced with documented
  reasoning.

### Accessibility and Appeal

- [x] Semantic HTML handles dialogue, Journal, meters, memory cards, and ending.
- [x] Focus enters and exits overlays correctly in automated checks.
- [x] Automated compact-layout coverage at 320×568, 360×560, and 640×360 has
  no horizontal overflow, retains 48px targets, and exercises tap-to-walk,
  nearby tap interaction, d-pad cancellation, and the 28 CSS px destination
  ring.
- [x] Reduced-motion support exists.
- [ ] Keyboard-only human playthrough passes.
- [ ] Real phone and tablet playthroughs pass.
- [ ] Screen-reader and 200 percent zoom checks pass.
- [ ] Final Miora art is integrated and reviewed at actual scale.
- [x] Audio feedback, mute, and volume controls are complete.

### Current Risk

The complete campaign is demo-ready, has three human-curated visual-direction
translations, ships one reviewed generated title asset, and uses authored
code-drawn consequence art. Loader and touch behavior are verified in
automation only; Miora-specific production art, real-device performance, and
human accessibility checks remain higher priority than adding more systems.

## Social Media Bonus - Up to 5 Points

- [x] Reproducible 90-second captioned review cut, indexed gameplay B-roll,
  AI/engineering/integrity cards, and QR end slate are preserved. The cut
  predates the latest loader, touch, consequence-art, and 79-test build, so it
  is an earlier-build review artifact rather than current-build evidence.
- [ ] Recapture or explicitly compare and approve every gameplay and terminal
  shot needed for a current-build final video.
- [ ] Final game link, short video, and approved screenshots are ready.
- [ ] Post copy accurately describes CodeBuddy and Miora use.
- [ ] Organizer-required hashtags are included.
- [ ] The post is published before the required cutoff.
- [ ] The link and timestamp are saved as submission evidence.

## Release Blockers

- [ ] Confirm the current deadline and submission form in Discord.
- [ ] Restore or resolve CodeBuddy credits.
- [ ] Complete the Miora style key and asset integration.
- [ ] Complete real-device and human accessibility checks.
- [ ] Complete at least one documented human playtest round.
- [x] Deploy the public build and verify the live title/game assets.
- [x] Finish and validate the eight-slide PPTX and eight-page PDF.
- [ ] Refresh the review cut with verified current-build footage, add human
      narration and an ear-checked sound mix, approve and publish it, then save
      the social-post timestamps.
- [x] Add a fail-closed backup-package builder that validates exact filenames,
      deck/media structure, hashes, public links, human approvals, repository
      state, and the complete release gate without treating optional score
      evidence as mandatory submission fields.
- [ ] Run that builder in final mode after the remaining human/external work
      and preserve the correctly named submission backup ZIP.
