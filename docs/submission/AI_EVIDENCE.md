# Kampung SG — AI Creation Evidence

**Team:** TheTwoGuys · **Track:** Game · **Tagline:** *Every Small Act Grows the Kampung.*
**Judge-checkable claim:** every statement below maps to a file in this repository. Nothing here is aspirational.

---

## 1. The workflow, as it actually happened

**We treat AI output as a pull request, not as a deliverable.**

1. **Humans wrote the contract first.** Before any agent touched code, we wrote `CODEBUDDY.md` (mission, tool rules, product invariants, engineering baseline), `docs/GAME_DESIGN.md`, `docs/ACCESSIBILITY.md`, `docs/RESEARCH.md` (claim guardrails), and `docs/QA_CHECKLIST.md`. The agent was given a spec with acceptance criteria, not a vibe.
2. **CodeBuddy CLI 2.127.0 authored the Phase 1 codebase.** The exact task prompt is preserved verbatim in `docs/prompts/codebuddy-phase1.txt` — written *before* the run, not reconstructed after it.
3. **The run failed a verification gate.** Details in §2. We did not delete the evidence.
4. **An independent pass corrected it.** **OpenCode**, under human direction, fixed each defect *without expanding scope*, then re-ran the gate.
5. **Humans redirected the product.** A human — not an agent — decided the card-matching board was the wrong game and pivoted to a top-down neighbourhood sandbox, demoting matching to one optional activity. OpenCode implemented the pivot; **Claude Code (Opus 5)** did the 2026-08-01 work (audio system, living residents, golden-hour lighting, the Node smoke harness, the Pages deploy workflow, the submission deck).
6. **Every session is logged — and the log is uneven, which we would rather state than have you discover.** `docs/AI_USAGE_LOG.md` records, per session, the tool, the goal, the files touched and the verification actually run. It is a working record, not a back-filled template: of the seven entries dated **2026-07-25**, an explicit *Known limitations* section appears in **two** and an explicit *Claim boundary* section in **one**. The remaining entries carry their caveats in prose instead. An entry is appended the day the work happens — the 2026-07-25 entries cover contract → Phase 1 → correction → pivot, and the **2026-08-01** entry covers today's work.

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
| **The fix** | An independent OpenCode pass, human-directed, rewrote the tests to locate actual matching IDs instead of assuming shuffle order, added session-aware timer cancellation and defensive mismatch resolution, corrected focus routing / ARIA board semantics / touch targets / 360px overflow, and patched dependencies. |
| **What survived** | The match engine CodeBuddy wrote **still ships today** as the optional memory-table activity — 31 of our 59 tests cover it. |

**The method change this forced.** Run 1 was one unbounded task with prose acceptance criteria, and it produced a red build. Diagnosis: the scope exceeded the agent's turn budget, and "self-review against the QA checklist" is not machine-checkable. Every task since has been **bounded**, every acceptance criterion **executable** (`tsc --noEmit`, `vitest`, `npm run build`, `npm audit`, `npm run smoke`), and **no agent is allowed to merge its own work.** That rule is why the defects above are in a log instead of in the shipped game.

---

## 3. Division of labour

