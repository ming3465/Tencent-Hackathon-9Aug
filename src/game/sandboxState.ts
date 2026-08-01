export type ActivityId = "garden" | "noticeboard" | "safe-route" | "memory-table";

export interface KampungMeters {
  connection: number;
  purpose: number;
  comfort: number;
}

export interface ActivityChoice {
  id: string;
  label: string;
  /** Shown one line at a time after the player picks this choice. */
  responseLines: readonly string[];
  effects: KampungMeters;
}

export interface ActivityDefinition {
  id: ActivityId;
  title: string;
  resident: string;
  /** The conversation before any choice is offered, one line per screen. */
  introLines: readonly string[];
  /** Shown when the player returns after finishing this activity. */
  completedLines: readonly string[];
  /** One-line summary for the journal entry. */
  completedMessage: string;
  choices: readonly ActivityChoice[];
}

export interface SandboxState {
  completedActivities: ActivityId[];
  choices: Partial<Record<ActivityId, string>>;
  meters: KampungMeters;
  eveningReady: boolean;
  dayEnded: boolean;
  /**
   * How many activities unlock the evening gathering. 3 in the real game;
   * demo mode (?demo=1) lowers it to 2 so a judge reaches the golden-hour
   * ending inside their judging window. Nothing else about the rules changes.
   */
  requiredForEvening: number;
}

export const METER_MAX = 6;
export const ACTIVITIES_REQUIRED_FOR_EVENING = 3;

