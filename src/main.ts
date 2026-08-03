import { KampungAudio, readStoredAudioSettings } from "./game/audio.js";
import {
  CHAPTERS,
  CHAPTER_BY_ID,
  LOCATIONS,
  NPC_BY_ID,
  QUESTS,
  SIDE_QUEST_IDS,
} from "./game/campaignContent.js";
import {
  KAMPUNG_METER_MAX,
  canEnterLocation,
  chapterIsComplete,
  chapterIsUnlocked,
  createCampaignState,
  getChapterProgress,
  reduceCampaign,
} from "./game/campaign.js";
import {
  clearCampaign,
  loadCampaign,
  parseDemoMode,
  saveCampaign,
} from "./game/campaignSave.js";
import { renderCampaignPortrait } from "./game/campaignPortrait.js";
import { selectNpcIntent } from "./game/kampungMind.js";
import type {
  CampaignEvent,
  CampaignStateV1,
  IntentChoiceDefinition,
  KampungMeters,
  LocationId,
  NpcId,
  NpcIntentDefinition,
  WorldInteraction,
} from "./game/campaignTypes.js";
import type {
  CampaignGameHandle,
  CampaignMotionSnapshot,
} from "./game/campaignScene.js";

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing required element #${id}`);
  return element as T;
}

const screenTitle = byId<HTMLElement>("screen-title");
const screenSandbox = byId<HTMLElement>("screen-sandbox");
const btnStart = byId<HTMLButtonElement>("btn-start");
const btnContinue = byId<HTMLButtonElement>("btn-continue");
const btnStartOver = byId<HTMLButtonElement>("btn-start-over");
const btnReturnTitle = byId<HTMLButtonElement>("btn-return-title");
const worldShell = byId<HTMLElement>("world-shell");
const sandboxStage = byId<HTMLElement>("sandbox-stage");
const areaName = byId<HTMLElement>("area-name");
const chapterLabel = byId<HTMLElement>("chapter-label");
const liveRegion = byId<HTMLElement>("live-region");

const interactionPrompt = byId<HTMLElement>("interaction-prompt");
const nearbyText = byId<HTMLElement>("nearby-text");
const btnInteract = byId<HTMLButtonElement>("btn-interact");
const btnTouchInteract = byId<HTMLButtonElement>("btn-touch-interact");

const btnSound = byId<HTMLButtonElement>("btn-sound");
const volumeMusic = byId<HTMLInputElement>("volume-music");
const volumeSfx = byId<HTMLInputElement>("volume-sfx");

const btnJournal = byId<HTMLButtonElement>("btn-journal");
const btnJournalClose = byId<HTMLButtonElement>("btn-journal-close");
const journalBackdrop = byId<HTMLElement>("journal-backdrop");
const journalPanel = byId<HTMLElement>("journal-panel");
const journalContent = byId<HTMLElement>("journal-content");
const campaignProgress = byId<HTMLElement>("campaign-progress");

const dialogOverlay = byId<HTMLElement>("dialog-overlay");
const dialogKicker = byId<HTMLElement>("dialog-kicker");
const dialogSpeaker = byId<HTMLElement>("dialog-speaker");
const dialogText = byId<HTMLElement>("dialog-text");
const dialogTextA11y = byId<HTMLElement>("dialog-text-a11y");
const dialogPortrait = byId<HTMLElement>("dialog-portrait");
const dialogProgress = byId<HTMLElement>("dialog-progress");
const dialogScroll = document.querySelector<HTMLElement>(".dialog-scroll");
if (!dialogScroll) throw new Error("Missing required .dialog-scroll");
const btnDialogAdvance = byId<HTMLButtonElement>("btn-dialog-advance");
const dialogChoices = byId<HTMLElement>("dialog-choices");
const btnDialogClose = byId<HTMLButtonElement>("btn-dialog-close");

const meterElements = {
  connection: byId<HTMLElement>("meter-connection"),
  purpose: byId<HTMLElement>("meter-purpose"),
  comfort: byId<HTMLElement>("meter-comfort"),
} satisfies Record<keyof KampungMeters, HTMLElement>;

const DEMO_MODE = parseDemoMode(window.location.search);
const SMOKE_MODE =
  new URLSearchParams(window.location.search).get("smoke") === "1";
