import Phaser from "phaser";
import {
  darkenColour,
  lightenColour,
  PALETTE,
} from "./campaignArt.js";

const INK = PALETTE.ink;
const NIGHT = PALETTE.night;
const CREAM = PALETTE.cream;
const CORAL = PALETTE.coral;
const GOLD = PALETTE.gold;
const TEAL = PALETTE.teal;
const GREEN = PALETTE.green;
const PURPLE = PALETTE.purple;
const CONCRETE = PALETTE.concrete;
const CONCRETE_EDGE = PALETTE.concreteEdge;

export const CONSEQUENCE_ART_IDS = {
  exteriorRamp: "ramp-exterior-three-quarter-v1",
  interiorRamp: "ramp-interior-three-quarter-v1",
  gardenHerbs: "garden-raised-herbs-v1",
  gardenFlowersSeat: "garden-flowers-shaded-seat-v1",
  shelteredRoute: "sheltered-linkway-extension-v1",
} as const;

export type ConsequenceArtId =
  (typeof CONSEQUENCE_ART_IDS)[keyof typeof CONSEQUENCE_ART_IDS];

export interface CampaignConsequenceArtSnapshot {
  exteriorRamp: typeof CONSEQUENCE_ART_IDS.exteriorRamp | null;
  interiorRamp: typeof CONSEQUENCE_ART_IDS.interiorRamp | null;
  garden:
    | typeof CONSEQUENCE_ART_IDS.gardenHerbs
    | typeof CONSEQUENCE_ART_IDS.gardenFlowersSeat
    | null;
  shelteredRoute: typeof CONSEQUENCE_ART_IDS.shelteredRoute | null;
}

export function emptyConsequenceArtSnapshot(): CampaignConsequenceArtSnapshot {
  return {
    exteriorRamp: null,
    interiorRamp: null,
    garden: null,
    shelteredRoute: null,
  };
}

function point(x: number, y: number): Phaser.Geom.Point {
  return new Phaser.Geom.Point(Math.round(x), Math.round(y));
}

function depthFor(y: number, layer = 0): number {
  return y * 10 + layer;
}

function drawRail(
  graphics: Phaser.GameObjects.Graphics,
  topX: number,
  topY: number,
  bottomX: number,
  bottomY: number,
): void {
  graphics
    .lineStyle(8, INK)
    .lineBetween(topX, topY, bottomX, bottomY)
    .lineBetween(topX, topY, topX, topY + 21)
    .lineBetween(bottomX, bottomY, bottomX, bottomY + 24)
    .lineStyle(3, lightenColour(TEAL, 0.3))
    .lineBetween(topX, topY - 1, bottomX, bottomY - 1)
    .lineBetween(topX - 1, topY, topX - 1, topY + 18)
    .lineBetween(bottomX - 1, bottomY, bottomX - 1, bottomY + 20);
}

function drawTactileEdge(
  graphics: Phaser.GameObjects.Graphics,
  left: number,
  top: number,
  width: number,
): void {
  graphics
    .fillStyle(INK)
    .fillRect(left - 3, top - 3, width + 6, 13)
    .fillStyle(GOLD)
    .fillRect(left, top, width, 7);
  for (let x = left + 5; x < left + width - 3; x += 12) {
    graphics
      .fillStyle(CREAM, 0.9)
      .fillRect(x, top + 2, 4, 3);
  }
}

