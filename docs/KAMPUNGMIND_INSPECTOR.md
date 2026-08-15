# KampungMind Inspector — showing the NPC engine decide

Append `?inspect=1` to any build. It composes with the other flags:

```text
http://127.0.0.1:4173/?demo=1&inspect=1
https://ming3465.github.io/Tencent-Hackathon-9Aug/?demo=1&inspect=1
```

Only the exact value `inspect=1` enables it. The judged routes — `/` and
`?demo=1` — never render the panel.

## Why this exists

KampungMind has always been a real decision engine: it filters every authored
intent a resident holds against current campaign facts, scores the survivors,
and breaks ties on a stable ID. The problem was never that it was fake — the
problem was that **it was invisible**. A player, or a judge, sees a line of
dialogue and has no way to tell a state-conditioned choice from a fixed script.

The panel makes the engine's own working visible while you play, so "our NPCs
are AI-driven" stops being a claim and becomes something a judge can watch.

## What it shows

For whichever resident you are talking to, in real time:

- **The facts fed in** — current chapter, what expertise the chapter needs,
  what this resident knows, and what this resident remembers about you.
- **Every authored intent considered**, not just the winner.
- **For each rejected intent, the first rule that rejected it**, in plain
  language: `rejected — not offered in prologue`, `rejected — waiting on
  heard-voice`, `rejected — needs garden-request finished first`. Rule order is
  part of the contract, since it decides which reason is the one shown.
- **For each eligible intent, its score broken into named parts** that add up
  to the total: `+100 chapter relevance`, `+14 remembers being helped`,
  `+8 their expertise is what's needed`.
- **The winner**, marked `▶` and highlighted.

The intent it selects is exactly the intent the campaign plays. A unit test
asserts that for every resident across three campaign states, so the panel can
never drift into showing a decision the game did not actually make.

## The 20-second demo beat

This is the sequence worth rehearsing:

1. Open `?demo=1&inspect=1` and talk to Aunty Mei. The panel shows her
   `offer-request` winning, and shows `aunty-mei-memory` **rejected — needs
   garden-request finished first**.
2. Help her. Walk away.
3. Talk to her again. Same person, same code, **different winner** — because a
   memory got written in between, and `+14 remembers being helped` now appears
   in the score breakdown.

Say: *"Every team here will tell you their NPCs are AI-driven. This is mine
deciding — offline, in front of you, with no network call."*

A test (`shows the estate remembering: helping someone re-ranks their intents`)
pins this exact behaviour, so the beat cannot silently stop working.

## Voicings — where the model-authored writing shows up

An intent can carry `variants`: alternate phrasings of the *same* beat, drafted
by a model through `scripts/author-intents.mjs` and then curated by a human.
`chooseIntentVoicing()` picks between them from facts already in campaign
state — this resident's memory count, plus a stable hash of the intent ID — so
the choice is deterministic, reproducible, and identical on every machine.

The effect is that a resident words the same beat differently once she
remembers you, and the panel says why: `voicing 2 of 3 (remembers 1 thing about
you)`. The line only appears once more than one phrasing exists.

**The boundary that makes this safe:** a voicing changes how something is said,
never what happens. The beat, its choices and its events are identical whichever
phrasing is picked. A variant that introduces a fact, a number or an obligation
is a different beat and belongs in its own intent — a test rejects any variant
carrying a placeholder other than `{player}`, and the smoke suite's
unresolved-token scan catches the rest.

## Drafting new voicings

```bash
export HUNYUAN_API_KEY=...          # console.cloud.tencent.com/hunyuan/api-key
node scripts/author-intents.mjs

export DASHSCOPE_API_KEY=...        # or Qwen instead
node scripts/author-intents.mjs --provider qwen

node scripts/author-intents.mjs --dry-run    # inspect the request, send nothing
```

It runs `docs/prompts/gemini-kampungmind-authoring.txt` — the prompt that was
written for the Gemini attempt that died on an auth error and never produced
anything. The prompt was never the problem, so it is reused verbatim rather
than rewritten.

Output lands in `docs/prompts/out/` as the raw answer plus a JSON receipt
recording the model, timestamp, prompt SHA-256 and token usage. **The script
never writes to `campaignContent.ts`.** You read the table, keep what survives,
and paste it in by hand — the same accept/reject discipline the four OpenAI
visual workflows use, and the reason they hold up. Log what you accepted and
what you rejected in `docs/AI_USAGE_LOG.md`.

