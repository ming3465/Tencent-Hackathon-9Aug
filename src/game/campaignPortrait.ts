import type { NpcId } from "./campaignTypes.js";

type PortraitBuild = "wide" | "regular" | "slim";
type PortraitAccessory = "apron" | "cane" | "glasses" | "none";
export type PortraitMood = "neutral" | "thoughtful" | "warm";
type PortraitHair =
  | "bob"
  | "bun"
  | "crop"
  | "fringe"
  | "glow"
  | "ponytail"
  | "side-part"
  | "soft-wave";
type PortraitMotif =
  | "chair"
  | "cup"
  | "door"
  | "keepsake"
  | "notice"
  | "pan"
  | "plant"
  | "ramp"
  | "route"
  | "shelf"
  | "tool"
  | "weave";

interface CampaignPortraitDefinition {
  shirt: string;
  hair: string;
  skin: string;
  accent: string;
  backdrop: string;
  build: PortraitBuild;
  accessory: PortraitAccessory;
  hairStyle: PortraitHair;
  motif: PortraitMotif;
  ageLines: 0 | 1 | 2;
}

export const CAMPAIGN_PORTRAITS: Readonly<
  Record<NpcId, CampaignPortraitDefinition>
> = {
  voice: {
    shirt: "#ad493d",
    hair: "#f2b84b",
    skin: "#fff6dc",
    accent: "#f2b84b",
    backdrop: "#173f4f",
    build: "regular",
    accessory: "none",
    hairStyle: "glow",
    motif: "door",
    ageLines: 0,
  },
  "aunty-mei": {
    shirt: "#c85c5c",
    hair: "#6b6560",
    skin: "#e3b58c",
    accent: "#f2b84b",
    backdrop: "#dce9be",
    build: "wide",
    accessory: "apron",
    hairStyle: "bun",
    motif: "plant",
    ageLines: 2,
  },
  "uncle-ravi": {
    shirt: "#3d7a80",
    hair: "#aaa49c",
    skin: "#b87f52",
    accent: "#f2b84b",
    backdrop: "#d9ece8",
    build: "slim",
    accessory: "glasses",
    hairStyle: "side-part",
    motif: "notice",
    ageLines: 2,
  },
  "mdm-siti": {
    shirt: "#7b5aa6",
    hair: "#4c3b5f",
    skin: "#cf9a6c",
    accent: "#f2b84b",
    backdrop: "#e8dded",
    build: "regular",
    accessory: "cane",
    hairStyle: "soft-wave",
    motif: "route",
    ageLines: 1,
  },
  "pak-yusof": {
    shirt: "#4a6fa5",
    hair: "#827d77",
    skin: "#cf9a6c",
    accent: "#d96756",
    backdrop: "#dce8ee",
    build: "wide",
    accessory: "none",
    hairStyle: "crop",
    motif: "tool",
    ageLines: 2,
  },
  "coach-meng": {
    shirt: "#d98a3c",
    hair: "#5a5550",
    skin: "#e3b58c",
    accent: "#287271",
    backdrop: "#f2e1bd",
    build: "slim",
    accessory: "none",
    hairStyle: "side-part",
    motif: "chair",
    ageLines: 1,
  },
  "uncle-seng": {
    shirt: "#8a6b3d",
    hair: "#a7a198",
    skin: "#e8c49b",
    accent: "#d96756",
    backdrop: "#eadfc5",
    build: "regular",
    accessory: "glasses",
    hairStyle: "crop",
    motif: "cup",
    ageLines: 2,
  },
  "auntie-minah": {
    shirt: "#2f7d5f",
    hair: "#2a2523",
    skin: "#a8703f",
    accent: "#f2b84b",
    backdrop: "#d8e5c9",
    build: "wide",
    accessory: "apron",
    hairStyle: "soft-wave",
    motif: "shelf",
    ageLines: 1,
  },
  "wei-ling": {
    shirt: "#c76a9a",
    hair: "#241f1c",
    skin: "#ecc6a0",
    accent: "#287271",
    backdrop: "#f0dce7",
    build: "slim",
    accessory: "none",
    hairStyle: "ponytail",
    motif: "keepsake",
    ageLines: 0,
  },
  "mr-long": {
    shirt: "#5b748f",
    hair: "#b6b0a7",
    skin: "#d6a177",
    accent: "#f2b84b",
    backdrop: "#dce2e4",
    build: "regular",
    accessory: "cane",
    hairStyle: "side-part",
    motif: "ramp",
    ageLines: 2,
  },
  "grandma-ros": {
    shirt: "#c76b52",
    hair: "#b3ada5",
    skin: "#a8703f",
    accent: "#f2b84b",
    backdrop: "#f0dfc8",
    build: "wide",
    accessory: "apron",
    hairStyle: "bun",
    motif: "pan",
    ageLines: 2,
  },
  "craftsman-tan": {
    shirt: "#596d55",
    hair: "#827d77",
    skin: "#cf9a6c",
    accent: "#d96756",
    backdrop: "#dce4d3",
    build: "slim",
    accessory: "glasses",
    hairStyle: "side-part",
    motif: "weave",
    ageLines: 2,
  },
  ben: {
    shirt: "#5e698a",
    hair: "#2a2523",
    skin: "#d6a177",
    accent: "#f2b84b",
    backdrop: "#dfe0ea",
    build: "slim",
    accessory: "none",
    hairStyle: "fringe",
    motif: "keepsake",
    ageLines: 0,
  },
};

