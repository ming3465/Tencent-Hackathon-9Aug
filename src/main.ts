import {
  createPrng,
  createEngine,
  evaluateSelection,
  flipCard,
  isComplete,
  resolveMismatch,
  restartGame,
  type EngineState,
} from "./game/matchEngine.js";
import { CHAPTER_1_PAIRS } from "./game/chapter1.js";
import { DEFAULT_CONFIG } from "./game/config.js";
import {
  ACTIVITIES,
  ACTIVITIES_REQUIRED_FOR_EVENING,
  METER_MAX,
  buildChoiceScript,
  buildDialogueScript,
  buildEveningReflection,
  completeActivity,
  createSandboxState,
  endDay,
  getActivity,
  isActivityComplete,
  type ActivityId,
  type DialogueScript,
  type KampungMeters,
  type SandboxState,
} from "./game/sandboxState.js";
import type {
  SandboxGameHandle,
  WorldInteraction,
} from "./game/sandboxScene.js";
import { KampungAudio, readStoredAudioSettings } from "./game/audio.js";

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing required element #${id}`);
  return element as T;
}

const screenTitle = byId<HTMLElement>("screen-title");
const screenSandbox = byId<HTMLElement>("screen-sandbox");
const btnStart = byId<HTMLButtonElement>("btn-start");
const btnReturnTitle = byId<HTMLButtonElement>("btn-return-title");
const sandboxStage = byId<HTMLElement>("sandbox-stage");
const areaName = byId<HTMLElement>("area-name");
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
const journalPanel = byId<HTMLElement>("journal-panel");
const dayProgress = byId<HTMLElement>("day-progress");
const btnEvening = byId<HTMLButtonElement>("btn-evening");

const dialogOverlay = byId<HTMLElement>("dialog-overlay");
const dialogKicker = byId<HTMLElement>("dialog-kicker");
const dialogSpeaker = byId<HTMLElement>("dialog-speaker");
const dialogText = byId<HTMLElement>("dialog-text");
const dialogTextA11y = byId<HTMLElement>("dialog-text-a11y");
const dialogPortrait = byId<HTMLElement>("dialog-portrait");
const dialogProgress = byId<HTMLElement>("dialog-progress");
const dialogScroll = document.querySelector<HTMLElement>(".dialog-scroll")!;
const btnDialogAdvance = byId<HTMLButtonElement>("btn-dialog-advance");
const dialogChoices = byId<HTMLElement>("dialog-choices");
const btnDialogClose = byId<HTMLButtonElement>("btn-dialog-close");

const memoryOverlay = byId<HTMLElement>("memory-overlay");
const memoryBoard = byId<HTMLElement>("memory-board");
const memoryProgress = byId<HTMLElement>("memory-progress");
const memoryComplete = byId<HTMLElement>("memory-complete");
const btnMemoryRestart = byId<HTMLButtonElement>("btn-memory-restart");
const btnMemoryLeave = byId<HTMLButtonElement>("btn-memory-leave");

const eveningOverlay = byId<HTMLElement>("evening-overlay");
const eveningTitle = byId<HTMLElement>("evening-title");
const eveningText = byId<HTMLElement>("evening-text");
const btnKeepExploring = byId<HTMLButtonElement>("btn-keep-exploring");
const btnEndDay = byId<HTMLButtonElement>("btn-end-day");

const meterElements = {
  connection: byId<HTMLElement>("meter-connection"),
  purpose: byId<HTMLElement>("meter-purpose"),
  comfort: byId<HTMLElement>("meter-comfort"),
} satisfies Record<keyof KampungMeters, HTMLElement>;

const summaryElements = {
  connection: byId<HTMLElement>("summary-connection"),
  purpose: byId<HTMLElement>("summary-purpose"),
  comfort: byId<HTMLElement>("summary-comfort"),
} satisfies Record<keyof KampungMeters, HTMLElement>;

