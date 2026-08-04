# Kampung SG Master Requirements and Owner Checklist

> **2026-08-03 campaign note:** older rows below record the original sandbox
> delivery. For current architecture and counts, use `docs/GAME_DESIGN.md`,
> `docs/QA_CHECKLIST.md`, and `docs/submission/SUBMIT_NOW.md`.

This is the single operational checklist for the project. Detailed design,
testing, art, and schedule documents remain authoritative for their specialist
areas, but every required responsibility must appear here with an owner.

## Status Legend

| Status | Meaning |
| --- | --- |
| `DONE` | Completed and supported by evidence |
| `OPEN` | Ready to work on now |
| `BLOCKED` | Cannot proceed until a named dependency is resolved |
| `NEEDS USER` | Requires the user's account, approval, decision, presence, or physical action |
| `UNKNOWN` | Must be confirmed rather than assumed |
| `NOT REQUIRED` | Deliberately excluded from this Game Track submission |

## Owner Legend

| Owner | Responsibility |
| --- | --- |
| `USER` | Account owner, product owner, Miora operator, human tester coordinator, and submitter |
| `OPENCODE` | Engineering, review, testing, documentation, prompts, integration, and deliverable preparation |
| `CODEBUDDY` | Official Game Track AI coding work after credits are available |
| `MIORA` | Official Game Track visual-asset generation operated by the user |
| `SHARED` | Requires user decisions or actions plus AI preparation and verification |

## Current Snapshot

| Requirement | Owner | Status | Evidence or next action |
| --- | --- | --- | --- |
| Project name `Kampung SG` | SHARED | DONE | Used across game and documentation |
| Top-down neighbourhood sandbox direction | SHARED | DONE | `docs/GAME_DESIGN.md` |
| Local playable vertical slice | OPENCODE | DONE | `http://127.0.0.1:5173/` while server runs |
| Keyboard and touch movement | OPENCODE | DONE | Keyboard, d-pad, tap-to-walk, nearby tap interaction, cancellation, and short-viewport behavior are covered by production-browser smoke; the real-phone pass remains open below |
| Recoverable campaign loader | OPENCODE | DONE | The lazy scene has opening, slow, cancel, retry, and back-to-title states with focus/control blocking; production-browser smoke covers recovery, but real-device startup remains unverified |
| Five-part campaign and enterable estate | OPENCODE | DONE | Current game build and campaign smoke |
| Eight resident routes and visible consequences | OPENCODE | DONE | Current code-drawn consequence art includes three-quarter exterior/interior ramps, both garden-choice treatments, a sheltered linkway, and the persistent shop-window card |
| Optional memory-table activity | OPENCODE | DONE | Current build and matching tests |
| KampungMind authored memory/intent engine | OPENCODE | DONE | `campaignContent.ts`, `kampungMind.ts`, campaign tests |
| Automated tests | OPENCODE | DONE | 79/79 passing: 27 campaign, 31 match, 17 audio, 4 accessibility |
| Production build | OPENCODE | DONE | Latest verified Vite build: HTML 84.76 kB (15.26 kB gzip), initial JS 114.37 kB (35.06 kB gzip), lazy campaign scene 1,609.14 kB (376.46 kB gzip) |
| Production-browser regression | OPENCODE | DONE | 60/60 smoke checks pass across the full and demo campaigns |
| Dependency security audit | OPENCODE | DONE | Zero known vulnerabilities |
| CodeBuddy initial implementation evidence | CODEBUDDY | DONE | `docs/AI_USAGE_LOG.md` |
| Additional CodeBuddy work | CODEBUDDY | BLOCKED | Credits currently exhausted or pending |
| Miora account access | USER | DONE | User reported access ready |
| Miora contest credits | USER | BLOCKED | Await organizer distribution |
| Final Miora assets | SHARED | BLOCKED | Starts after credits and style approval |
| WorkBuddy use in game build | USER | NOT REQUIRED | Game Track specifies CodeBuddy and Miora |
| Registration completed | USER | UNKNOWN | Confirm registration and confirmation email |
| Discord joined and monitored | USER | UNKNOWN | Confirm current access and announcements |
| Submission deadline | USER | UNKNOWN | Brief says August 3, 2026; verify in Discord |
| Team name | USER | UNKNOWN | Required for deliverable filenames |
| Team member details | USER | UNKNOWN | Required for deck and submission |
| Deployment account | USER | UNKNOWN | EdgeOne suggested; requires approval and login |
| Public game URL | SHARED | OPEN | Deploy only after explicit user approval |
| Human playtesting | SHARED | OPEN | Use `docs/PLAYTEST_PROTOCOL.md` |
| Final deck | SHARED | OPEN | Outline exists; final evidence still pending |
| Final demo video | SHARED | OPEN | A 90-second review cut exists, but it predates the latest loader, touch, and consequence-art polish and is not current-build proof; current footage, human narration/mix, approval, and upload remain open |
| Social bonus post | USER | OPEN | Optional and requires public-post approval |
| Git repository initialized | OPENCODE | DONE | Local `.git` exists |
| First Git commit | USER | NEEDS USER | User must explicitly request a commit |
| Git remote and backup | USER | UNKNOWN | Choose private/public host and approve push |