function mixHex(colour: string, target: string, amount: number): string {
  const from = Number.parseInt(colour.slice(1), 16);
  const to = Number.parseInt(target.slice(1), 16);
  const channel = (shift: number): number => {
    const start = (from >> shift) & 0xff;
    const end = (to >> shift) & 0xff;
    return Math.round(start + (end - start) * amount);
  };
  return `#${(
    (channel(16) << 16)
    | (channel(8) << 8)
    | channel(0)
  ).toString(16).padStart(6, "0")}`;
}

function hairMarkup(
  style: PortraitHair,
  hair: string,
  highlight: string,
): string {
  if (style === "glow") {
    return `
      <rect x="55" y="47" width="110" height="12" fill="${highlight}"/>
      <rect x="43" y="59" width="134" height="12" fill="${hair}"/>
      <rect x="35" y="71" width="16" height="58" fill="${highlight}"/>
      <rect x="169" y="71" width="16" height="58" fill="${highlight}"/>`;
  }
  if (style === "bun") {
    return `
      <rect x="88" y="43" width="44" height="25" fill="#173f4f"/>
      <rect x="92" y="47" width="36" height="17" fill="${hair}"/>
      <rect x="61" y="63" width="98" height="38" fill="#173f4f"/>
      <rect x="67" y="68" width="86" height="28" fill="${hair}"/>
      <rect x="69" y="68" width="44" height="6" fill="${highlight}"/>
      <rect x="61" y="91" width="13" height="59" fill="${hair}"/>
      <rect x="146" y="91" width="13" height="59" fill="${hair}"/>`;
  }
  if (style === "bob" || style === "soft-wave") {
    return `
      <rect x="57" y="61" width="106" height="44" fill="#173f4f"/>
      <rect x="63" y="66" width="94" height="34" fill="${hair}"/>
      <rect x="63" y="92" width="17" height="76" fill="${hair}"/>
      <rect x="140" y="92" width="17" height="76" fill="${hair}"/>
      <rect x="69" y="68" width="45" height="7" fill="${highlight}"/>
      ${style === "soft-wave"
        ? `<rect x="57" y="119" width="12" height="20" fill="${hair}"/>
           <rect x="151" y="129" width="12" height="20" fill="${hair}"/>`
        : ""}`;
  }
  if (style === "ponytail") {
    return `
      <rect x="145" y="75" width="24" height="87" fill="#173f4f"/>
      <rect x="151" y="81" width="14" height="75" fill="${hair}"/>
      <rect x="61" y="61" width="98" height="40" fill="#173f4f"/>
      <rect x="67" y="67" width="86" height="28" fill="${hair}"/>
      <rect x="70" y="68" width="48" height="7" fill="${highlight}"/>
      <rect x="61" y="90" width="13" height="49" fill="${hair}"/>`;
  }
  if (style === "fringe") {
    return `
      <rect x="61" y="61" width="98" height="42" fill="#173f4f"/>
      <rect x="67" y="67" width="86" height="29" fill="${hair}"/>
      <rect x="67" y="91" width="21" height="22" fill="${hair}"/>
      <rect x="88" y="91" width="17" height="13" fill="${hair}"/>
      <rect x="67" y="68" width="44" height="6" fill="${highlight}"/>`;
  }
  if (style === "crop") {
    return `
      <rect x="63" y="63" width="94" height="34" fill="#173f4f"/>
      <rect x="69" y="69" width="82" height="22" fill="${hair}"/>
      <rect x="69" y="69" width="37" height="6" fill="${highlight}"/>
      <rect x="63" y="88" width="12" height="25" fill="${hair}"/>`;
  }
  return `
    <rect x="61" y="61" width="98" height="39" fill="#173f4f"/>
    <rect x="67" y="67" width="86" height="27" fill="${hair}"/>
    <rect x="67" y="91" width="24" height="17" fill="${hair}"/>
    <rect x="67" y="68" width="45" height="6" fill="${highlight}"/>
    <rect x="112" y="72" width="6" height="23" fill="#173f4f"/>`;
}

