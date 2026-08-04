export type ResidentBuild = "short" | "tall" | "wide";
export type ResidentAccessory = "glasses" | "cane" | "apron" | "none";
export type ResidentHairStyle =
  | "bob"
  | "bun"
  | "crop"
  | "receding"
  | "side-part";
export type ResidentOutfit =
  | "collared"
  | "floral"
  | "plain"
  | "striped"
  | "work-vest";
export type ResidentCarry = "none" | "tote";

export interface ResidentArtDefinition {
  key: string;
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
    key: "npc-long",
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
  hairStyleCount: number;
  outfitCount: number;
  buildCount: number;
  accessoryCount: number;
  carryingResidentCount: number;
}

export function getCharacterArtAudit(): CharacterArtAudit {
  return {
    residentCount: RESIDENT_ART.length,
    hairStyleCount: new Set(RESIDENT_ART.map(({ hairStyle }) => hairStyle)).size,
    outfitCount: new Set(RESIDENT_ART.map(({ outfit }) => outfit)).size,
    buildCount: new Set(RESIDENT_ART.map(({ build }) => build)).size,
    accessoryCount: new Set(RESIDENT_ART.map(({ accessory }) => accessory)).size,
    carryingResidentCount: RESIDENT_ART.filter(({ carry }) => carry !== "none")
      .length,
  };
}