const MEMORY_PAIRS = CHAPTER_1_PAIRS.slice(0, 4);

/**
 * Judge path: ?demo=1 compresses the session for a timed judging window - the
 * evening unlocks after 2 activities instead of 3, and the player walks a
 * little faster. Every rule, line, and consequence is the shipped game's own.
 */
const DEMO_MODE = new URLSearchParams(window.location.search).has("demo");
const REQUIRED_FOR_EVENING = DEMO_MODE ? 2 : ACTIVITIES_REQUIRED_FOR_EVENING;
const COMPACT_LAYOUT = window.matchMedia("(max-width: 1000px)");
const JOURNAL_OPEN_COPY: Record<ActivityId, string> = {
  garden: "Find Aunty Mei near the garden beds.",
  noticeboard: "Uncle Ravi has space for a new invitation.",
  "safe-route": "Mdm Siti knows where the daily route needs care.",
  "memory-table": "A quiet matching activity waits at the void deck.",
};
let sandboxState: SandboxState = createSandboxState();
let sandboxHandle: SandboxGameHandle | null = null;
let memoryState: EngineState | null = null;
let memoryTimer: ReturnType<typeof setTimeout> | null = null;
let memoryVersion = 0;
let announceTimer: ReturnType<typeof setTimeout> | null = null;
let journalOpen = false;
let eveningAnnounced = false;

const audio = new KampungAudio(readStoredAudioSettings());

function showScreen(id: "screen-title" | "screen-sandbox"): void {
  screenTitle.classList.toggle("active", id === "screen-title");
  screenSandbox.classList.toggle("active", id === "screen-sandbox");
}

function announce(message: string): void {
  liveRegion.textContent = "";
  if (announceTimer !== null) clearTimeout(announceTimer);
  announceTimer = setTimeout(() => {
    liveRegion.textContent = message;
  }, 40);
}

function setWorldControls(enabled: boolean): void {
  sandboxHandle?.scene.setControlsEnabled(enabled);
}

function isOverlayOpen(): boolean {
  return [dialogOverlay, memoryOverlay, eveningOverlay].some((overlay) =>
    overlay.classList.contains("active")
  );
}

function focusWorld(): void {
  sandboxStage.focus();
}

async function startNewDay(): Promise<void> {
  btnStart.disabled = true;
  btnStart.textContent = "Opening the neighbourhood...";
  audio.unlock();
  sandboxState = createSandboxState(REQUIRED_FOR_EVENING);
  eveningAnnounced = false;
  renderSandboxState();
  showScreen("screen-sandbox");
  sandboxStage.setAttribute("aria-busy", "true");

  try {
    const { createSandboxGame } = await import("./game/sandboxScene.js");
    sandboxHandle = createSandboxGame("sandbox-stage", {
      onReady: () => {
        sandboxStage.setAttribute("aria-busy", "false");
        focusWorld();
        audio.startAmbience();
        announce("Neighbourhood open. Explore with the arrow keys or WASD.");
      },
      onNearbyInteraction: updateNearbyPrompt,
      onInteract: (interaction) => openInteraction(interaction.id),
      onAreaChange: (name) => {
        areaName.textContent = name;
      },
      onStep: () => audio.play("step"),
    }, { playerSpeed: DEMO_MODE ? 260 : undefined });

  } catch (error) {
    console.error(error);
    announce("The neighbourhood could not open.");
    returnToTitle();
  } finally {
    btnStart.disabled = false;
    btnStart.textContent = "Begin a neighbourhood day";
  }
}

function returnToTitle(): void {
  closeJournal(false);
  closeDialog(false);
  closeMemory(false);
  closeEvening(false);
  cancelMemoryTimer();
  updateNearbyPrompt(null);
  audio.stopAmbience();
  audio.setEveningMood(false);
  sandboxHandle?.game.destroy(true);
  sandboxHandle = null;
  sandboxStage.innerHTML = "";
  sandboxStage.setAttribute("aria-busy", "false");
  showScreen("screen-title");
  btnStart.focus();
}