function motifMarkup(motif: PortraitMotif, accent: string): string {
  const ink = "#173f4f";
  if (motif === "plant") {
    return `<rect x="24" y="47" width="5" height="35" fill="${ink}"/>
      <rect x="12" y="53" width="16" height="10" fill="${accent}"/>
      <rect x="29" y="42" width="16" height="10" fill="${accent}"/>
      <rect x="18" y="81" width="24" height="7" fill="${ink}"/>`;
  }
  if (motif === "notice") {
    return `<rect x="12" y="42" width="39" height="45" fill="${ink}"/>
      <rect x="17" y="47" width="29" height="29" fill="#fff6dc"/>
      <rect x="21" y="52" width="20" height="5" fill="${accent}"/>
      <rect x="21" y="62" width="14" height="4" fill="${ink}"/>`;
  }
  if (motif === "route" || motif === "ramp") {
    return `<rect x="12" y="76" width="42" height="8" fill="${ink}"/>
      <rect x="19" y="64" width="35" height="8" fill="${accent}"/>
      <rect x="30" y="52" width="24" height="8" fill="${ink}"/>`;
  }
  if (motif === "tool") {
    return `<rect x="28" y="44" width="7" height="40" fill="${ink}"/>
      <rect x="19" y="43" width="25" height="8" fill="${accent}"/>
      <rect x="16" y="37" width="9" height="15" fill="${ink}"/>`;
  }
  if (motif === "chair") {
    return `<rect x="17" y="47" width="29" height="23" fill="${accent}"/>
      <rect x="12" y="70" width="39" height="7" fill="${ink}"/>
      <rect x="17" y="77" width="6" height="13" fill="${ink}"/>
      <rect x="40" y="77" width="6" height="13" fill="${ink}"/>`;
  }
  if (motif === "cup") {
    return `<rect x="15" y="53" width="29" height="25" fill="#fff6dc"/>
      <rect x="20" y="58" width="19" height="12" fill="${accent}"/>
      <rect x="44" y="58" width="9" height="14" fill="none" stroke="${ink}" stroke-width="5"/>
      <rect x="11" y="78" width="44" height="6" fill="${ink}"/>`;
  }
  if (motif === "shelf") {
    return `<rect x="11" y="43" width="44" height="7" fill="${ink}"/>
      <rect x="11" y="62" width="44" height="7" fill="${ink}"/>
      <rect x="11" y="81" width="44" height="7" fill="${ink}"/>
      <rect x="17" y="51" width="10" height="10" fill="${accent}"/>
      <rect x="34" y="70" width="14" height="10" fill="${accent}"/>`;
  }
  if (motif === "keepsake") {
    return `<rect x="12" y="45" width="42" height="34" fill="${ink}"/>
      <rect x="18" y="51" width="30" height="22" fill="#fff6dc"/>
      <rect x="24" y="55" width="18" height="14" fill="${accent}"/>
      <rect x="24" y="58" width="6" height="6" fill="#173f4f"/>`;
  }
  if (motif === "pan") {
    return `<rect x="12" y="51" width="34" height="29" fill="${ink}"/>
      <rect x="18" y="56" width="22" height="18" fill="${accent}"/>
      <rect x="46" y="59" width="13" height="7" fill="${ink}"/>
      <rect x="20" y="44" width="18" height="6" fill="#fff6dc"/>`;
  }
  if (motif === "weave") {
    return `<rect x="12" y="42" width="44" height="44" fill="${ink}"/>
      <rect x="18" y="48" width="32" height="32" fill="#fff6dc"/>
      <rect x="18" y="53" width="32" height="5" fill="${accent}"/>
      <rect x="18" y="66" width="32" height="5" fill="${accent}"/>
      <rect x="27" y="48" width="5" height="32" fill="${ink}"/>
      <rect x="40" y="48" width="5" height="32" fill="${ink}"/>`;
  }
  return `<rect x="14" y="39" width="40" height="51" fill="${accent}"/>
    <rect x="21" y="47" width="26" height="43" fill="#fff6dc"/>
    <rect x="29" y="64" width="10" height="18" fill="${ink}"/>`;
}