| Layer | AI generated | Human decided | How we verified |
|---|---|---|---|
| **Code** | Phase 1 graybox (10 files, incl. the shipping `matchEngine.ts`) by **CodeBuddy CLI 2.127.0**; sandbox scene, state and UI by **OpenCode**; audio system, resident behaviour, lighting and the smoke harness by **Claude Code (Opus 5)** — all under human direction | Architecture rule: domain logic stays Phaser-free and pure; Phaser lazy-loaded so the title page ships small; no backend, no network | `tsc --noEmit` clean (strict) · `vitest` 59/59 pass · `vite build` succeeds — 24.35 kB initial JS (8.85 kB gzip), Phaser deferred to a lazy 1,498 kB chunk (345.7 kB gzip) · `npm audit` 0 vulnerabilities · `npm run smoke` — a Node + Chrome DevTools Protocol harness (`scripts/browser-smoke.mjs`) driving the **production** bundle: **18 checks, 18 passing, 0 failing, run 2026-08-01** |
| **Game design** | Draft activity structures, dialogue branches, evening-reflection phrasing | Older residents are **authors of the neighbourhood, not recipients of care**; choices are non-punitive (no fail state, no streaks, no timers); matching demoted to optional; every choice must leave a visible mark on the world | Human read-through against `CODEBUDDY.md` product invariants; 11 `sandboxState` tests assert bounded meters, immutability, and that the evening reflection is composed from the player's *actual* choice IDs |
| **Art** | **Nothing.** 100% of current visuals are procedural Phaser geometry drawn in code | Graybox-first: no final art until the world layout is validated, so art never blocks the loop. `docs/MIORA_ASSET_BIBLE.md` (palette, representation rules, prompt templates, file contract, review checklist) and `public/assets/miora/` were prepared in advance | Nothing to verify — **zero Miora assets have been generated, and we claim none.** `[PLACEHOLDER: if Miora assets are generated before submission, list each filename, its prompt, and the rejected variants here — otherwise this row stands as written.]` |
| **Copy** | Resident dialogue and choice-response drafts | Every line reviewed against `docs/RESEARCH.md` prohibited-claims list; celebratory language over deficit language; Singapore specifics (void deck, sheltered walkway, hawker corner, shade) kept concrete, not touristic | Manual review; `docs/RESEARCH.md` pre-registers the banned claim set so review is a checklist, not a judgement call |
| **Tests** | Test bodies drafted by AI — match-engine tests by CodeBuddy CLI 2.127.0 (rewritten by OpenCode after they failed the gate), sandbox-state tests by OpenCode, audio tests by Claude Code (Opus 5) | Rule: **tests are the acceptance criteria, and the agent that writes the code does not get to declare it passing** | 59 deterministic tests across 3 files (31 match engine · 11 sandbox state · 17 audio settings), all pure — no browser, no timers, no network. Re-run in ~1 second: `npm test` |
| **Audio** | Web Audio synthesis code for all sounds, written by Claude Code (Opus 5) on 2026-08-01 — music/sfx/ui buses, mute, per-category volume, throttling, tab-hidden suspend | No audio files at all — every sound is synthesized at runtime, so there is nothing to license and no missing-asset failure on a judge's machine | 17 tests over the pure settings/mute/volume helpers (`src/game/audio.ts` keeps Web Audio out of the testable layer) |

---

## 4. Artifacts a judge can open right now

| Artifact | Path | What it proves |
|---|---|---|
| The exact CodeBuddy prompt | `docs/prompts/codebuddy-phase1.txt` | Written before the run; specifies scope, bans backends/analytics/medical claims/unapproved dependencies |
| Agent operating contract | `CODEBUDDY.md` | Product invariants and tool rules the agent was bound by |
| Full AI usage log | `docs/AI_USAGE_LOG.md` | Every session: tool, goal, files touched, verification run — newest entry dated 2026-08-01. Caveats are explicit *Known limitations* / *Claim boundary* sections in some entries and prose in the rest; see §1.6 |
| Browser smoke harness | `scripts/browser-smoke.mjs` · `npm run smoke` | Node + Chrome DevTools Protocol, driving the **production** bundle: 18 checks, 18 passing, run 2026-08-01. Runs on macOS and Linux. (`scripts/browser-smoke.ps1` is **superseded** — retained as the pre-pivot harness for the card-matching build, and is not evidence for the current game) |
| Claim guardrails | `docs/RESEARCH.md` | The prohibited-claims list, written before any copy existed |
| Test suite | `src/game/__tests__/` | 59 passing deterministic tests |
| Self-audit | `docs/RUBRIC_SCORECARD.md` | We score ourselves against this rubric and leave the boxes we failed **unticked** |
| Playtest protocol | `docs/PLAYTEST_PROTOCOL.md` | A consent-and-privacy plan — and an admission that no playtest has been run |
| Miora asset bible | `docs/MIORA_ASSET_BIBLE.md` | The art pipeline we prepared but did not get to use |
| Submission deck | `docs/deck/Kampung SG-Project Introduction Deck-TheTwoGuys.pptx` (and `.pdf`) | 8 slides with speaker notes in the notes pane. Built from `docs/deck/index.html` by `scripts/capture-deck.mjs` + `scripts/build-pptx.py`, so the deck is regenerable from source rather than hand-assembled |
| Source repository | https://github.com/ming3465/Tencent-Hackathon-9Aug | Public. Every file cited on this page can be opened without asking us for access |
| Live build | https://ming3465.github.io/Tencent-Hackathon-9Aug/ | Verified 2026-08-01: HTTP 200, HTTPS enforced. Auto-deployed from `main` by a GitHub Pages workflow, so the deployed artifact is the commit you can read. The verification claims above were run against this production bundle `[PLACEHOLDER: add EdgeOne Pages mirror URL if deployed]` |

