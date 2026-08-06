import type { NpcId } from "./campaignTypes.js";

export type ResidentBuild = "short" | "tall" | "wide";
export type ResidentAccessory =
  | "glasses"
  | "cane"
  | "apron"
  | "cap"
  | "backpack"
  | "none";
export type ResidentHairStyle =
  | "bob"
  | "bun"
  | "crop"
  | "receding"
  | "side-part"
  | "ponytail"
  | "curly";
export type ResidentOutfit =
  | "collared"
  | "floral"
  | "plain"
  | "striped"
  | "work-vest"
  | "tee"
  | "hoodie";
export type ResidentCarry = "none" | "tote";

/**
 * Roughly how old a resident reads on screen.
 *
 * The estate was drawn entirely as older adults, which is wrong for the
 * story: the village is intergenerational, and the young neighbours are
 * specifically the ones who get asked to help build Mr. Long's ramp and to
 * fill Grandma Ros's kitchen. Elders stay the experts - that is the whole
 * premise - but they are not the only people in the village.
 *
 * Declared rather than inferred from hair and build, so the cast mix is
 * something a test can assert instead of something a reviewer has to eyeball.
 */
export type ResidentGeneration = "young" | "adult" | "elder";

export interface ResidentArtDefinition {
  key: string;
  generation: ResidentGeneration;
  shirt: number;
  hair: number;
  skin: number;
  build: ResidentBuild;
  accessory: ResidentAccessory;
  hairStyle: ResidentHairStyle;
  outfit: ResidentOutfit;
  carry: ResidentCarry;
}

export const RESIDENT_ART: readonly ResidentArtDefinition[] = [
  {
    key: "npc-mei",
    generation: "elder",
    shirt: 0xc85c5c,
    hair: 0x6b6560,
    skin: 0xe3b58c,
    build: "wide",
    accessory: "apron",
    hairStyle: "bun",
    outfit: "floral",
    carry: "none",
  },
  {
    key: "npc-ravi",
    generation: "elder",
    shirt: 0x3d7a80,
    hair: 0xb0aaa0,
    skin: 0xb87f52,
    build: "tall",
    accessory: "glasses",
    hairStyle: "receding",
    outfit: "collared",
    carry: "tote",
  },
  {
    key: "npc-siti",
    generation: "elder",
    shirt: 0x7b5aa6,
    hair: 0x4c3b5f,
    skin: 0xcf9a6c,
    build: "short",
    accessory: "cane",
    hairStyle: "bob",
    outfit: "floral",
    carry: "none",
  },
  {
    key: "npc-yusof",
    generation: "adult",
    shirt: 0x4a6fa5,
    hair: 0x8c8580,
    skin: 0xcf9a6c,
    build: "wide",
    accessory: "none",
    hairStyle: "side-part",
    outfit: "work-vest",
    carry: "tote",
  },
  {
    key: "npc-meng",
    generation: "adult",
    shirt: 0xd98a3c,
    hair: 0x5a5550,
    skin: 0xe3b58c,
    build: "tall",
    accessory: "none",
    hairStyle: "crop",
    outfit: "collared",
    carry: "none",
  },
  {
    key: "npc-seng",
    generation: "elder",
    shirt: 0x8a6b3d,
    hair: 0xa7a198,
    skin: 0xe8c49b,
    build: "short",
    accessory: "glasses",
    hairStyle: "receding",
    outfit: "striped",
    carry: "none",
  },
  {
    key: "npc-minah",
    generation: "elder",
    shirt: 0x2f7d5f,
    hair: 0x2a2523,
    skin: 0xa8703f,
    build: "wide",
    accessory: "apron",
    hairStyle: "bun",
    outfit: "floral",
    carry: "none",
  },
  {
    key: "npc-weiling",
    generation: "young",
    shirt: 0xc76a9a,
    hair: 0x241f1c,
    skin: 0xecc6a0,
    build: "tall",
    accessory: "none",
    hairStyle: "bob",
    outfit: "plain",
    carry: "tote",
  },
  {
    key: "npc-hafiz",
    generation: "young",
    shirt: 0x2f7d8c,
    hair: 0x241f1d,
    skin: 0xb87f52,
    build: "tall",
    accessory: "cap",
    hairStyle: "crop",
    outfit: "tee",
    carry: "none",
  },
  {
    key: "npc-jiaen",
    generation: "young",
    shirt: 0xd4674f,
    hair: 0x2a2523,
    skin: 0xe3b58c,
    build: "short",
    accessory: "backpack",
    hairStyle: "ponytail",
    outfit: "tee",
    carry: "none",
  },
  {
    key: "npc-arun",
    generation: "young",
    shirt: 0x6f8f5a,
    hair: 0x1f1a17,
    skin: 0x8d5a3b,
    build: "tall",
    accessory: "none",
    hairStyle: "curly",
    outfit: "hoodie",
    carry: "tote",
  },
  {
    key: "npc-nadia",
    generation: "young",
    shirt: 0x7b5aa6,
    hair: 0x3a2a20,
    skin: 0xcf9a6c,
    build: "short",
    accessory: "none",
    hairStyle: "ponytail",
    outfit: "tee",
    carry: "tote",
  },
  {
    key: "npc-kai",
    generation: "young",
    shirt: 0xd9a53c,
    hair: 0x2a2523,
    skin: 0xd39c6d,
    build: "short",
    accessory: "cap",
    hairStyle: "crop",
    outfit: "hoodie",
    carry: "none",
  },
  {
    key: "npc-priya",
    generation: "young",
    shirt: 0xc85c5c,
    hair: 0x241a14,
    skin: 0xb87f52,
    build: "tall",
    accessory: "backpack",
    hairStyle: "curly",
    outfit: "tee",
    carry: "none",
  },
  {
    key: "npc-long",
    generation: "elder",
    shirt: 0x5b748f,
    hair: 0xb6b0a7,
    skin: 0xd6a177,
    build: "short",
    accessory: "cane",
    hairStyle: "receding",
    outfit: "striped",
    carry: "none",
  },
  {
    key: "npc-ros",
    generation: "elder",
    shirt: 0xc76b52,
    hair: 0xb3ada5,
    skin: 0xa8703f,
    build: "wide",
    accessory: "apron",
    hairStyle: "bun",
    outfit: "floral",
    carry: "none",
  },
  {
    key: "npc-tan",
    generation: "elder",
    shirt: 0x596d55,
    hair: 0x827d77,
    skin: 0xcf9a6c,
    build: "tall",
    accessory: "glasses",
    hairStyle: "side-part",
    outfit: "work-vest",
    carry: "none",
  },
  {
    key: "npc-ben",
    generation: "young",
    shirt: 0x5e698a,
    hair: 0x2a2523,
    skin: 0xd6a177,
    build: "tall",
    accessory: "none",
    hairStyle: "crop",
    outfit: "plain",
    carry: "tote",
  },
] as const;

