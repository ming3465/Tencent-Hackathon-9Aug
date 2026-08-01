# Kampung SG — Project Introduction Deck Copy

**Deliverable filename when exported:** `Kampung SG-Project Introduction Deck-TheTwoGuys.pptx`
(ship `Kampung SG-Project Introduction Deck-TheTwoGuys.pdf` alongside it)

**Team:** TheTwoGuys · **Project:** Kampung SG · **Tagline:** Every Small Act Grows the Kampung.
**Event:** Tencent Cloud Hackathon "AI CAN DO IT" — "Age Well" Social Good Challenge Singapore, Game Track.

---

## How to use this file

- Headlines are max 8 words. Bullets are max 12 words. Do not paste the speaker notes onto slides —
  they go in PowerPoint's notes pane (`slide.notes_slide.notes_text_frame.text`), which also makes the
  image-backed deck partly machine-readable.
- Every `[FILL: ...]` is a real unknown. Fill it or **delete the bullet**. Never guess. (This file used
  to say `PLACEHOLDER`; everything that became knowable on 2026-08-01 is now filled in, and only genuine
  unknowns still carry a `FILL:` marker — the same convention the built deck at `docs/deck/index.html` uses.)
- **Honesty rule for this deck:** no invented playtesters, user counts, metrics, awards, endorsements,
  or AI-tool runs that did not happen. No medical claim — never "prevents", "delays", "treats",
  or "improves memory".
- **Tooling attribution rule:** never write a single "Built with <AI tool> + <framework>" line. Name which
  tool wrote which part, because three different agents touched this repo and only one of them wrote the
  pre-pivot files.

## Verified facts snapshot — re-run before exporting

Measured on the repo at `2026-08-01`, immediately before this copy was written:

| Fact | Value | How to re-verify |
| --- | --- | --- |
| Test suite | **59 tests passing**, 3 files (`sandboxState` 11, `audio` 17, `matchEngine` 31) — up from 42 before 2026-08-01 | `npm test` |
| Type checking | passes clean, strict TypeScript | `npm run typecheck` |
| Dependency audit | **0 vulnerabilities** | `npm audit` |
| Initial JS | **24.35 kB** (8.85 kB gzip) | `npm run build` |
| Lazy Phaser chunk | 1,498 kB (345.7 kB gzip), loads only after "Begin" | `npm run build` |
| Browser smoke | **18 checks, 18 passing, 0 failing**, run 2026-08-01 against the **production** bundle | `npm run smoke` (`scripts/browser-smoke.mjs`, Node + Chrome DevTools Protocol, macOS/Linux) |
| Audio | Web Audio API synthesis, **zero audio files shipped**, mute + music/effects sliders | `src/game/audio.ts` |
| Live link | `https://ming3465.github.io/Tencent-Hackathon-9Aug/` — HTTP 200, HTTPS enforced | `curl -I` |
| Repo | **public**: `https://github.com/ming3465/Tencent-Hackathon-9Aug` | open it in a signed-out browser |
| Deck deliverables | **exported and present** in `docs/deck/`: `Kampung SG-Project Introduction Deck-TheTwoGuys.pptx` (8 slides, speaker notes in the notes pane) and the matching `.pdf` | `ls docs/deck/` |
| Deck build path | `docs/deck/index.html` → `scripts/capture-deck.mjs` → `scripts/build-pptx.py` | re-run both scripts |
| Art assets | **no Miora assets shipped** — `public/assets/miora/` contains only `README.md` | `ls public/assets/miora/` |
| Human playtests | **zero** | nothing to cite |
| World | 1600×1000 scrollable map, 6 named areas, 3 residents, 4 activities, 6 world consequences | `src/game/sandboxScene.ts` |

> If any number moves before export, **change it here first, then in the deck.** A wrong number on a
> slide is worse than no number.

> `scripts/browser-smoke.ps1` is **superseded; retained as the pre-pivot harness.** It drove the deleted
> card-matching build (12 cards, Together Mode, Solo Mode) which no longer exists. Never cite it as
> current evidence — the current harness is `scripts/browser-smoke.mjs`.

---

# SLIDE 1 — The Pitch

### Headline
**Every Small Act Grows the Kampung.**