function accessoryMarkup(
  accessory: PortraitAccessory,
  skin: string,
  accent: string,
): string {
  if (accessory === "glasses") {
    return `<rect x="73" y="119" width="34" height="23" fill="none" stroke="#173f4f" stroke-width="6"/>
      <rect x="113" y="119" width="34" height="23" fill="none" stroke="#173f4f" stroke-width="6"/>
      <rect x="107" y="126" width="6" height="5" fill="#173f4f"/>
      <rect x="80" y="124" width="18" height="5" fill="#fff6dc" opacity="0.42"/>
      <rect x="120" y="124" width="18" height="5" fill="#fff6dc" opacity="0.42"/>`;
  }
  if (accessory === "cane") {
    return `<rect x="181" y="224" width="8" height="76" fill="#173f4f"/>
      <rect x="174" y="218" width="23" height="8" fill="#173f4f"/>
      <rect x="184" y="228" width="3" height="63" fill="${accent}"/>
      <rect x="173" y="218" width="16" height="4" fill="${skin}"/>`;
  }
  if (accessory === "apron") {
    return `<path d="M75 232 H145 L154 300 H66 Z" fill="#fff6dc"/>
      <rect x="81" y="239" width="58" height="7" fill="${accent}"/>
      <rect x="88" y="266" width="44" height="23" fill="${accent}"/>
      <rect x="94" y="271" width="32" height="5" fill="#fff6dc"/>`;
  }
  return "";
}

