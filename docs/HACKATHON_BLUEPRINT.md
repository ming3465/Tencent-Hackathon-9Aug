# Kampung SG Hackathon Execution Blueprint

Owner responsibilities, approvals, account actions, deliverables, and final
definition of done are consolidated in `docs/MASTER_CHECKLIST.md`.

## Competition Clock

- Current date: Saturday, July 25, 2026.
- Brief submission deadline: Monday, August 3, 2026.
- Organizer warning: dates may change, so verify the deadline and submission
  form in Discord before relying on this schedule.
- Required Game Track outputs: public game link, gameplay and AI demo video,
  and project introduction deck.
- Required filename pattern: `[Project Name]-[Deliverable Name]-[Team Name]`.

## Winning Product Definition

- Project: **Kampung SG**.
- Tagline: **Every Small Act Grows the Kampung.**
- Format: cozy top-down Singapore neighbourhood sandbox.
- Player promise: explore one HDB estate, meet older residents as community
  mentors, and choose activities that strengthen connection, purpose, and
  everyday comfort.
- Shared-play promise: one avatar with choices that family or friends can
  discuss together.
- AI creation promise: CodeBuddy for documented code work and Miora for final
  visual assets.
- Safety promise: no diagnosis, cognitive score, dementia-prevention claim,
  addictive loop, timer pressure, or portrayal of older adults as passive
  recipients.

## Scope That Must Ship

- [x] One explorable Phaser neighbourhood larger than the camera viewport.
- [x] Keyboard and touch movement.
- [x] Three older residents with contribution-focused activities.
- [x] Choices that update Connection, Purpose, and Comfort.
- [x] Journal and non-spatial activity shortcuts.
- [x] Optional memory-table mini-game.
- [x] Evening reflection after any three activities.
- [x] Visible world changes for each completed resident choice.
- [ ] Final Miora title, residents, portraits, environment, props, and cards.
- [ ] Audio feedback and mute controls.
- [ ] Human accessibility and older-adult usability evidence.
- [ ] Public deployment, deck, video, and submission package.

## Scope That Must Not Expand

- No crop simulation or farming calendar.
- No inventory, crafting, economy, shops, combat, romance, or quest chains.
- No online multiplayer or second independently controlled avatar.
- No cloud save, account, analytics, or personal-data collection.
- No runtime LLM dialogue or API dependency.
- No procedural world generation or autonomous NPC schedules.
- No multilingual release unless the English build is frozen and verified.

## Phase 1: Direction and Technical Foundation

### Day 1 - Saturday, July 25 - Concept Lock and Sandbox Proof

**Judging goal:** prove Project Quality and remove concept ambiguity.

- [x] Replace the matching-board concept with the top-down sandbox direction.
- [x] Preserve matching as an optional activity rather than the main game.
- [x] Define Age Well around agency, dignity, connection, purpose, and comfort.
- [x] Build movement, collision, camera, residents, dialogue, Journal, meters,
  memory table, and evening flow.
- [x] Add semantic HTML alternatives around the canvas.
- [x] Add 40 deterministic domain tests.
- [x] Add production-browser smoke coverage.
- [x] Fix keyboard movement after reproducing the blocked event path.
- [x] Write the Miora asset bible and evidence rules.

**Day 1 exit gate:** a complete procedural-art sandbox flow runs locally and
passes type checking, tests, production build, audit, keyboard movement, touch
movement, activity progression, memory completion, and end-day verification.

## Phase 2: Gameplay Depth and Visible Consequences

### Day 2 - Sunday, July 26 - World Feedback and Game Feel

**Judging goal:** make the sandbox feel authored rather than like a technical
map demo.

- [ ] Play the complete flow manually with WASD and arrow keys.
- [ ] Tune movement speed, diagonal speed, camera smoothing, marker radius, and
  interaction distance.
- [ ] Verify collision around the HDB, hawker corner, pond, and world bounds.
- [ ] Add visible choice consequences to the procedural fallback world.
- [x] Show herbs or flowers after Aunty Mei's choice.
- [x] Show the selected chess or story notice after Uncle Ravi's choice.
- [x] Show a bench or shelter improvement after Mdm Siti's choice.
- [ ] Improve resident idle feedback without building schedules.
- [ ] Add a small in-game controls reminder that can be dismissed.
- [ ] Recheck all keyboard, touch, Journal, and focus paths.

**External action:** restore or confirm CodeBuddy organizer credits. The account
currently returns `429 Credits exhausted`. Do not purchase or change accounts
without the user's decision.

**Day 2 exit gate:** every resident choice causes an immediate, visible,
testable change in the world and the entire procedural version is enjoyable
enough to play without final art.

### Day 3 - Monday, July 27 - Content, Emotional Arc, and AI Evidence

**Judging goal:** strengthen Impact and Relevance while making CodeBuddy use
visible and defensible.

