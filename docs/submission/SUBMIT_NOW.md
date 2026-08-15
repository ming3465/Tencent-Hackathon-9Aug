# Kampung SG — Submission Runbook (TheTwoGuys)

> **Status as of 2026-08-05.** The submission form is NOT yet released — the
> organisers delayed it on credit issues and will announce it in Discord.
> Working assumption: the window opens on short notice and closes around
> **Aug 7–8**; finalists ~Aug 7±, Singapore Demo Day ~Aug 16. **Be
> submission-ready by Aug 5.** This file is the single checklist for that
> window. Strategy lives in `docs/WINNING_PLAYBOOK.md`; outstanding product
> work in `docs/IMPROVEMENTS.md`.

## ⏰ Daily until the form drops (5 min/day)

- [ ] Check Discord (`discord.gg/5aE7nB78K`) and email for the form.
- [ ] Check the portal `tch.cloud.tencent.com` — the 赛事资料 section has a
      downloadable Game Development Challenge handbook with the full fine
      print. **Fetch it the day it appears; read the IP/T&C terms.**
- [ ] The moment the form drops: screenshot it, read every required field,
      confirm the real deadline and timezone, and tell the AI agent so the
      checklist below can be re-verified against the actual fields.

## Deliverable status

| # | Required | Status |
| --- | --- | --- |
| 1 | **Game Web Link** | ⚠️ https://ming3465.github.io/Tencent-Hackathon-9Aug/ is live, but this latest local loader/touch/consequence-art pass was not pushed or deployed. After explicit release approval, deploy and verify both the full route and `?demo=1` logged out (see `docs/DEMO_MODE.md`). |
| 2 | **Project Introduction Deck (PPT)** | ✅ `docs/deck/Kampung SG-Project Introduction Deck-TheTwoGuys.pptx` + `.pdf`, refreshed for the five-part campaign and KampungMind. Re-export after any later count or screenshot change. |
| 3 | **Game Demo Video** | ⚠️ **CURRENT-BUILD REFRESH AND HUMAN FINISHING REMAIN.** The preserved artifact set contains 63.1 s of indexed silent B-roll plus a reproducible, open-captioned **90.0 s narration-ready review cut** at `docs/video/kampung-sg-demo-review.mp4`. Those durations remain valid historical artifact facts, but the footage predates the registry-driven three-quarter world, 22 DoorViews, corrected choice-specific shelters, Pause/Settings, Phaser.AUTO renderer gate, and 90-test build. It is **not current-build footage**. Its exact 14-beat sources and claim boundaries are in `demo-review-beats.json`; regenerate with `npm run compose:video` after recapturing affected shots or explicitly comparing and approving unchanged sources. The AI-receipts montage, engineering/integrity cards, and QR end slate are already present. **Still required:** current terminal/gameplay evidence, human voice-over, an ear-checked sound mix, final approval, rename to `Kampung SG-Game Demo Video-TheTwoGuys.mp4`, upload, and logged-out link check. The checked-in MP4 is not the final submission video. |
| + | Social bonus (+5) | ❌ Copy ready in `docs/submission/SOCIAL_POST.md`. Confirmed hashtags: `#CodeBuddy #腾讯云黑客松` (+ event tags) on Xiaohongshu / YouTube / X. Post before submission, screenshot each. |

## Fail-closed backup package

Rehearse the package now without creating a final-looking video:

```bash
npm run submission:review
```

This writes an ignored folder and ZIP under `artifacts/`. The silent cut is
named `REVIEW ONLY - ...`, and the manifest remains `submissionReady: false`.
It checks both public game routes, the eight-slide PPTX, eight-page PDF,
90-second H.264/AAC review cut, hashes, filenames, provenance, and outstanding
score risks.

For the final backup, first copy
`docs/submission/FINAL_APPROVALS.example.json` to the ignored
`docs/submission/FINAL_APPROVALS.json` and complete it only after the named
human checks occur. Then run:

```bash
npm run submission:final -- \
  --video "/path/Kampung SG-Game Demo Video-TheTwoGuys.mp4" \
  --codebuddy-history "/path/codebuddy-history.pdf" \
  --approvals "docs/submission/FINAL_APPROVALS.json"
```

Final mode refuses a renamed silent review cut, missing/audibly silent media,
unchecked public links, incomplete approvals, missing CodeBuddy history, a
dirty or unsynchronized commit, or a failing full verification gate. Miora,
playtest, real-device/accessibility, second-CodeBuddy-pass, and social evidence
remain explicit scoring risks rather than being fabricated as submission
requirements.

## USER actions before the window (owner: you two)