export const ACTIVITIES: readonly ActivityDefinition[] = [
  {
    id: "garden",
    title: "Community Garden",
    resident: "Aunty Mei",
    introLines: [
      "You found the plot. Good — most people walk straight past. They think it is just weeds.",
      "Forty years I cooked for this block. Weddings, funerals, one very memorable Chinese New Year.",
      "Standing at a stove all day is behind me now. My hands still know what to grow, though.",
      "This soil is tired but honest. Help me decide what goes into it.",
    ],
    completedMessage:
      "The new garden bed is already drawing neighbours over for a look.",
    completedLines: [
      "Come, look. Two days and the block is already treating it like it has always been here.",
      "That is how you know it worked. Nobody remembers it was ever a decision.",
    ],
    choices: [
      {
        id: "herbs",
        label: "Herbs — things people actually cook with",
        responseLines: [
          "Good. Pandan, mint, curry leaf. Things that end up in somebody's pot on a Tuesday.",
          "I will teach the young ones when to pick. Too early and the pandan has no smell at all.",
          "Then it stops being my garden. It becomes the block's garden.",
        ],
        effects: { connection: 1, purpose: 2, comfort: 0 },
      },
      {
        id: "flowers",
        label: "Flowers, with somewhere to sit",
        responseLines: [
          "Flowers. So you want people to sit down and stay a while.",
          "I will put the bench where the four o'clock shade lands. That is the good hour.",
          "Nobody comes to look at flowers. They come because somebody is already sitting there.",
        ],
        effects: { connection: 2, purpose: 1, comfort: 1 },
      },
    ],
  },
  {
    id: "noticeboard",
    title: "Void-Deck Noticeboard",
    resident: "Uncle Ravi",
    introLines: [
      "Ah! A face I do not know. Come, come — you can settle something for me.",
      "This board has fourteen notices. Town council, pest control, lift upgrade. All information.",
      "Not one of them invites anybody to do anything.",
      "I have Saturday morning free and a folding table. So — what should I put up?",
    ],
    completedMessage:
      "The fresh invitation is up. Uncle Ravi is already greeting the first curious neighbour.",
    completedLines: [
      "It is up. Two people have already asked me about it, and one of them never talks to anybody.",
      "Fourteen notices telling people things. One asking them to come. Guess which one worked.",
    ],
    choices: [
      {
        id: "chess",
        label: "A chess circle for beginners",
        responseLines: [
          "Chess, then. And I will write BEGINNERS WELCOME bigger than the word chess.",
          "That is the whole trick. People stay away if they think they will look stupid.",
          "I lost my first forty games. Somebody sat down with me anyway.",
        ],
        effects: { connection: 2, purpose: 1, comfort: 0 },
      },
      {
        id: "stories",
        label: "A story swap — bring one photo",
        responseLines: [
          "Stories. Bring one photograph, tell us who is in it. That is the entire rule.",
          "Half this block has been here since the flats were new. Nobody has ever asked them about it.",
          "You watch. The quiet ones talk the most, once somebody finally asks.",
        ],
        effects: { connection: 2, purpose: 2, comfort: 0 },
      },
    ],
  },
  {
    id: "safe-route",
    title: "Shaded Route",
    resident: "Mdm Siti",
    introLines: [
      "You walk fast. You have never done this route at three in the afternoon, have you?",
      "Block 12 to the wet market and back. Every day, thirty-one years.",
      "I know where the shade breaks. I know which stretch floods first when the monsoon comes.",
      "The town council keeps asking residents for feedback. So. This is my feedback. Where do we start?",
    ],
    completedMessage:
      "Mdm Siti tests the improved route herself and adds one more practical note to the plan.",
    completedLines: [
      "I walked it again this morning to check. It is better. I have three more notes for next time.",
      "Thirty-one years of walking somewhere finally counts as knowing something about it.",
    ],
    choices: [
      {
        id: "rest-point",
        label: "A bench where the shade actually lands",
        responseLines: [
          "A bench. Not a decorative one — placed properly, where the shade is at four o'clock.",
          "And with room beside it. A walking frame has to go somewhere too.",
          "Watch what happens. Once there is a bench, people stop being on their way somewhere.",
        ],
        effects: { connection: 1, purpose: 0, comfort: 2 },
      },
      {
        id: "shelter",
        label: "Close the gap in the shelter",
        responseLines: [
          "The shelter. That gap before the market is where everybody gets caught in the rain.",
          "I have had it mapped in my head for years. Now somebody is finally writing it down.",
          "Thirty-one years of walking it. That should count as a survey, don't you think?",
        ],
        effects: { connection: 0, purpose: 1, comfort: 2 },
      },
    ],
  },
  {
    id: "memory-table",
    title: "Memory Table",
    resident: "The Void Deck",
    introLines: [
      "Somebody has left a set of keepsake cards out on the table, squared up and ready.",
      "A kite. A lantern. A bumboat. A flower. Small things, all from around here.",
      "There is no timer on the table and nobody is keeping score. Play a round if you like.",
    ],
    completedMessage:
      "The final pair clicks into place. A nearby family starts another round together.",
    completedLines: [
      "The cards are squared up again, face down, waiting for whoever sits here next.",
    ],
    choices: [
      {
        id: "completed",
        label: "Complete the matching game",
        responseLines: [
          "You finish the table together and leave the cards ready for the next neighbours.",
        ],
        effects: { connection: 1, purpose: 0, comfort: 1 },
      },
    ],
  },
];

export function createSandboxState(
  requiredForEvening: number = ACTIVITIES_REQUIRED_FOR_EVENING
): SandboxState {
  return {
    completedActivities: [],
    choices: {},
    meters: { connection: 0, purpose: 0, comfort: 0 },
    eveningReady: false,
    dayEnded: false,
    requiredForEvening: Math.max(1, Math.min(requiredForEvening, ACTIVITIES.length)),
  };
}

export function getActivity(id: ActivityId): ActivityDefinition {
  const activity = ACTIVITIES.find((candidate) => candidate.id === id);
  if (!activity) {
    throw new Error(`Unknown activity: ${id}`);
  }
  return activity;
}