- [ ] Human-review every resident line for dignity, specificity, and brevity.
- [ ] Give each resident one clear strength, one practical insight, and one
  visible contribution.
- [ ] Add one short opening line explaining why the player is visiting.
- [x] Add one short evening callback based on the three activities completed.
- [ ] Add a Making Of panel or deck-ready evidence page with CodeBuddy and
  Miora roles.
- [ ] If CodeBuddy credits return, assign CodeBuddy one bounded feature with an
  exact prompt, tests, independent review, and screenshots.
- [ ] Record the CodeBuddy prompt, files, failures, fixes, and final checks.
- [ ] Run a five-minute internal playthrough and cut any slow dialogue.

**Day 3 exit gate:** a judge can explain within 30 seconds how the residents
contribute, how the game supports Age Well, and what CodeBuddy built.

## Phase 3: Miora Visual Production

### Day 4 - Tuesday, July 28 - Style Lock Before Asset Volume

**Judging goal:** establish a distinctive visual identity and prevent AI-art
style drift.

- [ ] Read `docs/MIORA_ASSET_BIBLE.md` before generating anything.
- [ ] Generate one neighbourhood style key in Miora.
- [ ] Reject outputs with tourist-poster cliches, copied farming-game style,
  generated text, inconsistent camera, or passive senior stereotypes.
- [ ] Lock camera angle, outline weight, palette, light direction, and texture.
- [ ] Generate Aunty Mei, Uncle Ravi, and Mdm Siti portrait references.
- [ ] Compare all three portraits side by side for style and representation.
- [ ] Generate one player-character reference.
- [ ] Save prompts, Miora links or IDs, selected images, and rejection reasons.
- [ ] Integrate only the style key and one resident first to test actual scale.

**User handoff:** the user operates Miora and exports approved source-quality
PNG files. OpenCode prepares prompts, validates exports, renames files, and
integrates them.

**Day 4 exit gate:** one approved style key and four consistent character
references work at mobile game scale. No environment batch starts before this
gate passes.

### Day 5 - Wednesday, July 29 - Asset Batch and Integration

**Judging goal:** convert Miora generation into visible production quality, not
just a claim in the deck.

- [ ] Generate transparent HDB, hawker, garden, walkway, and void-deck
  environment components.
- [ ] Generate player directional poses and resident world sprites.
- [ ] Generate activity props: noticeboard, memory table, garden variants,
  bench, and shelter improvement.
- [ ] Generate the four memory-card keepsakes.
- [ ] Generate final title illustration only after world style is stable.
- [ ] Remove generated text and reject dirty transparency or inconsistent light.
- [ ] Integrate assets behind existing collision and interaction geometry.
- [ ] Preserve procedural fallback assets until each replacement is verified.
- [ ] Capture procedural-before and Miora-after screenshots for the deck.
- [ ] Record every accepted Miora asset in the AI usage log.

**Day 5 exit gate:** all assets shown in the demo are stylistically coherent,
readable on phone and desktop, and traceable to Miora evidence.

## Phase 4: Accessibility, Audio, and Human Evidence

### Day 6 - Thursday, July 30 - Polish and Accessibility

**Judging goal:** turn completeness into professional Project Quality.

- [ ] Add centralized audio routing for music, UI, movement, interaction,
  success, and evening ambience.
- [ ] Use licensed or original audio only and record every source.
- [ ] Add mute and volume controls before enabling sound by default.
- [ ] Complete a keyboard-only playthrough.
- [ ] Complete a real-phone touch playthrough.
- [ ] Complete a Journal-shortcut-only playthrough.
- [ ] Test 200 percent zoom, reduced motion, focus order, and colour independence.
- [ ] Run a screen-reader pass through title, HUD, Journal, dialogue, memory
  table, and evening reflection.
- [ ] Fix console errors, clipped art, unreadable labels, and accidental scroll.
- [ ] Retest at 360px, tablet landscape, laptop, and wide desktop sizes.

**Day 6 exit gate:** the game can be completed by keyboard, touch, or Journal
shortcuts with understandable focus and no critical accessibility failure.

### Day 7 - Friday, July 31 - Playtesting and Impact Evidence

**Judging goal:** support Impact claims with observations instead of promises.

- [ ] Recruit three to five testers if feasible.
- [ ] Include at least one older adult if access and consent are appropriate.
- [ ] Do not collect names, health data, diagnoses, or sensitive information.
- [ ] Observe first-click clarity, movement confusion, dialogue length, text
  readability, activity discovery, enjoyment, and shared discussion.
- [ ] Ask what the player thinks each resident contributed.
- [ ] Record anonymous manual observations and direct consented quotes only.
- [ ] Fix the top three repeated usability problems.
- [ ] State participant limitations honestly if no older adult could test.
- [ ] Freeze all medical and impact wording against `docs/RESEARCH.md`.

