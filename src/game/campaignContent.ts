import type {
  CampaignEvent,
  ChapterDefinition,
  ChapterId,
  FlavourInteractionDefinition,
  IntentChoiceDefinition,
  KampungMeters,
  LocationDefinition,
  LocationId,
  NpcIntentDefinition,
  NpcProfile,
  QuestDefinition,
  QuestId,
} from "./campaignTypes.js";
import {
  BLOCK_12_BICYCLE_RACK,
  BLOCK_9_BICYCLE_RACK,
} from "./estateLayout.js";

export const ESTATE_FLAVOUR_INTERACTIONS:
readonly FlavourInteractionDefinition[] = [
  {
    id: "estate-shared-bicycles",
    label: "Look at the shared bicycles",
    shortLabel: "Shared bicycles",
    lines: [
      "Two baskets carry hand-painted unit numbers. A tyre pump hangs between them with a note: “Return after your errand.”",
    ],
    x: BLOCK_9_BICYCLE_RACK.x,
    y: BLOCK_9_BICYCLE_RACK.y,
  },
  {
    id: "estate-void-deck-bench",
    label: "Inspect the repaired void-deck bench",
    shortLabel: "Repaired bench",
    lines: [
      "One timber slat is newer than the others. Someone has pencilled the repair date underneath, where rain cannot reach it.",
    ],
    x: 470,
    y: 485,
  },
  {
    id: "estate-pond-lilies",
    label: "Watch the pond lilies",
    shortLabel: "Pond lilies",
    lines: [
      "Small rings pass between the lily pads. A low stone edge leaves room to pause without blocking the path.",
    ],
    x: 300,
    y: 710,
  },
  {
    id: "estate-garden-labels",
    label: "Read the garden labels",
    shortLabel: "Garden labels",
    lines: [
      "The labels name each plant and the neighbour who knows how to use it. Practical knowledge grows beside the flowers.",
    ],
    x: 1160,
    y: 760,
  },
  {
    id: "estate-tray-return",
    label: "Look at the hawker tray-return station",
    shortLabel: "Tray return",
    lines: [
      "Pictures, large words, and two shelf heights make the return station easy to understand from either side.",
    ],
    x: 1550,
    y: 475,
  },
  {
    id: "estate-kopitiam-tables",
    label: "Look at the kopitiam tables",
    shortLabel: "Morning tables",
    lines: [
      "The tables leave one chair turned outward. Uncle Seng says an open place is a quieter invitation than a sign.",
    ],
    x: 1510,
    y: 610,
  },
  {
    id: "estate-provision-crates",
    label: "Inspect Minah's provision crates",
    shortLabel: "Provision crates",
    lines: [
      "The heaviest tins sit between knee and shoulder height. Handwritten shelf cards group ingredients by meal, not brand.",
    ],
    x: 2210,
    y: 475,
  },
  {
    id: "estate-dragon-playground",
    label: "Look at the mosaic dragon",
    shortLabel: "Mosaic dragon",
    lines: [
      "Its tiles have been patched in several shades. The repairs make a second pattern instead of hiding the first.",
    ],
    x: 1700,
    y: 1010,
  },
  {
    id: "estate-exercise-corner",
    label: "Inspect the exercise corner",
    shortLabel: "Exercise corner",
    lines: [
      "The stations face one another, leaving a clear middle where neighbours can talk without joining in.",
    ],
    x: 1430,
    y: 1225,
  },
  {
    id: "estate-community-bench",
    label: "Look at the community-centre bench",
    shortLabel: "Community bench",
    lines: [
      "A clear space beside the bench is kept free. The arrangement welcomes wheels, walking aids, bags, and extra chairs.",
    ],
    x: 1720,
    y: 1110,
  },
  {
    id: "estate-block-twelve-bicycles",
    label: "Look at the Block 12 bicycle rack",
    shortLabel: "Block 12 rack",
    lines: [
      "A child-sized helmet hangs beside a silver bell. Different errands share the same rack.",
    ],
    x: BLOCK_12_BICYCLE_RACK.x,
    y: BLOCK_12_BICYCLE_RACK.y,
  },
  {
    id: "estate-prayer-hall-garden",
    label: "Look at the prayer-hall garden edge",
    shortLabel: "Hall garden",
    lines: [
      "Low planting keeps the doorway visible from the path. A broad paved edge gives arrivals room to greet one another.",
    ],
    x: 2190,
    y: 1240,
  },
  {
    id: "estate-workshop-timber",
    label: "Inspect the workshop timber rack",
    shortLabel: "Timber rack",
    lines: [
      "Offcuts are sorted by width and tied in small bundles. Nothing useful is too short until the craftsperson decides.",
    ],
    x: 1260,
    y: 1420,
  },
  {
    id: "estate-sheltered-link",
    label: "Look along the sheltered link",
    shortLabel: "Sheltered link",
    lines: [
      "The roof follows the everyday route between seats, shops, and homes. Its value is clearest when the weather changes.",
    ],
    x: 650,
    y: 910,
  },
];