### Bullets
- Kampung SG: a cozy Singapore neighbourhood sandbox
- Older residents are the experts, not the errands
- Walk one HDB estate, join small invitations
- Every choice visibly changes the neighbourhood
- Plays free in any browser, no account

### Speaker note (~20s)
> This is Kampung SG. You walk into one HDB estate and meet three older neighbours — and they are not
> problems to be solved. They are the people who know how to grow herbs here, who host the void deck,
> who know which route stays dry in the afternoon. You choose which of their invitations to join, and
> the neighbourhood visibly changes because of it. Every small act grows the kampung.

### Visual
Full-bleed hero screenshot: the player standing at the void deck with a resident marker active and the
three Kampung Spirit meters visible in the HUD. Pick the frame with the most colour and the most
recognisable Singapore geometry. Overlay the tagline bottom-left; keep the live URL small, bottom-right.
[PLACEHOLDER: capture at 1280×720 logical or wider — narrower triggers the compact layout at 1000px]

---

# SLIDE 2 — The Problem

### Headline
**One In Four, By 2030**

### Bullets
- By 2030, nearly one in four Singapore citizens aged 65+
- Age Well means dignity, purpose, independence, social bonds
- The gap is belonging, not supervision
- We design for contributors, never for patients
- Setting: the void deck people actually live in

### Source line to print on the slide
`Source: official "AI CAN DO IT" — "Age Well" Social Good Challenge Singapore hackathon brief (2026), p.5.`

**Citation status: CONFIRMED.** The brief states verbatim on page 5: *"By 2030, nearly one in four
citizens will be aged 65 and above."* The slide bullet must stay inside that wording — say "citizens",
say "nearly", and keep the page reference on the slide.

### Speaker note (~20s)
> The brief for this challenge gives us the number: by 2030, nearly one in four Singapore citizens will
> be aged 65 and above. It defines Age Well as security, independence, dignity, purpose, social bonds,
> and technology that includes rather than excludes. So we asked one question: what does a game look
> like if it treats an older resident as the person with the expertise, and the neighbourhood as the
> thing that needs their help?

### Visual
Split slide. Left: the "1 in 4 by 2030" stat set large, with the brief cited underneath in small type,
page reference included (`official hackathon brief, 2026, p.5`).
Right: an in-game screenshot of the void deck and sheltered walkway — the argument that this is a real
Singapore place, not a generic town. Do **not** use stock photography of older adults; the game art
carries the respect framing better than a stock image will.

---

# SLIDE 3 — The Loop

### Headline
**A Place, Not A Menu**

### Bullets
- 1600×1000 estate: HDB block, void deck, hawker corner
- Move with WASD, arrow keys, or touch pad
- Approach a resident, press E, choose together
- Three meters rise: Connection, Purpose, Comfort
- Any three activities unlock the evening reflection

### Speaker note (~20s)
> The neighbourhood is walked, not picked from a list. You move through six named areas — HDB Commons,
> Void Deck, Hawker Corner, Community Garden, Shaded Walk, Community Court — and activities are
> discovered wherever you happen to go, in any order you like. Complete any three and the day closes
> with an evening gathering at the void deck. No timer, no energy bar, no failure state, nothing to lose.

### Visual
Annotated top-down map of the full 1600×1000 world, with the six area names labelled and the four
activity markers pinned. Beneath it, a three-step strip: **walk → choose → the world changes.**
Add a small inset of the on-screen touch d-pad to prove phone play in one glance.

---

# SLIDE 4 — The Residents

### Headline
**Three Neighbours With Real Expertise**

### Bullets
- Aunty Mei: tropical herb care, teaches harvest timing
- Uncle Ravi: void-deck host, welcomes chess beginners
- Mdm Siti: route expert on shade and rain
- Two choices each — preferences, never right answers
- Six choices, six visible changes in the world

### Speaker note (~20s)
> Aunty Mei decides what the garden grows and teaches younger neighbours when to harvest. Uncle Ravi
> turns a noticeboard full of notices into an invitation. Mdm Siti maps sun and rain from walking the
> route every day, and her knowledge drives the shelter plan. Both choices are always valid — the game
> never tells you that you chose wrong. And the evening reflection is written from the choices you
> actually made, not from generic text.

### Visual
Three portrait cards across the top, one per resident, each captioned with their expertise in five words.
Below, a single before/after pair from one choice — recommended: Aunty Mei's garden bed before, then the
herb rows after — because it proves consequence in one image. Caption the pair: *"You chose herbs. The
estate now grows them."*