**One honest caveat about git history:** this repository was checkpointed into a small number of commits rather than committed incrementally through the build, so `git log` is *not* our evidence trail. `docs/AI_USAGE_LOG.md` is, and it was written as the work happened. We would rather say that than let a judge discover it.

---

## 5. What AI was **not** allowed to do — and why

These are refusals we designed in, not features we ran out of time for.

- **No medical, cognitive, or dementia claim.** `docs/RESEARCH.md` bans "diagnoses / measures cognitive age / prevents / delays / treats / improves" *before* a single line of copy was written. We are a game team, not a clinical one: we have run no study, we hold no outcome data, and we are not qualified to say what a game does to anyone's cognition. So we scope our evaluation to what we could actually observe — usability, engagement and social interaction. Clinical outcomes are not a thing we measure, and therefore not a thing we claim. On a health-adjacent topic, an unconstrained language model will happily write the sentence that gets a project disqualified. We removed the opportunity.
- **No fabricated playtests, users, or metrics.** **Zero humans have played this game.** Kampung SG's social impact is a **design hypothesis, not a demonstrated result.** `docs/PLAYTEST_PROTOCOL.md` is a plan; there are no results, and we did not invent any.
- **No runtime LLM dependency.** Every system in the game is deterministic and offline. *"No live LLM: our content is authored with AI at development time and selected at runtime by deterministic, unit-tested logic. Zero network calls, zero API cost, zero demo failure modes — and every generated line is in the repo and reviewable."* A chatbot bolted to an NPC demos AI; a tested offline system demos engineering. We also cannot afford a hallucination in front of judges, and neither can an older adult who was told this app is calm and safe.
- **No analytics, no accounts, no data collection.** Nothing about the player leaves the browser. For an audience often targeted by extractive apps, that is part of the product, not a limitation.
- **No dark patterns.** No streaks, no timers, no fail state, no retention pressure — banned in `CODEBUDDY.md` product invariants, so no agent could add them "to increase engagement."

---

## 6. What we would say to a judge in one sentence

> Every other team's AI slide says the tool worked great. Ours shows you the run that failed, the gate that caught it, the defects it shipped, and the rule we changed because of it — because a team that can enumerate its AI's mistakes is a team that actually read the code.

*Verified 2026-08-01 on the current build: `npm run typecheck` clean (strict) · `npm test` 59/59 passing across 3 files (31 match engine · 11 sandbox state · 17 audio) · `npm run build` succeeds · `npm audit` 0 vulnerabilities · `npm run smoke` 18/18 checks passing against the production bundle. (`docs/AI_USAGE_LOG.md` records 42 tests at the sandbox-pivot entry on 2026-07-25; the 17 audio-settings tests were added on 2026-08-01, which is what moves the count to 59.)*