const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)");
const audio = new KampungAudio(readStoredAudioSettings());
const smokeWindow = window as Window & {
  __kampungSmoke?: {
    getMotionSnapshot: () => CampaignMotionSnapshot | null;
  };
};

let campaignState = createCampaignState({ demo: DEMO_MODE });
let savedCampaign = loadCampaign(window.localStorage, DEMO_MODE);
let campaignHandle: CampaignGameHandle | null = null;
let nearbyInteraction: WorldInteraction | null = null;
let journalOpen = false;
let announceTimer: ReturnType<typeof setTimeout> | null = null;
let typeTimer: ReturnType<typeof setInterval> | null = null;
let dialogueLines: readonly string[] = [];
let dialogueIndex = 0;
let dialogueChoicesToShow: readonly IntentChoiceDefinition[] = [];
let dialogueChoiceHandler:
  | ((choice: IntentChoiceDefinition) => void)
  | null = null;

function showScreen(id: "screen-title" | "screen-sandbox"): void {
  screenTitle.classList.toggle("active", id === "screen-title");
  screenSandbox.classList.toggle("active", id === "screen-sandbox");
}

function announce(message: string): void {
  liveRegion.textContent = "";
  if (announceTimer) clearTimeout(announceTimer);
  announceTimer = setTimeout(() => {
    liveRegion.textContent = message;
  }, 40);
}

function focusWorld(): void {
  sandboxStage.focus();
  campaignHandle?.setControlsEnabled(true);
}

function setWorldControls(enabled: boolean): void {
  campaignHandle?.setControlsEnabled(enabled);
}

let viewportResizeFrame: number | null = null;

function queueCampaignViewportResize(): void {
  if (viewportResizeFrame !== null) {
    cancelAnimationFrame(viewportResizeFrame);
  }
  viewportResizeFrame = requestAnimationFrame(() => {
    viewportResizeFrame = null;
    if (!campaignHandle) return;
    const width = sandboxStage.clientWidth;
    const height = sandboxStage.clientHeight;
    if (width <= 0 || height <= 0) return;
    campaignHandle.resize(width, height);
  });
}

function renderTitleActions(): void {
  const hasSave = savedCampaign !== null && !DEMO_MODE;
  btnStart.hidden = hasSave;
  btnContinue.hidden = !hasSave;
  btnStartOver.hidden = !hasSave;
  if (savedCampaign) {
    const chapter = savedCampaign.currentChapter === "free-explore"
      ? "Free exploration"
      : CHAPTER_BY_ID.get(savedCampaign.currentChapter)?.title ?? "the campaign";
    btnContinue.textContent = `Continue — ${chapter}`;
  }
}

async function startCampaign(state: CampaignStateV1): Promise<void> {
  btnStart.disabled = true;
  btnContinue.disabled = true;
  audio.unlock();
  campaignState = state;
  saveCampaign(window.localStorage, campaignState);
  if (!campaignState.demo) savedCampaign = campaignState;
  renderCampaign();
  showScreen("screen-sandbox");
  sandboxStage.setAttribute("aria-busy", "true");

  try {
    const { createCampaignGame } = await import("./game/campaignScene.js");
    campaignHandle = createCampaignGame(
      "sandbox-stage",
      {
        onReady: (locationId) => {
          sandboxStage.setAttribute("aria-busy", "false");
          setTimeout(focusWorld, 0);
          audio.startAmbience();
          announce(
            `${NPC_BY_ID.get("voice")?.name ?? "The Voice"}: ${
              locationId === "y-flat"
                ? "Move when you are ready. Nothing here is timed."
                : "Location ready."
            }`,
          );
        },
        onNearbyInteraction: updateNearbyPrompt,
        onInteract: handleWorldInteraction,
        onLocationChange: (locationId, name) => {
          areaName.textContent = name;
          worldShell.classList.toggle(
            "interior-framing",
            locationId !== "estate",
          );
          queueCampaignViewportResize();
          dispatchCampaign({ type: "visit-location", locationId });
          announce(`${name}. Location changed.`);
        },
        onStep: () => audio.play("step"),
      },
      {
        initialLocation: state.currentLocation,
        state,
        playerSpeed: DEMO_MODE ? 260 : undefined,
        reducedMotion: REDUCED_MOTION.matches,
      },
    );
    if (SMOKE_MODE) {
      smokeWindow.__kampungSmoke = {
        getMotionSnapshot: () => campaignHandle?.getMotionSnapshot() ?? null,
      };
    }
    queueCampaignViewportResize();
  } catch (error) {
    console.error(error);
    announce("The estate could not open.");
    returnToTitle();
  } finally {
    btnStart.disabled = false;
    btnContinue.disabled = false;
  }
}