## Information Required From the User

Do not place passwords, API keys, one-time codes, private tokens, or billing
details in this document or the repository.

| Information | Status | Why it is needed |
| --- | --- | --- |
| Final team name | DONE | TheTwoGuys — confirmed 2026-08-04 |
| Team member display names | UNKNOWN | Deck and registration consistency |
| Team member roles | UNKNOWN | Team slide and judging narrative |
| University or organization names | UNKNOWN | Submission and team slide if required |
| Final submission deadline and timezone | UNKNOWN | Freeze and upload schedule |
| Submission form URL | UNKNOWN | Final delivery |
| Registration confirmation | UNKNOWN | Eligibility and credits |
| Discord access | UNKNOWN | Organizer updates and deadline changes |
| CodeBuddy credit status | BLOCKED | Official coding evidence |
| Miora credit status | BLOCKED | Final visual production |
| EdgeOne or deployment preference | UNKNOWN | Public game link |
| Approval to configure cloud deployment | NEEDS USER | External account and infrastructure change |
| Preferred social platform | UNKNOWN | Optional bonus post |
| Approval to publish publicly | NEEDS USER | Social bonus and public game link |
| Access to phone and tablet | UNKNOWN | Real-device QA |
| Access to volunteer playtesters | UNKNOWN | Usability and impact evidence |
| Access to an older-adult tester | UNKNOWN | Valuable but not mandatory; consent required |
| Voice-over preference | UNKNOWN | Demo video production |
| Permission to create a Git commit | NEEDS USER | Version checkpoint |
| Git hosting preference | UNKNOWN | Backup and collaboration |

## User Responsibilities

### Event and Account Administration

- [ ] Confirm hackathon registration is complete.
- [ ] Save the registration confirmation email or screenshot.
- [ ] Join the official Discord and verify announcement access.
- [ ] Confirm the final deadline, timezone, submission form, and file limits.
- [ ] Confirm eligibility, team-size rules, and whether all members are listed.
- [ ] Confirm CodeBuddy and Miora credits when distributed.
- [ ] Decide whether to request support if credits remain missing.
- [ ] Do not purchase credits or change paid plans without an explicit decision.

### Product Decisions

- [x] Approve the sandbox direction.
- [x] Approve the memory game as optional.
- [x] Approve one-avatar play with shared discussion.
- [ ] Approve final resident names, roles, and dialogue tone.
- [ ] Approve the final Miora style key before batch generation.
- [ ] Approve every final resident design for dignity and cultural grounding.
- [ ] Approve the final title illustration and screenshots.
- [ ] Approve the final game copy, deck claims, and video narration.
- [ ] Approve any scope cut proposed during feature freeze.

### Miora Operation

- [ ] Read `docs/MIORA_ASSET_BIBLE.md` before using credits.
- [ ] Open Miora with the credited event account.
- [ ] Generate the style key using the prepared prompt.
- [ ] Share full-quality outputs or export them to the specified folders.
- [ ] Preserve Miora generation links, IDs, dates, prompts, and model details.
- [ ] Select or reject variations with AI assistance but retain human authority.
- [ ] Generate assets in the documented order rather than all at once.
- [ ] Export transparent PNG components without generated text or watermarks.
- [ ] Confirm the right to submit and publicly display generated outputs.
- [ ] Avoid uploading private, copyrighted, or unlicensed source material.

