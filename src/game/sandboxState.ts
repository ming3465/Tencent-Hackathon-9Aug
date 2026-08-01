export type ActivityId = "garden" | "noticeboard" | "safe-route" | "memory-table";

export interface KampungMeters {
  connection: number;
  purpose: number;
  comfort: number;
}

export interface ActivityChoice {
  id: string;
  label: string;
  response: string;
  effects: KampungMeters;
}

export interface ActivityDefinition {
  id: ActivityId;
  title: string;
  resident: string;
  introduction: string;
  completedMessage: string;
  choices: readonly ActivityChoice[];
}

export interface SandboxState {
  completedActivities: ActivityId[];
  choices: Partial<Record<ActivityId, string>>;
  meters: KampungMeters;
  eveningReady: boolean;
  dayEnded: boolean;
}

export const METER_MAX = 6;
export const ACTIVITIES_REQUIRED_FOR_EVENING = 3;

export const ACTIVITIES: readonly ActivityDefinition[] = [
  {
    id: "garden",
    title: "Community Garden",
    resident: "Aunty Mei",
    introduction:
      "The noon sun is strong, but this soil can feed the whole block. What should we grow together?",
    completedMessage:
      "The new garden bed is already drawing neighbours over for a look.",
    choices: [
      {
        id: "herbs",
        label: "Herbs for shared meals",
        response:
          "Aunty Mei marks out pandan, mint, and curry leaf. She will teach the younger neighbours when to harvest them.",
        effects: { connection: 1, purpose: 2, comfort: 0 },
      },
      {
        id: "flowers",
        label: "Flowers around a seat",
        response:
          "Aunty Mei plans a bright corner where people can pause, chat, and trade gardening tips.",
        effects: { connection: 2, purpose: 1, comfort: 1 },
      },
    ],
  },
  {
    id: "noticeboard",
    title: "Void-Deck Noticeboard",
    resident: "Uncle Ravi",
    introduction:
      "This board has plenty of notices but not enough invitations. What should we host this weekend?",
    completedMessage:
      "The fresh invitation is up. Uncle Ravi is already greeting the first curious neighbour.",
    choices: [
      {
        id: "chess",
        label: "A friendly chess circle",
        response:
          "Uncle Ravi offers to teach the opening moves. Beginners and experienced players will share the same table.",
        effects: { connection: 2, purpose: 1, comfort: 0 },
      },
      {
        id: "stories",
        label: "A neighbourhood story swap",
        response:
          "Uncle Ravi pins up a call for old photos and new stories. Everyone gets a turn to contribute.",
        effects: { connection: 2, purpose: 2, comfort: 0 },
      },
    ],
  },
  {
    id: "safe-route",
    title: "Shaded Route",
    resident: "Mdm Siti",
    introduction:
      "I use this path every day. The route is direct, but the afternoon stretch needs more care. Where should we begin?",
    completedMessage:
      "Mdm Siti tests the improved route herself and adds one more practical note to the plan.",
    choices: [
      {
        id: "rest-point",
        label: "Add a comfortable rest point",
        response:
          "Mdm Siti chooses a spot with a clear view and room for walking aids. The bench becomes a natural meeting place.",
        effects: { connection: 1, purpose: 0, comfort: 2 },
      },
      {
        id: "shelter",
        label: "Extend the sheltered path",
        response:
          "Mdm Siti maps the rain and sun exposure from experience. Her route notes guide the new shelter plan.",
        effects: { connection: 0, purpose: 1, comfort: 2 },
      },
    ],
  },
  {
    id: "memory-table",
    title: "Memory Table",
    resident: "Community Table",
    introduction:
      "A small matching game is laid out here for anyone who wants a quiet shared activity.",
    completedMessage:
      "The final pair clicks into place. A nearby family starts another round together.",
    choices: [
      {
        id: "completed",
        label: "Complete the matching game",
        response:
          "You finish the table together and leave the cards ready for the next neighbours.",
        effects: { connection: 1, purpose: 0, comfort: 1 },
      },
    ],
  },
];

export function createSandboxState(): SandboxState {
  return {
    completedActivities: [],
    choices: {},
    meters: { connection: 0, purpose: 0, comfort: 0 },
    eveningReady: false,
    dayEnded: false,
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
    eveningReady: completedActivities.length >= ACTIVITIES_REQUIRED_FOR_EVENING,
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