export const CHAPTERS: readonly ChapterDefinition[] = [
  {
    id: "prologue",
    numberLabel: "Prologue",
    title: "Y's Flat",
    summary: "Wake to a familiar voice and take the first open door.",
    journalObjective: "Listen to the Voice, then leave Y's flat.",
    entryLocationId: "y-flat",
  },
  {
    id: "chapter-1",
    numberLabel: "Chapter 1",
    title: "Open the Way",
    summary: "Mr. Long's doorstep needs the block's practical knowledge.",
    journalObjective: "Visit Mr. Long, then recruit distinct neighbours to build the ramp.",
    entryLocationId: "hdb-corridor",
  },
  {
    id: "chapter-2",
    numberLabel: "Chapter 2",
    title: "A Place at the Table",
    summary: "Follow the estate's clues to Grandma Ros and gather a cooking lesson.",
    journalObjective: "Find two clues about Grandma Ros, enter her kitchen, and invite residents.",
    entryLocationId: "estate",
  },
  {
    id: "chapter-3",
    numberLabel: "Chapter 3",
    title: "Hands Remember",
    summary: "Reconnect Ben and a craftsman through patient, shared making.",
    journalObjective: "Visit the workshop, find two clues about Ben, then weave together.",
    entryLocationId: "craftsman-workshop",
  },
  {
    id: "ending",
    numberLabel: "Ending",
    title: "The Last Door",
    summary: "Return to Y's flat and learn who the Voice has been waiting for.",
    journalObjective: "Return to Y's flat. The last door is open.",
    entryLocationId: "y-flat",
  },
];

export const QUESTS: readonly QuestDefinition[] = [
  {
    id: "prologue-voice",
    chapterId: "prologue",
    title: "The First Door",
    summary: "Listen to the Voice and step into the corridor.",
    optional: false,
    npcId: "voice",
    objectiveIds: ["heard-voice", "left-y-flat"],
  },
  {
    id: "open-the-way",
    chapterId: "chapter-1",
    title: "Open the Way",
    summary: "See Mr. Long's broken step and gather distinct helpers.",
    optional: false,
    npcId: "mr-long",
    objectiveIds: ["mr-long-step-seen", "ramp-built", "mr-long-outside"],
  },
  {
    id: "garden-request",
    chapterId: "chapter-1",
    title: "A Garden People Use",
    summary: "Restore the garden with useful herbs or seating flowers.",
    optional: true,
    npcId: "aunty-mei",
    objectiveIds: ["request:garden-request"],
  },
  {
    id: "noticeboard-request",
    chapterId: "chapter-1",
    title: "An Invitation, Not a Notice",
    summary: "Create a welcoming activity for the void-deck board.",
    optional: true,
    npcId: "uncle-ravi",
    objectiveIds: ["request:noticeboard-request"],
  },
  {
    id: "sheltered-route-request",
    chapterId: "chapter-1",
    title: "Shade That Follows the Route",
    summary: "Use Mdm Siti's daily-route knowledge to improve the linkway.",
    optional: true,
    npcId: "mdm-siti",
    objectiveIds: ["request:sheltered-route-request"],
  },
  {
    id: "doorstep-request",
    chapterId: "chapter-1",
    title: "Measure Twice",
    summary: "Inspect Mr. Long's step with Pak Yusof.",
    optional: true,
    npcId: "pak-yusof",
    objectiveIds: ["request:doorstep-request"],
  },
  {
    id: "seating-request",
    chapterId: "chapter-1",
    title: "Room in the Circle",
    summary: "Arrange community-centre seating with clear, comfortable access.",
    optional: true,
    npcId: "coach-meng",
    objectiveIds: ["request:seating-request"],
  },
  {
    id: "morning-table-request",
    chapterId: "chapter-1",
    title: "A Table That Says Welcome",
    summary: "Prepare Uncle Seng's morning table for familiar and new faces.",
    optional: true,
    npcId: "uncle-seng",
    objectiveIds: ["request:morning-table-request"],
  },
  {
    id: "ingredient-shelf-request",
    chapterId: "chapter-1",
    title: "The Shared Shelf",
    summary: "Organise community ingredients by how neighbours cook with them.",
    optional: true,
    npcId: "auntie-minah",
    objectiveIds: ["request:ingredient-shelf-request"],
  },
  {
    id: "keepsake-table-request",
    chapterId: "chapter-1",
    title: "Keepsakes Together",
    summary: "Finish a shared keepsake table with Wei Ling.",
    optional: true,
    npcId: "wei-ling",
    objectiveIds: ["request:keepsake-table-request"],
  },
  {
    id: "grandma-ros-clues",
    chapterId: "chapter-2",
    title: "Who Knows Grandma Ros?",
    summary: "Collect two independent clues from people who know her routines.",
    optional: false,
    objectiveIds: ["ros-clue-minah", "ros-clue-seng"],
  },
  {
    id: "cooking-invitations",
    chapterId: "chapter-2",
    title: "A Place at the Table",
    summary: "Invite neighbours to the cooking lesson Grandma Ros will lead.",
    optional: false,
    npcId: "grandma-ros",
    objectiveIds: ["grandma-kitchen-open", "cooking-lesson-staged"],
  },
  {
    id: "hands-remember",
    chapterId: "chapter-3",
    title: "Hands Remember",
    summary: "Find Ben, choose a supportive approach, and weave without pressure.",
    optional: false,
    npcId: "craftsman-tan",
    objectiveIds: [
      "ben-clue-tools",
      "ben-clue-keepsake",
      "ben-approach-chosen",
      "ben-at-workshop",
      "weaving-complete",
    ],
  },
  {
    id: "last-door",
    chapterId: "ending",
    title: "The Last Door",
    summary: "Return home for the Voice's final story.",
    optional: false,
    npcId: "voice",
    objectiveIds: ["ending-reveal"],
  },
];