### Human and Real-Device Testing

- [ ] Play the complete game using WASD and arrow keys.
- [ ] Play the complete game using touch controls on a real phone.
- [ ] Test on a tablet if available.
- [ ] Test at 200 percent browser zoom.
- [ ] Test mute and volume controls after audio is added.
- [ ] Recruit three to five playtesters if feasible.
- [ ] Use the consent script in `docs/PLAYTEST_PROTOCOL.md`.
- [ ] Do not collect health data, diagnoses, names, or other sensitive details.
- [ ] Include an older-adult perspective only with appropriate access and consent.
- [ ] Record anonymized observations and consented quotes.
- [ ] Tell the AI Agent which repeated issues occurred.

### Deployment and Submission

- [ ] Choose and approve the deployment platform.
- [ ] Log into the deployment account personally when authentication is needed.
- [ ] Complete two-factor authentication personally.
- [ ] Never paste credentials into chat, source code, screenshots, or documents.
- [ ] Approve domain, project, billing, and public-access settings.
- [ ] Verify the deployed game on a second device and network.
- [ ] Provide the final team name for filenames.
- [ ] Review the final deck and video.
- [ ] Upload the game link, deck, and video through the official form.
- [ ] Save submission confirmation and timestamp.
- [ ] Verify all submitted links without relying on a logged-in session.

### Social Bonus

- [ ] Decide whether to pursue the optional social-media bonus.
- [ ] Approve the platform, screenshots, video clip, and public copy.
- [ ] Publish from the user's own account.
- [ ] Include organizer-required hashtags exactly as instructed.
- [ ] Clearly state that the Game Track build used CodeBuddy and Miora.
- [ ] Do not claim WorkBuddy was used merely because its hashtag is required.
- [ ] Save the public post URL and timestamp.

## OpenCode AI Agent Responsibilities

### Engineering

- [x] Maintain the Phaser sandbox architecture.
- [x] Keep progression and matching logic independent and testable.
- [x] Maintain keyboard, d-pad, tap-to-walk, nearby tap interaction, and Journal paths.
- [x] Maintain semantic dialogue, meters, memory cards, and ending UI.
- [x] Fix reproduced root causes rather than hiding symptoms.
- [x] Keep Miora art replaceable without rewriting collision or game rules.
- [x] Keep the game playable without network services.
- [x] Maintain centralized audio, mute, and volume behavior.
- [ ] Add final Miora assets and preserve procedural fallbacks during review.
- [x] Provide an accessible recoverable lazy-loader with slow, cancel, retry,
      and back-to-title paths.
- [ ] Fix all critical and repeated high-severity playtest findings.

### Testing and Quality

- [x] Run strict TypeScript checks.
- [x] Maintain deterministic unit tests.
- [x] Maintain production-browser keyboard and touch smoke coverage.
- [x] Run production builds and dependency audits.
- [x] Check 320×568, 360×560, and 640×360 automated layout behavior and
      minimum touch-target size.
- [ ] Check final phone, tablet, laptop, and wide desktop layouts.
- [ ] Check final Miora assets at actual display scale.
- [ ] Check screen-reader announcements with human assistance.
- [ ] Check audio behavior, muting, and interruption recovery by ear on real
      devices; automated audio behavior is covered by 17 tests.
- [ ] Run the complete regression suite after every final asset batch.
- [ ] Produce a final QA report with known limitations.

### Miora Support

- [x] Define style direction, palette, camera, representation, and export rules.
- [x] Prepare prompts and negative constraints.
- [x] Define filenames and target folders.
- [ ] Review generated assets for consistency, transparency, text errors, and
  stereotypes.
- [ ] Recommend selections while leaving final visual approval to the user.
- [ ] Rename and organize approved exports.
- [ ] Integrate assets into Phaser rendering.
- [ ] Preserve asset provenance and rejection reasons.
- [ ] Capture procedural-before and Miora-after evidence.

### CodeBuddy Support

