# Kampung SG — AI Creation Evidence

**Team:** TheTwoGuys · **Track:** Game · **Tagline:** *Every Small Act Grows the Kampung.*
**Judge-checkable claim:** every statement below maps to a file in this repository. Nothing here is aspirational.

---

## 1. The workflow, as it actually happened

**We treat AI output as a pull request, not as a deliverable.**

1. **Humans wrote the contract first.** Before any agent touched code, we wrote `CODEBUDDY.md` (mission, tool rules, product invariants, engineering baseline), `docs/GAME_DESIGN.md`, `docs/ACCESSIBILITY.md`, `docs/RESEARCH.md` (claim guardrails), and `docs/QA_CHECKLIST.md`. The agent was given a spec with acceptance criteria, not a vibe.
2. **CodeBuddy CLI 2.127.0 authored the Phase 1 codebase.** The exact task prompt is preserved verbatim in `docs/prompts/codebuddy-phase1.txt` — written *before* the run, not reconstructed after it.
3. **The run failed a verification gate.** Details in §2. We did not delete the evidence.
4. **An independent pass corrected it.** A different agent, under human direction, fixed each defect *without expanding scope*, then re-ran the gate.
5. **Humans redirected the product.** A human — not an agent — decided the card-matching board was the wrong game and pivoted to a top-down neighbourhood sandbox, demoting matching to one optional activity.
6. **Every step is logged.** `docs/AI_USAGE_LOG.md` (297 lines) records tool, goal, files touched, verified results, and — in every entry — an explicit *Known limitations* and *Claim boundary* section.

---

## 2. The CodeBuddy episode, told honestly

We are leading with our failure because it is the part of our process a judge can actually verify.