export const LOCATIONS: readonly LocationDefinition[] = [
  {
    id: "y-flat",
    name: "Y's Flat",
    kind: "home",
    description: "A muted home where one warm lamp waits beside the first door.",
    connections: ["hdb-corridor"],
  },
  {
    id: "hdb-corridor",
    name: "Block 9 Corridor",
    kind: "hub",
    description: "A breezy common corridor linking four lived-in homes.",
    connections: ["y-flat", "mr-long-flat", "grandma-ros-kitchen", "ben-flat", "estate"],
  },
  {
    id: "estate",
    name: "Kampung SG Estate",
    kind: "exterior",
    description: "A walkable HDB estate of gardens, linkways, shops, and gathering places.",
    connections: [
      "hdb-corridor",
      "craftsman-workshop",
      "community-centre",
      "kopitiam",
      "provision-shop",
      "hawker-centre",
      "prayer-hall",
    ],
  },
  {
    id: "mr-long-flat",
    name: "Mr. Long's Flat",
    kind: "home",
    description: "A careful front room narrowed by a broken doorstep.",
    connections: ["hdb-corridor"],
  },
  {
    id: "grandma-ros-kitchen",
    name: "Grandma Ros's Kitchen",
    kind: "home",
    description: "A lived-in kitchen with labelled tins, a long table, and recipes in use.",
    connections: ["hdb-corridor"],
    unlockHint: "Two neighbours know how to find Grandma Ros.",
  },
  {
    id: "ben-flat",
    name: "Ben's Flat",
    kind: "home",
    description: "A quiet room with a half-finished keepsake near the window.",
    connections: ["hdb-corridor"],
    unlockHint: "Two clues will show how to approach Ben on his terms.",
  },
  {
    id: "craftsman-workshop",
    name: "Craftsman's Workshop",
    kind: "landmark",
    description: "Canes, rattan strips, hand tools, and years of practical knowledge.",
    connections: ["estate"],
    unlockHint: "The workshop opens in Chapter 3.",
  },
  {
    id: "community-centre",
    name: "Community Centre",
    kind: "landmark",
    description: "A bright hall with movable chairs and generous clear routes.",
    connections: ["estate"],
  },
  {
    id: "kopitiam",
    name: "Kopitiam",
    kind: "landmark",
    description: "Morning regulars, enamel cups, and one table kept open for newcomers.",
    connections: ["estate"],
  },
  {
    id: "provision-shop",
    name: "Minah's Provision Shop",
    kind: "landmark",
    description: "Every shelf carries groceries and a little neighbourhood knowledge.",
    connections: ["estate"],
  },
  {
    id: "hawker-centre",
    name: "Hawker Centre",
    kind: "landmark",
    description: "Open tables, patterned tiles, and the sound of many ordinary lunches.",
    connections: ["estate"],
  },
  {
    id: "prayer-hall",
    name: "Prayer Hall",
    kind: "landmark",
    description: "A calm shared hall with shoe racks, plants, and soft afternoon light.",
    connections: ["estate"],
  },
];

interface ResidentDraft {
  id: NpcProfile["id"];
  name: string;
  traits: readonly string[];
  role: string;
  expertise: readonly string[];
  knowledge: readonly string[];
  memoryRules: readonly string[];
  questId: QuestId;
  requestTitle: string;
  requestLines: readonly string[];
  reminderLine: string;
  options: readonly [
    {
      id: string;
      label: string;
      lines: readonly string[];
      effects: KampungMeters;
    },
    {
      id: string;
      label: string;
      lines: readonly string[];
      effects: KampungMeters;
    },
  ];
  invitationLines: readonly string[];
  invitedResponse: readonly string[];
  helpedLine: string;
  reflectionLine: string;
}

function completeRequestEvent(
  questId: QuestId,
  npcId: NpcProfile["id"],
  choiceId: string,
  effects: KampungMeters,
): CampaignEvent {
  return { type: "complete-request", questId, npcId, choiceId, effects };
}

function choice(
  id: string,
  label: string,
  responseLines: readonly string[],
  events: readonly CampaignEvent[],
): IntentChoiceDefinition {
  return { id, label, responseLines, events };
}

function residentProfile(draft: ResidentDraft): NpcProfile {
  const offeredFlag = `offered:${draft.questId}`;
  const helpedMemory = `helped:${draft.questId}`;
  const intents: NpcIntentDefinition[] = [
    {
      id: `${draft.id}-request`,
      npcId: draft.id,
      kind: "offer-request",
      title: draft.requestTitle,
      lines: draft.requestLines,
      choices: draft.options.map((option) =>
        choice(
          option.id,
          option.label,
          option.lines,
          [completeRequestEvent(draft.questId, draft.id, option.id, option.effects)],
        ),
      ),
      eligibility: {
        chapters: ["chapter-1", "chapter-2", "chapter-3", "ending", "free-explore"],
        requiredObjectives: ["mr-long-step-seen"],
        forbiddenObjectives: [offeredFlag],
        forbiddenCompletedQuests: [draft.questId],
      },
      chapterRelevance: 9,
    },
    {
      id: `${draft.id}-reminder`,
      npcId: draft.id,
      kind: "reminder",
      title: draft.requestTitle,
      lines: [draft.reminderLine],
      choices: draft.options.map((option) =>
        choice(
          option.id,
          option.label,
          option.lines,
          [completeRequestEvent(draft.questId, draft.id, option.id, option.effects)],
        ),
      ),
      eligibility: {
        chapters: ["chapter-1", "chapter-2", "chapter-3", "ending", "free-explore"],
        requiredObjectives: [offeredFlag],
        forbiddenCompletedQuests: [draft.questId],
      },
      chapterRelevance: 10,
    },
    {
      id: `${draft.id}-memory`,
      npcId: draft.id,
      kind: "memory-reaction",
      title: "The estate remembers",
      lines: [draft.helpedLine],
      eligibility: {
        chapters: ["chapter-1", "chapter-2"],
        requiredCompletedQuests: [draft.questId],
        requiredMemories: [helpedMemory],
      },
      chapterRelevance: 4,
    },
    {
      id: `${draft.id}-invitation`,
      npcId: draft.id,
      kind: "invitation",
      title: "A Place at the Table",
      lines: draft.invitationLines,
      choices: [
        choice(
          "join-cooking-lesson",
          "Invite them to Grandma Ros's lesson",
          draft.invitedResponse,
          [{ type: "invite-resident", npcId: draft.id }],
        ),
      ],
      eligibility: {
        chapters: ["chapter-2"],
        requiredObjectives: ["grandma-kitchen-open"],
        notInvited: true,
      },
      chapterRelevance: 15,
    },
    {
      id: `${draft.id}-reflection`,
      npcId: draft.id,
      kind: "reflection",
      title: "What the block carries forward",
      lines: [draft.reflectionLine],
      eligibility: {
        chapters: ["chapter-3", "ending", "free-explore"],
        requiredCompletedQuests: [draft.questId],
      },
      chapterRelevance: 3,
    },
    {
      id: `${draft.id}-greeting`,
      npcId: draft.id,
      kind: "greeting",
      title: draft.role,
      lines: [`${draft.name} looks up with an easy nod. There is always room to talk.`],
      eligibility: {},
      chapterRelevance: 0,
    },
  ];

  return {
    id: draft.id,
    name: draft.name,
    traits: draft.traits,
    communityRole: draft.role,
    expertise: draft.expertise,
    knowledge: draft.knowledge,
    memoryRules: draft.memoryRules,
    intents,
  };
}