### Extra copy if the slide has room (use the game's own lines, verbatim)
> "Aunty Mei marks out pandan, mint, and curry leaf. She will teach the younger neighbours when to
> harvest them."

---

# SLIDE 5 — AI Creation Workflow *(the 40-point slide — make this the best-designed one)*

### Headline
**How AI Built This, Honestly**

### Bullets
- CodeBuddy CLI 2.127.0 authored the first ten files
- That run overran and shipped real defects
- Our verification gate caught every one
- "429 Credits exhausted" — none bought, none faked
- Humans set scope and ethics; AI writes and tests

### The defect table — print this on the slide, it is the whole argument

| AI produced | What our gate caught | What we did | Verification after |
| --- | --- | --- | --- |
| 10 files incl. the match engine that still ships today | 2 TypeScript errors · 3 failing tests · 1 unused dependency · 4 audit findings · 1 stale-timer race | Rewrote tests off an invalid constant-RNG shuffle assumption; added session-aware timer cancellation | `tsc --noEmit` clean · 59/59 tests · `npm audit` 0 · 18/18 production-bundle browser smoke |

### Which agent wrote which part — say it this precisely, never fuse it into one line

| Agent | What it actually produced |
| --- | --- |
| **CodeBuddy CLI 2.127.0** | The first ten files only, pre-pivot — incl. the match engine that still ships. Then 429, credits exhausted. |
| **OpenCode** | Middle-phase work on the sandbox rebuild after the pivot away from card matching |
| **Claude Code (Opus 5)** | 2026-08-01 work: the Web Audio system and its 17 tests, wandering/reactive residents, golden-hour lighting, shadows and ambient detail, the Node CDP smoke harness, the Pages deploy workflow, this deck |
| **Humans (TheTwoGuys)** | Scope, ethics policy, art direction, and the verification gate every one of the above had to pass |

### Second block — who decided what

| Human decided | AI produced |
| --- | --- |
| That older residents are experts, not quest problems | The Phaser world, movement, collision, camera, HUD |
| The no-medical-claims policy, written **before** any code | The deterministic domain logic and its 59 tests |
| Non-punitive choices; no timer, no failure state | Web Audio synthesis layer — zero audio files shipped |
| Art direction, palette, and representation rules | Every visual in the build as procedural Phaser geometry — no image assets generated, none shipped |

### Speaker note (~20s)
> Every team here will tell you their AI tool worked great. Ours didn't, the first time. CodeBuddy wrote
> our initial codebase, then blew its turn limit and handed us type errors, three failing tests and a
> timer race. Our verification gate caught all of it, and we fixed it. When we asked CodeBuddy to
> correct itself, the account returned 429, credits exhausted. We didn't buy credits and we didn't invent
> extra runs to make this slide look better. We treat AI output as a pull request, not a deliverable.

### Deliberate design decision to state out loud
> **No runtime LLM.** Dialogue and world content are authored ahead of time and selected by
> deterministic, unit-tested code. That means zero network calls, zero API cost, zero hallucination on
> stage, and every line is in the repo where a judge can read it.

### Art pipeline copy — ONE variant only, no branch to choose from

**Zero Miora assets shipped.** `public/assets/miora/` contains only `README.md`. The alternate
"if Miora assets shipped" variant has been **deleted from this file on purpose**, so that nobody can
export the wrong branch by accident. Do not re-add it unless generated assets are actually committed —
and if they ever are, list their exact filenames here first.

> "All art in this build is procedural Phaser geometry. The Miora asset bible — palette, camera,
> representation rules, export contract — is written and the code is layered so generated art drops in
> without touching collision or game rules. We are not claiming assets we did not generate."

*(This is the honest line. It costs less than being caught.)*

### Visual
Three-column evidence strip, left to right: (1) a screenshot of the real preserved prompt file
`docs/prompts/codebuddy-phase1.txt`, (2) the defect table above, (3) a terminal screenshot of the green
gate — `59 passed`, `found 0 vulnerabilities`. Put the "429 Credits exhausted" error text in as a small,
unretouched screenshot. It is the most credible pixel in the entire deck.

---

# SLIDE 6 — Engineering

### Headline
**Fast, Private, Tested, No Backend**