Hunyuan is the default because this is a Tencent Cloud event whose prize pool
is paid in Tencent Cloud tokens; "we used Tencent's own model to author our
NPCs" is worth a line on the AI slide. Qwen is a flag away and costs about the
same — which is to say, nearly nothing for a few thousand tokens.

## Live re-voicing on-device — `?llm=1`

Compose it with the others: `?demo=1&inspect=1&llm=1`.

Residents re-word their own lines at play time using **the language model
already built into the browser** (Chrome's Prompt API / Gemini Nano). The game
downloads nothing, ships no model, holds no API key and contacts no server. The
default routes `/` and `?demo=1` make no model call at all — verified.

Measured 2026-08-15 in the real game:

> **Authored:** Uncle Ravi looks up with an easy nod. There is always room to talk.
> **Re-voiced:** *I nod, always welcome a chat. Plenty of time for a cuppa and a bit of gossip, you know.*
> Panel: `re-voiced on-device in 2686ms`

### Only low-stakes lines, and why

Re-voicing is restricted by `intent.kind` to **greeting**, **reflection** and
**memory-reaction**. Everything else — requests, reminders, invitations, clues,
contributions, main-story — is authored-only, permanently.

That is not caution for its own sake. Asked twice, with an explicit rule and a
few-shot example forbidding it, the model rewrote Mdm Siti's

> That route floods every monsoon, {player}. We should shelter it properly.

as *"...we really must reinforce the drainage properly."* Her quest builds a
**sheltered linkway** and the game draws it. A resident asking for drainage
beside a covered walkway is worse than never re-voicing her. Meaning drift is
fluent, plausible and undetectable by any validator — so those kinds never
reach the model at all.

### What still gets checked

Every generated line must survive `validateRevoicing()` or the authored line is
used: no invented numbers, no unknown `{tokens}`, no dropped `{player}`, no
third-person self-reference, no medical or diagnostic vocabulary, sane length.
If **any** line in a beat fails, the whole beat falls back — half-authored,
half-generated reads worse than untouched.

### Why you never wait for it

Generation starts when you walk *near* someone, not when you press `E`, so the
~1–3 s it takes is spent while you are still walking. If it is not ready, the
authored line opens instantly. There is no spinner and no pause anywhere.

### First run needs a click

Chrome refuses `LanguageModel.create()` without a user gesture while the model
is still downloading — a page cannot silently pull several gigabytes. The
"Begin" button provides that gesture. On a machine that already has the model
the session is ready in a few seconds; on one that does not, Chrome fetches
~4 GB once (roughly two minutes on a good connection).

If the model is unavailable — Safari, Firefox, mobile, older Chrome, low disk —
the game behaves exactly as it does today. The panel says which happened.

## What it is not

- **Not a runtime language model, on the default routes.** `/` and `?demo=1`
  run no inference at all; the director is deterministic. The opt-in `?llm=1`
  lane does run a model — the browser's own, on-device, with no server and no
  key — and only ever re-words a line the deterministic engine already chose.
- **Not part of the game.** It is a read-out layered over the world. It is
  `aria-hidden`, contains no focusable element, and takes no pointer events, so
  it cannot enter the tab order, disturb the dialogue focus trap, or intercept
  a tap.
- **Not on the judged path.** `/` and `?demo=1` never build it. If you are
  demoing the game rather than the engineering, leave it off.

## On stage

Reliability is the reason to prefer this over a live model demo: it renders
instantly, needs no venue wifi, cannot rate-limit, cannot lag, and cannot say
something unexpected in front of judges. If the projector is small, the panel
scales down at narrow widths — check it at the venue resolution first.

## Implementation

- `traceNpcIntent()` in `src/game/kampungMind.ts` returns the full reasoning;
  `selectNpcIntent()` returns only its conclusion. Both run the same
  eligibility and scoring code, so they cannot disagree.
- `renderMindInspector()` in `src/main.ts` draws it, called from `openNpc()`.
- Markup and styles live in `index.html` under `#mind-inspector`.
- Five unit tests in `campaign.test.ts` cover winner agreement, complete intent
  coverage, rejection reasons, score arithmetic, the memory re-rank beat, and
  row ordering.
