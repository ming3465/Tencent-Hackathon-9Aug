# Kampung SG — Submission Runbook (TheTwoGuys)

> **Status as of 2026-08-04.** The submission form is NOT yet released — the
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
| 1 | **Game Web Link** | ✅ https://ming3465.github.io/Tencent-Hackathon-9Aug/ — auto-deploys from `main`. Judge path: append `?demo=1` (see `docs/DEMO_MODE.md`). |
| 2 | **Project Introduction Deck (PPT)** | ✅ `docs/deck/Kampung SG-Project Introduction Deck-TheTwoGuys.pptx` + `.pdf`, refreshed for the five-part campaign and KampungMind. Re-export after any later count or screenshot change. |
| 3 | **Game Demo Video** | ❌ **NOT RECORDED — the critical item.** Beat sheet: `docs/WINNING_PLAYBOOK.md` §4. Shoot on `?demo=1`. Name it `Kampung SG-Game Demo Video-TheTwoGuys.mp4`. |
| + | Social bonus (+5) | ❌ Copy ready in `docs/submission/SOCIAL_POST.md`. Confirmed hashtags: `#CodeBuddy #腾讯云黑客松` (+ event tags) on Xiaohongshu / YouTube / X. Post before submission, screenshot each. |

## USER actions before the window (owner: you two)

| # | Action | Time | Notes |
| --- | --- | --- | --- |
| U1 | **One genuine CodeBuddy pass + export the chat history.** | 1–2 h | The published mainland rules list CodeBuddy chat history as a submission artifact; our only artifact today is the documented *failure*. Use the ready-made prompt in `docs/prompts/codebuddy-age-signal.txt` (age-signalling task). Keep the failure log too — the story is "what worked, what didn't, both documented". |
| U2 | **Record the demo video** on `?demo=1`. | ~1 day | Beat sheet in the playbook §4: cold open on golden hour, three resident beats, AI-receipts montage quoting the rules verbatim, 8–10 s end slate with QR. Keep a local MP4; upload YouTube early; consider an unlisted Bilibili mirror. |
| U3 | **Playtest with 3–5 real older adults** (a grandparent counts). | half day | Consent script in `docs/PLAYTEST_PROTOCOL.md`. Capture: short quotes, one photo (with consent), one design change made from feedback. Quotes about fun/recognition only — never anything medical. |
| U4 | **Miora key art** (miora.design, 1,000 free credits on signup). | 1 h | Still Miora-specific and still open. Three auditable OpenAI visual workflows now cover two human-curated code translations and one reviewed playable title asset; none is Miora. Use the prepared Miora prompt for poster/social/deck output and log the real run. Feeds U5. |
| U5 | **Social posts** on all three platforms with the confirmed hashtags. | 1 h | Before submission. While there, spend 15 min scanning the hashtags for rival entries — free competitor intel. |
| U6 | **EdgeOne deploy** (optional but Shenzhen-proofing). | 1–2 h | `edgeone login -s global` then deploy `dist` with **`-a overseas`** (never the default `global` — its free URL 401s after 3 h). Keep GitHub Pages as fallback; print both URLs. |
| U7 | **Submit early**, verify every link logged-out, save the confirmation. | 1 h | File names must follow `[Kampung SG]-[Deliverable]-[TheTwoGuys]`. |

## AI-agent actions before the window

- [ ] Prepare deck re-export the day of submission (numbers drift; see below).
- [ ] Add playtest evidence slide once U3 happens (quotes + the one change).
- [ ] Add the "rules verbatim" AI-compliance line to the deck if not already
      present after the handbook is read (see playbook §2 action 9).
- [ ] Density pass on the judge path (IMPROVEMENTS P1) if time remains after
      the video exists — never instead of it.

## Final re-verification (run on submission day, before export)

```bash
npm run typecheck && npm test && npm run build && npm audit && npm run smoke
```

Then grep the deck source and submission docs for stale numbers (test count,
smoke-check count, bundle size) and re-export:

```bash
node scripts/capture-deck.mjs && <venv>/bin/python scripts/build-pptx.py
# + Chrome --headless --print-to-pdf for the PDF (see git history for the exact command)
```

Current truth as of 2026-08-04: **75 tests · 60 smoke checks · 0 vulnerabilities**.
If those numbers appear anywhere as something else, fix before submitting.

## Claim boundaries (unchanged, non-negotiable)

No medical/cognitive/dementia claims. No invented playtests, users, metrics, or
AI-tool runs. Demo mode is a pacing device — never claim the full game is
3 minutes. The CodeBuddy failure stays documented; honesty is the strategy.
