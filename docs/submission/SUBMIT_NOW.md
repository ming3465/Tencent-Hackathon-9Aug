# Kampung SG — Submission Runbook (TheTwoGuys)

Deadline is today. This is the only checklist you need. Work top to bottom.

---

## Deliverable status

| # | Required by the brief | Status |
| --- | --- | --- |
| 1 | **Game Web Link** | ✅ **DONE** — https://ming3465.github.io/Tencent-Hackathon-9Aug/ (HTTP 200, HTTPS enforced, auto-redeploys on every push to `main`) |
| 2 | **Project Introduction Deck (PPT)** | ⚠️ **BUILT, needs 2 fields** — `docs/deck/Kampung SG-Project Introduction Deck-TheTwoGuys.pptx` + `.pdf`. Slides 7 and 8 have `FILL:` markers. |
| 3 | **Game Demo Video** | ❌ **NOT RECORDED** — shot-by-shot script ready at `docs/submission/VIDEO_SCRIPT.md` |
| + | Social bonus (+5) | ❌ **NOT POSTED** — copy ready at `docs/submission/SOCIAL_POST.md` |

Required filename pattern is `[Project Name]-[Deliverable Name]-[Team Name]`.
The deck files are already named correctly. Name the video:

```
Kampung SG-Game Demo Video-TheTwoGuys.mp4
```

---

## Do these in this order

### 1. Open the submission form — 5 min — **DO THIS FIRST**

Nobody has looked at it. Confirm registration went through, confirm the real
deadline and timezone, and read every required field. This is the only failure
mode that can zero a finished submission, and five minutes buys certainty.
Discord invite from the brief: `https://discord.gg/5aE7nB78K`

### 2. Send me two things — 2 min

1. **Both team members' names + one-line roles** (e.g. "design & direction",
   "engineering & AI workflow")
2. **A contact email** for the team slide

I will fill them into the deck and re-export both files in under a minute.
Until then the deck says `FILL:` on slide 8, which reads as abandonment.

Also tell me your **playtest answer** for slide 7: if nobody has played it,
I will write "No human playtest was conducted before submission" — stating that
plainly is worth more than an empty bullet, and far more than an invented one.

### 3. Record the demo video — 40 min

Follow `docs/submission/VIDEO_SCRIPT.md`. It has exact timecodes, the keyboard
route through the map, word-for-word narration timed at ~2.5 words/second, and
caption text.

- Record with **Cmd-Shift-5** on macOS, or `screencapture -v out.mov`
- Use a browser window ~1300px wide — narrower than 1000px triggers the mobile
  layout and hides the journal
- Record the **deployed link**, not the dev server
- `ffmpeg` is installed if you need to trim or convert

Two beats that earn the most and did not exist this morning — make sure they
are in the cut:
- **A resident says something different after you act on their invitation.**
  Uncle Ravi opens with "Ah, a new face. Help me decide what goes on the board?"
  and afterwards says "Two neighbours signed up while you were walking around."
  That is the "intelligent NPCs" the 40-point criterion names.
- **The golden-hour transition** when your third activity lands and the whole
  estate fades to dusk. It is the single most cinematic moment in the game.

### 4. Submit — 15 min

Upload the link, the video, and the deck. **Submit before you do anything
optional below.** Save the confirmation screenshot and timestamp.

---

## Optional, only after you have submitted

### 5. Social bonus (+5) — 20 min

Copy is written in `docs/submission/SOCIAL_POST.md`, character-counted against
X's weighting. Required hashtags: `#CodeBuddy #WorkBuddy #Miora
#TencentCloudHackathon`.

**Read the honesty note in that file before posting.** The required hashtags
include tools we did not use today. The file gives you a one-line disclosure
that keeps the tags without claiming the tools. A judge who catches a false
AI-tool claim will take far more than 5 points off.

### 6. EdgeOne mirror — 25 min — **read the trap first**

The brief suggests EdgeOne, so a working EdgeOne link earns goodwill with
Tencent judges. GitHub Pages already satisfies the deliverable, so this is
upside only.

> ⚠️ **The trap:** the CLI defaults to `-a global`, which means "including
> Chinese mainland". That region requires real-name verification and MIIT ICP
> filing, **and its free preview URL returns 401 after three hours.** A link
> that dies three hours after you submit it is a silent catastrophe.
>
> **Always pass `-a overseas`.**

```bash
npm install -g edgeone
edgeone login -s global
npm run build
edgeone makers deploy ./dist -n kampung-sg-thetwoguys -a overseas -e production
```

Signup at `edgeone.ai/register` needs no credit card and no ID. If it works,
send me the URL and I will add it to the deck as a mirror. **If it stalls for
more than 25 minutes, abandon it** — the submitted link stays GitHub Pages.

Do **not** use `pages.edgeone.ai/deploy` (the no-account drop): it expires
after one hour.

### 7. Art — only if you have real time left

`docs/MIORA_ASSET_BIBLE.md` has the locked style key, palette, camera angle and
prompt templates ready to paste. Worth knowing: **the brief says Miora grants
1,000 credits automatically as welcome credits on new signup** — so a fresh
signup is free, and it is the officially recommended tool, which scores better
than any alternative. Two signups = 2,000 credits.

Hard cap at 5 assets: title illustration, three resident portraits, one
environment piece. Log every prompt. If nothing ships, the deck already tells
the truth — all art is procedural — and that costs less than being caught.

---

## Verified state, if a judge asks

```
npm run typecheck   passes, strict TypeScript
npm test            59 tests across 3 files
npm run build       24.35 kB initial JS, Phaser lazy-loaded
npm audit           0 vulnerabilities
npm run smoke       19/19 production-browser checks
```

`npm run smoke` is self-contained — it builds, starts its own preview server,
drives real headless Chrome through a full playthrough plus a second
playthrough, and shuts down. Anyone can run that one command and see it pass.

## What we deliberately do not claim

No human playtest. No generated art asset ships. No second CodeBuddy run — its
credits stayed exhausted and none were bought. No medical, cognitive, or
dementia claim of any kind. All of this is stated plainly in the deck, the AI
evidence page, and the usage log rather than papered over.
