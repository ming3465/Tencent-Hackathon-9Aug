# Kampung SG Visual Artifacts

This folder stores deck art, visual-direction references, and AI-generation
evidence. It is separate from `public/`, so an image placed here does not enter
the playable bundle automatically.

- `key-art.jpeg` is the existing deck hero.
- `openai-neighbourhood-style-key.png` is the 2026-08-03 OpenAI-generated
  gameplay style key. Its exact prompt and human acceptance/rejection notes are
  in `docs/prompts/openai-neighbourhood-style-key.txt`.
- `openai-estate-density-reference.png` is the second 2026-08-03
  OpenAI-generated study. It used three current estate screenshots to explore
  code-drawable story clusters, clear circulation, ground accents, and subtle
  ambient life. Its exact prompt and review decision are in
  `docs/prompts/openai-estate-density-reference.txt`.
- `openai-kampung-estate-title-v1.png` is the reviewed 2026-08-04 source for
  the first OpenAI-generated raster intentionally integrated into the playable
  build. The first output was rejected for pseudo-writing; a constrained edit
  replaced only the noticeboard contents with non-text pictograms. Exact
  prompts, artifacts, hashes, accepted/rejected decisions, and the optimized
  runtime export are in `docs/prompts/openai-title-panorama-v1.txt`.

Generated art is welcome when it improves the project. Every accepted output
must retain its real tool provenance, prompt, review decisions, and intended
use in `docs/AI_USAGE_LOG.md`. Runtime assets may be copied into `public/` only
after actual-scale, accessibility, cultural, and performance review.
Neither of the first two OpenAI studies is a Miora output, and neither raster
ships in the playable bundle. The title panorama is also not Miora; its
reviewed WebP export ships separately under `public/assets/generated/`.