function startNewCampaign(): void {
  void startCampaign(createCampaignState({ demo: DEMO_MODE }));
}

function continueCampaign(): void {
  if (!savedCampaign) return;
  void startCampaign(savedCampaign);
}

function startOver(): void {
  const confirmed = window.confirm(
    "Start Kampung SG again from Y's flat? Your current campaign save will be replaced.",
  );
  if (!confirmed) return;
  clearCampaign(window.localStorage, DEMO_MODE);
  savedCampaign = null;
  void startCampaign(createCampaignState({ demo: DEMO_MODE }));
}

function returnToTitle(): void {
  closeJournal(false);
  closeDialogue(false);
  updateNearbyPrompt(null);
  audio.stopAmbience();
  campaignHandle?.game.destroy(true);
  campaignHandle = null;
  delete smokeWindow.__kampungSmoke;
  sandboxStage.innerHTML = "";
  sandboxStage.setAttribute("aria-busy", "false");
  savedCampaign = loadCampaign(window.localStorage, DEMO_MODE);
  renderTitleActions();
  showScreen("screen-title");
  (savedCampaign ? btnContinue : btnStart).focus();
}

function dispatchCampaign(event: CampaignEvent): void {
  const previousChapter = campaignState.currentChapter;
  const next = reduceCampaign(campaignState, event);
  if (next === campaignState) return;
  campaignState = next;
  saveCampaign(window.localStorage, campaignState);
  if (!campaignState.demo) savedCampaign = campaignState;
  campaignHandle?.setCampaignState(campaignState);
  renderCampaign();
  if (previousChapter !== campaignState.currentChapter) {
    const nextTitle = campaignState.currentChapter === "free-explore"
      ? "Free exploration"
      : CHAPTER_BY_ID.get(campaignState.currentChapter)?.title ?? "Next chapter";
    audio.play("activity-complete");
    announce(`${nextTitle} unlocked. The estate remembers what you changed.`);
  }
}

function updateNearbyPrompt(interaction: WorldInteraction | null): void {
  nearbyInteraction = interaction;
  const visible = interaction !== null;
  interactionPrompt.classList.toggle("visible", visible);
  interactionPrompt.setAttribute("aria-hidden", String(!visible));
  btnInteract.disabled = !visible;
  btnTouchInteract.disabled = !visible;
  nearbyText.textContent = interaction?.label ?? "Move closer to a person, doorway, or object.";
  btnTouchInteract.textContent = interaction === null
    ? "Interact"
    : interaction.kind === "door" || interaction.kind === "exit"
      ? "Enter"
      : interaction.kind === "flavour" || interaction.kind === "quest-object"
        ? "Look"
        : "Talk";
}

function handleWorldInteraction(interaction: WorldInteraction): void {
  switch (interaction.kind) {
    case "npc":
      openNpc(interaction.npcId);
      return;
    case "door":
    case "exit":
      visitLocation(interaction.targetLocationId);
      return;
    case "quest-object":
      dispatchCampaign({
        type: "complete-objective",
        objectiveId: interaction.objectiveId,
      });
      openNarrative(
        "A useful detail",
        "Neighbourhood object",
        [`You take a careful look. ${interaction.label}. The Journal records what matters.`],
      );
      return;
    case "flavour":
      openNarrative(interaction.shortLabel, "The estate", interaction.lines);
  }
}

function visitLocation(locationId: LocationId): void {
  if (!canEnterLocation(campaignState, locationId)) {
    const location = LOCATIONS.find((candidate) => candidate.id === locationId);
    openNarrative(
      "The door stays closed for now",
      location?.name ?? "A future place",
      [
        location?.unlockHint
          ?? "Continue the current chapter. This route will remain available when it opens.",
      ],
    );
    return;
  }
  if (campaignHandle?.getCurrentLocation() === locationId) {
    announce(`You are already in ${areaName.textContent ?? "this place"}.`);
    focusWorld();
    return;
  }
  closeJournal(false);
  setWorldControls(false);
  audio.play("overlay-close");
  campaignHandle?.transitionTo(locationId);
}