### Bullets
- Vite + TypeScript + Phaser 3, strict mode
- 24.35 kB initial JS; engine loads only on play
- 59 tests, 0 vulnerabilities, 18/18 production browser checks
- Keyboard, touch, or Journal — all finish the game
- Zero accounts, zero analytics, zero data collected

### Speaker note (~20s)
> The title screen ships 24.35 kilobytes of JavaScript; the game engine only downloads when you press
> Begin, which matters on an older phone. Fifty-nine deterministic tests cover the domain logic, and an
> eighteen-check Chrome DevTools smoke run drives the real production bundle, ending at a 360-pixel
> viewport — all eighteen passing on the first of August. There is no
> backend, no account, no analytics, and no personal data — nothing about you leaves your device,
> because nothing is ever collected. All sound is synthesised at runtime, so there are no audio files
> to fail to load.

### Visual
Left: a four-box architecture diagram — Browser → Vite static bundle → `sandboxState` (pure, tested) /
`sandboxScene` (Phaser render) — with a red X through a "Server / Database / Account" box to make the
zero-backend point visually.
Right: a stat row of four hard numbers — **59 tests · 0 vulnerabilities · 24.35 kB initial JS · 0 bytes
collected** — plus both URLs as clickable hyperlinks (the PDF export keeps links live).
Play: `https://ming3465.github.io/Tencent-Hackathon-9Aug/`
Code: `https://github.com/ming3465/Tencent-Hackathon-9Aug` (public)
[FILL: EdgeOne mirror URL — only if it actually deploys and still returns 200 after three hours;
otherwise delete this line rather than promising a mirror]

---

# SLIDE 7 — Integrity

### Headline
**What We Tested, What We Won't Claim**

### Bullets
- Automated: typecheck, 59 tests, 0-vulnerability audit
- Automated: 18/18 browser checks on the production bundle
- Automated: no overflow at 360px, touch targets ≥ 44px
- We never claim to prevent, delay, or treat dementia
- No human playtest yet — the social claim stays a hypothesis

### What the 18 automated browser checks actually assert — do not overstate this list

Run: `npm run smoke` (`scripts/browser-smoke.mjs`), 2026-08-01, **18 checks, 18 passing, 0 failing**,
against the production build. The two numbers people get wrong:

- The touch-target assertion is **≥ 44px**, not 48px. Never print 48.
- **Focus restoration is NOT one of the 18 checks.** It belongs on the manual list below, or nowhere.

Verified automatically: title renders · start button present · exactly one Phaser canvas · world reports
ready (`aria-busy` cleared) · sound controls present · spawn offers the first resident · keyboard movement
reaches a different activity · touch d-pad movement returns to the resident · dialogue opens with two
choices · a choice raises a Kampung Spirit meter · three activities unlock the evening · the evening
reflection names the player's real choices · exiting destroys the canvas · a second playthrough starts
with one canvas · the second playthrough resets the meters · no horizontal overflow at 360px · all
visible touch targets ≥ 44px · no uncaught console errors.

### NOT automated — manual-only ground. Label it that way, or leave it off the slide

- Focus restoration after a dialogue closes — implemented in code, **not** asserted by the harness
- Screen-reader announcement wording
- Real-device play on physical phones (only 360px CDP emulation is automated)
- Colour-contrast judgement beyond the palette we authored

*(Anything on this list may only be described as "implemented" or "checked by hand" — and only if
someone actually checked it before export. None of it may sit under the word "Verified", which on this
deck means the harness asserted it.)*

### Speaker note (~20s)
> We want to be precise about the difference between what we built and what we've proven. The software
> is verified: type checking, fifty-nine tests, a clean audit, and eighteen out of eighteen browser
> checks on the real production bundle — including no horizontal overflow at three-sixty pixels and
> every touch target at forty-four pixels or larger. The social impact is a design hypothesis: we have
> run zero human playtests, so we are not going to stand here and tell you it works on people. The
> protocol for that is written and consented; the sessions have not happened. And we wrote our claim
> guardrails before we wrote the game: Kampung SG does
> not diagnose, measure, prevent, delay, or treat anything. On a health-adjacent topic, that restraint
> is the design, not a limitation of it.

### Two-column card to print on the slide

