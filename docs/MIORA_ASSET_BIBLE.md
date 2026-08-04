# Miora Asset Bible

## Purpose

Miora is the planned official visual-asset tool for Kampung SG. The current
Phaser art is a production-capable procedural layer used to validate movement,
layout, interactions, accessibility, and game feel before spending generation
credits.

Four OpenAI-generated visual workflows now exist. The first two studies are at
`docs/art/openai-neighbourhood-style-key.png` and
`docs/art/openai-estate-density-reference.png`; their strongest reviewed ideas
were translated into deterministic code-drawn activity vignettes, prop
clusters, ground accents, and ambient insects. The third is the reviewed title
panorama at `docs/art/openai-kampung-estate-title-v1.png`, with its optimized
runtime WebP under `public/assets/generated/`. The fourth is the resident
silhouette/gait study at
`docs/art/openai-character-silhouette-study-v1.png`; direct runtime use was
rejected, while its stepped anatomy, grounded footwork, and readable outfit
grammar informed an original code-drawn cast registry. All four are cross-tool
evidence, not Miora outputs; do not relabel them as Miora.

Generate components, not complete screenshots. Interface layout, text,
accessibility, animation timing, collision, and responsive behavior remain in
code. This prevents generated text errors and makes the art replaceable.

## Art Direction

**Style:** warm top-down 2D storybook art with pixel-inspired edges, simplified
geometry, tactile painted texture, and strong silhouettes. Contemporary
Singapore rather than fantasy farming imagery.

**Mood:** welcoming, sunlit, lived-in, calm, and intergenerational.

**Camera:** consistent three-quarter top-down view, approximately 35 degrees,
with light arriving from the upper left.

**Palette:**

| Role | Hex |
| --- | --- |
| Deep teal outline | `#173F4F` |
| Warm cream | `#FFF6DC` |
| Coral accent | `#D96756` |
| Golden highlight | `#F2B84B` |
| Community teal | `#287271` |
| Garden green | `#5B8C5A` |
| Soft purple | `#775B91` |
| Concrete sand | `#EAD9B7` |

Do not reproduce Stardew Valley characters, tiles, buildings, palettes, map
layouts, icons, or branding. The reference is the readable top-down interaction
model, not its copyrighted visual identity.

## Representation Rules

- Portray older adults as active neighbours, organizers, mentors, and experts.
- Include realistic variation in age, skin tone, body type, clothing, mobility,
  and cultural background without caricature.
- Do not add medical imagery, hospital cues, frailty stereotypes, or infantilizing
  expressions.
- Keep clothing contemporary and appropriate to Singapore's climate.
- Avoid making every Singapore reference a tourist icon or ethnic costume.
- Use mobility aids naturally when relevant, not as the character's identity.

## Export Rules

- Export PNG in sRGB.
- Use transparent backgrounds for characters, props, vegetation, and building
  cutouts.
- Generate no embedded text, labels, UI copy, logos, numbers, or watermarks.
- Keep a minimum 24px transparent margin around each isolated asset.
- Preserve one consistent light direction and outline weight across batches.
- Do not upscale compressed previews. Export the highest Miora source quality.
- Record every prompt, generation ID or link, selected variation, rejection
  reason, cleanup step, filename, and in-game use in `docs/AI_USAGE_LOG.md`.

## File Contract

Place approved exports under `public/assets/miora/` using lowercase kebab-case.

```text
public/assets/miora/
  style-key-neighbourhood.png
  environment/
    hdb-block-a.png
    hawker-corner-a.png
    community-garden-a.png
    sheltered-walkway-a.png
    void-deck-props-a.png
  characters/
    player-front.png
    player-back.png
    player-left.png
    player-right.png
    aunty-mei-front.png
    uncle-ravi-front.png
    mdm-siti-front.png
  props/
    memory-table.png
    noticeboard.png
    garden-bed-herbs.png
    garden-bed-flowers.png
    rest-bench.png
    shelter-panel.png
  portraits/
    aunty-mei.png
    uncle-ravi.png
    mdm-siti.png
  cards/
    keepsake-kite.png
    keepsake-lantern.png
    keepsake-flower.png
    keepsake-bumboat.png
```

## Generation Order

1. Generate one neighbourhood style key and reject it unless the camera,
   palette, outline, lighting, and Singapore context are coherent.
2. Generate the three resident portrait keys and compare them side by side for
   style and representation drift.
3. Generate environment components on transparent backgrounds.
4. Generate player and resident directional poses using the approved character
   references.
5. Generate props and matching-card keepsakes.
6. Integrate a small batch, test at actual game scale, and only then generate
   remaining variants.

## Style-Key Prompt

```text
Create a polished visual style key for a cozy top-down 2D neighbourhood game
set in a contemporary Singapore HDB estate. Show a void deck, warm concrete
walkways, a small hawker corner, sheltered path, community garden, tropical
trees, benches, and neighbours of different ages using the shared space.

Visual style: storybook illustration with pixel-inspired crisp edges, simplified
readable shapes, subtle painted texture, deep teal outlines, warm cream concrete,
coral accents, golden sunlight, community teal, and garden green. Three-quarter
top-down camera at about 35 degrees. Light from upper left. Calm, welcoming,
lived-in, and distinctly Singaporean without tourist-poster cliches.

Older adults are active organizers and mentors. No medical setting, no fantasy
farm, no copied game aesthetic, no text, no signs with lettering, no logo, no
watermark, no UI, no photorealism, no isometric 3D render.
```

## Resident Prompt Template

```text
Using the approved Kampung SG style key, create [CHARACTER NAME], an older
Singapore resident who contributes as [COMMUNITY ROLE]. Contemporary lightweight
clothing suitable for Singapore weather, warm confident expression, grounded and
dignified body language, strong silhouette readable at small game scale.

Three-quarter top-down 2D storybook game character, pixel-inspired crisp edges,
deep teal outline, upper-left lighting, restrained palette matching the style
key. Full body, centered, transparent background, generous transparent margin.
No text, no prop covering the face, no hospital cues, no caricature, no chibi
baby proportions, no watermark, no extra limbs.
```

Character roles:

- Aunty Mei: experienced community gardener who teaches tropical herb care.
- Uncle Ravi: void-deck host who welcomes beginners to chess and story sharing.
- Mdm Siti: daily-route expert who maps shade, rain exposure, and useful rests.

## Environment Component Prompt Template

```text
Using the approved Kampung SG style key, create an isolated [ASSET NAME] for a
top-down 2D Singapore neighbourhood game. Three-quarter top-down view at 35
degrees, upper-left light, deep teal outline, warm storybook texture, readable
at mobile game scale. Contemporary HDB-estate design with practical lived-in
details. Transparent background and complete uncropped silhouette.

No people unless requested, no text, no signage lettering, no logo, no UI, no
watermark, no photorealism, no fantasy-farm elements, no cast shadow cut off by
the image boundary.
```

## Acceptance Checklist

- Silhouette remains readable when displayed at 96px to 160px.
- Camera and light direction match the style key.
- Transparent edges are clean with no checkerboard baked into the image.
- Character identity remains consistent across directions and portraits.
- Asset has no generated text or accidental watermark.
- Cultural details are grounded and non-stereotypical.
- Palette works against both grass and concrete backgrounds.
- The asset can replace a procedural layer without changing collision or game
  rules.