function openNpc(
  npcId: NpcId,
  options: { preferredKind?: NpcIntentDefinition["kind"]; preferredIntentId?: string } = {},
): void {
  try {
    const profile = NPC_BY_ID.get(npcId);
    if (!profile) throw new Error(`Unknown NPC: ${npcId}`);
    const intent = selectNpcIntent({
      state: campaignState,
      npcId,
      preferredKind: options.preferredKind,
      preferredIntentId: options.preferredIntentId,
      expertiseNeeded: currentExpertiseNeeds(),
    });

    if (intent.kind === "offer-request") {
      const requestEvent = intent.choices
        ?.flatMap((candidate) => candidate.events)
        .find(
          (event): event is Extract<CampaignEvent, { type: "complete-request" }> =>
            event.type === "complete-request",
        );
      if (requestEvent) {
        dispatchCampaign({
          type: "complete-objective",
          objectiveId: `offered:${requestEvent.questId}`,
        });
      }
    }

    openDialogue(
      intent.title,
      profile.name,
      intent.lines,
      intent.choices ?? [],
      npcId,
      (selectedChoice) => {
        for (const event of selectedChoice.events) dispatchCampaign(event);
        audio.play("choice");
        showDialogueScript(
          selectedChoice.responseLines,
          [],
          null,
        );
        announce(`${profile.name} remembers this choice.`);
      },
    );
  } catch (error) {
    console.error(error);
    openNarrative(
      "A quiet moment",
      NPC_BY_ID.get(npcId)?.name ?? "Neighbour",
      ["There is time to return to this conversation later."],
      npcId,
    );
  }
}

function currentExpertiseNeeds(): readonly string[] {
  switch (campaignState.currentChapter) {
    case "chapter-1":
      return ["door", "route", "seating"];
    case "chapter-2":
      return ["ingredient", "welcome"];
    case "chapter-3":
      return ["tool", "keepsake", "weaving"];
    default:
      return [];
  }
}

function openNarrative(
  title: string,
  speaker: string,
  lines: readonly string[],
  npcId: NpcId | null = null,
): void {
  openDialogue(title, speaker, lines, [], npcId, null);
}

function openDialogue(
  title: string,
  speaker: string,
  lines: readonly string[],
  choices: readonly IntentChoiceDefinition[],
  npcId: NpcId | null,
  onChoice: ((choice: IntentChoiceDefinition) => void) | null,
): void {
  closeJournal(false);
  dialogOverlay.classList.add("active");
  setWorldControls(false);
  audio.play("overlay-open");
  dialogKicker.textContent = title;
  dialogSpeaker.textContent = speaker;
  dialogPortrait.innerHTML = renderCampaignPortrait(npcId);
  dialogueChoiceHandler = onChoice;
  showDialogueScript(lines, choices, onChoice);
  btnDialogAdvance.focus();
}

function showDialogueScript(
  lines: readonly string[],
  choices: readonly IntentChoiceDefinition[],
  onChoice: ((choice: IntentChoiceDefinition) => void) | null,
): void {
  dialogueLines = lines;
  dialogueIndex = 0;
  dialogueChoicesToShow = choices;
  dialogueChoiceHandler = onChoice;
  dialogChoices.innerHTML = "";
  btnDialogClose.textContent = choices.length ? "Maybe later" : "Back";
  showDialogueLine();
}

function stopTyping(): void {
  if (typeTimer) {
    clearInterval(typeTimer);
    typeTimer = null;
  }
  dialogText.classList.remove("typing");
}

function showDialogueLine(): void {
  const line = dialogueLines[dialogueIndex] ?? "";
  stopTyping();
  dialogTextA11y.textContent = line;
  dialogProgress.textContent =
    dialogueLines.length > 1 ? `${dialogueIndex + 1} of ${dialogueLines.length}` : "";
  btnDialogAdvance.classList.add("visible");
  btnDialogAdvance.disabled = false;

  if (REDUCED_MOTION.matches) {
    dialogText.textContent = line;
    return;
  }
  dialogText.textContent = "";
  dialogText.classList.add("typing");
  let index = 0;
  const step = Math.max(1, Math.ceil(line.length / 90));
  typeTimer = setInterval(() => {
    index = Math.min(line.length, index + step);
    dialogText.textContent = line.slice(0, index);
    if (index >= line.length) stopTyping();
  }, 16);
}