export function drawExteriorRamp(
  scene: Phaser.Scene,
): Phaser.GameObjects.GameObject[] {
  const ramp = scene.add.graphics().setDepth(depthFor(370, 1));
  ramp
    .fillStyle(NIGHT, 0.23)
    .fillPoints(
      [point(593, 358), point(709, 358), point(722, 374), point(607, 379)],
      true,
    )
    .fillStyle(INK)
    .fillPoints(
      [point(617, 299), point(683, 299), point(716, 359), point(590, 359)],
      true,
    )
    .fillStyle(darkenColour(CONCRETE_EDGE, 0.12))
    .fillPoints(
      [point(596, 354), point(710, 354), point(710, 370), point(603, 372)],
      true,
    )
    .fillStyle(darkenColour(CONCRETE, 0.18))
    .fillPoints(
      [point(678, 304), point(710, 354), point(710, 370), point(678, 317)],
      true,
    )
    .fillStyle(CONCRETE)
    .fillPoints(
      [point(620, 304), point(678, 304), point(706, 352), point(596, 352)],
      true,
    )
    .fillStyle(lightenColour(CONCRETE, 0.34))
    .fillPoints(
      [point(622, 307), point(638, 307), point(614, 349), point(600, 349)],
      true,
    )
    .lineStyle(2, CONCRETE_EDGE, 0.7)
    .lineBetween(626, 315, 682, 315)
    .lineBetween(616, 330, 691, 330)
    .lineBetween(605, 345, 701, 345);
  drawTactileEdge(ramp, 601, 347, 99);

  const rails = scene.add.graphics().setDepth(depthFor(374, 4));
  drawRail(rails, 618, 291, 590, 345);
  drawRail(rails, 682, 291, 710, 345);
  rails
    .fillStyle(NIGHT, 0.24)
    .fillEllipse(590, 371, 22, 8)
    .fillEllipse(710, 371, 22, 8)
    .fillStyle(INK)
    .fillRect(584, 365, 12, 6)
    .fillRect(704, 365, 12, 6)
    .fillStyle(lightenColour(TEAL, 0.18))
    .fillRect(587, 365, 4, 4)
    .fillRect(707, 365, 4, 4);

  return [ramp, rails];
}

export function drawInteriorRamp(
  scene: Phaser.Scene,
): Phaser.GameObjects.GameObject[] {
  const ramp = scene.add.graphics().setDepth(depthFor(570, 1));
  ramp
    .fillStyle(NIGHT, 0.22)
    .fillPoints(
      [point(398, 568), point(560, 568), point(574, 581), point(413, 584)],
      true,
    )
    .fillStyle(INK)
    .fillPoints(
      [point(446, 520), point(514, 520), point(566, 568), point(394, 568)],
      true,
    )
    .fillStyle(darkenColour(CONCRETE_EDGE, 0.12))
    .fillPoints(
      [point(400, 563), point(560, 563), point(560, 578), point(409, 580)],
      true,
    )
    .fillStyle(darkenColour(CONCRETE, 0.2))
    .fillPoints(
      [point(510, 525), point(560, 563), point(560, 578), point(510, 537)],
      true,
    )
    .fillStyle(CONCRETE)
    .fillPoints(
      [point(449, 525), point(510, 525), point(556, 561), point(404, 561)],
      true,
    )
    .fillStyle(lightenColour(CONCRETE, 0.33))
    .fillPoints(
      [point(451, 528), point(466, 528), point(432, 558), point(410, 558)],
      true,
    )
    .lineStyle(2, CONCRETE_EDGE, 0.65)
    .lineBetween(441, 537, 519, 537)
    .lineBetween(421, 550, 538, 550);
  drawTactileEdge(ramp, 414, 555, 130);

  const rails = scene.add.graphics().setDepth(depthFor(582, 4));
  drawRail(rails, 445, 515, 397, 557);
  drawRail(rails, 515, 515, 563, 557);
  rails
    .fillStyle(NIGHT, 0.24)
    .fillEllipse(397, 579, 21, 8)
    .fillEllipse(563, 579, 21, 8)
    .fillStyle(INK)
    .fillRect(391, 573, 12, 6)
    .fillRect(557, 573, 12, 6);

  return [ramp, rails];
}

function drawRaisedBed(
  graphics: Phaser.GameObjects.Graphics,
  left: number,
  top: number,
  width: number,
  depth: number,
): void {
  graphics
    .fillStyle(NIGHT, 0.2)
    .fillEllipse(left + width / 2 + 5, top + depth + 13, width + 16, 22)
    .fillStyle(INK)
    .fillPoints(
      [
        point(left, top),
        point(left + width, top),
        point(left + width + 9, top + depth),
        point(left + 9, top + depth),
      ],
      true,
    )
    .fillStyle(0x76523c)
    .fillPoints(
      [
        point(left + 5, top + 5),
        point(left + width - 5, top + 5),
        point(left + width + 2, top + depth - 4),
        point(left + 12, top + depth - 4),
      ],
      true,
    )
    .fillStyle(0x9b714b)
    .fillPoints(
      [
        point(left + 10, top + depth - 8),
        point(left + width + 2, top + depth - 8),
        point(left + width + 2, top + depth + 4),
        point(left + 10, top + depth + 4),
      ],
      true,
    )
    .fillStyle(lightenColour(0x9b714b, 0.25))
    .fillRect(left + 12, top + depth - 7, width - 10, 3);
}

