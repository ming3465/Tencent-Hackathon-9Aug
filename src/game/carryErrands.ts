/**
 * Errands the player physically runs: pick something up here, carry it across
 * the estate, hand it over there.
 *
 * Every request in the campaign used to resolve inside a conversation - you
 * chose an option and the estate changed. That reads as choosing well but not
 * as *doing*, and the neighbourhood is the thing the game is actually about.
 * An errand puts the estate between the asking and the answering: you hold the
 * thing, you walk it over, and the walk is the contribution.
 *
 * Deliberately additive. No errand gates a chapter, changes a threshold, or is
 * required to finish the story - the campaign's pacing is tuned around the
 * existing request-givers, and making a fetch mandatory would quietly raise the
 * cost of an ending. Errands are optional texture with real feedback.
 *
 * Design rules that follow from the published constraints:
 *  - No timer and no failure. A carried item is never dropped, lost or spoiled.
 *  - Carrying never blocks movement, doors, or conversation.
 *  - One item at a time, so the HUD only ever states one fact.
 */

import type { CampaignStateV1, LocationId } from "./campaignTypes.js";
import {
  BLOCK_9_BICYCLE_RACK,
  BLOCK_12_BICYCLE_RACK,
} from "./estateLayout.js";

export interface ErrandPoint {
  locationId: LocationId;
  x: number;
  y: number;
  /** Prompt shown when the player is close enough to act. */
  label: string;
  shortLabel: string;
  /** Authored reaction, shown once the player acts. */
  lines: readonly string[];
}

export interface CarryErrand {
  id: string;
  /** What the player is holding. Shown in the HUD and above their head. */
  item: string;
  /** Parcel colour, so two errands never look like the same box. */
  tint: number;
  /** Journal-facing one-liner. */
  summary: string;
  pickup: ErrandPoint;
  dropoff: ErrandPoint;
  /** Objective recorded on delivery. */
  objectiveId: string;
}

/**
 * Two errands, both hanging off details the estate already authored rather
 * than off new furniture invented to justify the mechanic.
 */
export const CARRY_ERRANDS: readonly CarryErrand[] = [
  {
    id: "return-the-pump",
    item: "the shared tyre pump",
    tint: 0x4a6fa5,
    summary: "Return the shared tyre pump to the Block 12 verge.",
    objectiveId: "errand:return-the-pump",
    pickup: {
      locationId: "estate",
      // The Block 9 rack, whose note already reads "Return after your errand."
      x: BLOCK_9_BICYCLE_RACK.x + 46,
      y: BLOCK_9_BICYCLE_RACK.y + 34,
      label: "Take the shared tyre pump",
      shortLabel: "Tyre pump",
      lines: [
        "The pump hangs where the note says it should. Someone borrowed it and walked the long way home.",
        "Block 12 keeps the other rack. You can drop it back on your way past.",
      ],
    },
    dropoff: {
      locationId: "estate",
      x: BLOCK_12_BICYCLE_RACK.x + 40,
      y: BLOCK_12_BICYCLE_RACK.y - 30,
      label: "Hang the pump on the Block 12 rack",
      shortLabel: "Block 12 rack",
      lines: [
        "The bracket is empty and the right shape. The pump sits back into it without being forced.",
        "Nobody watched you do it. The next person to need it will simply find it there.",
      ],
    },
  },
  {
    id: "timber-for-the-step",
    item: "a planed timber offcut",
    tint: 0xb07a3c,
    summary: "Carry a planed offcut from the workshop to Mr. Long's step.",
    objectiveId: "errand:timber-for-the-step",
    pickup: {
      locationId: "estate",
      // Beside the workshop timber stack the estate already describes.
      x: 1260,
      y: 1390,
      label: "Lift the planed offcut",
      shortLabel: "Planed offcut",
      lines: [
        "The offcut is already sanded on one face. It was cut for a step, not for a shelf.",
        "The workshop keeps spares by the door precisely so they can be carried out.",
      ],
    },
    dropoff: {
      locationId: "estate",
      // Mr. Long's own doorstep, at the east end of the village.
      x: 2452,
      y: 1120,
      label: "Set the offcut down by the step",
      shortLabel: "Mr. Long's step",
      lines: [
        "You lean it against the riser, sanded face out, where whoever measures next will see it first.",
        "It is not a repair. It is the repair becoming somebody's obvious next job.",
      ],
    },
  },
];

const ERRAND_BY_ID = new Map(CARRY_ERRANDS.map((errand) => [errand.id, errand]));

export function errandById(id: string): CarryErrand | undefined {
  return ERRAND_BY_ID.get(id);
}

/** True once the delivery objective is recorded. Errands never un-complete. */
export function isErrandDelivered(
  state: CampaignStateV1,
  errandId: string,
): boolean {
  const errand = errandById(errandId);
  return errand !== undefined && state.objectives.includes(errand.objectiveId);
}

export function carriedErrand(state: CampaignStateV1): CarryErrand | undefined {
  return state.carrying === null ? undefined : errandById(state.carrying);
}

/**
 * Pickups the player could act on right now: not already delivered, and not
 * while their hands are full. Hiding a pickup while carrying is what keeps the
 * "one item at a time" rule legible instead of it being a silent rejection.
 */
export function availablePickups(
  state: CampaignStateV1,
  locationId: LocationId,
): readonly CarryErrand[] {
  if (state.carrying !== null) return [];
  return CARRY_ERRANDS.filter(
    (errand) =>
      errand.pickup.locationId === locationId
      && !isErrandDelivered(state, errand.id),
  );
}

/** The single drop-off the player can act on, if they are carrying something. */
export function availableDropoff(
  state: CampaignStateV1,
  locationId: LocationId,
): CarryErrand | undefined {
  const errand = carriedErrand(state);
  if (!errand) return undefined;
  return errand.dropoff.locationId === locationId ? errand : undefined;
}

/** Every errand the player has finished, for the journal. */
export function deliveredErrands(
  state: CampaignStateV1,
): readonly CarryErrand[] {
  return CARRY_ERRANDS.filter((errand) => isErrandDelivered(state, errand.id));
}