function advanceDialogue(): void {
  if (typeTimer) {
    stopTyping();
    dialogText.textContent = dialogueLines[dialogueIndex] ?? "";
    return;
  }
  if (dialogueIndex < dialogueLines.length - 1) {
    dialogueIndex += 1;
    audio.play("overlay-open");
    showDialogueLine();
    return;
  }
  finishDialogueScript();
}

function finishDialogueScript(): void {
  stopTyping();
  btnDialogAdvance.classList.remove("visible");
  dialogProgress.textContent = "";
  dialogChoices.innerHTML = "";
  if (!dialogueChoicesToShow.length) {
    btnDialogClose.focus();
    return;
  }
  for (const choice of dialogueChoicesToShow) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-button";
    button.textContent = choice.label;
    button.addEventListener("click", () => {
      dialogueChoiceHandler?.(choice);
    });
    dialogChoices.appendChild(button);
  }
  dialogChoices.querySelector<HTMLButtonElement>("button")?.focus();
  announce(`${dialogSpeaker.textContent ?? "A neighbour"} offers ${dialogueChoicesToShow.length} choices.`);
}

function closeDialogue(restoreFocus = true): void {
  if (!dialogOverlay.classList.contains("active")) return;
  stopTyping();
  dialogOverlay.classList.remove("active");
  dialogChoices.innerHTML = "";
  audio.play("overlay-close");
  if (restoreFocus) focusWorld();
}

function renderCampaign(): void {
  renderMeters();
  renderJournal();
  const chapter = campaignState.currentChapter === "free-explore"
    ? null
    : CHAPTER_BY_ID.get(campaignState.currentChapter);
  chapterLabel.textContent = campaignState.currentChapter === "free-explore"
    ? "Story complete"
    : `${chapter?.numberLabel ?? ""} · ${chapter?.title ?? ""}`;
  campaignProgress.textContent = getChapterProgress(campaignState);
}

function renderMeters(): void {
  for (const key of Object.keys(meterElements) as (keyof KampungMeters)[]) {
    const value = campaignState.meters[key];
    const element = meterElements[key];
    element.setAttribute("aria-valuemax", String(KAMPUNG_METER_MAX));
    element.setAttribute("aria-valuenow", String(value));
    element.setAttribute(
      "aria-valuetext",
      `${value} points of neighbourhood growth; this is not a target or score.`,
    );
    const valueLabel = element.querySelector<HTMLElement>(".meter-value");
    const fill = element.querySelector<HTMLElement>(".meter-fill");
    if (valueLabel) valueLabel.textContent = `+${value}`;
    if (fill) fill.style.width = `${(value / KAMPUNG_METER_MAX) * 100}%`;
  }
}

interface JournalAction {
  label: string;
  run: () => void;
  disabled?: boolean;
}

function createJournalSection(title: string): HTMLElement {
  const section = document.createElement("section");
  section.className = "journal-section";
  const heading = document.createElement("h3");
  heading.textContent = title;
  const list = document.createElement("ul");
  list.className = "journal-list";
  section.append(heading, list);
  return section;
}

function appendJournalItem(
  section: HTMLElement,
  statusText: string,
  title: string,
  description: string,
  actions: readonly JournalAction[],
  classes: readonly string[] = [],
): void {
  const list = section.querySelector("ul");
  if (!list) return;
  const item = document.createElement("li");
  item.className = ["journal-item", ...classes].join(" ");
  const status = document.createElement("span");
  status.className = "journal-status";
  status.textContent = statusText;
  const body = document.createElement("div");
  const heading = document.createElement("h3");
  heading.textContent = title;
  const copy = document.createElement("p");
  copy.textContent = description;
  body.append(heading, copy);
  if (actions.length) {
    const actionRow = document.createElement("div");
    actionRow.className = "journal-actions";
    for (const action of actions) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "journal-action";
      button.textContent = action.label;
      button.disabled = action.disabled === true;
      button.addEventListener("click", action.run);
      actionRow.appendChild(button);
    }
    body.appendChild(actionRow);
  }
  item.append(status, body);
  list.appendChild(item);
}