function updateNearbyPrompt(interaction: WorldInteraction | null): void {
  const visible = interaction !== null;
  interactionPrompt.classList.toggle("visible", visible);
  interactionPrompt.setAttribute("aria-hidden", String(!visible));
  btnInteract.disabled = !visible;
  btnTouchInteract.disabled = !visible;
  if (interaction) {
    nearbyText.textContent = interaction.label;
  } else {
    nearbyText.textContent = "Move closer to a neighbour or activity.";
  }
}

/**
 * Simple pixel-style busts drawn from the same palette as the world sprites, so
 * the conversation panel and the map read as one place. No image files.
 */
const PORTRAIT_PALETTE: Record<string, { shirt: string; hair: string; brow: number }> = {
  "Aunty Mei": { shirt: "#c85c5c", hair: "#2a2523", brow: 2 },
  "Uncle Ravi": { shirt: "#3d7a80", hair: "#404040", brow: 3 },
  "Mdm Siti": { shirt: "#7b5aa6", hair: "#4c3b5f", brow: 1 },
};

function portraitSvg(speaker: string): string {
  const palette = PORTRAIT_PALETTE[speaker];
  const open = '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" role="presentation">';

  if (!palette) {
    // The memory table speaks as a place, not a person.
    return `${open}
      <rect width="16" height="16" fill="#fff6dc"/>
      <rect x="2" y="9" width="12" height="2" fill="#86624b"/>
      <rect x="3" y="11" width="1" height="3" fill="#6f4f36"/>
      <rect x="12" y="11" width="1" height="3" fill="#6f4f36"/>
      <rect x="4" y="5" width="3" height="4" fill="#f2c96d" stroke="#173f4f" stroke-width="0.4"/>
      <rect x="9" y="5" width="3" height="4" fill="#f2c96d" stroke="#173f4f" stroke-width="0.4"/>
    </svg>`;
  }

  const { shirt, hair, brow } = palette;
  return `${open}
    <rect width="16" height="16" fill="#fff6dc"/>
    <rect x="2" y="12" width="12" height="4" fill="${shirt}"/>
    <rect x="7" y="10" width="2" height="2" fill="#d9a77f"/>
    <rect x="5" y="4" width="6" height="7" fill="#d9a77f"/>
    <rect x="4" y="${brow}" width="8" height="${5 - brow}" fill="${hair}"/>
    <rect x="4" y="5" width="1" height="4" fill="${hair}"/>
    <rect x="11" y="5" width="1" height="4" fill="${hair}"/>
    <rect x="6" y="7" width="1" height="1" fill="#173f4f"/>
    <rect x="9" y="7" width="1" height="1" fill="#173f4f"/>
    <rect x="7" y="9" width="2" height="1" fill="#b9765d"/>
  </svg>`;
}

const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)");

let dialogueLines: readonly string[] = [];
let dialogueIndex = 0;
let dialogueActivity: ActivityId | null = null;
let dialogueOffersChoices = false;
let typeTimer: ReturnType<typeof setInterval> | null = null;

function stopTyping(): void {
  if (typeTimer !== null) {
    clearInterval(typeTimer);
    typeTimer = null;
  }
  dialogText.classList.remove("typing");
}

function isTyping(): boolean {
  return typeTimer !== null;
}

function playScript(script: DialogueScript, activityId: ActivityId): void {
  dialogueActivity = activityId;
  dialogueLines = script.lines;
  dialogueIndex = 0;
  dialogueOffersChoices = script.offersChoices;

  dialogKicker.textContent = script.title;
  dialogSpeaker.textContent = script.speaker;
  dialogPortrait.innerHTML = portraitSvg(script.speaker);
  dialogChoices.innerHTML = "";
  btnDialogClose.textContent = script.offersChoices ? "Maybe later" : "Back to neighbourhood";

  showDialogueLine();
}