| What we can support | What we deliberately do not claim |
| --- | --- |
| Strict TypeScript, 59 passing tests, 0 vulnerabilities | Any cognitive, memory, or dementia benefit |
| 18/18 browser checks on the production bundle, incl. 360px layout and ≥ 44px touch targets | Any clinical or health outcome |
| Completable by keyboard, touch, or Journal shortcuts alone | Any measured user or population result |
| No data collection, no account, no network dependency | Any playtest finding — **zero human playtests have been run** |
| Choice-driven evening reflection built from real player choices | Any accessibility outcome the harness does not assert (e.g. focus restoration, screen-reader wording) |

### Speaker note addendum — say this if a judge asks "why so cautious?"
> Because the evidence on brain-training transfer to everyday functioning is genuinely uncertain, and
> overclaiming on ageing is how good intentions become harm. Our research guardrails file bans those
> claims by name. We would rather score lower on a slide than be wrong about someone's health.

### Visual
Two clean columns — green ticks left, deliberate grey dashes right. Grey, not red: these are choices,
not failures. Small footer citing `docs/RESEARCH.md` and `docs/PLAYTEST_PROTOCOL.md` so a judge can see
the guardrails and the consent-and-privacy protocol exist as artifacts, not as a slide promise.

---

# SLIDE 8 — Team

### Headline
**TheTwoGuys — Built In Public**

### Bullets
- [FILL: Member 1 name — role, e.g. design & direction]
- [FILL: Member 2 name — role, e.g. engineering & AI workflow]
- Play now: ming3465.github.io/Tencent-Hackathon-9Aug
- Code: github.com/ming3465/Tencent-Hackathon-9Aug — public
- Phaser 3, Vite, TypeScript; three AI agents, human-directed
- [FILL: contact email — do not guess one]

> **Do not write "Built with CodeBuddy, Phaser 3, Vite, TypeScript."** That single line is banned by this
> pack's own honesty rules: it reads as "CodeBuddy built the game", and CodeBuddy authored only the ten
> pre-pivot files. Essentially all shipping sandbox code came from later agents. Phaser 3, Vite and
> TypeScript are the stack; CodeBuddy, OpenCode and Claude Code are tools that wrote different parts of
> it. Keep those two facts in two separate lines, and put the breakdown on slide 5.

### Speaker note (~20s)
> We are TheTwoGuys. Everything you have seen is in the repository, including the prompts we used, the
> AI usage log with the failed run written into it, and the guardrails we set before we started.
> Kampung SG is playable right now in any browser, with no install and no account. Thank you — and
> every small act grows the kampung.

### Credits and licences block to print small on the slide
- **Engine:** Phaser 3 (MIT). **Build:** Vite, TypeScript, Vitest (MIT).
- **Audio:** synthesised at runtime with the Web Audio API. No third-party audio files, no licence obligations.
- **Art:** [PLACEHOLDER: "Procedural Phaser geometry, authored by the team" OR "Procedural geometry plus
  N assets generated with Miora" — state exactly what shipped]
- **Ageing statistic:** official "AI CAN DO IT" — "Age Well" Social Good Challenge Singapore hackathon brief.
- **AI assistance:** CodeBuddy CLI 2.127.0 and AI coding agents under human direction; full record in
  `docs/AI_USAGE_LOG.md`.
- Kampung SG is an original work. It does not copy any existing game's art, characters, maps, or branding.

### Visual
Two team cards with [PLACEHOLDER: photo or initial avatar] and role. Large QR code to the live game —
judges scan it on their phone from their seat, which is exactly the behaviour you want. Repeat the URL
as text under the QR in case the code scans badly on a projector.

---

## Appendix — export checklist

- [ ] Every `[PLACEHOLDER: ...]` filled or its bullet deleted. **Search the exported file for the word
      "PLACEHOLDER" before submitting.**
- [ ] Numbers re-verified against `npm test` / `npm run build` / `npm audit` on the final commit.
- [ ] Live URL opened in a private window on a phone, not just on the build machine.
- [ ] Miora / CodeBuddy claims match what actually ran — cross-check `docs/AI_USAGE_LOG.md`.
- [ ] Filenames exactly `Kampung SG-Project Introduction Deck-TheTwoGuys.pptx` / `.pdf`.
- [ ] Speaker notes pasted into the PowerPoint notes pane for every slide.
- [ ] Deck opened once in the installed PowerPoint to confirm it renders before submitting.
