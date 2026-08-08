# Character portraits (optional)

Drop a file named after the character's id here and the dialogue card uses it
automatically. Nothing else to edit — no registry, no build step.

```
public/assets/portraits/<npc-id>.webp     # preferred
public/assets/portraits/<npc-id>.png      # also accepted
```

A missing file is not an error: the code-drawn SVG portrait keeps showing. That
is deliberate, so a mistyped filename can never put a broken-image icon in front
of a judge.

## The 19 ids

```
voice            mr-long          grandma-ros      craftsman-tan    ben
aunty-mei        uncle-ravi       mdm-siti         pak-yusof        coach-meng
uncle-seng       auntie-minah     wei-ling         hafiz            jia-en
arun             nadia            kai              priya
```

## Shape

**11:15 portrait** (the card renders 220×300). The image is cropped with
`object-fit: cover` and biased toward the top, so keep the face in the upper
half and leave headroom.

Prompts for every character are in `docs/CHARACTER_PERSONAS.md`.

## Before you ship them

The deck and the Credits panel currently say the title panorama is the only
image asset. Adding portraits makes that false — update
`title-view-credits` in `index.html` and the art note in `AGENTS.md`.
