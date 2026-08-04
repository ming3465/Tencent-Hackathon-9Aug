# Kampung SG — AI Creation Evidence

**Team:** TheTwoGuys · **Track:** Game · **Tagline:** *Every Small Act Grows the Kampung.*

Every current claim below maps to a repository artifact. Failed and blocked
runs remain visible.

## 1. Working rule

**We treat AI output as a pull request, not a deliverable.**

Humans wrote the mission, product constraints, ageing-claim guardrails,
accessibility requirements, and executable gate before the first coding run.
AI produced drafts and implementation under that contract. No tool was allowed
to declare its own work complete; the repository gate is the acceptance test.

## 2. Tool record

| Tool | Verified contribution | Honest boundary |
| --- | --- | --- |
| CodeBuddy CLI 2.127.0 | Authored the first 10 Phase 1 files, including `matchEngine.ts`, which remains as the optional keepsake table | Exceeded its 50-turn limit. The gate found 2 TypeScript errors, 3 failing tests, 1 unused dependency, 4 audit findings, and a stale-timer race. A focused retry returned `429 Credits exhausted`. |
| OpenCode | Corrected the Phase 1 defects and implemented the original top-down sandbox pivot | That sandbox state/scene architecture was superseded by the 2026-08-03 campaign upgrade. |
| Claude Code (Opus 5) | Audio, reactive residents, lighting, procedural-art pass, Node CDP smoke harness, Pages workflow, and original deck | No human usability or accessibility outcome was inferred from automated checks. |
| Codex (GPT-5) | `CampaignStateV1`, pure reducer, KampungMind, content registries, versioned save, four-tab quest Journal, circular estate map, room-fit interior camera, Estate/Interior scene architecture, original resident/environment art including tropical landscaping, landmark façades, 13 visual-novel portraits with three expressions, four-frame locomotion, a pure 12-resident silhouette/outfit registry, 14 approach-only details, responsive world scale, pond/movement feedback, deterministic day/evening ambient voice-leading, the Chapter 2 monsoon, 12 story clusters, 54 baked ground accents, eight ambient insects, building solidity, generated-title integration, campaign tests, full/demo browser campaigns, and refreshed artifacts/docs | Authored deterministic content and code-drawn visuals ahead of time and integrated one reviewed generated title asset; no runtime model or network path was added. |
| OpenAI image generation | Produced four original visual workflows from labelled project references: a neighbourhood style key, a targeted estate-density study, a production HDB-estate title panorama with a constrained cleanup edit, and a cast silhouette/gait study | Human review translated the neighbourhood, density, and cast studies into original code-drawn systems. The cast review accepted stepped anatomy, connected limbs, grounded feet, and readable outfit variation while rejecting costume-like treatments. For the title, review rejected pseudo-writing, constrained the edit to non-text pictograms, optimized the accepted source, and integrated it at runtime while keeping all interface text semantic. Prompts, accepted outputs, artifact IDs, decisions, uses, and hashes are preserved. None was Miora. |
| Gemini CLI 0.53.1 | One real authoring invocation was attempted with `docs/prompts/gemini-kampungmind-authoring.txt` | Google authentication opened and the run was cancelled while blocked. It produced no draft; no Gemini text was reviewed or committed. We do not claim a completed Gemini pass. |

## 3. KampungMind: the AI feature

**AI-authored personalities powered by a private, offline NPC
memory-and-decision engine.**

`src/game/campaignContent.ts` stores reviewed personality, role, expertise,
knowledge, memory rules, and several authored intents per NPC.
`src/game/kampungMind.ts` filters and deterministically scores eligible intents
using chapter relevance, expertise, prior help, active requests, and remembered
choices. Stable IDs break ties.

The player can receive a greeting, clue, request, reminder, main-quest
contribution, remembered reaction, or completed-chapter reflection. “Maybe
later” never closes a route. No line is generated at runtime.

## 4. Current verification

| Gate | Evidence |
| --- | --- |
| Strict TypeScript | `npm run typecheck` passes |
| Unit tests | 75/75: 27 campaign, 31 optional matching, 17 audio |
| Production build | 106.23 kB initial JS (32.29 kB gzip); 1,596.66 kB lazy campaign scene (374.83 kB gzip) |
| Dependency audit | 0 known vulnerabilities |
| Production browser | 60/60 checks; complete full and demo campaigns in headless Chrome |