const RESIDENT_DRAFTS: readonly ResidentDraft[] = [
  {
    id: "aunty-mei",
    name: "Aunty Mei",
    traits: ["observant", "plain-spoken", "generous"],
    role: "Community garden mentor",
    expertise: ["soil care", "everyday herbs", "placing seats in afternoon shade"],
    knowledge: ["which plants neighbours actually use", "who tends each garden bed"],
    memoryRules: ["remember the chosen planting plan", "welcome the player as a returning helper"],
    questId: "garden-request",
    requestTitle: "A Garden People Use",
    requestLines: [
      "This soil is tired, not finished. I know what will take here.",
      "Help me choose what the block should grow around.",
    ],
    reminderLine: "The bed is not going anywhere. Come back when you feel like choosing with me.",
    options: [
      {
        id: "herbs",
        label: "Grow pandan, mint, and curry leaf",
        lines: ["Useful things, then. I will mark what to pick, and what to leave another week."],
        effects: { connection: 1, purpose: 2, comfort: 0 },
      },
      {
        id: "seating-flowers",
        label: "Plant flowers around a shaded seat",
        lines: ["Good. The seat goes where the four o'clock shade already does the work."],
        effects: { connection: 2, purpose: 1, comfort: 1 },
      },
    ],
    invitationLines: ["Grandma Ros teaching again? Then the herb scissors are coming with me."],
    invitedResponse: ["Tell her I will bring the curry leaf and let her lead the table."],
    helpedLine: "You chose with the people who use the garden in mind. I remembered that.",
    reflectionLine: "A garden works when neighbours keep adding knowledge, not when one person owns it.",
  },
  {
    id: "uncle-ravi",
    name: "Uncle Ravi",
    traits: ["welcoming", "wry", "persistent"],
    role: "Void-deck social organiser",
    expertise: ["welcoming invitations", "small-group hosting", "drawing quiet neighbours in"],
    knowledge: ["which wording makes newcomers feel included", "who prefers to listen first"],
    memoryRules: ["remember the chosen event", "recognise the player as a co-organiser"],
    questId: "noticeboard-request",
    requestTitle: "An Invitation, Not a Notice",
    requestLines: [
      "This board tells people fourteen things and invites them to none.",
      "Help me put up one notice that feels like an open chair.",
    ],
    reminderLine: "No hurry. The blank space stays blank until we find the right welcome.",
    options: [
      {
        id: "beginner-chess",
        label: "Beginner chess — losing is welcome",
        lines: ["I will print BEGINNERS WELCOME bigger than CHESS. That is the important part."],
        effects: { connection: 2, purpose: 1, comfort: 0 },
      },
      {
        id: "photo-stories",
        label: "Photo stories — bring one picture",
        lines: ["One picture, one story, no speech required. The quiet ones can start by listening."],
        effects: { connection: 2, purpose: 2, comfort: 0 },
      },
    ],
    invitationLines: ["A lesson with Grandma Ros? A proper invitation needs a proper answer."],
    invitedResponse: ["Yes. I will greet people at the door so Ros can stay by her stove."],
    helpedLine: "Our little notice worked because you made the first step easy. I have kept that wording.",
    reflectionLine: "A full table begins with one invitation that does not test anybody.",
  },
  {
    id: "mdm-siti",
    name: "Mdm Siti",
    traits: ["precise", "patient", "quietly funny"],
    role: "Neighbourhood access expert",
    expertise: ["daily walking routes", "shade and drainage", "clear widths around rest points"],
    knowledge: ["where the linkway floods first", "where afternoon shade actually falls"],
    memoryRules: ["remember the route choice", "add the player to her list of careful listeners"],
    questId: "sheltered-route-request",
    requestTitle: "Shade That Follows the Route",
    requestLines: [
      "I have walked this route for thirty-one years. The shade breaks in the same two places.",
      "Walk the plan with me and choose where the first improvement counts.",
    ],
    reminderLine: "The route will still be here tomorrow. So will my notes.",
    options: [
      {
        id: "rest-point",
        label: "Place a rest point in real afternoon shade",
        lines: ["Leave room beside the bench as well. A clear route is part of the seat."],
        effects: { connection: 1, purpose: 1, comfort: 2 },
      },
      {
        id: "shelter-gap",
        label: "Close the rain-shelter gap",
        lines: ["That gap catches everyone before the market. We start where daily experience points."],
        effects: { connection: 0, purpose: 2, comfort: 2 },
      },
    ],
    invitationLines: ["Before I say yes: is there a clear way around the cooking table?"],
    invitedResponse: ["Good. I will come early and check the chair spacing with Ros."],
    helpedLine: "You listened to the route instead of guessing from a plan. I remember that.",
    reflectionLine: "Access improves when the people who use a route are treated as its experts.",
  },
  {
    id: "pak-yusof",
    name: "Pak Yusof",
    traits: ["practical", "unshowy", "methodical"],
    role: "Estate fixer",
    expertise: ["door thresholds", "hand tools", "safe practical repairs"],
    knowledge: ["the age and quirks of the block", "which repairs need more than one pair of hands"],
    memoryRules: ["remember who measured alongside him", "credit the group rather than himself"],
    questId: "doorstep-request",
    requestTitle: "Measure Twice",
    requestLines: [
      "Mr. Long's step is not a mystery. It needs a level, two measurements, and people who will carry.",
      "Come inspect it with me. We can mark the ramp before anyone lifts a board.",
    ],
    reminderLine: "Tools are packed. When you are ready, we measure before we promise.",
    options: [
      {
        id: "gentle-slope",
        label: "Mark a gentle slope with a clear landing",
        lines: ["Enough landing to turn comfortably. Good. The doorway must stay a doorway."],
        effects: { connection: 1, purpose: 2, comfort: 2 },
      },
      {
        id: "threshold-rail",
        label: "Pair the ramp with a steady handrail",
        lines: ["The rail ends past the last step. Small detail, big difference in the hand."],
        effects: { connection: 1, purpose: 2, comfort: 2 },
      },
    ],
    invitationLines: ["I will come after I put the drill away. No sawdust near Ros's food."],
    invitedResponse: ["Save me a chair near the end. I can help shift the table first."],
    helpedLine: "You did not rush the repair. That made you useful before we touched a tool.",
    reflectionLine: "A thing keeps working because somebody notices, measures, and returns.",
  },
  {
    id: "coach-meng",
    name: "Coach Meng",
    traits: ["energetic", "inclusive", "organised"],
    role: "Volunteer organiser",
    expertise: ["accessible group layouts", "welcoming first-timers", "calm activity pacing"],
    knowledge: ["how different neighbours enter a group", "which chairs are easiest to move"],
    memoryRules: ["remember the seating layout", "offer the player a place in future organising"],
    questId: "seating-request",
    requestTitle: "Room in the Circle",
    requestLines: [
      "A circle should make room before anyone has to ask.",
      "Help me lay out the hall so every chair has a clear way in and out.",
    ],
    reminderLine: "The chairs stack neatly. We can try the layout whenever you come back.",
    options: [
      {
        id: "wide-circle",
        label: "Make one wide circle with open gaps",
        lines: ["Good sight-lines, clear gaps, nobody tucked behind another row."],
        effects: { connection: 2, purpose: 1, comfort: 2 },
      },
      {
        id: "small-clusters",
        label: "Use small clusters with a quiet edge",
        lines: ["Some people join by sitting near the group first. The quiet edge counts."],
        effects: { connection: 2, purpose: 2, comfort: 1 },
      },
    ],
    invitationLines: ["A cooking lesson is a group activity. Ros sets the pace; I can set the chairs."],
    invitedResponse: ["I am in. I will leave two clear spaces before anyone asks."],
    helpedLine: "You remembered that joining can look different from person to person.",
    reflectionLine: "The best group is not the loudest one. It is the one people can enter easily.",
  },
  {
    id: "uncle-seng",
    name: "Uncle Seng",
    traits: ["steady", "dry-humoured", "attentive"],
    role: "Kopitiam connector",
    expertise: ["morning routines", "low-pressure welcomes", "remembering regulars' preferences"],
    knowledge: ["who comes early", "who may need an introduction without fuss"],
    memoryRules: ["remember the table arrangement", "notice when the player returns at a different hour"],
    questId: "morning-table-request",
    requestTitle: "A Table That Says Welcome",
    requestLines: [
      "Regulars sit by habit. New people stand because every table looks claimed.",
      "Help me prepare one morning table that says anyone can start there.",
    ],
    reminderLine: "Tomorrow morning also can. A welcome works better when it is sincere.",
    options: [
      {
        id: "shared-sign",
        label: "Add a small 'join us' table sign",
        lines: ["Short words, big enough to read before someone has to hover. Good."],
        effects: { connection: 2, purpose: 1, comfort: 1 },
      },
      {
        id: "spare-place",
        label: "Keep one place open with a fresh cup",
        lines: ["An empty chair can look reserved. A fresh cup makes the meaning clear."],
        effects: { connection: 2, purpose: 1, comfort: 2 },
      },
    ],
    invitationLines: ["Ros still folds her tea towel into a perfect square. I know where she buys ginger."],
    invitedResponse: ["I will come. Morning table can manage without me for one hour."],
    helpedLine: "You helped the table speak before a newcomer had to ask. I kept it that way.",
    reflectionLine: "Routine is not a closed door. Done properly, it is how you notice who is missing.",
  },
  {
    id: "auntie-minah",
    name: "Auntie Minah",
    traits: ["resourceful", "neighbourly", "direct"],
    role: "Provision-shop keeper",
    expertise: ["community pantry organisation", "ingredient substitutions", "neighbour routines"],
    knowledge: ["Grandma Ros's ginger order", "which ingredients households can share"],
    memoryRules: ["remember the shelf logic", "share Grandma Ros's clue without gossip"],
    questId: "ingredient-shelf-request",
    requestTitle: "The Shared Shelf",
    requestLines: [
      "A shared shelf fails when nobody knows what belongs there.",
      "Help me arrange it by how people cook, not by how the wholesaler packs.",
    ],
    reminderLine: "Take your time. I will keep one shelf clear until the labels make sense.",
    options: [
      {
        id: "meal-groups",
        label: "Group ingredients by everyday meals",
        lines: ["Rice, soup, tea, baking. People can see what completes a meal."],
        effects: { connection: 2, purpose: 2, comfort: 0 },
      },
      {
        id: "clear-labels",
        label: "Use large labels and reachable baskets",
        lines: ["Good. The top shelf is storage, not a test of anybody's reach."],
        effects: { connection: 1, purpose: 2, comfort: 2 },
      },
    ],
    invitationLines: ["Ros teaching? Then somebody must bring the ginger she always checks twice."],
    invitedResponse: ["I will close for an hour. The ingredient shelf can explain itself now."],
    helpedLine: "The new shelf works because you organised around people, not packets.",
    reflectionLine: "A provision shop sells things. A neighbourhood shop also remembers how people use them.",
  },
  {
    id: "wei-ling",
    name: "Wei Ling",
    traits: ["curious", "thoughtful", "gently candid"],
    role: "Newer resident and intergenerational connector",
    expertise: ["keepsake display", "inviting younger neighbours", "listening before assuming"],
    knowledge: ["Ben's unfinished woven keepsake", "which younger families are still finding their place"],
    memoryRules: ["remember the keepsake choice", "treat help as collaboration between neighbours"],
    questId: "keepsake-table-request",
    requestTitle: "Keepsakes Together",
    requestLines: [
      "I want the table to feel shared, not like I arranged other people's memories.",
      "Help me choose a simple way neighbours can add their own keepsake.",
    ],
    reminderLine: "We can leave the centre empty for now. Empty space can be an invitation too.",
    options: [
      {
        id: "story-tags",
        label: "Add large story tags beside each keepsake",
        lines: ["Names first, then one sentence. Nobody has to tell their whole life at once."],
        effects: { connection: 2, purpose: 2, comfort: 1 },
      },
      {
        id: "open-centre",
        label: "Leave the centre open for new additions",
        lines: ["Good. The table should look unfinished in the welcoming way."],
        effects: { connection: 2, purpose: 1, comfort: 1 },
      },
    ],
    invitationLines: ["I can invite the younger neighbours. They keep asking how to meet everyone without intruding."],
    invitedResponse: ["Yes. I will tell them it is a lesson, not a performance."],
    helpedLine: "You left room for other people's stories. That changed how I welcome newcomers.",
    reflectionLine: "Belonging got easier when I stopped waiting to feel new and started contributing something small.",
  },
];

