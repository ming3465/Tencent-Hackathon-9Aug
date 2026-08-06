# Kampung SG — Current Judge Deck Copy

This file mirrors the eight-slide deck source in `docs/deck/index.html`.
Screenshots and evidence figures are current as of 2026-08-04.

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

Auntie Minah brings everyday scam-safety expertise, Uncle Ravi creates a
welcoming noticeboard event, and Mdm Siti maps the sheltered route from daily
experience. Five more authored routes remain revisitable.

- Personality, role, expertise, knowledge, and memory rules per NPC
- Numbered steps or icons + words: both advance; no test or penalty
- The selected `CHECK FIRST` card stays in Minah's shop window

> “I check before I act. I use the supplier number in my own order book, or call
> ScamShield at 1799.”
> — Auntie Minah, in-game authored safety habit

Source: official ScamShield and Singapore Police Force scam-safety guidance;
the public repository preserves the citations and authored implementation.

## Slide 5 — How AI built this, honestly

CodeBuddy CLI 2.127.0 authored the first 10 files. Its run exceeded the turn
limit; our gate found 2 TypeScript errors, 3 failing tests, 1 unused dependency,
4 audit findings, and a stale-timer race. Its correction run returned
`429 Credits exhausted`.

Later AI-assisted work produced the procedural Phaser world, versioned campaign
reducer, KampungMind, Web Audio layer, and tests under human direction.

Four OpenAI visual workflows used labelled project references and preserved
their prompts and artifacts. Humans translated the neighbourhood, density,
and cast-silhouette studies into verified code-drawn systems. The title
workflow rejected pseudo-writing, constrained the cleanup to non-text
pictograms, optimized the accepted image, and integrated it into the playable
title while keeping interface text semantic. None is claimed as Miora.

**Verified after:** strict TypeScript, 90/90 tests, 0 vulnerabilities, 60/60
production-browser checks.

## Slide 6 — Fast, private, tested, no backend

**90 tests · 0 vulnerabilities · 141.46 kB initial JavaScript · 0 bytes
collected**

- Vite + strict TypeScript + Phaser 3
- 30 campaign, 31 match, 17 audio, 4 accessibility, and 8 world/door/pause tests
- Connection-aware idle prefetch after title art; Start reuses one cached scene
  load and offers cancel/retry recovery
- 60-check full/demo production-browser campaign
- Keyboard, touch controls, tap-to-walk/approach, and Journal completion routes;
  circular map opens Places
- No account, analytics, backend, or personal data
- Runtime-synthesized audio; zero audio files
- KampungMind uses authored text and deterministic code offline

Current private build: 91.64 kB HTML (16.14 kB gzip), 141.46 kB initial
JavaScript (41.48 kB gzip), and 1,613.26 kB lazy scene (379.79 kB gzip).

## Slide 7 — What we tested. What we will not claim

Supported:

- Strict TypeScript, 90 tests (30 campaign, 31 match, 17 audio, 4
  accessibility, and 8 world/door/pause), 0 vulnerabilities
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
- In-game art: procedural Phaser geometry plus one reviewed generated title
  panorama
- Four OpenAI visual workflows: exact prompts, artifacts, review notes, and
  verified code-drawn or runtime results; none claimed as Miora
- Deck key art: AI-generated from the documented prompt
- Full AI and verification record: `docs/AI_USAGE_LOG.md`