The browser harness covers keyboard and touch doors, return positions,
interiors, locked ordering, alternative resident routes, every chapter,
autosave/Continue, confirmed Start Over, demo isolation, visible modals, 360px
layout, 48px targets, circular-map movement, room-fit camera evidence,
four-tab Journal selection/tracking, generated terrain/landscape/façade evidence,
reviewed title-art loading, code-drawn portrait
dimensions/detail/named traits and neutral-to-thoughtful expression state,
desktop and mobile visual-novel fit,
four-frame player/resident locomotion, a 12-resident production registry with
five hair and five outfit silhouettes, one physical keyboard/touch path through
the 14 approach-only estate details, all four two-frame community task
vignettes, all eight two-frame butterflies/dragonflies, 88 exterior props
across 22 forms, 12 collision-aware story clusters across six forms, 54 baked
ground accents, responsive exterior zoom, pond phase, pooled walking feedback,
reduced-motion stillness, Chapter 2
rain/puddles/shelter/resident/cat/activity/laundry responses,
desktop/mobile/reduced-motion weather captures, live obstacle counts, physical
pond/storefront evidence, collision-preserving district travel, frame budgets,
and console errors.

## 5. Judge-openable artifacts

| Artifact | Path |
| --- | --- |
| Original CodeBuddy prompt | `docs/prompts/codebuddy-phase1.txt` |
| KampungMind/Gemini authoring prompt | `docs/prompts/gemini-kampungmind-authoring.txt` |
| OpenAI neighbourhood prompt and review | `docs/prompts/openai-neighbourhood-style-key.txt` |
| OpenAI estate-density prompt and review | `docs/prompts/openai-estate-density-reference.txt` |
| OpenAI title prompt, rejection, cleanup, hashes, and review | `docs/prompts/openai-title-panorama-v1.txt` |
| OpenAI cast-silhouette prompt and reviewed study | `docs/prompts/openai-character-silhouette-study-v1.txt`, `docs/art/openai-character-silhouette-study-v1.png` |
| Reviewed generated visual outputs | `docs/art/openai-neighbourhood-style-key.png`, `docs/art/openai-estate-density-reference.png`, `docs/art/openai-kampung-estate-title-v1.png`, `docs/art/openai-character-silhouette-study-v1.png` |
| Optimized generated runtime asset | `public/assets/generated/kampung-estate-title-v1.webp` |
| Curated in-game activity/density result | `src/game/campaignArt.ts`, `src/game/campaignScene.ts`, `docs/screenshots/10-living-estate.png`, `docs/screenshots/27-ambient-micro-scenes.png` |
| Full chronological AI record | `docs/AI_USAGE_LOG.md` |
| Campaign content and engine | `src/game/campaignContent.ts`, `src/game/kampungMind.ts` |
| Code-drawn visual-novel portraits | `src/game/campaignPortrait.ts` |
| Pure campaign reducer and save rules | `src/game/campaign.ts`, `src/game/campaignSave.ts` |
| Tests | `src/game/__tests__/campaign.test.ts`, `matchEngine.test.ts`, `audio.test.ts` |
| Production browser harness | `scripts/browser-smoke.mjs` |
| Claim guardrails | `docs/RESEARCH.md` |
| Current game contract | `docs/GAME_DESIGN.md`, `docs/ACCESSIBILITY.md` |
| Judge deck | `docs/deck/Kampung SG-Project Introduction Deck-TheTwoGuys.pptx` and `.pdf` |

## 6. What AI was not allowed to do

- No medical, cognitive, or dementia claim
- No fabricated playtests, users, metrics, endorsements, or tool runs
- No runtime LLM or externally generated dialogue
- No backend, analytics, accounts, or personal-data collection
- No timer, failure state, energy system, streak, or dark pattern
- No unreviewed, unattributed, or culturally unchecked generated asset

Generated visual work is explicitly allowed. The neighbourhood, density, and
cast studies remain visual-direction evidence with human-curated code-drawn
runtime translations. The title followed a documented reject/edit/optimize
path and ships as the title panorama. No claim depends on pretending any
workflow was a Miora run.

## 7. Known limitations

- No human playtest has occurred.
- No real-device touch pass has occurred.
- No 200% zoom, reduced-motion, or human screen-reader pass is claimed.
- The Phaser lazy chunk still triggers Vite’s standard 500 kB warning.
- No completed Gemini authoring output exists; the authentication-blocked
  attempt is evidence of process honesty, not a content contribution.
- No Miora generation has occurred. The four OpenAI workflows are useful
  cross-tool evidence but do not satisfy a Miora-specific artifact request.

## Judge summary

> Our AI story includes the failed run, the gate that caught it, the offline
> NPC system, generated visual targets that humans translated, and a title
> asset we rejected, constrained, optimized, and verified before shipping—
> because reviewable AI-authored depth is more responsible than a live model
> or uncurated asset a judge has to trust.