function drawLeafCluster(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale: number,
): void {
  graphics
    .lineStyle(Math.max(2, scale), darkenColour(GREEN, 0.28))
    .lineBetween(x, y + 12 * scale, x, y)
    .fillStyle(darkenColour(GREEN, 0.12))
    .fillEllipse(x - 4 * scale, y + 3 * scale, 8 * scale, 5 * scale)
    .fillEllipse(x + 4 * scale, y + 6 * scale, 8 * scale, 5 * scale)
    .fillStyle(lightenColour(GREEN, 0.18))
    .fillEllipse(x + 2 * scale, y, 7 * scale, 5 * scale)
    .fillEllipse(x - 3 * scale, y + 8 * scale, 7 * scale, 5 * scale);
}

export function drawHerbGarden(
  scene: Phaser.Scene,
): Phaser.GameObjects.GameObject[] {
  const beds = scene.add.graphics().setDepth(depthFor(790, 1));
  drawRaisedBed(beds, 1048, 740, 100, 33);
  drawRaisedBed(beds, 1168, 728, 104, 37);

  const plants = scene.add.graphics().setDepth(depthFor(794, 4));
  for (const [x, height] of [
    [1072, 33],
    [1083, 43],
    [1095, 37],
    [1107, 47],
    [1119, 35],
  ] as const) {
    plants
      .lineStyle(5, INK)
      .lineBetween(x, 753, x + (x % 3) - 1, 753 - height)
      .lineStyle(2, lightenColour(GREEN, 0.26))
      .lineBetween(x - 1, 752, x + (x % 3) - 2, 754 - height);
  }
  for (const [x, y, scale] of [
    [1191, 737, 1],
    [1210, 730, 1],
    [1229, 738, 1],
    [1249, 729, 1],
  ] as const) {
    drawLeafCluster(plants, x, y, scale);
  }
  plants
    .fillStyle(CREAM)
    .fillRect(1139, 719, 22, 15)
    .fillRect(1254, 706, 22, 15)
    .fillStyle(INK)
    .fillRect(1143, 723, 14, 3)
    .fillRect(1258, 710, 14, 3)
    .fillStyle(GOLD)
    .fillRect(1148, 734, 4, 13)
    .fillRect(1263, 721, 4, 13);

  return [beds, plants];
}

function drawFlower(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  colour: number,
): void {
  graphics
    .lineStyle(3, darkenColour(GREEN, 0.18))
    .lineBetween(x, y + 12, x, y + 3)
    .fillStyle(INK)
    .fillCircle(x, y, 7)
    .fillStyle(colour)
    .fillRect(x - 5, y - 3, 4, 6)
    .fillRect(x + 1, y - 3, 4, 6)
    .fillRect(x - 2, y - 6, 4, 12)
    .fillStyle(GOLD)
    .fillRect(x - 2, y - 2, 4, 4);
}

export function drawFlowerSeatGarden(
  scene: Phaser.Scene,
): Phaser.GameObjects.GameObject[] {
  const bed = scene.add.graphics().setDepth(depthFor(790, 1));
  drawRaisedBed(bed, 1042, 746, 100, 30);
  drawRaisedBed(bed, 1184, 744, 92, 31);

  const flowers = scene.add.graphics().setDepth(depthFor(794, 3));
  const flowerColours = [CORAL, GOLD, PURPLE, CREAM] as const;
  for (let flower = 0; flower < 8; flower += 1) {
    const leftSide = flower < 4;
    const index = flower % 4;
    drawFlower(
      flowers,
      (leftSide ? 1060 : 1201) + index * 20,
      (leftSide ? 745 : 742) - (index % 2) * 7,
      flowerColours[flower % flowerColours.length],
    );
  }

  const seat = scene.add.graphics().setDepth(depthFor(788, 5));
  seat
    .fillStyle(NIGHT, 0.22)
    .fillEllipse(1159, 788, 112, 20)
    .fillStyle(INK)
    .fillRect(1107, 739, 105, 14)
    .fillRect(1113, 757, 95, 15)
    .fillRect(1118, 772, 9, 18)
    .fillRect(1194, 772, 9, 18)
    .fillStyle(0x9b714b)
    .fillRect(1112, 742, 95, 7)
    .fillStyle(lightenColour(0x9b714b, 0.3))
    .fillRect(1114, 742, 91, 3)
    .fillStyle(TEAL)
    .fillRect(1118, 759, 84, 8)
    .fillStyle(lightenColour(TEAL, 0.24))
    .fillRect(1118, 759, 84, 3);

  return [bed, flowers, seat];
}