const residentProfiles = RESIDENT_DRAFTS.map(residentProfile);

function profile(
  id: NpcProfile["id"],
  name: string,
  traits: readonly string[],
  role: string,
  expertise: readonly string[],
  knowledge: readonly string[],
  memoryRules: readonly string[],
  intents: readonly NpcIntentDefinition[],
): NpcProfile {
  return { id, name, traits, communityRole: role, expertise, knowledge, memoryRules, intents };
}

const STORY_PROFILES: readonly NpcProfile[] = [
  profile(
    "voice",
    "The Voice",
    ["familiar", "patient", "fading"],
    "Y's unseen companion",
    ["remembering the estate's small acts"],
    ["which door Y has not opened", "why the flat grows warmer"],
    ["remember every completed chapter", "never pressure Y to leave"],
    [
      {
        id: "voice-prologue",
        npcId: "voice",
        kind: "main-story",
        title: "Y's Flat",
        lines: [
          "Morning, Y. The estate is already awake.",
          "Move with the arrow keys or WASD. Use E or Space when a person or doorway is near.",
          "There is no hurry. When you are ready, open the door.",
        ],
        choices: [
          choice(
            "listen",
            "I'm ready to see who is outside",
            ["The latch is loose. The first door opens inward."],
            [{ type: "complete-objective", objectiveId: "heard-voice" }],
          ),
        ],
        eligibility: {
          chapters: ["prologue"],
          forbiddenObjectives: ["heard-voice"],
        },
        chapterRelevance: 10,
      },
      {
        id: "voice-prologue-reminder",
        npcId: "voice",
        kind: "reminder",
        title: "Y's Flat",
        lines: ["The corridor is through the lit doorway. Take all the time you need."],
        eligibility: {
          chapters: ["prologue"],
          requiredObjectives: ["heard-voice"],
        },
        chapterRelevance: 8,
      },
      {
        id: "voice-ending",
        npcId: "voice",
        kind: "main-story",
        title: "The Last Door",
        lines: [
          "You thought I was leading you through the estate.",
          "I was the part of Y that had begun to fade from the doorway.",
          "But listen: Mei brought cuttings. Ravi brought chairs. Ros brought the whole kitchen.",
          "Nobody came to rescue Y. They came because Y had already helped make room for them.",
        ],
        choices: [
          choice(
            "open-last-door",
            "Open the door together",
            ["The latch turns. Warm corridor light fills the room, and every familiar voice answers."],
            [{ type: "complete-ending" }],
          ),
        ],
        eligibility: { chapters: ["ending"] },
        chapterRelevance: 12,
      },
      {
        id: "voice-free",
        npcId: "voice",
        kind: "reflection",
        title: "Y's Flat",
        lines: ["The door stays open now. The estate is yours to revisit in any order."],
        eligibility: { chapters: ["free-explore"] },
        chapterRelevance: 2,
      },
    ],
  ),
  profile(
    "mr-long",
    "Mr. Long",
    ["independent", "careful", "dry-humoured"],
    "Long-time resident and radio repairer",
    ["repairing old radios", "describing how he uses his own doorway"],
    ["the broken threshold's exact problem"],
    ["remember which neighbours contributed", "speak for himself about his own home"],
    [
      {
        id: "mr-long-step",
        npcId: "mr-long",
        kind: "main-story",
        title: "Open the Way",
        lines: [
          "The radio is fine. The doorstep is the troublesome one.",
          "It shifted after the last storm. I can cross it, but not comfortably with both hands full.",
          "Pak Yusof will know the measurements. The others will know how the route should feel.",
        ],
        choices: [
          choice(
            "inspect-step",
            "Look at the broken step together",
            ["A cracked lip catches the toe. There is room for a gentle ramp and a proper landing."],
            [{ type: "complete-objective", objectiveId: "mr-long-step-seen" }],
          ),
        ],
        eligibility: {
          chapters: ["chapter-1"],
          requiredVisitedLocations: ["mr-long-flat"],
          forbiddenObjectives: ["mr-long-step-seen"],
        },
        chapterRelevance: 12,
      },
      {
        id: "mr-long-waiting",
        npcId: "mr-long",
        kind: "reminder",
        title: "Open the Way",
        lines: ["I have marked the loose edge. Bring the block's ideas; I will choose what works at my door."],
        eligibility: {
          chapters: ["chapter-1"],
          requiredObjectives: ["mr-long-step-seen"],
          forbiddenObjectives: ["ramp-built"],
        },
        chapterRelevance: 7,
      },
      {
        id: "mr-long-outside",
        npcId: "mr-long",
        kind: "reflection",
        title: "The ramp",
        lines: ["Smooth landing, steady rail, and still my own front door. That is good work."],
        eligibility: {
          chapters: ["chapter-2", "chapter-3", "ending", "free-explore"],
          requiredObjectives: ["mr-long-outside"],
        },
        chapterRelevance: 4,
      },
    ],
  ),
  profile(
    "grandma-ros",
    "Grandma Ros",
    ["assured", "warm", "exact"],
    "Neighbourhood cooking teacher",
    ["balancing everyday recipes", "teaching by touch, smell, and sequence"],
    ["which table jobs suit each guest"],
    ["remember who was invited", "lead her own lesson"],
    [
      {
        id: "ros-kitchen",
        npcId: "grandma-ros",
        kind: "main-story",
        title: "A Place at the Table",
        lines: [
          "Minah sent ginger and Seng sent word. So the estate still remembers my timings.",
          "A lesson needs hands, not an audience. Invite people who will chop, stir, label, and teach back.",
        ],
        eligibility: {
          chapters: ["chapter-2"],
          requiredVisitedLocations: ["grandma-ros-kitchen"],
        },
        chapterRelevance: 10,
      },
      {
        id: "ros-reflection",
        npcId: "grandma-ros",
        kind: "reflection",
        title: "The long table",
        lines: ["Everybody arrived with something to teach. That is why the recipe will travel."],
        eligibility: {
          chapters: ["chapter-3", "ending", "free-explore"],
          requiredObjectives: ["cooking-lesson-staged"],
        },
        chapterRelevance: 3,
      },
    ],
  ),
  profile(
    "craftsman-tan",
    "Mr. Tan",
    ["measured", "inventive", "patient"],
    "Rattan craftsman",
    ["cane repair", "weaving tension", "teaching without taking over"],
    ["the tool Ben left behind"],
    ["remember Ben's chosen pace", "never turn weaving into a test"],
    [
      {
        id: "craftsman-clue",
        npcId: "craftsman-tan",
        kind: "clue",
        title: "Hands Remember",
        lines: [
          "Ben left this smooth-handled awl here. He shaped it himself so it would sit properly in his palm.",
          "Do not drag him back for my sake. Find out what he wants to finish.",
        ],
        choices: [
          choice(
            "take-tool-clue",
            "Remember the shaped tool",
            ["You leave the tool on Mr. Tan's bench, exactly where Ben placed it."],
            [{ type: "collect-clue", clueId: "ben-clue-tools", npcId: "craftsman-tan" }],
          ),
        ],
        eligibility: {
          chapters: ["chapter-3"],
          forbiddenObjectives: ["ben-clue-tools"],
          requiredVisitedLocations: ["craftsman-workshop"],
        },
        chapterRelevance: 12,
      },
      {
        id: "craftsman-weave",
        npcId: "craftsman-tan",
        kind: "main-story",
        title: "The weaving bench",
        lines: [
          "Ben chose to come. Good. The rattan can wait as long as either of you needs.",
          "Keep the strip supported; the hands decide the pace.",
        ],
        choices: [
          choice(
            "steady-lines",
            "Weave steady parallel lines",
            ["One strip, then another. No clock, no score, just a pattern becoming shared."],
            [{ type: "complete-weaving", patternId: "steady-lines" }],
          ),
          choice(
            "shared-colours",
            "Alternate the estate's warm colours",
            ["Ben chooses coral; you choose teal. Mr. Tan holds the frame and does not take over."],
            [{ type: "complete-weaving", patternId: "shared-colours" }],
          ),
        ],
        eligibility: {
          chapters: ["chapter-3"],
          requiredObjectives: ["ben-at-workshop"],
          forbiddenObjectives: ["weaving-complete"],
        },
        chapterRelevance: 13,
      },
      {
        id: "craftsman-reflection",
        npcId: "craftsman-tan",
        kind: "reflection",
        title: "The active workshop",
        lines: ["The finished pattern matters less than the fact that both sets of hands stayed in it."],
        eligibility: {
          chapters: ["ending", "free-explore"],
          requiredObjectives: ["weaving-complete"],
        },
        chapterRelevance: 3,
      },
    ],
  ),
  profile(
    "ben",
    "Ben",
    ["reserved", "skilled", "deliberate"],
    "Maker and neighbour",
    ["rattan preparation", "tool shaping", "colour patterns"],
    ["what he wants to finish and when"],
    ["remember the player's supportive approach", "keep Ben's choice central"],
    [
      {
        id: "ben-approach",
        npcId: "ben",
        kind: "main-story",
        title: "Ben's Flat",
        lines: [
          "The keepsake is mine. I stopped because everyone kept asking when it would be finished.",
          "Mr. Tan understands the work. I just do not want the workshop to turn into a performance.",
        ],
        choices: [
          choice(
            "sit-beside",
            "Sit beside Ben and let the quiet stay quiet",
            ["After a while, Ben points to the unfinished edge. “That part still bothers me.”"],
            [{ type: "choose-approach", approachId: "sit-beside" }],
          ),
          choice(
            "bring-keepsake",
            "Offer to carry the keepsake, if Ben wants",
            ["Ben considers it. “Carry the frame. I will carry my own tools.”"],
            [{ type: "choose-approach", approachId: "bring-keepsake" }],
          ),
        ],
        eligibility: {
          chapters: ["chapter-3"],
          requiredObjectives: ["ben-clue-tools", "ben-clue-keepsake"],
          forbiddenObjectives: ["ben-approach-chosen"],
          requiredVisitedLocations: ["ben-flat"],
        },
        chapterRelevance: 13,
      },
      {
        id: "ben-return",
        npcId: "ben",
        kind: "contribution",
        title: "Back to the workshop",
        lines: ["I will go if we keep the same pace we chose here. No audience, no deadline."],
        choices: [
          choice(
            "walk-together",
            "Walk to the workshop together",
            ["Ben closes his own door and brings the shaped tools."],
            [{ type: "bring-ben-to-workshop" }],
          ),
        ],
        eligibility: {
          chapters: ["chapter-3"],
          requiredObjectives: ["ben-approach-chosen"],
          forbiddenObjectives: ["ben-at-workshop"],
        },
        chapterRelevance: 12,
      },
      {
        id: "ben-reflection",
        npcId: "ben",
        kind: "reflection",
        title: "The finished edge",
        lines: ["It is finished because I decided to return to it, not because anyone counted the days."],
        eligibility: {
          chapters: ["ending", "free-explore"],
          requiredObjectives: ["weaving-complete"],
        },
        chapterRelevance: 3,
      },
    ],
  ),
];