function showDialogueLine(): void {
  const line = dialogueLines[dialogueIndex] ?? "";
  stopTyping();

  // Screen readers get the whole line immediately; the typewriter is decorative.
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
  if (isTyping()) {
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

  endDialogueScript();
}

function endDialogueScript(): void {
  stopTyping();
  btnDialogAdvance.classList.remove("visible");
  dialogProgress.textContent = "";

  if (dialogueActivity === null) {
    btnDialogClose.focus();
    return;
  }

  // The memory table is sat down at rather than decided, and stays replayable.
  if (dialogueActivity === "memory-table") {
    const played = isActivityComplete(sandboxState, "memory-table");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-button";
    button.textContent = played ? "Play another round" : "Sit down and play";
    button.addEventListener("click", () => {
      closeDialog(false);
      openMemory();
    });
    dialogChoices.appendChild(button);
    button.focus();
    return;
  }

  if (!dialogueOffersChoices) {
    btnDialogClose.focus();
    return;
  }

  const activity = getActivity(dialogueActivity);
  const activityId = dialogueActivity;
  for (const choice of activity.choices) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-button";
    button.textContent = choice.label;
    button.addEventListener("click", () => selectActivityChoice(activityId, choice.id));
    dialogChoices.appendChild(button);
  }
  dialogChoices.querySelector<HTMLButtonElement>("button")?.focus();
  announce(`${activity.resident} is waiting for your answer. Two options.`);
}

function openInteraction(activityId: ActivityId): void {
  dialogOverlay.classList.add("active");
  setWorldControls(false);
  audio.play("overlay-open");
  playScript(buildDialogueScript(sandboxState, activityId), activityId);
  btnDialogAdvance.focus();
}

function selectActivityChoice(activityId: ActivityId, choiceId: string): void {
  const activity = getActivity(activityId);
  sandboxState = completeActivity(sandboxState, activityId, choiceId);
  sandboxHandle?.scene.applyActivityChoice(activityId, choiceId);
  audio.play("choice");
  renderSandboxState();
  announce(`${activity.title} added to the neighbourhood journal.`);
  playScript(buildChoiceScript(activityId, choiceId), activityId);
  btnDialogAdvance.focus();
}

function closeDialog(restoreFocus = true): void {
  if (!dialogOverlay.classList.contains("active")) return;
  stopTyping();
  dialogOverlay.classList.remove("active");
  setWorldControls(true);
  audio.play("overlay-close");
  if (restoreFocus) focusWorld();
}

function renderSandboxState(): void {
  renderMeters();
  renderJournal();

  if (sandboxState.eveningReady && !eveningAnnounced) {
    eveningAnnounced = true;
    sandboxHandle?.scene.setEveningMood(true);
    audio.setEveningMood(true);
  }

  const completedForEvening = Math.min(
    sandboxState.completedActivities.length,
    sandboxState.requiredForEvening
  );
  dayProgress.textContent = sandboxState.eveningReady
    ? "The evening gathering is ready. You can join now or keep exploring."
    : `Complete any ${sandboxState.requiredForEvening} activities to gather at the void deck. ${completedForEvening} of ${sandboxState.requiredForEvening} ready.`;
  btnEvening.disabled = !sandboxState.eveningReady;
}

function renderMeters(): void {
  for (const key of Object.keys(meterElements) as (keyof KampungMeters)[]) {
    const value = sandboxState.meters[key];
    const element = meterElements[key];
    element.setAttribute("aria-valuenow", String(value));
    const valueLabel = element.querySelector<HTMLElement>(".meter-value");
    const fill = element.querySelector<HTMLElement>(".meter-fill");
    if (valueLabel) valueLabel.textContent = `${value}/${METER_MAX}`;
    if (fill) fill.style.width = `${(value / METER_MAX) * 100}%`;
    summaryElements[key].textContent = String(value);
  }
}

