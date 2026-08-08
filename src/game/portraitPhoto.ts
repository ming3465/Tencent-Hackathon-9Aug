/**
 * Optional illustrated portraits for the dialogue card.
 *
 * The campaign ships code-drawn SVG portraits and always will - they are the
 * floor, and they guarantee every neighbour has a face with no assets to
 * download. This module lets a generated illustration sit *on top* of that
 * floor when one exists.
 *
 * The rule is deliberately one-way: a portrait file appearing in
 * `public/assets/portraits/` upgrades that character, and a missing file
 * changes nothing. No registry to keep in sync, no build step, no chance of a
 * broken-image icon appearing in front of a judge because a filename was
 * mistyped - a failed load simply leaves the drawn portrait showing.
 *
 * Drop `<npc-id>.webp` (or `.png`) in that folder and it appears. That is the
 * whole contract. Ids are the `NpcId` union: `mr-long`, `grandma-ros`,
 * `craftsman-tan`, `aunty-mei`, and so on.
 */

import type { NpcId } from "./campaignTypes.js";

/** Where a portrait file for `npcId` is looked for, most-preferred first. */
export function portraitPhotoCandidates(npcId: NpcId): readonly string[] {
  return [
    `./assets/portraits/${npcId}.webp`,
    `./assets/portraits/${npcId}.png`,
  ];
}

type Availability = "present" | "absent";

/**
 * Remembers what has already been probed, so walking through a conversation
 * does not re-request a missing file on every line.
 */
const known = new Map<string, Availability>();
const inFlight = new Map<string, Promise<string | null>>();

function probe(url: string): Promise<string | null> {
  const cached = known.get(url);
  if (cached === "present") return Promise.resolve(url);
  if (cached === "absent") return Promise.resolve(null);

  const existing = inFlight.get(url);
  if (existing) return existing;

  const attempt = new Promise<string | null>((resolve) => {
    const image = new Image();
    image.onload = () => {
      known.set(url, "present");
      resolve(url);
    };
    image.onerror = () => {
      known.set(url, "absent");
      resolve(null);
    };
    image.src = url;
  }).finally(() => {
    inFlight.delete(url);
  });

  inFlight.set(url, attempt);
  return attempt;
}

/** Resolves to the first portrait file that actually loads, or null. */
export async function findPortraitPhoto(
  npcId: NpcId | null,
): Promise<string | null> {
  if (!npcId) return null;
  for (const candidate of portraitPhotoCandidates(npcId)) {
    const found = await probe(candidate);
    if (found) return found;
  }
  return null;
}

/**
 * Lays an illustrated portrait over the drawn one inside `container`.
 *
 * Safe to call on every line: it no-ops when the right photo is already in
 * place, and it checks the container is still showing the same character
 * before attaching, so a fast advance through dialogue cannot land Ravi's face
 * on Mdm Siti's line.
 */
export function applyPortraitPhoto(
  container: HTMLElement,
  npcId: NpcId | null,
): void {
  const token = npcId ?? "estate";
  const existing = container.querySelector<HTMLImageElement>(
    ".dialog-portrait-photo",
  );
  if (existing) {
    if (existing.dataset.portraitId === token) return;
    existing.remove();
  }
  if (!npcId) return;

  void findPortraitPhoto(npcId).then((url) => {
    if (!url) return;
    // The card may have moved on while the file was loading.
    if (container.dataset.portraitId !== token) return;
    if (container.querySelector(".dialog-portrait-photo")) return;
    const image = new Image();
    image.className = "dialog-portrait-photo";
    image.src = url;
    image.alt = "";
    image.decoding = "async";
    image.dataset.portraitId = token;
    container.appendChild(image);
  });
}