function addStoryIntent(npcId: NpcProfile["id"], intent: NpcIntentDefinition): void {
  const profileToExtend = residentProfiles.find((candidate) => candidate.id === npcId);
  if (profileToExtend) {
    (profileToExtend.intents as NpcIntentDefinition[]).unshift(intent);
  }
}

addStoryIntent("auntie-minah", {
  id: "minah-ros-clue",
  npcId: "auntie-minah",
  kind: "clue",
  title: "Who Knows Grandma Ros?",
  lines: [
    "Ros still buys old ginger, the knobbly kind. She says smooth ginger has not worked hard enough.",
    "Her kitchen is the corner unit. Knock twice; the first knock competes with the exhaust fan.",
  ],
  choices: [
    choice(
      "remember-ros-shop-clue",
      "Remember the ginger order and corner unit",
      ["Minah circles the unit number on the back of a clean paper bag."],
      [{ type: "collect-clue", clueId: "ros-clue-minah", npcId: "auntie-minah" }],
    ),
  ],
  eligibility: {
    chapters: ["chapter-2"],
    forbiddenObjectives: ["ros-clue-minah"],
  },
  chapterRelevance: 12,
});

addStoryIntent("uncle-seng", {
  id: "seng-ros-clue",
  npcId: "uncle-seng",
  kind: "clue",
  title: "Who Knows Grandma Ros?",
  lines: [
    "Ros takes kopi after the morning rush, never during it. She likes time to correct my foam.",
    "If her kitchen window is open, she is ready for company. If not, come back later.",
  ],
  choices: [
    choice(
      "remember-ros-routine",
      "Remember Ros's quiet-hour routine",
      ["Seng points out the kitchen window from the kopitiam table."],
      [{ type: "collect-clue", clueId: "ros-clue-seng", npcId: "uncle-seng" }],
    ),
  ],
  eligibility: {
    chapters: ["chapter-2"],
    forbiddenObjectives: ["ros-clue-seng"],
  },
  chapterRelevance: 12,
});