function renderJournal(): void {
  for (const activity of ACTIVITIES) {
    const item = byId<HTMLElement>(`journal-${activity.id}`);
    const status = item.querySelector<HTMLElement>(".journal-status");
    const description = item.querySelector<HTMLElement>("p");
    const action = item.querySelector<HTMLButtonElement>(".journal-action");
    const completed = isActivityComplete(sandboxState, activity.id);
    item.classList.toggle("completed", completed);
    if (status) {
      status.textContent = completed ? "DONE" : activity.id === "memory-table" ? "OPTION" : "OPEN";
    }
    if (description) {
      description.textContent = completed
        ? activity.completedMessage
        : JOURNAL_OPEN_COPY[activity.id];
    }
    if (action) action.textContent = completed ? "Revisit" : "Open invitation";
  }
}

function openJournal(): void {
  if (!COMPACT_LAYOUT.matches) {
    journalPanel.focus();
    announce("Journal focused. Four neighbourhood invitations are listed.");
    return;
  }
  journalOpen = true;
  journalPanel.classList.add("open");
  btnJournal.setAttribute("aria-expanded", "true");
  setWorldControls(false);
  btnJournalClose.focus();
}

function closeJournal(restoreFocus = true): void {
  if (!journalOpen) return;
  journalOpen = false;
  journalPanel.classList.remove("open");
  btnJournal.setAttribute("aria-expanded", "false");
  if (!isOverlayOpen()) setWorldControls(true);
  if (restoreFocus) focusWorld();
}

function syncJournalLayout(): void {
  if (!COMPACT_LAYOUT.matches) {
    journalOpen = false;
    journalPanel.classList.remove("open");
    btnJournal.setAttribute("aria-expanded", "true");
    if (!isOverlayOpen()) setWorldControls(true);
    return;
  }
  btnJournal.setAttribute("aria-expanded", String(journalOpen));
}

function cancelMemoryTimer(): void {
  memoryVersion += 1;
  if (memoryTimer !== null) {
    clearTimeout(memoryTimer);
    memoryTimer = null;
  }
}

function openMemory(): void {
  cancelMemoryTimer();
  memoryState = createEngine(
    MEMORY_PAIRS,
    "solo",
    createPrng(Math.floor(Math.random() * 0x7fffffff))
  );
  memoryComplete.classList.remove("visible");
  btnMemoryRestart.textContent = "New shuffle";
  memoryOverlay.classList.add("active");
  setWorldControls(false);
  audio.play("overlay-open");
  renderMemoryBoard();
  focusFirstMemoryCard();
}

function renderMemoryBoard(preferredCardId?: number): void {
  if (!memoryState) return;
  memoryBoard.innerHTML = "";
  memoryBoard.setAttribute("aria-busy", String(memoryState.locked));
  memoryProgress.textContent = `${memoryState.matchedPairs} of ${memoryState.totalPairs} pairs`;

  memoryState.cards.forEach((card, index) => {
    const button = document.createElement("button");
    const faceUp = card.state === "face-up" || card.state === "matched";
    button.type = "button";
    button.className = "memory-card";
    button.dataset.id = String(card.id);
    button.dataset.state = card.state;
    button.textContent = faceUp ? card.symbol : "";
    button.setAttribute(
      "aria-label",
      faceUp
        ? `Card ${index + 1} of ${memoryState!.cards.length}, ${card.label}, ${card.state}`
        : `Card ${index + 1} of ${memoryState!.cards.length}, face down`
    );
    button.disabled = card.state === "matched" || memoryState!.locked;
    button.addEventListener("click", () => handleMemoryCard(card.id));
    memoryBoard.appendChild(button);
  });

  if (preferredCardId !== undefined) {
    const preferred = memoryBoard.querySelector<HTMLButtonElement>(
      `.memory-card[data-id="${preferredCardId}"]:not(:disabled)`
    );
    const fallback = memoryBoard.querySelector<HTMLButtonElement>(".memory-card:not(:disabled)");
    (preferred ?? fallback)?.focus();
  }
}