function expressionMarkup(
  mood: PortraitMood,
  ink: string,
  cream: string,
  skinLight: string,
  skinShade: string,
): string {
  const nose = `<rect x="106" y="130" width="8" height="22" fill="${skinShade}"/>
    <rect x="110" y="130" width="4" height="17" fill="${skinLight}"/>`;

  if (mood === "thoughtful") {
    return `
      <rect x="80" y="110" width="13" height="5" fill="${skinShade}"/>
      <rect x="93" y="113" width="14" height="5" fill="${skinShade}"/>
      <rect x="113" y="113" width="14" height="5" fill="${skinShade}"/>
      <rect x="127" y="110" width="13" height="5" fill="${skinShade}"/>
      <rect x="85" y="123" width="10" height="8" fill="${ink}"/>
      <rect x="125" y="123" width="10" height="8" fill="${ink}"/>
      <rect x="86" y="124" width="5" height="4" fill="${cream}" opacity="0.88"/>
      <rect x="126" y="124" width="5" height="4" fill="${cream}" opacity="0.88"/>
      <rect x="86" y="124" width="2" height="2" fill="${cream}"/>
      <rect x="126" y="124" width="2" height="2" fill="${cream}"/>
      ${nose}
      <rect x="100" y="162" width="20" height="5" fill="${ink}"/>
      <rect x="114" y="166" width="10" height="4" fill="${ink}"/>
      <rect x="103" y="162" width="15" height="2" fill="#d96756"/>
      <rect x="81" y="137" width="8" height="5" fill="#d96756" opacity="0.28"/>
      <rect x="131" y="137" width="8" height="5" fill="#d96756" opacity="0.28"/>`;
  }

  if (mood === "warm") {
    return `
      <rect x="81" y="111" width="25" height="5" fill="${skinShade}"/>
      <rect x="114" y="111" width="25" height="5" fill="${skinShade}"/>
      <rect x="85" y="124" width="10" height="6" fill="${ink}"/>
      <rect x="125" y="124" width="10" height="6" fill="${ink}"/>
      <rect x="87" y="124" width="6" height="2" fill="${cream}" opacity="0.9"/>
      <rect x="127" y="124" width="6" height="2" fill="${cream}" opacity="0.9"/>
      ${nose}
      <rect x="95" y="159" width="5" height="6" fill="${ink}"/>
      <rect x="120" y="159" width="5" height="6" fill="${ink}"/>
      <rect x="100" y="164" width="20" height="6" fill="${ink}"/>
      <rect x="103" y="164" width="14" height="3" fill="#d96756"/>
      <rect x="80" y="137" width="10" height="6" fill="#d96756" opacity="0.42"/>
      <rect x="130" y="137" width="10" height="6" fill="#d96756" opacity="0.42"/>`;
  }

  return `
    <rect x="80" y="113" width="27" height="5" fill="${skinShade}"/>
    <rect x="113" y="113" width="27" height="5" fill="${skinShade}"/>
    <rect x="85" y="123" width="10" height="8" fill="${ink}"/>
    <rect x="125" y="123" width="10" height="8" fill="${ink}"/>
    <rect x="87" y="124" width="5" height="4" fill="${cream}" opacity="0.88"/>
    <rect x="127" y="124" width="5" height="4" fill="${cream}" opacity="0.88"/>
    <rect x="88" y="124" width="2" height="2" fill="${cream}"/>
    <rect x="128" y="124" width="2" height="2" fill="${cream}"/>
    ${nose}
    <rect x="95" y="162" width="30" height="6" fill="${ink}"/>
    <rect x="101" y="162" width="18" height="3" fill="#d96756"/>
    <rect x="81" y="137" width="8" height="5" fill="#d96756" opacity="0.34"/>
    <rect x="131" y="137" width="8" height="5" fill="#d96756" opacity="0.34"/>`;
}