addStoryIntent("wei-ling", {
  id: "weiling-ben-clue",
  npcId: "wei-ling",
  kind: "clue",
  title: "A Half-Finished Keepsake",
  lines: [
    "Ben showed me the centre pattern once. He said the empty edge was not a mistake; he had not chosen its colour.",
    "Ask about the edge, not why he stopped. That keeps the work in his hands.",
  ],
  choices: [
    choice(
      "remember-ben-keepsake",
      "Remember the unfinished edge",
      ["Wei Ling leaves the centre of the keepsake table open, just as Ben described."],
      [{ type: "collect-clue", clueId: "ben-clue-keepsake", npcId: "wei-ling" }],
    ),
  ],
  eligibility: {
    chapters: ["chapter-3"],
    forbiddenObjectives: ["ben-clue-keepsake"],
  },
  chapterRelevance: 12,
});

export const NPC_PROFILES: readonly NpcProfile[] = [
  ...residentProfiles,
  ...STORY_PROFILES,
];

export const CHAPTER_BY_ID = new Map(CHAPTERS.map((chapter) => [chapter.id, chapter]));
export const QUEST_BY_ID = new Map(QUESTS.map((quest) => [quest.id, quest]));
export const LOCATION_BY_ID = new Map(LOCATIONS.map((location) => [location.id, location]));
export const NPC_BY_ID = new Map(NPC_PROFILES.map((npc) => [npc.id, npc]));

export const SIDE_QUEST_IDS = QUESTS
  .filter((quest) => quest.optional)
  .map((quest) => quest.id);

export const STORY_CHAPTER_ORDER: readonly ChapterId[] = [
  "prologue",
  "chapter-1",
  "chapter-2",
  "chapter-3",
  "ending",
];

export function getLocation(id: LocationId): LocationDefinition {
  const location = LOCATION_BY_ID.get(id);
  if (!location) throw new Error(`Unknown location: ${id}`);
  return location;
}