- [x] Preserve the initial CodeBuddy prompt and authored files.
- [x] Record CodeBuddy failures, max-turn limit, and credit exhaustion honestly.
- [ ] Prepare the next bounded CodeBuddy prompt after credits are restored.
- [ ] Give CodeBuddy explicit acceptance criteria and permitted dependencies.
- [ ] Independently inspect CodeBuddy output.
- [ ] Run tests, build, audit, and browser checks after CodeBuddy edits.
- [ ] Record human corrections rather than claiming untouched generation.
- [ ] Capture prompt, output, code diff, test, and final-game screenshots.

### Evidence and Deliverables

- [x] Maintain `docs/AI_USAGE_LOG.md`.
- [x] Maintain `docs/RUBRIC_SCORECARD.md`.
- [x] Maintain `docs/HACKATHON_BLUEPRINT.md`.
- [x] Prepare the playtest protocol.
- [x] Prepare the 90-second demo script.
- [ ] Convert anonymized playtest notes into evidence and fixes.
- [ ] Draft final slide copy and speaker notes.
- [ ] Prepare final video shot list and captions.
- [ ] Prepare social-post copy for user approval.
- [ ] Prepare correctly named submission files.
- [ ] Prepare local ZIP, screenshots, and offline backup.

## OpenCode AI Agent Prohibitions

- Do not claim guaranteed winning or a guaranteed score.
- Do not fabricate CodeBuddy, Miora, WorkBuddy, playtest, research, deployment,
  or impact evidence.
- Do not claim medical, cognitive, dementia-prevention, treatment, or diagnostic
  benefits.
- Do not add accounts, analytics, personal-data collection, APIs, dependencies,
  MCP servers, paid tools, or cloud resources without approval.
- Do not store credentials or ask the user to commit secrets.
- Do not purchase credits, change billing, publish publicly, or submit forms on
  the user's behalf without explicit permission and required access.
- Do not use WorkBuddy in the Game Track build unless the user changes the
  strategy and the use can be explained truthfully.
- Do not copy Stardew Valley art, characters, maps, writing, or branding.
- Do not treat Miora output as final without human review.
- Do not mark manual or human tests complete based only on automation.
- Do not commit or push Git changes unless explicitly requested.

## CodeBuddy Responsibilities After Credits Arrive

### Required Recovery Check

- [ ] Confirm the account has usable credits.
- [ ] Record CodeBuddy version and selected model.
- [ ] Read `CODEBUDDY.md` before editing.
- [ ] Read current game design, accessibility, QA, and evidence documents.
- [ ] Inspect current code before proposing a change.
- [ ] Do not repeat or overwrite already completed systems.

### Recommended Bounded CodeBuddy Task

Implement a centralized accessible audio and settings system without adding a
dependency or external API.

- [ ] Separate music, world, UI, and activity sound categories.
- [ ] Add mute and category-volume controls in semantic HTML.
- [ ] Pause or reduce audio when the tab is hidden.
- [ ] Prevent repeated interactions from stacking harsh sounds.
- [ ] Persist non-sensitive settings locally if approved.
- [ ] Add unit-testable settings logic.
- [ ] Respect reduced-motion and accessibility requirements.
- [ ] Run type checking, tests, build, audit, and browser checks.
- [ ] Update the AI usage log with exact prompt and results.

This task is recommended because it is visible in the demo, improves Project
Quality, follows the training-session advice to treat audio as a system, and is
small enough to attribute and review clearly.

### CodeBuddy Evidence Required

- Exact prompt text.
- CodeBuddy version and model.
- Start and end timestamps.
- Files created or changed.
- Screenshots of CodeBuddy working and reporting checks.
- Initial test or build output.
- Human review findings.
- CodeBuddy correction prompt if needed.
- Final passing checks.
- In-game screenshot or video of the feature.
- Honest limitations and any OpenCode correction.

## Miora Responsibilities After Credits Arrive

Miora is a generation tool, not an autonomous project owner. The user operates
it and approves outputs; OpenCode prepares prompts, validates, and integrates.

### Required Asset Batches