function renderEstatePortrait(): string {
  return `<svg
    viewBox="0 0 220 300"
    shape-rendering="crispEdges"
    role="presentation"
    data-portrait-id="estate"
    data-hair-style="none"
    data-accessory="none"
    data-mood="neutral"
  >
    <rect width="220" height="300" fill="#dce9be"/>
    <rect width="220" height="18" fill="#f2b84b"/>
    <rect x="17" y="52" width="186" height="145" fill="#173f4f"/>
    <rect x="25" y="60" width="170" height="125" fill="#fff6dc"/>
    <rect x="25" y="146" width="170" height="39" fill="#287271"/>
    <rect x="42" y="78" width="34" height="43" fill="#173f4f"/>
    <rect x="48" y="84" width="22" height="30" fill="#91bdc0"/>
    <rect x="93" y="78" width="34" height="43" fill="#173f4f"/>
    <rect x="99" y="84" width="22" height="30" fill="#91bdc0"/>
    <rect x="144" y="78" width="34" height="43" fill="#173f4f"/>
    <rect x="150" y="84" width="22" height="30" fill="#91bdc0"/>
    <rect x="91" y="135" width="38" height="50" fill="#173f4f"/>
    <rect x="98" y="142" width="24" height="43" fill="#d96756"/>
    <path d="M86 300 L100 191 H120 L134 300 Z" fill="#ead9b7"/>
    <rect x="0" y="243" width="220" height="57" fill="#94bc70"/>
    <rect x="27" y="207" width="12" height="65" fill="#6b4d3c"/>
    <rect x="9" y="195" width="49" height="31" fill="#173f4f"/>
    <rect x="15" y="201" width="37" height="19" fill="#5b8c5a"/>
    <rect x="156" y="222" width="44" height="8" fill="#173f4f"/>
    <rect x="161" y="212" width="34" height="10" fill="#d96756"/>
    <rect x="163" y="230" width="6" height="20" fill="#173f4f"/>
    <rect x="187" y="230" width="6" height="20" fill="#173f4f"/>
  </svg>`;
}

