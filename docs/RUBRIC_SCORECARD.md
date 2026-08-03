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
- [x] Human-reviewed OpenAI neighbourhood and estate-density studies are
  contemporary and grounded; their community-activity, clustered-prop,
  ground-detail, and ambient-life ideas have verified in-game results.
- [ ] Final Miora assets look contemporary and grounded rather than like a
  tourist poster.
- [ ] Singapore ageing context and one-in-four-by-2030 source are cited in the
  final deck.

### Depth and Public Engagement

- [x] Supports one-avatar shared discussion around non-punitive choices.
- [x] Provides a prologue, three sequential chapters, an ending, and revisitable
  optional resident routes.
- [x] Gives resident choices persistent memories and visible world consequences.
- [x] Keeps free exploration available after The Last Door.
- [ ] Human playtesting shows whether players understand resident contribution.
- [ ] At least one consented older-adult perspective is included if feasible.
- [ ] Impact limitations are stated honestly in the deck.

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

- [x] Two real OpenAI image-generation runs have exact prompts, labelled
  project references, saved outputs, generation artifacts, and
  acceptance/rejection notes.
- [x] Human review rejected direct runtime use and translated selected ideas
  into four deterministic activity vignettes, six story-cluster forms, 54
  baked ground accents, and eight ambient insects.
- [x] Production smoke proves all four vignettes and eight insects animate,
  respect reduced motion, store during the monsoon, and coexist with 12
  collision-aware cluster placements on open campaign routes.
- [x] Both OpenAI results are explicitly not relabelled as Miora.

### AI Attention to Detail

- [x] AI instructions include accessibility, privacy, medical-claim, testing,
  scope, and evidence constraints.
- [x] Domain logic is deterministic and independently tested.
- [x] Browser automation verifies keyboard, touch, progression, focus, and end
  flow.
- [ ] Final deck clearly separates CodeBuddy code work, Miora visual work, and
  human design decisions.
- [ ] No WorkBuddy use is claimed for the Game Track build.

### Current Risk

This remains the largest scoring risk. CodeBuddy credits are exhausted and no
Miora asset has been generated yet. The two OpenAI studies → human review →
verified activity/density translations provide strong visual AI evidence, but
they do not replace the planned second CodeBuddy task or Miora-specific
before-and-after pipeline.

## Project Quality - 30 Points

### Completeness and Interactivity

- [x] Title-to-prologue-to-three-chapters-to-ending loop works.
- [x] Phaser world, camera, collision, keyboard, touch, enterable locations,
  residents, Journal, choices, meters, autosave, and free exploration are
  implemented.
- [x] Any 3 distinct helper routes and any 5 invitees advance the full campaign.
- [x] Journal shortcuts allow non-spatial completion.
- [x] Resident choices visibly alter the procedural world.

### Technical Execution

- [x] Strict TypeScript passes.
- [x] Seventy-five domain tests pass.
- [x] Sixty production-browser checks drive complete full and demo campaigns.
- [x] Dependency audit has zero known vulnerabilities.
- [x] Phaser is lazy-loaded after the title screen.
- [x] No backend or network dependency is required to play.
- [ ] The Phaser bundle-size warning is accepted or reduced with documented
  reasoning.

### Accessibility and Appeal

- [x] Semantic HTML handles dialogue, Journal, meters, memory cards, and ending.
- [x] Focus enters and exits overlays correctly in automated checks.
- [x] Mobile layout has no horizontal overflow and uses 48px targets.
- [x] Reduced-motion support exists.
- [ ] Keyboard-only human playthrough passes.
- [ ] Real phone and tablet playthroughs pass.
- [ ] Screen-reader and 200 percent zoom checks pass.
- [ ] Final Miora art is integrated and reviewed at actual scale.
- [x] Audio feedback, mute, and volume controls are complete.

### Current Risk

The complete campaign is demo-ready and has a human-reviewed AI visual-
direction pass. Miora-specific production art, real-device performance, and
human accessibility checks remain higher priority than adding more systems.

## Social Media Bonus - Up to 5 Points

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
- [ ] Deploy the public build after explicit cloud approval.
- [ ] Finish the deck, video, filenames, social post, and backup package.