function drawLinkwayPost(
  scene: Phaser.Scene,
  x: number,
  footY: number,
): Phaser.GameObjects.Graphics {
  const post = scene.add.graphics().setDepth(depthFor(footY, 3));
  post
    .fillStyle(NIGHT, 0.2)
    .fillEllipse(x + 6, footY + 5, 28, 10)
    .fillStyle(INK)
    .fillRect(x - 8, 832, 17, footY - 829)
    .fillStyle(darkenColour(TEAL, 0.12))
    .fillRect(x - 4, 836, 9, footY - 837)
    .fillStyle(lightenColour(TEAL, 0.3))
    .fillRect(x - 3, 836, 3, footY - 840)
    .fillStyle(INK)
    .fillRect(x - 12, footY - 2, 25, 8)
    .fillStyle(CONCRETE_EDGE)
    .fillRect(x - 8, footY, 17, 4);
  return post;
}

export function drawShelteredLinkway(
  scene: Phaser.Scene,
): Phaser.GameObjects.GameObject[] {
  const groundShade = scene.add.graphics().setDepth(depthFor(806));
  groundShade
    .fillStyle(NIGHT, 0.13)
    .fillPoints(
      [point(430, 840), point(770, 840), point(780, 950), point(420, 950)],
      true,
    );
  for (let band = 0; band < 5; band += 1) {
    const x = 434 + band * 71;
    groundShade
      .fillStyle(NIGHT, band % 2 === 0 ? 0.09 : 0.055)
      .fillPoints(
        [
          point(x, 844),
          point(x + 31, 844),
          point(x + 66, 948),
          point(x + 34, 948),
        ],
        true,
      );
  }

  const supports = [438, 518, 600, 682, 762].map((x, index) =>
    drawLinkwayPost(scene, x, 939 + (index % 2) * 3),
  );

  const roof = scene.add.graphics().setDepth(depthFor(844, 5));
  roof
    .fillStyle(NIGHT, 0.24)
    .fillPoints(
      [point(426, 816), point(760, 816), point(780, 838), point(444, 838)],
      true,
    )
    .fillStyle(INK)
    .fillPoints(
      [point(420, 805), point(756, 805), point(780, 829), point(444, 829)],
      true,
    )
    .fillStyle(TEAL)
    .fillPoints(
      [point(426, 809), point(753, 809), point(772, 826), point(447, 826)],
      true,
    )
    .fillStyle(lightenColour(TEAL, 0.3))
    .fillPoints(
      [point(431, 811), point(750, 811), point(755, 815), point(435, 815)],
      true,
    )
    .fillStyle(darkenColour(TEAL, 0.26))
    .fillPoints(
      [point(444, 829), point(780, 829), point(775, 846), point(438, 846)],
      true,
    )
    .fillStyle(CREAM, 0.62)
    .fillPoints(
      [point(449, 832), point(772, 832), point(770, 839), point(446, 839)],
      true,
    )
    .fillStyle(INK)
    .fillRect(438, 842, 337, 7);
  for (let seam = 1; seam < 5; seam += 1) {
    const backX = 426 + seam * 65;
    const frontX = 447 + seam * 65;
    roof
      .fillStyle(darkenColour(TEAL, 0.24), 0.72)
      .fillPoints(
        [
          point(backX - 1, 810),
          point(backX + 2, 810),
          point(frontX + 2, 825),
          point(frontX - 1, 825),
        ],
        true,
      );
  }

  return [groundShade, ...supports, roof];
}