function handleMemoryCard(cardId: number): void {
  if (!memoryState) return;
  const flipped = flipCard(memoryState, cardId);
  if (!flipped) return;
  memoryState = flipped;
  renderMemoryBoard(cardId);

  const result = evaluateSelection(memoryState);
  if (result.kind === "waiting") {
    memoryState = result.state;
    return;
  }

  memoryState = result.state;
  if (result.kind === "matched") {
    renderMemoryBoard(cardId);
    audio.play("match");
    if (isComplete(memoryState)) completeMemoryActivity();
    else announce("A pair found at the memory table.");
    return;
  }

  renderMemoryBoard();
  audio.play("mismatch");
  announce("Those keepsakes are different. They will turn back over.");
  const expectedVersion = memoryVersion;
  memoryTimer = setTimeout(() => {
    memoryTimer = null;
    if (!memoryState || expectedVersion !== memoryVersion) return;
    memoryState = resolveMismatch(memoryState);
    renderMemoryBoard(cardId);
  }, DEFAULT_CONFIG.mismatchDelayMs);
}

function completeMemoryActivity(): void {
  if (!isActivityComplete(sandboxState, "memory-table")) {
    sandboxState = completeActivity(sandboxState, "memory-table", "completed");
    sandboxHandle?.scene.applyActivityChoice("memory-table", "completed");
    renderSandboxState();
  }
  memoryComplete.classList.add("visible");
  btnMemoryRestart.textContent = "Play another shuffle";
  btnMemoryLeave.focus();
  audio.play("activity-complete");
  announce("All memory-table pairs found. The activity is complete.");
}

function restartMemoryGame(): void {
  if (!memoryState) return;
  cancelMemoryTimer();
  memoryState = restartGame(
    memoryState,
    MEMORY_PAIRS,
    createPrng(Math.floor(Math.random() * 0x7fffffff))
  );
  memoryComplete.classList.remove("visible");
  renderMemoryBoard();
  focusFirstMemoryCard();
}

function focusFirstMemoryCard(): void {
  memoryBoard.querySelector<HTMLButtonElement>(".memory-card:not(:disabled)")?.focus();
}

function closeMemory(restoreFocus = true): void {
  if (!memoryOverlay.classList.contains("active")) return;
  cancelMemoryTimer();
  memoryOverlay.classList.remove("active");
  memoryState = null;
  setWorldControls(true);
  if (restoreFocus) focusWorld();
}

const CLOSING_REFLECTION =
  "Ageing well is not one perfect solution. It is a neighbourhood that keeps making room for people to contribute on their own terms.";

function openEvening(): void {
  if (!sandboxState.eveningReady) return;

  if (sandboxState.dayEnded) {
    // Closing the ending and reopening it must not rewind the day.
    eveningTitle.textContent = "A day worth returning to.";
    eveningText.textContent = CLOSING_REFLECTION;
    btnKeepExploring.hidden = true;
    btnEndDay.textContent = "Return to title";
  } else {
    eveningTitle.textContent = "The block feels different tonight.";
    eveningText.textContent = buildEveningReflection(sandboxState);
    btnKeepExploring.hidden = false;
    btnEndDay.textContent = "End the day";
  }

  setWorldControls(false);
  audio.play("evening");
  (sandboxState.dayEnded ? btnEndDay : btnKeepExploring).focus();
}

function closeEvening(restoreFocus = true): void {
  if (!eveningOverlay.classList.contains("active")) return;
  eveningOverlay.classList.remove("active");
  setWorldControls(true);
  if (restoreFocus) focusWorld();
}

function handleEndDay(): void {
  if (!sandboxState.dayEnded) {
    sandboxState = endDay(sandboxState);
    eveningTitle.textContent = "A day worth returning to.";
    eveningText.textContent = CLOSING_REFLECTION;
    btnKeepExploring.hidden = true;
    btnEndDay.textContent = "Return to title";
    btnEndDay.focus();
    audio.play("day-complete");
    announce("Day complete. Every small act grew the kampung.");
    return;
  }
  returnToTitle();
}

