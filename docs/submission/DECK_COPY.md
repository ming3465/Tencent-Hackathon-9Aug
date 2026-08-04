# Kampung SG — Current Judge Deck Copy

This file mirrors the eight-slide deck source in `docs/deck/index.html`.
Screenshots and evidence figures are current as of 2026-08-03.

## Slide 1 — Every Small Act Grows the Kampung

A cozy five-part campaign where older residents are the experts shaping an
enterable Singapore estate.

- Prologue + three chapters + ending
- Enter homes and landmarks
- NPCs remember your choices

## Slide 2 — One in four, by 2030

The official challenge brief states that nearly one in four Singapore citizens
will be aged 65+ by 2030.

- Age Well means dignity, purpose, independence, and social bonds
- The gap is belonging, not supervision
- We design for contributors, never patients

Source: official “AI CAN DO IT” — “Age Well” Social Good Challenge Singapore
brief (2026), p.5.

## Slide 3 — Five doors tell one connected story

- Prologue, three sequential chapters, one ending, then free exploration
- 2560×1600 estate plus homes, corridor, workshop, shops, and halls
- WASD, arrow-key, and touch movement
- Recruit 3 helpers, invite 5 residents, reconnect Ben with a craftsman
- Circular map opens Places; quest Journal tracks every objective
- No timer, energy bar, or failure state

Enter → Listen → Remember.

## Slide 4 — Eight routes. One private KampungMind

Aunty Mei brings garden expertise, Uncle Ravi creates a welcoming
noticeboard event, and Mdm Siti maps the sheltered route from daily experience.
Five more authored routes remain revisitable.

- Personality, role, expertise, knowledge, and memory rules per NPC
- Authored greetings, clues, requests, reminders, and reflections
- Deterministic scoring; stable IDs break ties; no runtime generation

> “A full table begins with one invitation that does not test anybody.”
> — Uncle Ravi, in-game authored reflection

## Slide 5 — How AI built this, honestly

CodeBuddy CLI 2.127.0 authored the first 10 files. Its run exceeded the turn
limit; our gate found 2 TypeScript errors, 3 failing tests, 1 unused dependency,
4 audit findings, and a stale-timer race. Its correction run returned
`429 Credits exhausted`.

Later AI-assisted work produced the procedural Phaser world, versioned campaign
reducer, KampungMind, Web Audio layer, and tests under human direction.

One OpenAI image-generation pass produced a neighbourhood style key from two
labelled project references. Human review rejected direct runtime use, preserved
the prompt and output, and translated its strongest idea into four deterministic
activity vignettes verified in the game. This is not claimed as Miora.

**Verified after:** strict TypeScript, 75/75 tests, 0 vulnerabilities, 60/60
production-browser checks.

## Slide 6 — Fast, private, tested, no backend

**75 tests · 0 vulnerabilities · 98.71 kB initial JavaScript · 0 bytes
collected**

- Vite + strict TypeScript + Phaser 3
- Lazy-loaded game scene
- 60-check full/demo production-browser campaign
- Keyboard, touch, and Journal completion routes; circular map opens Places
- No account, analytics, backend, or personal data
- Runtime-synthesized audio; zero audio files
- KampungMind uses authored text and deterministic code offline

## Slide 7 — What we tested. What we will not claim

Supported:

- Strict TypeScript, 75 tests, 0 vulnerabilities
- 60/60 production-browser checks
- Keyboard/touch entry, focus return, and correct return doors
- Versioned autosave, Continue, Start Over, and demo isolation
- No data collection, account, or network dependency

Not claimed:

- Cognitive, memory, dementia, clinical, or health benefit
- Measured user or population outcome
- Any result for a real person

No human playtest or real-device accessibility pass has occurred.

## Slide 8 — TheTwoGuys, built in public

Team members: Sutolimin Widjaja and Andreas Auwyano.

- Contact: sutolimin.45@gmail.com
- Source: github.com/ming3465/Tencent-Hackathon-9Aug
- Live: ming3465.github.io/Tencent-Hackathon-9Aug
- In-game art: procedural Phaser geometry, including a human-curated
  translation of the generated activity-direction pass
- OpenAI neighbourhood style key: exact prompt, saved output, review notes, and
  verified in-game result; not claimed as Miora
- Deck key art: AI-generated from the documented prompt
- Full AI and verification record: `docs/AI_USAGE_LOG.md`