function renderJournal(): void {
  journalContent.innerHTML = "";
  const mainStory = createJournalSection("Main Story");
  for (const chapter of CHAPTERS) {
    const unlocked = chapterIsUnlocked(campaignState, chapter.id);
    const complete = chapterIsComplete(campaignState, chapter.id);
    const current = campaignState.currentChapter === chapter.id;
    if (!unlocked) {
      appendJournalItem(
        mainStory,
        "LOCKED",
        "A future chapter",
        "Complete the current chapter to reveal this story.",
        [],
        ["locked"],
      );
      continue;
    }
    appendJournalItem(
      mainStory,
      complete ? "DONE" : current ? "NOW" : "OPEN",
      `${chapter.numberLabel} — ${chapter.title}`,
      current ? getChapterProgress(campaignState) : chapter.summary,
      current ? mainStoryActions() : [],
      [complete ? "completed" : "", current ? "current" : ""].filter(Boolean),
    );
  }
  journalContent.appendChild(mainStory);

  const optional = createJournalSection("Optional Requests");
  const optionalUnlocked = campaignState.currentChapter !== "prologue";
  for (const questId of SIDE_QUEST_IDS) {
    const quest = QUESTS.find((candidate) => candidate.id === questId);
    if (!quest?.npcId) continue;
    const complete = campaignState.completedQuests.includes(quest.id);
    const offered = campaignState.objectives.includes(`offered:${quest.id}`);
    const npcName = NPC_BY_ID.get(quest.npcId)?.name ?? "Neighbour";
    appendJournalItem(
      optional,
      complete ? "DONE" : optionalUnlocked ? "OPTION" : "LOCKED",
      optionalUnlocked ? quest.title : "Neighbour request",
      optionalUnlocked
        ? complete
          ? `${npcName} remembers how you helped. This route remains revisitable.`
          : quest.summary
        : "Leave Y's flat to meet the estate's contributors.",
      optionalUnlocked
        ? [
            {
              label: complete ? `Talk with ${npcName}` : `Open ${npcName}'s request`,
              run: () =>
                openNpc(quest.npcId!, {
                  preferredKind: complete
                    ? "memory-reaction"
                    : offered
                      ? "reminder"
                      : "offer-request",
                }),
            },
          ]
        : [],
      [complete ? "completed" : "", optionalUnlocked ? "" : "locked"].filter(Boolean),
    );
  }
  journalContent.appendChild(optional);

  const people = createJournalSection("People");
  for (const npc of NPC_BY_ID.values()) {
    if (npc.id === "voice") continue;
    const storyNpc = ["mr-long", "grandma-ros", "craftsman-tan", "ben"].includes(npc.id);
    const known = !storyNpc
      ? campaignState.completedChapters.includes("prologue")
      : campaignState.visitedLocations.some((location) =>
          (
            (npc.id === "mr-long" && location === "mr-long-flat")
            || (npc.id === "grandma-ros" && location === "grandma-ros-kitchen")
            || (npc.id === "craftsman-tan" && location === "craftsman-workshop")
            || (npc.id === "ben" && location === "ben-flat")
          )
        );
    if (!known) continue;
    const helped = (campaignState.npcMemories[npc.id] ?? []).some((memory) =>
      memory.startsWith("helped:")
    );
    appendJournalItem(
      people,
      helped ? "REMEMBERS" : "KNOWN",
      npc.name,
      `${npc.communityRole}. Expertise: ${npc.expertise.join(", ")}.`,
      [{ label: "Talk", run: () => openNpc(npc.id) }],
      [],
    );
  }
  journalContent.appendChild(people);

  const places = createJournalSection("Places");
  for (const location of LOCATIONS) {
    const visited = campaignState.visitedLocations.includes(location.id);
    const unlocked = canEnterLocation(campaignState, location.id);
    const current = campaignHandle?.getCurrentLocation() === location.id
      || campaignState.currentLocation === location.id;
    const revealCurrentLocked =
      (campaignState.currentChapter === "chapter-2" && location.id === "grandma-ros-kitchen")
      || (campaignState.currentChapter === "chapter-3"
        && ["ben-flat", "craftsman-workshop"].includes(location.id));
    if (!visited && !unlocked && !revealCurrentLocked) continue;
    appendJournalItem(
      places,
      current ? "HERE" : visited ? "VISITED" : unlocked ? "OPEN" : "LOCKED",
      location.name,
      unlocked ? location.description : location.unlockHint ?? "Continue the current chapter.",
      [
        {
          label: current ? "You are here" : unlocked ? "Visit" : "Locked",
          run: () => visitLocation(location.id),
          disabled: current || !unlocked,
        },
      ],
      [current ? "current" : "", unlocked ? "" : "locked"].filter(Boolean),
    );
  }
  journalContent.appendChild(places);
}