export function completeActivity(
  state: SandboxState,
  activityId: ActivityId,
  choiceId: string
): SandboxState {
  if (state.completedActivities.includes(activityId)) {
    return state;
  }

  const activity = getActivity(activityId);
  const choice = activity.choices.find((candidate) => candidate.id === choiceId);
  if (!choice) {
    throw new Error(`Unknown choice ${choiceId} for activity ${activityId}`);
  }

  const completedActivities = [...state.completedActivities, activityId];
  return {
    ...state,
    completedActivities,
    choices: { ...state.choices, [activityId]: choiceId },
    meters: {
      connection: Math.min(METER_MAX, state.meters.connection + choice.effects.connection),
      purpose: Math.min(METER_MAX, state.meters.purpose + choice.effects.purpose),
      comfort: Math.min(METER_MAX, state.meters.comfort + choice.effects.comfort),
    },
    eveningReady: completedActivities.length >= state.requiredForEvening,
  };
}

export function endDay(state: SandboxState): SandboxState {
  if (!state.eveningReady) {
    return state;
  }
  return { ...state, dayEnded: true };
}

export function isActivityComplete(state: SandboxState, id: ActivityId): boolean {
  return state.completedActivities.includes(id);
}

export type DialoguePhase = "intro" | "response" | "completed";

export interface DialogueScript {
  phase: DialoguePhase;
  title: string;
  speaker: string;
  lines: readonly string[];
  /** Choices are presented only once an intro script has been read to the end. */
  offersChoices: boolean;
}

/**
 * Picks the conversation to play when the player opens an activity: the full
 * introduction the first time, or the shorter revisit lines afterwards.
 */
export function buildDialogueScript(
  state: SandboxState,
  activityId: ActivityId
): DialogueScript {
  const activity = getActivity(activityId);
  const completed = isActivityComplete(state, activityId);
  return {
    phase: completed ? "completed" : "intro",
    title: activity.title,
    speaker: activity.resident,
    lines: completed ? activity.completedLines : activity.introLines,
    offersChoices: !completed,
  };
}

/** The conversation that plays after the player commits to a choice. */
export function buildChoiceScript(
  activityId: ActivityId,
  choiceId: string
): DialogueScript {
  const activity = getActivity(activityId);
  const choice = activity.choices.find((candidate) => candidate.id === choiceId);
  if (!choice) {
    throw new Error(`Unknown choice ${choiceId} for activity ${activityId}`);
  }
  return {
    phase: "response",
    title: activity.title,
    speaker: activity.resident,
    lines: choice.responseLines,
    offersChoices: false,
  };
}

const EVENING_MOMENTS: Record<ActivityId, Record<string, string>> = {
  garden: {
    herbs: "Aunty Mei's shared herbs are becoming ingredients for tomorrow's meal",
    flowers: "Aunty Mei's flower seat has become a new place to pause and talk",
  },
  noticeboard: {
    chess: "Uncle Ravi's chess invitation is welcoming beginners to the void deck",
    stories: "Uncle Ravi's story swap is filling the noticeboard with neighbours' voices",
  },
  "safe-route": {
    "rest-point": "Mdm Siti's rest point is making the daily route more comfortable",
    shelter: "Mdm Siti's route knowledge is extending shelter from sun and rain",
  },
  "memory-table": {
    completed: "the memory table is ready for another family to play together",
  },
};

export function buildEveningReflection(state: SandboxState): string {
  const moments = state.completedActivities
    .map((activityId) => {
      const choiceId = state.choices[activityId];
      return choiceId ? EVENING_MOMENTS[activityId][choiceId] : undefined;
    })
    .filter((moment): moment is string => Boolean(moment));

  if (!moments.length) {
    return "The shared spaces are quiet, with room for tomorrow's neighbours to shape them.";
  }
  if (moments.length === 1) {
    return `Tonight, ${moments[0]}.`;
  }

  const finalMoment = moments[moments.length - 1];
  const openingMoments = moments.slice(0, -1).join("; ");
  return `Tonight, ${openingMoments}; and ${finalMoment}.`;
}
