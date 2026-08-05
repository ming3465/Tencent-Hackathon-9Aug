# Kampung SG — Winning Playbook

> Compiled 2026-08-01 from a six-lens web research sweep (jam-winner
> post-mortems, this competition's ecosystem and published rules, ageing-games
> prior art, cozy-game craft, demo-video research, infrastructure) plus an
> adversarial critic pass. For any agent picking up work: read this AND
> docs/IMPROVEMENTS.md before proposing changes. Constraints in
> IMPROVEMENTS.md override anything here.

TheTwoGuys | Tencent Cloud "AI CAN DO IT" Age Well Social Good Challenge, Game Track | Final week

---

## 1. THE THESIS

The finalist cut (~Aug 7) will be decided almost entirely by our video and deck, so the 90-second video is the real submission and everything this week serves it. Our path to top-5 is to be the one team whose entry maps verbatim onto the published rules — "AI creation in at least one area: worldbuilding/narrative, artwork, security systems, or sound design" is satisfied by our creation-time AI story, and 适老化关怀 (elderly care) is a *named sub-theme* of the Social Good track — and to say both out loud on screen. Our path from top-5 to winning the track is dignity-plus-proof: the "elders as experts, not patients" thesis is literally Tencent IEG Social Value Exploration Center's own published frame, and 3–5 real older-adult playtests would convert our biggest audited weakness into strong Impact-30 evidence. On stage Aug 16, our zero-backend runtime has no model or gameplay-network dependency after its assets load. The lazy loader has recoverable slow, cancel, and retry paths, but real-device startup and human play remain unverified. Ship order: fix the judge path, record the video, get playtest receipts, and let polish stop at "the first 120 seconds are perfect," because the first 120 seconds are the judging.

**Current verified engineering snapshot (2026-08-05):** 90/90 tests (30
campaign, 31 match, 17 audio, 4 accessibility, 8 world/door/pause), 60/60
production-browser checks in default WebGL and forced Canvas fallback, and a
production build of HTML 93.04 kB (16.28 kB gzip), initial JS 135.02 kB
(39.95 kB gzip), and lazy campaign scene 1,602.10 kB (374.15 kB gzip). The
checked-in 90-second review cut predates the registry-driven world, DoorViews,
corrected shelters, Pause/Settings, and renderer-parity gate; it
is not current-build footage.

---

## 2. TOP 10 ACTIONS (ranked by odds moved ÷ hours spent)

**1. Fetch the official handbook and stand a daily watch. (30 min + 5 min/day)**
What: Download the Game Development Challenge handbook from tch.cloud.tencent.com (赛事资料), read the T&C/IP terms, and check the portal + SMU AI Club channels daily; be submission-ready by Aug 5.
Why: Timeline claims are soft, the form will drop on short notice, and the mainland rules require artifacts (CodeBuddy chat history) we must not discover at the deadline (Critic §A5, §B12).
Must not break: nothing — pure insurance against the only catastrophic failure mode: missing the window.

**2. Build the judge path: demo spawn + 2-of-3 ending, behind `?demo=1`. (3–5 h)**
What: Start beside the Voice in Y’s flat, use the first usable door, and keep
every chapter in `?demo=1`; only the helper/invitation thresholds compress from
3/5 to 2/2 and walking speed increases. The judge sees the same story and
consequences as the full campaign.
Why: Judges' engagement window is 3–10 min and the hook must land in 30–60 s (Defold, StraySpark); the 6–8 min walking-heavy arc is our documented killer (Craft memo Tier 1).
Must not break: the public build (query-param gated), all 90 unit tests, the
60-check production-browser smoke suite. Run the repository's complete
verification gate after any change.