function mainStoryActions(): readonly JournalAction[] {
  switch (campaignState.currentChapter) {
    case "prologue":
      return campaignState.objectives.includes("heard-voice")
        ? [{ label: "Use the first door", run: () => visitLocation("hdb-corridor") }]
        : [{ label: "Listen to the Voice", run: () => openNpc("voice") }];
    case "chapter-1":
      return campaignState.objectives.includes("mr-long-step-seen")
        ? []
        : [{ label: "Visit Mr. Long", run: () => visitLocation("mr-long-flat") }];
    case "chapter-2": {
      const actions: JournalAction[] = [];
      if (!campaignState.objectives.includes("ros-clue-minah")) {
        actions.push({ label: "Ask Auntie Minah", run: () => openNpc("auntie-minah") });
      }
      if (!campaignState.objectives.includes("ros-clue-seng")) {
        actions.push({ label: "Ask Uncle Seng", run: () => openNpc("uncle-seng") });
      }
      if (
        campaignState.objectives.includes("ros-clue-minah")
        && campaignState.objectives.includes("ros-clue-seng")
        && !campaignState.objectives.includes("grandma-kitchen-open")
      ) {
        actions.push({
          label: "Enter Grandma Ros's kitchen",
          run: () => visitLocation("grandma-ros-kitchen"),
        });
      }
      return actions;
    }
    case "chapter-3": {
      if (!campaignState.objectives.includes("ben-clue-tools")) {
        return [{ label: "Visit the workshop", run: () => visitLocation("craftsman-workshop") }];
      }
      if (!campaignState.objectives.includes("ben-clue-keepsake")) {
        return [{ label: "Ask Wei Ling", run: () => openNpc("wei-ling") }];
      }
      if (!campaignState.objectives.includes("ben-approach-chosen")) {
        return [
          { label: "Visit Ben's flat", run: () => visitLocation("ben-flat") },
          { label: "Talk with Ben", run: () => openNpc("ben") },
        ];
      }
      if (!campaignState.objectives.includes("ben-walking-with-y")) {
        return [{ label: "Ask Ben to walk together", run: () => openNpc("ben") }];
      }
      if (!campaignState.objectives.includes("ben-at-workshop")) {
        return [{ label: "Walk to the workshop", run: () => visitLocation("craftsman-workshop") }];
      }
      return [{ label: "Weave with Mr. Tan and Ben", run: () => openNpc("craftsman-tan") }];
    }
    case "ending":
      return [
        { label: "Return to Y's flat", run: () => visitLocation("y-flat") },
        { label: "Listen at the last door", run: () => openNpc("voice") },
      ];
    case "free-explore":
      return [];
  }
}

function openJournal(): void {
  journalOpen = true;
  journalPanel.classList.add("open");
  journalBackdrop.classList.add("open");
  journalPanel.removeAttribute("inert");
  journalPanel.setAttribute("aria-hidden", "false");
  btnJournal.setAttribute("aria-expanded", "true");
  document.body.classList.add("journal-open");
  setWorldControls(false);
  btnJournalClose.focus();
  announce("Campaign Journal open. Main Story, Optional Requests, People, and Places.");
}

function closeJournal(restoreFocus = true): void {
  const wasOpen = journalOpen;
  const activeElement =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  const focusedInside =
    activeElement !== null && journalPanel.contains(activeElement);
  journalOpen = false;
  if (focusedInside) {
    if (restoreFocus && wasOpen) focusWorld();
    else activeElement.blur();
  }
  journalPanel.classList.remove("open");
  journalBackdrop.classList.remove("open");
  journalPanel.setAttribute("inert", "");
  journalPanel.setAttribute("aria-hidden", "true");
  btnJournal.setAttribute("aria-expanded", "false");
  document.body.classList.remove("journal-open");
  if (restoreFocus && wasOpen && !focusedInside) focusWorld();
}

function syncJournalLayout(): void {
  closeJournal(false);
}