**Day 7 exit gate:** the deck can show what was tested, what changed, and what
remains uncertain without claiming clinical benefit.

## Phase 5: Deployment and Submission Story

### Day 8 - Saturday, August 1 - Deployment, Deck, and Video Draft

**Judging goal:** make the project easy to evaluate and make AI use impossible
to miss.

- [ ] Request permission before configuring EdgeOne or another deployment host.
- [ ] Deploy the frozen candidate and verify the public link on phone and laptop.
- [ ] Confirm HTTPS, relative asset paths, load time, and no missing files.
- [ ] Draft the eight-slide project deck.
- [ ] Slide 1: emotional one-line pitch and strongest screenshot.
- [ ] Slide 2: Singapore Age Well problem and respectful target audience.
- [ ] Slide 3: sandbox loop and map.
- [ ] Slide 4: residents, contributions, and visible player choices.
- [ ] Slide 5: CodeBuddy and Miora creation workflow with evidence.
- [ ] Slide 6: architecture, accessibility, privacy, and deployment.
- [ ] Slide 7: playtest observations, impact boundaries, and future work.
- [ ] Slide 8: team, credits, sources, and contact details.
- [ ] Write a 90-second video shot list before recording.
- [ ] Open with the neighbourhood story, not the technology stack.
- [ ] Show movement, one resident choice, visible world change, optional memory
  table, evening reflection, and AI before-and-after evidence.

**Day 8 exit gate:** a public candidate, complete deck draft, and timed video
script exist. No required story depends on a risky live improvisation.

### Day 9 - Sunday, August 2 - Feature Freeze and Submission Candidate

**Judging goal:** protect completeness and reliability.

- [ ] Freeze features at the start of the day.
- [ ] Permit only bug, copy, accessibility, asset, and submission fixes.
- [ ] Run type checking, all tests, production build, audit, and browser smoke.
- [ ] Complete human keyboard, touch, Journal, screen-reader, and zoom checks.
- [ ] Test the deployed link in a private window and on a second network.
- [ ] Record the final demo video with captions.
- [ ] Export the final deck and check every link and image.
- [ ] Prepare the social post for the optional five-point bonus.
- [ ] Use the organizer-required hashtags while accurately stating that the
  Game Track build used CodeBuddy and Miora, not WorkBuddy.
- [ ] Prepare a local ZIP and screenshots as submission backups.
- [ ] Name every submitted file using the required project/team format.

**Day 9 exit gate:** game, link, video, deck, filenames, social copy, and backup
are final. No known critical defect remains.

### Day 10 - Monday, August 3 - Submit Early and Verify

**Judging goal:** avoid losing a finished project to submission mistakes.

- [ ] Recheck Discord and email for deadline or form changes.
- [ ] Submit several hours before the deadline.
- [ ] Open the submitted game link from the confirmation page.
- [ ] Verify video permissions and playback.
- [ ] Verify deck permissions, fonts, images, and hyperlinks.
- [ ] Save the submission confirmation and timestamp.
- [ ] Publish the approved social post if pursuing the bonus.
- [ ] Do not make post-submission production changes unless links are broken.
- [ ] Prepare a two-minute live fallback demo for finalist selection.

**Day 10 exit gate:** submission confirmation is saved and every judge-facing
link works without an account.

## Daily Operating Rhythm

- [ ] Start each day by choosing one judging objective and one playable outcome.
- [ ] Keep no more than one major implementation task in progress.
- [ ] Build the smallest vertical change before polishing it.
- [ ] Run targeted tests immediately after each system change.
- [ ] Run type checking and a production build before ending the day.
- [ ] Record CodeBuddy and Miora evidence while working, not from memory later.
- [ ] Capture one useful screenshot or short clip every day.
- [x] Update the rubric scorecard and cut anything that does not improve impact,
  AI evidence, quality, or submission reliability.
- [ ] Keep the last 30 minutes for cleanup, notes, and the next-day handoff.

## Responsibility Split

- User: Miora operation, visual approvals, real-device checks, playtest access,
  Discord updates, team details, deployment credentials, and submission.
- OpenCode: architecture, implementation, review, tests, debugging, asset
  integration, accessibility checks, evidence organization, and deliverables.
- CodeBuddy: one or more bounded, recorded code tasks if credits are restored.
- Human testers: anonymous usability and engagement feedback only, with consent.

## Immediate Next Actions

- [ ] Refresh `http://127.0.0.1:5173/` and confirm WASD and arrow movement.
- [ ] Confirm whether CodeBuddy organizer credits can be restored.
- [ ] Add visible procedural world consequences for all six resident choices.
- [ ] Manually complete the current build by keyboard and by touch.
- [ ] Begin Miora Day 4 only after the gameplay consequences are stable.