**3. Record the 90-second video (beat sheet in §4). (1 day, after #2 and #5)**
What: Shoot deliberately, shot by shot, on the improved build; upload to YouTube early ("Not for Kids"), keep a local MP4, add an unlisted Bilibili mirror for Shenzhen reachability. Do not relabel the checked-in review cut as current: recapture the loader/touch/consequence shots and current terminal gate, or compare and explicitly approve any unchanged source shot.
Why: The video is the primary shortlisting filter (Devpost judge panel; MLH "demo not presentation"); it is also a required submission artifact in the only published rules (SUES notice).
Must not break: honest-evidence rule — no footage of anything not in the shipped build; every claim checkable against the repo.

**4. One genuine CodeBuddy pass + Miora key art, this week. (3–4 h)**
What: Use CodeBuddy for one genuinely open, tightly scoped Todo Tencent task
and export the chat history; do not rerun the completed demo-mode or
age-signalling work. Generate poster/key-art/social assets with Miora
(miora.design, 1,000 free credits).
Why: CodeBuddy chat history is a required submission artifact in the mainland rules, and a *failure log as our only artifact* is actively risky before Tencent Cloud judges whose event exists to showcase CodeBuddy — May's PR was wall-to-wall CodeBuddy praise (Ecosystem memo §B2, Critic §B8).
Must not break: the honesty story. Keep the documented failure; the narrative becomes "what worked, what didn't, both documented" — verification-minded judges reward exactly this (Devfolio, Money Forward).

Current progress: four genuine OpenAI image-generation workflows now provide
an auditable neighbourhood style key, targeted estate-density study, reviewed
cast silhouette/gait study, and production title panorama. Exact prompts,
source references, artifacts, human review, and curated code-drawn or runtime
results are preserved. The cast study informed stepped anatomy and authored
outfit variation while costume-like treatments were rejected. The title
workflow includes a rejected pseudo-writing pass, constrained cleanup, hashes,
optimization, and playable integration. This strengthens cross-tool visual
evidence but is not Miora; the Miora-specific action remains open.

**5. Age-signal the cast. (completed 2026-08-04)**
What shipped: twelve authored code-drawn resident profiles with three builds,
five hair silhouettes, five outfit grammars, glasses/canes/aprons, carried
totes, connected limbs, grounded four-phase walks, turn-to-face behavior, and
one synchronized contact shadow each. A reviewed OpenAI silhouette study
informed the stepped anatomy; costume-like treatments were rejected.
Why: In a 120-second judging window the cast must visibly BE older adults or Impact-30 doesn't land (Memo 1 §5); shared silhouettes violate the Gerontoludic "Heterogeneity" principle we cite; 94% of older game characters are male — one female elder is a citable differentiator (Prior-art memo §5.2).
Must not break: dignity — props, never punchlines; smoke suite; consistent art
direction and truthful provenance for any generated asset.

**6. Playtest with 3–5 real older adults before Aug 5. (half day + scheduling)**
What: A grandparent counts. Capture short quotes, one photo (with consent), and one design change made because of feedback. One slide, one 3-second video insert.
Why: Stakeholder validation and measurable-impact evidence is the top-ranked social-impact rubric item (Games for Change; Colosseum: validated teams score higher), and Tencent's own elderly work leads with evidence — this speaks the co-host's language (Ecosystem memo §B4).
Must not break: no-medical-claims rule. Quotes about recognition, fun, and place ("that's my void deck") — never "helped my memory." Say "designed in line with published findings," never "shown to."

**7. Density + coherence pass on the map. (core judge-path pass completed 2026-08-04)**
What: 12–15 zero-consequence one-liner interactions near the judge path (laundry poles, void-deck cat, kopitiam kettle, mahjong table); proximity speech bubbles from the 5 ambient neighbours; rehome the memory-match as an opt-in void-deck table game ("Auntie waves you over"); add ONE scam-awareness dialogue beat where an elder *teaches the player* to spot a scam.
Why: "Emptiness is fixed by interaction density, not geometry" (Wholesome Games / A Short Hike postmortem); rehoming kills the "recycled feature" incoherence for zero new code; the scam beat touches "game security systems" (a named qualifying AI area), rhymes with May's winner Auntie AI, and delivers the "elder SOLVING something" moment the critique literature demands.
Must not break: no failure state (the table game must be unloseable-cozy), tests, and the demo path length (density goes *on* the judge path, not beyond it).
What shipped: 14 approach-only details, five ambient community activities, and
one mandatory Minah beat in which she models a separate-channel check and asks
the player only how to present the habit. Both large-print layouts advance and
leave a persistent shop-window card. Proximity speech bubbles and rehoming the
optional keepsake table remain optional follow-ups, not shipped claims.
The visible consequence pass also ships authored code-drawn three-quarter
ramps outside and inside Mr. Long's flat, two garden-choice treatments, and a
sheltered linkway. These are runtime vector/code art, not Miora assets.

**8. EdgeOne Pages deploy + smoke the deployed URL. (1–2 h)**
What: `npx edgeone pages deploy dist -n kampung-sg -t <token>`; then `node scripts/browser-smoke.mjs --url <edgeone-url>` and preserve the 60/60 result.
Why: Tencent ecosystem alignment, Singapore edge node for Singapore judges, and GitHub Pages is throttled in mainland China — Shenzhen-proofing (Infra memo §1). "Our CI plays the *deployed* game" is a killer Quality-30 slide.
Must not break: keep GitHub Pages live as fallback; print both URLs everywhere.

**9. Rubric-map the deck with the rules' exact words. (2–3 h)**
What: AI slide quotes the official requirement verbatim and checks off worldbuilding + artwork + sound; one line: "Elderly care (适老化关怀) is a named sub-theme of the official Social Good track"; Impact slide opens with 1-in-4 Singaporeans 65+ by 2030 and cites the official brief; Quality slide: 90/90 tests / 60/60 CDP checks / 0 vulnerabilities, with the latest build figures—HTML 93.04/16.28 kB gzip, initial JS 135.02/39.95 kB gzip, and lazy scene 1,602.10/374.15 kB gzip.
Why: Winners visibly game the rubric and balance all criteria (Square, Klaviyo method); the verbatim-compliance line pre-empts the "no runtime LLM = no AI" misread, which is our single biggest scoring risk on a 40-point criterion (Critic §A4).
Must not break: citation honesty — every number sourced, "aligned with," never "partnered with" Age Well SG.

**10. Social posts + 15-minute competitor scan. (1 h)**
What: Post on Xiaohongshu, YouTube, and X with #CodeBuddy #腾讯云黑客松 + event tags, from a screenshottable account, before submission; while there, scan the hashtags for rival SEA entries.
Why: The cheapest 5 points in the rubric, and the hashtag feed is free live competitor intel nobody has checked (Critic §B7, §B9). Use the Miora key art from #4.
Must not break: nothing. Do it before locking the video in case the scan changes positioning.

**Remaining build order for the week:** 1 → 2 → 4 → 3 (video) → 6 (parallel,
scheduling-bound) → 8 → 9 → 10. Actions 5 and the core judge-path portion of
7 are complete; the genuine CodeBuddy pass in action 4 remains open and must
use a different scoped task. Action 7's keepsake-table/proximity follow-ups are
optional and must not displace submission work.

---

## 3. THE DEMO DAY PLAN (Aug 16)

Format assumption: stage roadshow, 3 min pitch + Q&A, seated judges, press present (May's format; NOT booth judging). Rehearse to a hard 3:00 — exact timing signals seriousness.

**Structure and roles** (Speaker A = narrative/impact voice; Speaker B = drives the game and owns the tech story):

- **0:00–0:20 — A, cold open, no thank-yous.** "By 2030, one in four Singaporeans will be over 65, and 122,000 will live alone. Every product built for them treats them as patients. We built the opposite." Screen: golden-hour wide shot, live build already running.
- **0:20–0:50 — A, problem + thesis.** Why "seniors as patients" products fail (deficit framing, the 7%-representation stat); Kampung SG's inversion: the elders are the community's problem-solvers. Screen: B walks toward the first resident.
- **0:50–2:00 — B drives, A narrates.** Scripted 60–70 s golden path on `?demo=1`: meet resident → dialogue choice → *visible world consequence* → the scam-awareness beat (elder solves what the player can't) → Bus Stop → golden-hour close. B drives from beside the screen; judges never fumble controls mid-pitch.
- **2:00–2:35 — B, AI story, numbers first.** “KampungMind turns reviewed AI-authored personalities into an offline deterministic NPC system. Seventy-nine tests and a zero-dependency CDP harness make sixty assertions across the full and demo campaigns. Here is the CodeBuddy run that failed, because our submission is auditable.” Screen: KampungMind content/reducer, test run, and AI log.
- **2:35–3:00 — A, power-of-three close.** "Elders as experts. Choices that reshape the estate. An AI process you can audit. Kampung SG — play it right now at [URL]." Screen: QR + both URLs.

**Fallback ladder:** (1) EdgeOne live build (Singapore edge node); (2) GitHub Pages; (3) local `npm run preview` on our laptop, pre-warmed; (4) the final current-build MP4, loaded locally and cued. The checked-in review MP4 is not that final fallback until its footage and terminal card are refreshed or explicitly re-approved against the current build. Bring a second device with the game open for judges to grab during Q&A only after that device has actually been tested.

**Q&A prep — acknowledge, never defend:** Playtesting → until sessions occur, say “No human playtest has occurred yet; automated checks are not social evidence.” If sessions happen, state only the actual count and documented change. Pacing → do not state a full-loop duration until a human run is timed; say only that `?demo=1` reduces thresholds for judge pacing. No runtime LLM → deliver the §5 line. No timer/failure → "Deliberate: Oxford's Animal Crossing findings and the Gerontoludic Manifesto — growth over decline."

---

## 4. VIDEO BEAT SHEET (final, 90 s)

Keep 90 s total. Burn open captions on every shot (most judges watch muted); mix game SFX under VO — the synthesized audio is a provable claim. No logos, no team intro up front.

- **0–5 s — Cold open:** golden-hour wide shot, estate alive. Caption: "Kampung SG — a cozy Singapore sandbox where seniors are the experts, not the patients."
- **5–15 s — Genre → hook:** walk into a resident conversation (genre), immediately a dialogue choice and the world visibly responding (hook). Caption the thesis.
- **15–48 s — Three resident beats:** title card → 6–8 s interaction → visible consequence, per resident. Jump-cut ALL traversal. Vary locations and framing hard (silhouette-repetition defense). Include the scam beat as one of the three. No memory-match.
- **48–60 s — Payoff:** calm weaving → Last Door → gathered residents and free exploration. Card: “No timer. No failure state. No medical claims.”
- **60–82 s — AI receipts montage, dense:** KampungMind personality/intents → pure reducer/save → current terminal shot of 90/90 tests + 60/60 CDP checks → honest card: “What worked, what did not — every run documented.”
- **82–90 s — End slate, 8–10 s (not 4):** title, play-now URL + QR, team, event hashtags, one-line vision.

**Deviation from the old 64/22/4 script:** restructure gameplay from "a playthrough" to Genre→Hook→Beats→Payoff; extend the close to 8–10 s; do NOT lengthen the AI segment — instead caption AI evidence *during* gameplay beats ("AI-generated visual target → human-curated code-drawn activity scenes") so effective AI coverage reaches ~35–40 s while Impact+Quality footage still dominates.

---

## 5. COMPETITOR POSITIONING

When the team before us just demoed a live-LLM NPC:

**"An AI companion that can hallucinate, lag, or leak at a lonely senior isn't social good — so we put the AI where the rules ask for it, in creation: it built our world, our characters, and our art, while the shipped campaign runs without a live model or gameplay-network call."**

Delivery note: say it once, warmly, in the close or Q&A — never as an attack on the other team by name.

---

## 6. WHAT TO IGNORE

- **The MLH 4-minute booth model.** This station is a stage roadshow. Plan for one pitch to seated judges, not science-fair circulation.
- **Preparing for a 48-hour Shenzhen rebuild.** The Grand Final is a pitch of existing work. Light CodeBuddy fluency is contingency; deep fluency is wasted hours.
- **Retrofitting a runtime LLM.** Creation-time AI qualifies verbatim under the published rules; mainland winners had our exact shape. The fix is captioning, not architecture.
- **More navigation chrome.** The shipped circular map is code-drawn, small,
  and directly connected to Places; do not add objective arrows, waypoint
  trails, notification pings, or another map layer.
- **Cutting the memory-match.** Rehoming beats deleting: as an opt-in void-deck table game it becomes a cozy-design asset for zero new code.
- **Shortening the full game.** 6–8 min is on-target for the actual audience ("one cup of kopi long"). Only the *judge path* needs compression.
- **Sprint buttons, objective arrows, timers, notification pings.** Horseshoe cozy anti-patterns; our no-timer/no-failure design is the pitch — don't let judging pressure corrupt it.
- **PWA/service worker, custom domain, CDN tuning, Playwright migration, any backend.** Zero-dependency and no-backend ARE the story. PWA only if literally everything above ships first.
- **Making health, cognitive, or "training" claims of any kind** — even when a judge invites one. "Consistent with published findings," full stop.
- **More map geometry.** The empty-district problem is interaction density, not size. No new districts, ever, this week.

*— end of playbook (~2,300 words)*
---

## Appendix: critic's corrections and source list

MEMO: Completeness critique — gaps, corrections, and re-verifications (with fresh checks run today)

== A. CORRECTIONS — things a memo asserts that are wrong or overconfident ==

1. **Shenzhen Grand Final is a pitch/roadshow, NOT a 48-hour rebuild.** Memo B (inference, "what your Shenzhen final will resemble: 48-hour hackathon") is contradicted by the published mainland rules: regional winners are "invited to the grand finals at the 2026 Tencent Global Digital Ecosystem Summit" — structured as pitches of the existing work. The 2025 48h event was a *different* competition (AI-for-good, not the game track). Forward-compatibility therefore means: bilingual-capable deck, mainland-reachable deploy (EdgeOne — the infra memo's #1 call is validated), and a locally-playable + mainland-viewable video (YouTube is blocked in mainland; keep an MP4 and consider an unlisted Bilibili mirror). Keep light CodeBuddy fluency as contingency only.

2. **The MLH "4-minute science-fair" framing (Memo 1, point 1) is probably the wrong format model.** The May Singapore station final was a stage roadshow — top 10 pitching to seated judges with press. Memos 2 and 5 already assume stage format; resolve the internal inconsistency toward stage pitch (3–5 min + Q&A), and stop planning for booth-walking judges.

3. **Prize pool is paid in Tencent Cloud tokens/credits, not cash.** Chinese-language coverage is explicit: "总值达数百万港元的词元（Token）奖金池" — a token prize pool valued in millions of HKD, top single award ~100k HKD *in tokens*. Memos say "millions HKD" unqualified. Doesn't change strategy, but manage expectations and note it confirms how hard Tencent wants ecosystem usage demonstrated.

4. **The "no runtime LLM = AI-score risk" worry is overstated against the letter of the rules — use this.** The official notice requires "AI creation in at least ONE area: worldbuilding/narrative, game artwork, security systems, or sound design." Creation-time AI explicitly qualifies. Mainland campus winners (e.g., BCU's "Silk Road Trading Post") won with exactly our shape: CodeBuddy for code + DeepSeek for worldbuilding + Doubao for art/music — no runtime LLM mentioned. Put the rule's exact wording on the AI slide and claim compliance verbatim. The residual risk is a naive judge equating runtime LLM = intelligence; the video captions must literally say "AI-built worldbuilding and NPCs."

5. **Timeline claims are soft.** "Finalists ~Aug 7 / top 5 per track" has no public source (the Singapore station still has no indexed page — I re-checked today). Mainland pattern is top-10 credits / top-3 advance. Treat Aug 7 as ±, be submission-ready by ~Aug 5, and expect a short-notice window when the delayed form drops.

== B. GAPS THE SWEEP MISSED ==

6. **No competitor profile for THIS station.** Reasoned forecast for a Singapore "Age Well" game track: (a) LLM-chat "talk to an AI grandma/companion" demos — they'll claim "intelligent NPCs" literally, likely via Hunyuan/OpenAI; (b) Miora/CodeBuddy asset-showcase games; (c) utility-in-game-clothing (the May winner Auntie AI was anti-scam utility). Counter-positioning to prepare: "an NPC that can hallucinate at a lonely senior is not social good — our world is authored, consequence-driven, and can never lie, lag, or leak" + zero-latency live demo reliability on stage while LLM demos stall on venue Wi-Fi. This one paragraph belongs in the pitch's Q&A prep and nobody wrote it.

7. **Live competitor intel is available right now and unchecked.** The confirmed bonus hashtags (#CodeBuddy #腾讯云黑客松, on Xiaohongshu/YouTube/X per the SUES notice) are a searchable feed of rival entries. A 15-minute scan of those hashtags would show what other SEA teams are posting. Do it before locking the video.

8. **CodeBuddy chat history is a required submission artifact in the only published rules — and we have a *failure* log.** No memo converted this into a deadlined action. Do one genuine CodeBuddy pass this week on a real task (e.g., a Tier-1 craft item from the design memo) so there is a substantive, exportable chat history. Similarly, Miora is confirmed internationally live (miora.design, public since Jul 22, 1,000 free credits on signup) — the "consider Miora" hedge should become: generate the key art/poster/social assets with it, which also feeds the +5 posts.

9. **Social bonus mechanics — now partially confirmed, but unowned.** Platforms and hashtags are published (see above); point value and whether posts stack across platforms are not. Cheap play: post on all three platforms with both hashtags plus event-name tags, from an account you can screenshot, BEFORE submission. Nobody assigned this.

10. **Rules fine print — residual risks to watch on the form.** Team size 1–3 per official notice (a 5-person mainland team won anyway, so enforcement is loose — our 2 is safe). Eligibility: "open to all creators" / May's winner was a working professional, so student status is likely not required, but unverified for the SMU-run station. IP terms: no published assignment/license text found anywhere — read the form T&C on release; our "zero external assets, all code-drawn" story is also an IP-cleanliness asset, say so. No rule found requiring the game be built inside a competition window — the "recycled project" concern is judge-perception only, not compliance. Deployment example in the rules is Cloud Studio (Tencent) — EdgeOne signals the same ecosystem alignment.

11. **The "elderly care is a named sub-theme" finding is not yet operationalized in the deck.** 适老化关怀 is literally a listed Little Red Flower/Social Good sub-theme. One deck line — "our theme is a named sub-theme of the official Social Good track" — remains the cheapest open legitimacy claim. The related one-hour elder-led scam-awareness beat is no longer open: it shipped on 2026-08-04 with official-source guardrails, two no-failure presentation choices, and a persistent shop-window consequence.

12. **No monitoring plan for the delayed form.** The official portal (tch.cloud.tencent.com) lists all live challenges and a downloadable Game Development Challenge handbook (赛事资料 section) that likely contains the full fine print — nobody has fetched the handbook or set a daily check of the portal + SMU AI Club channels. Highest-value single follow-up: get that handbook.

== C. VERDICT ON THE SWEEP ==
The craft/video/infra memos survive scrutiny well; citations I spot-checked (MLH, Gerontoludic Manifesto, Chua et al. 2013, Johannes/Przybylski 2021, Age Well SG figures) are real and used within bounds. The two genuinely wrong notes are the 48h-final inference and the booth-judging model; the two most consequential omissions are the missing CodeBuddy-history action plan and the absence of any competitor scan despite a public hashtag feed that makes one possible today.

Sources: [SUES official rules notice](https://www.sues.edu.cn/86/1e/c26790a296478/page.htm) | [Tencent Cloud hackathon portal](https://tch.cloud.tencent.com/) | [BCU winning-team writeup (North China regional)](https://www.bcu.edu.cn/xxxb_wpx/info/1118/2483.htm) | [PRNewswire launch (zh) — token prize pool, five regions](https://www.prnewswire.com/apac/zh/news-releases/ai-can-do-it--302745677.html) | [May Singapore station results](https://www.prnewswire.com/apac/news-releases/ai-for-good-tencent-cloud-empowers-youths-to-build-what-matters-at-the-ai-coding-challenge-in-singapore-302770519.html) | [Miora international rollout](https://ftp.kr-asia.com/pulses/162291) | [Miora public launch](https://pandaily.com/tencent-miora-design-agent-jul2026) | [Hunyuan GameCraft / NPC tooling](https://nextomoro.com/hunyuan/) | [GameRes on 2026 Tencent game competitions](https://www.gameres.com/917308.html)