function trapFocusWithin(
  container: HTMLElement,
  event: KeyboardEvent,
): void {
  if (event.key !== "Tab") return;
  const focusable = Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not(:disabled):not([hidden]), input:not(:disabled):not([hidden]), [href], [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => element.getClientRects().length > 0);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function trapModalFocus(event: KeyboardEvent): void {
  trapFocusWithin(dialogOverlay, event);
}

function trapJournalFocus(event: KeyboardEvent): void {
  trapFocusWithin(journalPanel, event);
}

function renderSoundControls(): void {
  const settings = audio.getSettings();
  btnSound.setAttribute("aria-pressed", String(settings.muted));
  btnSound.textContent = settings.muted ? "Sound off" : "Sound on";
  volumeMusic.value = String(Math.round(settings.music * 100));
  volumeSfx.value = String(Math.round(settings.sfx * 100));
}

btnStart.addEventListener("click", startNewCampaign);
btnContinue.addEventListener("click", continueCampaign);
btnStartOver.addEventListener("click", startOver);
btnReturnTitle.addEventListener("click", returnToTitle);
btnInteract.addEventListener("click", () =>
  nearbyInteraction ? handleWorldInteraction(nearbyInteraction) : campaignHandle?.tryInteract()
);
btnTouchInteract.addEventListener("click", () => campaignHandle?.tryInteract());

btnSound.addEventListener("click", () => {
  audio.unlock();
  audio.setMuted(!audio.getSettings().muted);
  renderSoundControls();
  announce(audio.getSettings().muted ? "Sound muted." : "Sound on.");
});
volumeMusic.addEventListener("input", () => {
  audio.unlock();
  audio.setVolume("music", Number(volumeMusic.value) / 100);
});
volumeSfx.addEventListener("input", () => {
  audio.unlock();
  audio.setVolume("sfx", Number(volumeSfx.value) / 100);
});

btnJournal.addEventListener("click", () => {
  if (journalOpen) closeJournal();
  else openJournal();
});
btnJournalClose.addEventListener("click", () => closeJournal());
journalBackdrop.addEventListener("click", () => closeJournal());
journalPanel.addEventListener("keydown", trapJournalFocus);

btnDialogAdvance.addEventListener("click", advanceDialogue);
dialogScroll.addEventListener("click", () => {
  if (btnDialogAdvance.classList.contains("visible")) advanceDialogue();
});
btnDialogClose.addEventListener("click", () => closeDialogue());
dialogOverlay.addEventListener("keydown", trapModalFocus);

const DIRECTION_VECTORS: Record<string, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};
const heldDirections = new Set<string>();

function applyHeldDirections(): void {
  let x = 0;
  let y = 0;
  for (const direction of heldDirections) {
    const vector = DIRECTION_VECTORS[direction];
    if (!vector) continue;
    x += vector[0];
    y += vector[1];
  }
  campaignHandle?.setVirtualDirection(x, y);
}

for (const button of document.querySelectorAll<HTMLButtonElement>("[data-direction]")) {
  const direction = button.dataset.direction ?? "";
  if (!DIRECTION_VECTORS[direction]) continue;
  const startMovement = (event: PointerEvent): void => {
    event.preventDefault();
    try {
      button.setPointerCapture(event.pointerId);
    } catch {
      // Pointer release still clears the held direction.
    }
    heldDirections.add(direction);
    applyHeldDirections();
  };
  const stopMovement = (): void => {
    heldDirections.delete(direction);
    applyHeldDirections();
  };
  button.addEventListener("pointerdown", startMovement);
  button.addEventListener("pointerup", stopMovement);
  button.addEventListener("pointercancel", stopMovement);
  button.addEventListener("lostpointercapture", stopMovement);
}

document.addEventListener("focusin", (event) => {
  if (!campaignHandle) return;
  const target = event.target;
  const isWorld = target === sandboxStage || target === campaignHandle.game.canvas;
  setWorldControls(isWorld && !dialogOverlay.classList.contains("active") && !journalOpen);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (dialogOverlay.classList.contains("active")) closeDialogue();
  else if (journalOpen) closeJournal();
});

window.addEventListener("resize", queueCampaignViewportResize);

showScreen("screen-title");
renderCampaign();
renderSoundControls();
renderTitleActions();
syncJournalLayout();