| | What happened |
|---|---|
| **Tool** | CodeBuddy CLI 2.127.0 |
| **Invocation** | *"Read CODEBUDDY.md and docs/prompts/codebuddy-phase1.txt, then execute only that Phase 1 task. You have approval to install only project-local Phaser, Vite, TypeScript, and Vitest packages. Do not use any other dependency or external service. Preserve the existing training transcript. Stop after the Phase 1 checks and report truthfully."* |
| **Files it authored** | `index.html`, `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `src/main.ts`, `src/game/chapter1.ts`, `src/game/config.ts`, `src/game/matchEngine.ts`, `src/game/__tests__/matchEngine.test.ts` |
| **What went wrong** | It **exceeded its 50-turn limit and returned no final report.** Our gate then found: **2 TypeScript unused-variable errors**, **3 failing tests** resting on an invalid constant-RNG shuffle assumption, 1 unused dependency, 4 dependency-audit findings, and a stale mismatch-timer race. |
| **The retry** | We sent a focused correction request listing every defect to the same session. It never ran — the account returned **`429 Credits exhausted`**. |
| **What we did not do** | We did not purchase credits, and **we did not fabricate additional runs to make this slide look better.** |
| **The fix** | An independent agent pass rewrote the tests to locate actual matching IDs instead of assuming shuffle order, added session-aware timer cancellation and defensive mismatch resolution, corrected focus routing / ARIA board semantics / touch targets / 360px overflow, and patched dependencies. |
| **What survived** | The match engine CodeBuddy wrote **still ships today** as the optional memory-table activity — 31 of our 59 tests cover it. |

**The method change this forced.** Run 1 was one unbounded task with prose acceptance criteria, and it produced a red build. Diagnosis: the scope exceeded the agent's turn budget, and "self-review against the QA checklist" is not machine-checkable. Every task since has been **bounded**, every acceptance criterion **executable** (`tsc --noEmit`, `vitest`, `npm run build`, `npm audit`, a browser smoke), and **no agent is allowed to merge its own work.** That rule is why the defects above are in a log instead of in the shipped game.

---

## 3. Division of labour

| Layer | AI generated | Human decided | How we verified |
|---|---|---|---|
| **Code** | Phase 1 graybox (10 files, incl. the shipping `matchEngine.ts`) by CodeBuddy CLI 2.127.0; sandbox scene, state, audio and UI by AI coding agents under direction | Architecture rule: domain logic stays Phaser-free and pure; Phaser lazy-loaded so the title page ships small; no backend, no network | `tsc --noEmit` clean · `vitest` 59/59 pass · `vite build` succeeds · `npm audit` 0 vulnerabilities · CDP browser smoke against the **production** bundle (`scripts/browser-smoke.ps1`, 499 lines) |
| **Game design** | Draft activity structures, dialogue branches, evening-reflection phrasing | Older residents are **authors of the neighbourhood, not recipients of care**; choices are non-punitive (no fail state, no streaks, no timers); matching demoted to optional; every choice must leave a visible mark on the world | Human read-through against `CODEBUDDY.md` product invariants; 11 `sandboxState` tests assert bounded meters, immutability, and that the evening reflection is composed from the player's *actual* choice IDs |
| **Art** | **Nothing.** 100% of current visuals are procedural Phaser geometry drawn in code | Graybox-first: no final art until the world layout is validated, so art never blocks the loop. `docs/MIORA_ASSET_BIBLE.md` (palette, representation rules, prompt templates, file contract, review checklist) and `public/assets/miora/` were prepared in advance | Nothing to verify — **zero Miora assets have been generated, and we claim none.** `[PLACEHOLDER: if Miora assets are generated before submission, list each filename, its prompt, and the rejected variants here — otherwise this row stands as written.]` |
| **Copy** | Resident dialogue and choice-response drafts | Every line reviewed against `docs/RESEARCH.md` prohibited-claims list; celebratory language over deficit language; Singapore specifics (void deck, sheltered walkway, hawker corner, shade) kept concrete, not touristic | Manual review; `docs/RESEARCH.md` pre-registers the banned claim set so review is a checklist, not a judgement call |
| **Tests** | Test bodies drafted by AI | Rule: **tests are the acceptance criteria, and the agent that writes the code does not get to declare it passing** | 59 deterministic tests across 3 files (31 match engine · 11 sandbox state · 17 audio settings), all pure — no browser, no timers, no network. Re-run in ~1 second: `npm test` |
| **Audio** | Web Audio synthesis code for all sounds | No audio files at all — every sound is synthesized at runtime, so there is nothing to license and no missing-asset failure on a judge's machine | 17 tests over the pure settings/mute/volume helpers (`src/game/audio.ts` keeps Web Audio out of the testable layer) |

---

## 4. Artifacts a judge can open right now

| Artifact | Path | What it proves |
|---|---|---|
| The exact CodeBuddy prompt | `docs/prompts/codebuddy-phase1.txt` | Written before the run; specifies scope, bans backends/analytics/medical claims/unapproved dependencies |
| Agent operating contract | `CODEBUDDY.md` | Product invariants and tool rules the agent was bound by |
| Full AI usage log | `docs/AI_USAGE_LOG.md` | Every session: tool, goal, files, verified results, **known limitations**, **claim boundaries** |
| Claim guardrails | `docs/RESEARCH.md` | The prohibited-claims list, written before any copy existed |
| Test suite | `src/game/__tests__/` | 59 passing deterministic tests |
| Self-audit | `docs/RUBRIC_SCORECARD.md` | We score ourselves against this rubric and leave the boxes we failed **unticked** |
| Playtest protocol | `docs/PLAYTEST_PROTOCOL.md` | A consent-and-privacy plan — and an admission that no playtest has been run |
| Miora asset bible | `docs/MIORA_ASSET_BIBLE.md` | The art pipeline we prepared but did not get to use |
| Live build | https://ming3465.github.io/Tencent-Hackathon-9Aug/ | The verification claims above apply to the deployed artifact `[PLACEHOLDER: add EdgeOne Pages mirror URL if deployed]` |

**One honest caveat about git history:** this repository was checkpointed into a small number of commits rather than committed incrementally through the build, so `git log` is *not* our evidence trail. `docs/AI_USAGE_LOG.md` is, and it was written as the work happened. We would rather say that than let a judge discover it.

---

## 5. What AI was **not** allowed to do — and why

These are refusals we designed in, not features we ran out of time for.

- **No medical, cognitive, or dementia claim.** `docs/RESEARCH.md` bans "diagnoses / measures cognitive age / prevents / delays / treats / improves" *before* a single line of copy was written. Cognitive-training research shows gains on practiced tasks but uncertain transfer to daily functioning — so we evaluate usability, engagement and social interaction, never clinical outcomes. On a health-adjacent topic, an unconstrained language model will happily write the sentence that gets a project disqualified. We removed the opportunity.
- **No fabricated playtests, users, or metrics.** **Zero humans have played this game.** Kampung SG's social impact is a **design hypothesis, not a demonstrated result.** `docs/PLAYTEST_PROTOCOL.md` is a plan; there are no results, and we did not invent any.
- **No runtime LLM dependency.** Every system in the game is deterministic and offline. *"No live LLM: our content is authored with AI at development time and selected at runtime by deterministic, unit-tested logic. Zero network calls, zero API cost, zero demo failure modes — and every generated line is in the repo and reviewable."* A chatbot bolted to an NPC demos AI; a tested offline system demos engineering. We also cannot afford a hallucination in front of judges, and neither can an older adult who was told this app is calm and safe.
- **No analytics, no accounts, no data collection.** Nothing about the player leaves the browser. For an audience often targeted by extractive apps, that is part of the product, not a limitation.
- **No dark patterns.** No streaks, no timers, no fail state, no retention pressure — banned in `CODEBUDDY.md` product invariants, so no agent could add them "to increase engagement."

---

## 6. What we would say to a judge in one sentence

> Every other team's AI slide says the tool worked great. Ours shows you the run that failed, the gate that caught it, the defects it shipped, and the rule we changed because of it — because a team that can enumerate its AI's mistakes is a team that actually read the code.

*Verified 2026-08-01 on the current build: `npm run typecheck` clean · `npm test` 59/59 passing · `npm run build` succeeds · `npm audit` 0 vulnerabilities. (`docs/AI_USAGE_LOG.md` records 42 tests at the sandbox-pivot entry; the 17 audio-settings tests were added afterwards.)*