- [ ] Neighbourhood style key.
- [ ] Aunty Mei portrait and world reference.
- [ ] Uncle Ravi portrait and world reference.
- [ ] Mdm Siti portrait and world reference.
- [ ] Player reference and directional poses.
- [ ] HDB environment component.
- [ ] Hawker-corner component.
- [ ] Community-garden component.
- [ ] Sheltered-walkway component.
- [ ] Void-deck props.
- [ ] Noticeboard and both choice variants.
- [ ] Garden herbs and flower-seat variants.
- [ ] Rest-bench and shelter variants.
- [ ] Memory table.
- [ ] Four keepsake-card images.
- [ ] Final title illustration.
- [ ] Optional deck and social-media hero image.

### Miora Acceptance Requirements

- Camera matches the approved style key.
- Lighting comes from the approved direction.
- Palette and outline weight remain consistent.
- Asset is readable at mobile game scale.
- Transparent background is clean.
- No generated text, watermark, extra limb, or malformed object appears.
- Resident remains dignified and culturally grounded.
- Asset does not imitate copyrighted game visuals.
- Asset filename matches the contract.
- Prompt and generation reference are logged.

## WorkBuddy Status

- `NOT REQUIRED` for the Game Track build.
- Do not wait for WorkBuddy credits to continue game development.
- Do not add WorkBuddy to the AI usage slide unless it performs real,
  explainable work.
- If organizer social-bonus instructions require `#WorkBuddy`, the hashtag may
  be included without claiming the tool was used.
- If the user later enters a separate AI Agent or Skills Track submission,
  create a separate plan and evidence trail rather than mixing tracks.

## External Approval Gates

The AI Agent must stop and request approval before any of these actions:

- Installing a new dependency or global tool.
- Adding an MCP server, API, analytics, or data collection.
- Creating or changing a cloud project.
- Logging into EdgeOne or another deployment provider.
- Creating a public repository or adding a Git remote.
- Committing or pushing code.
- Purchasing or upgrading credits.
- Publishing a game, video, deck, or social post publicly.
- Uploading a participant recording, quote, or image.
- Collecting any user or playtest data beyond the approved anonymous protocol.
- Changing the project track, core concept, target audience, or medical-claim
  policy.

## Required Submission Deliverables

### Public Game Link

- [ ] Production build deployed over HTTPS.
- [ ] Link opens without login.
- [ ] Desktop and mobile load successfully.
- [ ] No missing assets or console-blocking error.
- [ ] Keyboard, touch, Journal, activity, memory, and evening paths work.
- [ ] Link tested in a private browser window.
- [ ] Link tested on a second network if possible.

### Game Demo Video

- [ ] Approximately 90 seconds unless organizers state otherwise.
- [ ] Shows game premise and Singapore context immediately.
- [ ] Shows movement and map exploration.
- [ ] Shows one resident contribution and player choice.
- [ ] Shows the visible world consequence.
- [ ] Shows the optional memory table briefly.
- [ ] Shows the evening reflection.
- [ ] Shows CodeBuddy prompt and coding evidence.
- [ ] Shows Miora prompt, selected output, and integrated result.
- [ ] Shows procedural-before and Miora-after comparison.
- [ ] Shows accessibility paths and one truthful playtest improvement.
- [ ] Includes captions.
- [ ] Contains no secrets, private account details, or unapproved participant
  material.

### Project Introduction Deck

- [ ] Slide 1: one-line pitch and strongest screenshot.
- [ ] Slide 2: Age Well problem, Singapore context, and audience.
- [ ] Slide 3: sandbox loop and map.
- [ ] Slide 4: residents, expertise, choices, and visible consequences.
- [ ] Slide 5: CodeBuddy and Miora workflow with evidence.
- [ ] Slide 6: architecture, accessibility, privacy, testing, and deployment.
- [ ] Slide 7: playtest observations, changes, impact boundaries, and future.
- [ ] Slide 8: team, credits, licenses, sources, and contact details.
- [ ] All claims have a source or direct project evidence.
- [ ] Fonts, images, links, and videos work on another machine.

### File Naming

Replace `[Team Name]` before export.

- `[Kampung SG]-[Game Demo Video]-[Team Name].mp4`
- `[Kampung SG]-[Project Introduction Deck]-[Team Name].pptx`
- `[Kampung SG]-[Project Introduction Deck]-[Team Name].pdf` as backup if
  permitted.
- `[Kampung SG]-[Source Backup]-[Team Name].zip` as local backup, not necessarily
  a required upload.

## Required Evidence Package

