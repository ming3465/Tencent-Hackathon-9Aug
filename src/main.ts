import { KampungAudio, readStoredAudioSettings } from "./game/audio.js";
import {
  CHAPTER_BY_ID,
  LOCATIONS,
  NPC_BY_ID,
} from "./game/campaignContent.js";
import {
  KAMPUNG_METER_MAX,
  canEnterLocation,
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
import {
  estateMapAnchorLocation,
  getEstateMapPosition,
} from "./game/estateMap.js";
import {
  JOURNAL_CATEGORIES,
  buildJournalView,
  defaultJournalEntryId,
  type JournalCategory,
  type JournalEntryView,
  type JournalViewModel,
} from "./game/journal.js";
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
const estateMinimap = byId<HTMLButtonElement>("estate-minimap");
const minimapPlace = byId<HTMLElement>("minimap-place");
const minimapPlayer = byId<HTMLElement>("minimap-player");

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
const journalDetail = byId<HTMLElement>("journal-detail");
const journalChapterLabel = byId<HTMLElement>("journal-chapter-label");
const journalChapterTitle = byId<HTMLElement>("journal-chapter-title");
const campaignProgress = byId<HTMLElement>("campaign-progress");
const journalTabs = Array.from(
  document.querySelectorAll<HTMLButtonElement>("[data-journal-category]"),
);

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
let journalCategory: JournalCategory = "story";
let journalRenderedRevision = -1;
let trackedQuestId: string | null = null;
let trackedQuestTitle: string | null = null;
const selectedJournalEntries: Partial<Record<JournalCategory, string>> = {};
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
        onStep: () => {
          audio.play("step");
          renderMinimap();
        },
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
    renderMinimap();
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

function renderMinimap(): void {
  const navigation = campaignHandle?.getNavigationSnapshot();
  const locationId =
    navigation?.locationId ?? campaignState.currentLocation;
  const position = getEstateMapPosition(
    locationId,
    locationId === "estate" ? navigation?.player : undefined,
  );
  minimapPlayer.setAttribute(
    "transform",
    `translate(${position.xPercent.toFixed(2)} ${position.yPercent.toFixed(2)})`,
  );
  const anchorLocation = estateMapAnchorLocation(locationId);
  for (const landmark of estateMinimap.querySelectorAll<SVGElement>(
    "[data-map-location]",
  )) {
    landmark.classList.toggle(
      "current",
      landmark.dataset.mapLocation === anchorLocation,
    );
  }
  const locationName =
    LOCATIONS.find((location) => location.id === locationId)?.name
    ?? locationId;
  minimapPlace.textContent = locationName;
  estateMinimap.setAttribute(
    "aria-label",
    `Circular estate map. You are at ${locationName}.${
      trackedQuestTitle ? ` Tracking ${trackedQuestTitle}.` : ""
    } Open Places in the Journal.`,
  );
}

function renderCampaign(): void {
  renderMeters();
  renderJournal();
  renderMinimap();
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

const JOURNAL_SECTION_TITLES: Readonly<Record<JournalCategory, string>> = {
  story: "Main Story",
  requests: "Optional Requests",
  people: "People",
  places: "Places",
};

function journalActionsForEntry(
  entry: JournalEntryView,
): readonly JournalAction[] {
  if (entry.locked) return [];
  if (entry.category === "story") {
    return entry.current ? mainStoryActions() : [];
  }
  if (entry.category === "requests" && entry.npcId && entry.questId) {
    const complete = campaignState.completedQuests.includes(entry.questId);
    const offered = campaignState.objectives.includes(
      `offered:${entry.questId}`,
    );
    const npcName = NPC_BY_ID.get(entry.npcId)?.name ?? "Neighbour";
    return [{
      label: complete ? `Talk with ${npcName}` : `Open ${npcName}'s request`,
      run: () =>
        openNpc(entry.npcId!, {
          preferredKind: complete
            ? "memory-reaction"
            : offered
              ? "reminder"
              : "offer-request",
        }),
    }];
  }
  if (entry.category === "people" && entry.npcId) {
    return [{ label: "Talk", run: () => openNpc(entry.npcId!) }];
  }
  if (entry.category === "places" && entry.locationId) {
    return [{
      label: entry.current ? "You are here" : "Visit",
      run: () => visitLocation(entry.locationId!),
      disabled: entry.current,
    }];
  }
  return [];
}

function appendJournalProgress(
  parent: HTMLElement,
  entry: JournalEntryView,
): void {
  if (entry.progressTotal <= 0) return;
  const progress = document.createElement("span");
  progress.className = "journal-entry-progress";
  const track = document.createElement("span");
  const fill = document.createElement("i");
  fill.style.width = `${
    (entry.progressCurrent / entry.progressTotal) * 100
  }%`;
  track.appendChild(fill);
  const count = document.createElement("b");
  count.textContent = `${entry.progressCurrent}/${entry.progressTotal}`;
  progress.append(track, count);
  parent.appendChild(progress);
}

function selectJournalEntry(
  category: JournalCategory,
  entryId: string,
  restoreEntryFocus = true,
): void {
  journalCategory = category;
  selectedJournalEntries[category] = entryId;
  renderJournal();
  if (restoreEntryFocus) {
    journalContent
      .querySelector<HTMLButtonElement>(
        `[data-journal-entry="${entryId}"]`,
      )
      ?.focus();
  }
}

function renderJournalDetail(
  view: JournalViewModel,
  entry: JournalEntryView | null,
): void {
  journalDetail.innerHTML = "";
  if (!entry) {
    const empty = document.createElement("p");
    empty.className = "journal-empty-note";
    empty.textContent =
      "There are no notes in this section yet. The Journal will grow as you explore.";
    journalDetail.appendChild(empty);
    return;
  }

  const type = document.createElement("p");
  type.className = "journal-detail-type";
  type.textContent = entry.typeLabel;
  const title = document.createElement("h3");
  title.textContent = entry.title;
  const meta = document.createElement("p");
  meta.className = "journal-detail-meta";
  meta.textContent = entry.meta;
  const summary = document.createElement("p");
  summary.className = "journal-detail-summary";
  summary.textContent = entry.summary;
  journalDetail.append(type, title, meta, summary);

  if (entry.progressTotal > 0) {
    const progress = document.createElement("div");
    progress.className = "quest-progress";
    const label = document.createElement("div");
    label.className = "quest-progress-label";
    const labelText = document.createElement("span");
    labelText.textContent = entry.complete ? "Quest complete" : "Quest progress";
    const count = document.createElement("span");
    count.textContent = `${entry.progressCurrent} of ${entry.progressTotal}`;
    label.append(labelText, count);
    const track = document.createElement("span");
    track.className = "quest-progress-track";
    const fill = document.createElement("span");
    fill.className = "quest-progress-fill";
    fill.style.width = `${
      (entry.progressCurrent / entry.progressTotal) * 100
    }%`;
    track.appendChild(fill);
    progress.append(label, track);
    journalDetail.appendChild(progress);
  }

  if (entry.objectives.length) {
    const objectivesTitle = document.createElement("h4");
    objectivesTitle.className = "journal-objectives-title";
    objectivesTitle.textContent = "Objectives";
    const objectives = document.createElement("ul");
    objectives.className = "journal-objectives";
    for (const objective of entry.objectives) {
      const item = document.createElement("li");
      item.className = [
        "journal-objective",
        objective.complete ? "complete" : "",
      ].filter(Boolean).join(" ");
      const label = document.createElement("span");
      label.textContent = objective.label;
      item.appendChild(label);
      if (objective.progressText) {
        const progressText = document.createElement("b");
        progressText.textContent = objective.progressText;
        item.appendChild(progressText);
      }
      objectives.appendChild(item);
    }
    journalDetail.append(objectivesTitle, objectives);
  } else {
    const note = document.createElement("p");
    note.className = "journal-empty-note";
    note.textContent = entry.locked
      ? "This chapter stays spoiler-free until the current story is complete."
      : entry.category === "people"
        ? "People are the estate's experts. Their conversations and remembered choices remain available."
        : "This note is here for reference; nothing needs to be completed.";
    journalDetail.appendChild(note);
  }

  const actions = document.createElement("div");
  actions.className = "journal-detail-actions";
  const trackable =
    (entry.category === "story" || entry.category === "requests")
    && !entry.locked
    && !entry.complete;
  if (trackable) {
    const track = document.createElement("button");
    const tracked = trackedQuestId === entry.id;
    track.type = "button";
    track.className = "journal-track-button";
    track.setAttribute("aria-pressed", String(tracked));
    track.textContent = tracked ? "Tracking quest" : "Track quest";
    track.addEventListener("click", () => {
      trackedQuestId = tracked ? null : entry.id;
      renderJournal();
      renderMinimap();
      journalDetail
        .querySelector<HTMLButtonElement>(".journal-track-button")
        ?.focus();
      announce(
        tracked
          ? `${entry.title} is no longer tracked.`
          : `${entry.title} is now tracked.`,
      );
    });
    actions.appendChild(track);
  }
  for (const action of journalActionsForEntry(entry)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "journal-action";
    button.textContent = action.label;
    button.disabled = action.disabled === true;
    button.addEventListener("click", action.run);
    actions.appendChild(button);
  }
  if (actions.childElementCount) journalDetail.appendChild(actions);

  const trackedEntry = JOURNAL_CATEGORIES
    .flatMap((category) => view.entries[category])
    .find((candidate) => candidate.id === trackedQuestId);
  if (trackedEntry?.complete || trackedEntry?.locked) trackedQuestId = null;
}

function renderJournal(): void {
  const currentLocation =
    campaignHandle?.getCurrentLocation() ?? campaignState.currentLocation;
  const view = buildJournalView(campaignState, currentLocation);
  const stateChanged = journalRenderedRevision !== campaignState.revision;
  journalRenderedRevision = campaignState.revision;

  journalChapterLabel.textContent = view.chapterLabel;
  journalChapterTitle.textContent = view.chapterTitle;
  journalContent.innerHTML = "";

  for (const category of JOURNAL_CATEGORIES) {
    const entries = view.entries[category];
    const currentSelection = selectedJournalEntries[category];
    const selectionExists = entries.some(
      (entry) => entry.id === currentSelection,
    );
    if (
      !selectionExists
      || (stateChanged && category === "story")
    ) {
      selectedJournalEntries[category] =
        defaultJournalEntryId(view, category) ?? undefined;
    }
    const selectedId = selectedJournalEntries[category];

    const section = document.createElement("section");
    section.id = `journal-section-${category}`;
    section.className = "journal-section";
    section.setAttribute("role", "tabpanel");
    section.setAttribute("aria-labelledby", `journal-tab-${category}`);
    section.hidden = category !== journalCategory;
    const heading = document.createElement("h3");
    heading.textContent = JOURNAL_SECTION_TITLES[category];
    const list = document.createElement("ul");
    list.className = "journal-list";

    for (const entry of entries) {
      const item = document.createElement("li");
      item.className = [
        "journal-item",
        entry.complete ? "completed" : "",
        entry.current ? "current" : "",
        entry.locked ? "locked" : "",
        entry.id === selectedId ? "selected" : "",
      ].filter(Boolean).join(" ");
      const select = document.createElement("button");
      select.type = "button";
      select.className = "journal-entry-select";
      select.dataset.journalEntry = entry.id;
      select.setAttribute("aria-pressed", String(entry.id === selectedId));
      select.setAttribute(
        "aria-label",
        `${entry.statusLabel}. ${entry.title}. ${entry.summary}`,
      );
      const topline = document.createElement("span");
      topline.className = "journal-entry-topline";
      const status = document.createElement("span");
      status.className = "journal-status";
      status.textContent = entry.statusLabel;
      const kind = document.createElement("span");
      kind.className = "journal-entry-kind";
      kind.textContent = entry.typeLabel;
      topline.append(status, kind);
      const title = document.createElement("h3");
      title.textContent = entry.title;
      const summary = document.createElement("p");
      summary.textContent = entry.summary;
      select.append(topline, title, summary);
      appendJournalProgress(select, entry);
      select.addEventListener("click", () =>
        selectJournalEntry(category, entry.id)
      );
      item.appendChild(select);
      list.appendChild(item);
    }
    if (!entries.length) {
      const empty = document.createElement("li");
      empty.className = "journal-empty-note";
      empty.textContent = "Keep exploring. New notes will appear here.";
      list.appendChild(empty);
    }
    section.append(heading, list);
    journalContent.appendChild(section);
  }

  for (const tab of journalTabs) {
    const category = tab.dataset.journalCategory as JournalCategory;
    const selected = category === journalCategory;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    const count = tab.querySelector<HTMLElement>(".journal-tab-count");
    if (count) count.textContent = String(view.entries[category].length);
  }

  const selectedEntry =
    view.entries[journalCategory].find(
      (entry) => entry.id === selectedJournalEntries[journalCategory],
    ) ?? null;
  renderJournalDetail(view, selectedEntry);
  const trackedEntry = JOURNAL_CATEGORIES
    .flatMap((category) => view.entries[category])
    .find((entry) => entry.id === trackedQuestId);
  trackedQuestTitle = trackedEntry?.title ?? null;
  btnJournal.dataset.tracked = String(Boolean(trackedEntry));
  btnJournal.setAttribute(
    "aria-label",
    trackedEntry
      ? `Open Quest Journal. Tracking ${trackedEntry.title}.`
      : "Open Quest Journal.",
  );
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

function setJournalCategory(category: JournalCategory): void {
  journalCategory = category;
  renderJournal();
}

function openJournal(): void {
  renderJournal();
  journalOpen = true;
  journalPanel.classList.add("open");
  journalBackdrop.classList.add("open");
  journalPanel.removeAttribute("inert");
  journalPanel.setAttribute("aria-hidden", "false");
  btnJournal.setAttribute("aria-expanded", "true");
  document.body.classList.add("journal-open");
  setWorldControls(false);
  btnJournalClose.focus();
  announce(
    "Quest Journal open. Choose Story, Requests, People, or Places, then select an entry for its objectives.",
  );
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
      'button:not(:disabled):not([hidden]), input:not(:disabled):not([hidden]), summary, [href], [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => element.getClientRects().length > 0);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const activeElement =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  const closedSoundSummary =
    activeElement?.matches("details:not([open]) > summary") === true;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (
    !event.shiftKey
    && (document.activeElement === last || closedSoundSummary)
  ) {
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
estateMinimap.addEventListener("click", () => {
  const locationId =
    campaignHandle?.getCurrentLocation() ?? campaignState.currentLocation;
  journalCategory = "places";
  selectedJournalEntries.places = `place:${locationId}`;
  openJournal();
});
for (const [index, tab] of journalTabs.entries()) {
  const category = tab.dataset.journalCategory as JournalCategory;
  tab.addEventListener("click", () => setJournalCategory(category));
  tab.addEventListener("keydown", (event) => {
    let nextIndex = index;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % journalTabs.length;
    else if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + journalTabs.length) % journalTabs.length;
    } else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = journalTabs.length - 1;
    else return;
    event.preventDefault();
    const nextTab = journalTabs[nextIndex];
    const nextCategory =
      nextTab.dataset.journalCategory as JournalCategory;
    setJournalCategory(nextCategory);
    nextTab.focus();
  });
}
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
