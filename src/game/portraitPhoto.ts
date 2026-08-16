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

/**
 * Filenames present in `public/assets/portraits/` when this build was made,
 * injected by `vite.config.ts`.
 *
 * Discovering portraits by *trying to load* them meant a 404 in the console for
 * every character without one - which, while that folder holds no images, is
 * every character in the game. Roughly forty failed requests a session, in
 * front of anyone who opens developer tools. The list is rebuilt on every
 * build, so dropping a file in still works; it only stops the browser asking
 * for files nobody shipped.
 */
declare const __PORTRAIT_FILES__: readonly string[] | undefined;

function shippedPortraits(): readonly string[] {
  // Guarded because unit tests import this module without Vite's `define`.
  return typeof __PORTRAIT_FILES__ === "undefined" ? [] : __PORTRAIT_FILES__;
}

/**
 * Where a portrait for `npcId` would live, most-preferred first.
 *
 * Pure and exported for testing: it describes the naming contract, and says
 * nothing about whether the files exist.
 */
export function portraitPhotoCandidates(npcId: NpcId): readonly string[] {
  return [
    `./assets/portraits/${npcId}.webp`,
    `./assets/portraits/${npcId}.png`,
  ];
}

/** The candidates that this build actually shipped a file for. */
export function shippedPortraitCandidates(
  npcId: NpcId,
  shipped: readonly string[] = shippedPortraits(),
): readonly string[] {
  const names = new Set(shipped);
  return portraitPhotoCandidates(npcId).filter((path) =>
    names.has(path.slice(path.lastIndexOf("/") + 1))
  );
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
  // Only files this build shipped are requested at all. The probe is still run
  // on those, so a corrupt or unreadable image degrades to the drawn portrait
  // rather than showing a broken-image icon.
  for (const candidate of shippedPortraitCandidates(npcId)) {
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
