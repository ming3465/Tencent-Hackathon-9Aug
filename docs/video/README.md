# Demo video assets

## What is here

| File | What it is |
| --- | --- |
| `kampung-sg-gameplay-broll.mp4` | **Silent gameplay B-roll**, 1280×720. Machine-captured from the production bundle on the judge path (`?demo=1`). Raw footage to cut and narrate over. |
| `broll-beats.json` | Frame/second index of every beat in the capture, so clips can be found without scrubbing. |
| `kampung-sg-demo-review.mp4` | **Narration-ready 90-second review cut**, 1280×720 at 30 fps. Open captions, silent AAC guide track, story beats, AI receipts, engineering evidence, claim boundaries, and QR end slate. |
| `demo-review-beats.json` | Exact timeline, source provenance, captions, media metadata, and claim boundaries for the review cut. |

**Neither MP4 is the final submission video.** The review cut removes the clean
capture, visual edit, open-caption, AI-receipt, engineering-evidence, integrity,
and end-slate steps. Deliverable #3 still needs a human voice-over, sound mix,
final approval, and upload.

## Regenerate the gameplay B-roll

```bash
npm run capture:video
```

This builds the current bundle, starts its own `vite preview` if nothing is
listening, drives headless Chrome over CDP, captures with `Page.startScreencast`,
and encodes with ffmpeg. Requires Node 22+, Chrome, and `ffmpeg` on PATH.

To record against an already-running server (or a private build, so it does not
race another agent's `dist/`):

```bash
node scripts/capture-gameplay.mjs --url http://127.0.0.1:4399/ --out docs/video
```

Flags: `--url`, `--out`, `--port` (CDP port), `--fps` (default 20).

## Compose the review cut

```bash
npm run compose:video
```

The compositor validates every source, renders code-defined caption cards in
headless Chrome, assembles the exact 90-second timeline in ffmpeg, adds a silent
stereo AAC guide track for editor compatibility, probes the result, and writes
the provenance manifest. It never invents footage for story moments absent from
the B-roll: those beats use identified, verified production screenshots.

Optional flags: `--source`, `--out`, `--manifest`, `--chrome`.

## B-roll beats captured

The route follows `docs/WINNING_PLAYBOOK.md` §4 in order, so clips land in the
edit in sequence:

1. **Title screen** — cold open, key art and the thesis line.
2. **Prologue, Y's flat** — interior materials, warm lamp, wood floor.
3. **First conversation** — visual-novel card, code-drawn bust, typewriter line.
4. **Player choice** — the hook: a kind decision the world responds to.
5. **Leaving the flat** — door, keyboard movement.
6. **Block 9 corridor** — four lived-in units, lift to the void deck.
7. **Estate wide** — the money shot: residents on routes, laundry, cats,
   kopitiam tables, playground, wildflowers, ambient activity vignettes.
8. **Journal / quest book** — four tabs, objectives, no timer anywhere.
9. **Free exploration tail** — calm outro material.

## Final editing notes

- **Cut on the beat index, not by eye.** `broll-beats.json` gives the exact
  second each beat starts.
- **Jump-cut all traversal.** The playbook is explicit: walking between beats is
  the first thing to lose.
- **Audio is not captured.** The game synthesizes audio at runtime through Web
  Audio, so there are no sound files to drop into the timeline. The review cut
  contains a silent guide track only. Record a capture with system audio if real
  game SFX are wanted under the final voice-over, and verify that mix by ear.
- **Open captions are already burned in.** Keep them visible if the final
  voice-over follows this script; revise both the spoken line and caption
  together if editorial wording changes.
- **Do not present this as a played session.** It is a scripted machine capture.
  Saying "recorded from the live build" is accurate; "here is me playing" is not.

## Claim boundary

The gameplay capture proves the production bundle renders and responds. The
review cut proves that the checked-in visual edit can be reproduced from named
evidence. Neither is a performance benchmark, real-device test, screen-reader
audit, human playtest, human narration, or final submission approval.