- CodeBuddy exact prompts and screenshots.
- CodeBuddy files changed and verification output.
- Honest CodeBuddy failures and human corrections.
- Miora prompts, IDs or links, generation dates, selected variations, and
  rejected issues.
- Miora procedural-before and integrated-after screenshots.
- Test output showing the current 79/79 gate (27 campaign, 31 match,
  17 audio, and 4 accessibility tests). The earlier 42-test target
  remains historical planning context, not the current release claim.
- Production build and audit output, including HTML 84.76/15.26 kB gzip,
  initial JS 114.37/35.06 kB gzip, and lazy scene 1,609.14/376.46 kB gzip.
- Browser smoke output showing 60/60 checks, including keyboard, tap
  navigation, compact layouts, loader recovery, and visible consequence art.
- Manual phone, tablet, keyboard, zoom, and screen-reader notes.
- Anonymous playtest protocol, observations, and changes.
- Research sources and prohibited-claim policy.
- Asset licenses and audio sources.
- Deployment URL and final verification time.
- Submission confirmation and social post URL if used.

## Human Playtest Requirements

- Use `docs/PLAYTEST_PROTOCOL.md`.
- Obtain verbal or written consent before observing or recording.
- Test the game, not the person.
- Never frame the memory table as a cognitive test.
- Never collect medical or diagnostic information.
- Record participant code, device, input, blockers, interpretation, and suggested
  change only.
- Fix all critical blockers.
- Fix repeated high-severity issues before recording the final video.
- State sample size and limitations honestly.
- Do not claim broad older-adult acceptance from a small convenience sample.

## Git and Backup Requirements

- [x] Git repository initialized locally.
- [ ] User explicitly requests the first commit.
- [ ] Review status and diff before committing.
- [ ] Exclude `node_modules`, `dist`, credentials, and local environment files.
- [ ] Decide whether the remote repository is private or public.
- [ ] Add remote only after approval.
- [ ] Push a stable checkpoint before major Miora integration.
- [ ] Create a final source ZIP excluding dependencies and secrets.
- [ ] Keep final deck, video, screenshots, source, and deployment URL in one
  dated backup folder.

## Final Definition of Done

The project is ready to submit only when every statement below is true:

- The public game link works without login.
- The full game can be completed by keyboard, touch, and Journal shortcuts.
- No critical console, focus, collision, or missing-asset issue remains.
- Final Miora assets are coherent, approved, integrated, and logged.
- At least one additional CodeBuddy feature is completed if credits permit, or
  the limitation is disclosed honestly.
- Type checking, all tests, build, audit, and browser smoke pass.
- Real-device and human accessibility checks are recorded.
- Playtest evidence and limitations are documented.
- No medical or fabricated impact claim appears.
- Deck and video show the actual final build.
- CodeBuddy and Miora use is visible and reproducible.
- Team details, licenses, sources, and filenames are complete.
- Submission links and permissions are verified.
- Confirmation and backup are saved.

## Immediate User Actions

- [ ] Provide the final team name.
- [ ] Confirm registration and Discord access.
- [ ] Confirm the actual deadline and timezone.
- [ ] Report CodeBuddy and Miora credit status when it changes.
- [ ] Decide whether to approve a first Git commit and remote backup.
- [ ] Identify one phone, one tablet if possible, and three to five playtesters.
- [ ] Decide whether EdgeOne deployment is approved when the build reaches the
  deployment gate.

## Immediate OpenCode Actions

- [x] Keep the dependency-free audio/settings architecture covered by its
      17-test suite.
- [ ] Refresh the review-video gameplay and verification shots from the latest
      loader/touch/consequence-art build before calling any video current.
- [ ] Prepare the first Miora style-key prompt for direct use.
- [ ] Run manual-copy and interaction review with user feedback.
- [ ] Integrate and verify assets immediately after each approved Miora batch.
- [ ] Keep this master checklist and the evidence log current.

## Handoff Rule

At the end of every work session:

- OpenCode reports files changed, checks run, known limitations, and next user
  action.
- The user reports account, credit, visual-approval, testing, and organizer
  updates.
- CodeBuddy and Miora output is not accepted until independently reviewed.
- No item changes to `DONE` without evidence or explicit user confirmation.