export function renderCampaignPortrait(
  npcId: NpcId | null,
  mood: PortraitMood = "neutral",
): string {
  if (!npcId) return renderEstatePortrait();
  const profile = CAMPAIGN_PORTRAITS[npcId];
  const ink = "#173f4f";
  const night = "#102e3b";
  const cream = "#fff6dc";
  const skinLight = mixHex(profile.skin, cream, 0.22);
  const skinShade = mixHex(profile.skin, night, 0.22);
  const hairHighlight = mixHex(profile.hair, cream, 0.24);
  const shirtLight = mixHex(profile.shirt, cream, 0.18);
  const shoulderLeft =
    profile.build === "wide" ? 18 : profile.build === "slim" ? 38 : 28;
  const shoulderRight = 220 - shoulderLeft;
  const ageLines = profile.ageLines > 0
    ? `<rect x="72" y="146" width="13" height="3" fill="${skinShade}"/>
       <rect x="135" y="146" width="13" height="3" fill="${skinShade}"/>`
    : "";
  const extraAgeLine = profile.ageLines > 1
    ? `<rect x="78" y="154" width="10" height="3" fill="${skinShade}"/>
       <rect x="132" y="154" width="10" height="3" fill="${skinShade}"/>
       <rect x="103" y="174" width="14" height="3" fill="${skinShade}"/>`
    : "";

  return `<svg
    viewBox="0 0 220 300"
    shape-rendering="crispEdges"
    role="presentation"
    data-portrait-id="${npcId}"
    data-hair-style="${profile.hairStyle}"
    data-accessory="${profile.accessory}"
    data-mood="${mood}"
  >
    <defs>
      <!-- Radial face highlight: soft light from top-left -->
      <radialGradient id="pg-face-${npcId}" cx="38%" cy="28%" r="52%">
        <stop offset="0%"  stop-color="${skinLight}" stop-opacity="0.72"/>
        <stop offset="100%" stop-color="${skinShade}" stop-opacity="0"/>
      </radialGradient>
      <!-- Backdrop depth: vignette around edges -->
      <radialGradient id="pg-vign-${npcId}" cx="50%" cy="50%" r="65%">
        <stop offset="60%"  stop-color="${profile.backdrop}" stop-opacity="0"/>
        <stop offset="100%" stop-color="${night}" stop-opacity="0.38"/>
      </radialGradient>
      <!-- Spotlight from top-centre for Stardew-style warmth -->
      <radialGradient id="pg-spot-${npcId}" cx="50%" cy="0%" r="80%">
        <stop offset="0%"  stop-color="${cream}" stop-opacity="0.12"/>
        <stop offset="100%" stop-color="${cream}" stop-opacity="0"/>
      </radialGradient>
    </defs>

    <rect width="220" height="300" fill="${profile.backdrop}"/>
    <!-- Backdrop vignette depth -->
    <rect width="220" height="300" fill="url(#pg-vign-${npcId})"/>
    <!-- Accent header stripe -->
    <rect width="220" height="18" fill="${profile.accent}"/>
    <!-- Stripe highlight shimmer -->
    <rect width="110" height="8" fill="${cream}" opacity="0.12"/>
    <!-- Side shadow pillars -->
    <rect x="0" y="18" width="8" height="282" fill="${ink}" opacity="0.18"/>
    <rect x="212" y="18" width="8" height="282" fill="${ink}" opacity="0.18"/>
    <!-- Ground shadow plane -->
    <path d="M0 207 L74 151 L220 209 V300 H0 Z" fill="${ink}" opacity="0.11"/>
    <!-- Spot light from above -->
    <rect width="220" height="300" fill="url(#pg-spot-${npcId})"/>
    ${motifMarkup(profile.motif, profile.accent)}

    <!-- Character drop shadow -->
    <ellipse cx="110" cy="294" rx="54" ry="8" fill="${night}" opacity="0.28"/>

    <path d="M${shoulderLeft} 300 V258 L54 223 H166 L${shoulderRight} 258 V300 Z" fill="${ink}"/>
    <path d="M${shoulderLeft + 7} 300 V263 L59 230 H161 L${shoulderRight - 7} 263 V300 Z" fill="${profile.shirt}"/>
    <path d="M${shoulderLeft + 8} 264 L59 230 H161 L${shoulderRight - 8} 264 V275 L160 242 H60 L${shoulderLeft + 8} 275 Z" fill="${shirtLight}"/>
    <rect x="91" y="182" width="38" height="48" fill="${ink}"/>
    <rect x="97" y="184" width="26" height="42" fill="${profile.skin}"/>
    <rect x="97" y="184" width="7" height="42" fill="${skinLight}"/>
    <rect x="116" y="184" width="7" height="42" fill="${skinShade}"/>

    <rect x="55" y="111" width="19" height="44" fill="${ink}"/>
    <rect x="146" y="111" width="19" height="44" fill="${ink}"/>
    <rect x="60" y="116" width="14" height="34" fill="${profile.skin}"/>
    <rect x="146" y="116" width="14" height="34" fill="${profile.skin}"/>
    <path d="M64 72 H156 V156 L142 191 H78 L64 156 Z" fill="${ink}"/>
    <path d="M70 78 H150 V153 L138 184 H82 L70 153 Z" fill="${profile.skin}"/>
    <rect x="70" y="78" width="9" height="75" fill="${skinLight}"/>
    <rect x="141" y="78" width="9" height="75" fill="${skinShade}"/>
    <!-- Face radial highlight overlay -->
    <path d="M70 78 H150 V153 L138 184 H82 L70 153 Z" fill="url(#pg-face-${npcId})" opacity="0.55"/>
    ${expressionMarkup(mood, ink, cream, skinLight, skinShade)}
    ${ageLines}
    ${extraAgeLine}
    ${hairMarkup(profile.hairStyle, profile.hair, hairHighlight)}
    ${accessoryMarkup(profile.accessory, profile.skin, profile.accent)}
    <path d="M82 218 L110 241 L138 218" fill="none" stroke="${ink}" stroke-width="6"/>
    <rect x="104" y="235" width="12" height="12" fill="${profile.accent}"/>
  </svg>`;
}