function trapModalFocus(event: KeyboardEvent, overlay: HTMLElement): void {
  if (event.key !== "Tab") return;
  const focusable = Array.from(
    overlay.querySelectorAll<HTMLElement>(
      'button:not(:disabled):not([hidden]), [href], [tabindex]:not([tabindex="-1"])'
    )
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

btnStart.addEventListener("click", () => void startNewDay());
btnReturnTitle.addEventListener("click", returnToTitle);
btnInteract.addEventListener("click", () => sandboxHandle?.scene.tryInteract());
btnTouchInteract.addEventListener("click", () => sandboxHandle?.scene.tryInteract());

function renderSoundControls(): void {
  const settings = audio.getSettings();
  btnSound.setAttribute("aria-pressed", String(settings.muted));
  btnSound.textContent = settings.muted ? "Sound off" : "Sound on";
  volumeMusic.value = String(Math.round(settings.music * 100));
  volumeSfx.value = String(Math.round(settings.sfx * 100));
}

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
COMPACT_LAYOUT.addEventListener("change", syncJournalLayout);

for (const button of document.querySelectorAll<HTMLButtonElement>("[data-journal-activity]")) {
  button.addEventListener("click", () => {
    const activityId = button.dataset.journalActivity as ActivityId;
    if (journalOpen) closeJournal(false);
    openInteraction(activityId);
  });
}

btnDialogAdvance.addEventListener("click", advanceDialogue);
dialogScroll.addEventListener("click", () => {
  if (btnDialogAdvance.classList.contains("visible")) advanceDialogue();
});
btnDialogClose.addEventListener("click", () => closeDialog());
btnMemoryRestart.addEventListener("click", restartMemoryGame);
btnMemoryLeave.addEventListener("click", () => closeMemory());
btnEvening.addEventListener("click", openEvening);
btnKeepExploring.addEventListener("click", () => closeEvening());
btnEndDay.addEventListener("click", handleEndDay);

const DIRECTION_VECTORS: Record<string, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

// Held directions are tracked as a set so two buttons give a diagonal, and
// releasing one does not stop the player while the other is still down.
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
  sandboxHandle?.scene.setVirtualDirection(x, y);
}

for (const button of document.querySelectorAll<HTMLButtonElement>("[data-direction]")) {
  const direction = button.dataset.direction ?? "";
  if (!DIRECTION_VECTORS[direction]) continue;

  const startMovement = (event: PointerEvent) => {
    event.preventDefault();
    try {
      button.setPointerCapture(event.pointerId);
    } catch {
      // Some browsers reject capture for pointers they no longer track; the
      // release handlers below still clear the direction.
    }
    heldDirections.add(direction);
    applyHeldDirections();
  };
  const stopMovement = () => {
    heldDirections.delete(direction);
    applyHeldDirections();
  };

  button.addEventListener("pointerdown", startMovement);
  button.addEventListener("pointerup", stopMovement);
  button.addEventListener("pointercancel", stopMovement);
  button.addEventListener("lostpointercapture", stopMovement);
}

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (dialogOverlay.classList.contains("active")) closeDialog();
  else if (memoryOverlay.classList.contains("active")) closeMemory();
  else if (eveningOverlay.classList.contains("active")) closeEvening();
  else if (journalOpen) closeJournal();
});

dialogOverlay.addEventListener("keydown", (event) => trapModalFocus(event, dialogOverlay));
memoryOverlay.addEventListener("keydown", (event) => trapModalFocus(event, memoryOverlay));
eveningOverlay.addEventListener("keydown", (event) => trapModalFocus(event, eveningOverlay));

showScreen("screen-title");
renderSandboxState();
renderSoundControls();
syncJournalLayout();