export interface CharacterArtAudit {
  residentCount: number;
  youngCount: number;
  adultCount: number;
  elderCount: number;
  hairStyleCount: number;
  outfitCount: number;
  buildCount: number;
  accessoryCount: number;
  carryingResidentCount: number;
}

export function getCharacterArtAudit(): CharacterArtAudit {
  return {
    residentCount: RESIDENT_ART.length,
    youngCount: RESIDENT_ART.filter((r) => r.generation === "young").length,
    adultCount: RESIDENT_ART.filter((r) => r.generation === "adult").length,
    elderCount: RESIDENT_ART.filter((r) => r.generation === "elder").length,
    hairStyleCount: new Set(RESIDENT_ART.map(({ hairStyle }) => hairStyle)).size,
    outfitCount: new Set(RESIDENT_ART.map(({ outfit }) => outfit)).size,
    buildCount: new Set(RESIDENT_ART.map(({ build }) => build)).size,
    accessoryCount: new Set(RESIDENT_ART.map(({ accessory }) => accessory)).size,
    carryingResidentCount: RESIDENT_ART.filter(({ carry }) => carry !== "none")
      .length,
  };
}

/**
 * Which resident artwork each estate walker uses.
 *
 * Lives here rather than in the scene so it stays Phaser-free and the cast mix
 * can be asserted in a unit test.
 */
export const ESTATE_NPC_ART_KEYS: Readonly<Partial<Record<NpcId, string>>> = {
  "aunty-mei": "npc-mei",
  "uncle-ravi": "npc-ravi",
  "mdm-siti": "npc-siti",
  "pak-yusof": "npc-yusof",
  "coach-meng": "npc-meng",
  "uncle-seng": "npc-seng",
  "auntie-minah": "npc-minah",
  "wei-ling": "npc-weiling",
  hafiz: "npc-hafiz",
  "jia-en": "npc-jiaen",
  arun: "npc-arun",
  nadia: "npc-nadia",
  kai: "npc-kai",
  priya: "npc-priya",
};