| # | Action | Time | Notes |
| --- | --- | --- | --- |
| U1 | **One genuine CodeBuddy pass + export the chat history.** | 1–2 h | The published mainland rules list CodeBuddy chat history as a submission artifact; our only artifact today is the documented *failure*. The age-signalling task has now shipped, so choose a genuinely open, tightly scoped Todo Tencent item rather than rerunning `docs/prompts/codebuddy-age-signal.txt`. Keep the failure log too — the story is "what worked, what didn't, both documented". |
| U2 | **Refresh and finish the demo video** (historical captioned review cut ready). | 1–2 h | Start from `docs/video/kampung-sg-demo-review.mp4` as an edit reference, not current-build proof. Recapture the loader/touch/consequence and 154-test terminal evidence, or explicitly compare and approve each unchanged source. The open captions, AI receipts, integrity card, and QR end slate are already assembled. Record the human voice-over, add and verify the final sound mix by ear, confirm every spoken line still matches its open caption, obtain team approval, export with the required filename, and upload early. **Do not describe the machine-captured clips as a played session or a real-device touch test.** |
| U3 | **Playtest with 3–5 real older adults** (a grandparent counts). | half day | Consent script in `docs/PLAYTEST_PROTOCOL.md`. Capture: short quotes, one photo (with consent), one design change made from feedback. Quotes about fun/recognition only — never anything medical. |
| U4 | **Miora key art** (miora.design, 1,000 free credits on signup). | 1 h | Still Miora-specific and still open. Four auditable OpenAI visual workflows now cover three human-curated code translations and one reviewed playable title asset; none is Miora. Use the prepared Miora prompt for poster/social/deck output and log the real run. Feeds U5. |
| U5 | **Social posts** on all three platforms with the confirmed hashtags. | 1 h | Before submission. While there, spend 15 min scanning the hashtags for rival entries — free competitor intel. |
| U6 | **EdgeOne deploy** (optional but Shenzhen-proofing). | 1–2 h | `edgeone login -s global` then deploy `dist` with **`-a overseas`** (never the default `global` — its free URL 401s after 3 h). Keep GitHub Pages as fallback; print both URLs. |
| U7 | **Submit early**, verify every link logged-out, save the confirmation. | 1 h | File names must follow `[Kampung SG]-[Deliverable]-[TheTwoGuys]`. |

## AI-agent actions before the window

- [x] Capture clean gameplay B-roll and generate the reproducible 90-second
      captioned earlier-build review cut with source provenance and claim
      boundaries.
- [ ] Refresh or explicitly approve the gameplay and terminal sources against
      the latest three-quarter world, DoorView, Pause/Settings, renderer, and
      90-test build.
- [x] Add a fail-closed review/final backup builder with exact filenames,
      media/deck/link/hash checks, an untracked human-approval record, and
      explicit scoring-risk warnings.
- [x] Refresh the deck/PDF for the 2026-08-04 implementation drift; repeat the
      fail-closed re-export on submission day if any source or metric changes.
- [ ] Add playtest evidence slide once U3 happens (quotes + the one change).
- [ ] Add the "rules verbatim" AI-compliance line to the deck if not already
      present after the handbook is read (see playbook §2 action 9).
- [x] Complete the judge-path interaction-density and elder-led scam-awareness
      pass: 14 approach details, five ambient activities, Minah's mandatory
      check-before-you-act beat, and its persistent shop-window card now ship.
      The optional keepsake-table rehome and proximity bubbles are not claimed.

## Final re-verification (run on submission day, before export)

```bash
npm run typecheck && npm test && npm run build && npm audit && npm run smoke
```

Then grep the deck source and submission docs for stale numbers (test count,
smoke-check count, bundle size), recapture all eight HTML slides, and re-export
through the existing-deck Presentations workflow:

```bash
node scripts/capture-deck.mjs
# Import the existing PPTX with artifact-tool, replace only its eight inherited
# full-frame images, preserve notes/layout/master, and run template fidelity +
# overflow + full-slide render checks. scripts/build-pptx.py is legacy only.
# Rebuild the raster PDF and render all eight pages with Poppler for inspection.
```

Current truth as of 2026-08-15: **207/207 tests (40 campaign · 25 llm-voice · 31 match ·
25 player identity · 17 audio · 17 carry errands · 13 material shading ·
11 world/door/pause · 10 isometric world · 10 story auto-start · 4 optional
portraits · 4 accessibility) · strict TypeScript clean · 0 known
vulnerabilities**. Latest measured production build: **HTML 112.77 kB
(20.97 kB gzip) · initial JS 135.67 kB (42.40 kB gzip) · lazy campaign scene
91.89 kB (28.97 kB gzip) · lazy art chunk 1,558.00 kB (361.26 kB gzip)**.
If those numbers appear anywhere as something else, fix before submitting.

**Browser checks: 72/72 proven on 2026-08-15 — but budget several attempts,
and run it yourself on the presenting machine.** Seven runs that day: five
aborted on Chrome DevTools Protocol timeouts (13, 18, 27, 32 and 40 checks in),
one reached 71/72 on a motion-sampling assertion, and one passed 72/72 — with
no code change between any of them. The machine was never actually quiet: an
unrelated game process held a full core for three days and a VM a third of
another, on eight cores. **Quit those first.** The pass is real, but a laptop
in that state completes the suite about one run in seven, so do not leave this
until the morning of the pitch if you need a terminal shot of it. Before you quote the figure on stage, quit anything eating a core
and run `npm run smoke` to completion.

## Claim boundaries (unchanged, non-negotiable)

No medical/cognitive/dementia claims. No invented playtests, users, metrics, or
AI-tool runs. Demo mode is a pacing device — never claim the full game is
3 minutes. Automated touch checks do not equal a real-device pass, and the
checked-in review cut does not represent the latest build. The CodeBuddy
failure stays documented; honesty is the strategy.
