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
  buildEveningReflection,
  completeActivity,
  createSandboxState,
  endDay,
  getActivity,
  isActivityComplete,
  type ActivityId,
  type KampungMeters,
  type SandboxState,
} from "./game/sandboxState.js";
import type {
  SandboxGameHandle,
  WorldInteraction,
} from "./game/sandboxScene.js";

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

const btnJournal = byId<HTMLButtonElement>("btn-journal");
const btnJournalClose = byId<HTMLButtonElement>("btn-journal-close");
const journalPanel = byId<HTMLElement>("journal-panel");
const dayProgress = byId<HTMLElement>("day-progress");
const btnEvening = byId<HTMLButtonElement>("btn-evening");

const dialogOverlay = byId<HTMLElement>("dialog-overlay");
const dialogKicker = byId<HTMLElement>("dialog-kicker");
const dialogSpeaker = byId<HTMLElement>("dialog-speaker");
const dialogText = byId<HTMLElement>("dialog-text");
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
  sandboxState = createSandboxState();
  renderSandboxState();
  showScreen("screen-sandbox");
  sandboxStage.setAttribute("aria-busy", "true");

  try {
    const { createSandboxGame } = await import("./game/sandboxScene.js");
    sandboxHandle = createSandboxGame("sandbox-stage", {
      onReady: () => {
        sandboxStage.setAttribute("aria-busy", "false");
        focusWorld();
        announce("Neighbourhood open. Explore with the arrow keys or WASD.");
      },
      onNearbyInteraction: updateNearbyPrompt,
      onInteract: (interaction) => openInteraction(interaction.id),
      onAreaChange: (name) => {
        areaName.textContent = name;
      },
    });

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

function openInteraction(activityId: ActivityId): void {
  if (activityId === "memory-table") {
    openMemory();
    return;
  }

  const activity = getActivity(activityId);
  dialogKicker.textContent = activity.title;
  dialogSpeaker.textContent = activity.resident;
  dialogChoices.innerHTML = "";

  if (isActivityComplete(sandboxState, activityId)) {
    dialogText.textContent = activity.completedMessage;
    btnDialogClose.textContent = "Back to neighbourhood";
  } else {
    dialogText.textContent = activity.introduction;
    btnDialogClose.textContent = "Maybe later";
    for (const choice of activity.choices) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice-button";
      button.textContent = choice.label;
      button.addEventListener("click", () => selectActivityChoice(activityId, choice.id));
      dialogChoices.appendChild(button);
    }
  }

  dialogOverlay.classList.add("active");
  setWorldControls(false);
  const firstChoice = dialogChoices.querySelector<HTMLButtonElement>("button");
  (firstChoice ?? btnDialogClose).focus();
}

function selectActivityChoice(activityId: ActivityId, choiceId: string): void {
  const activity = getActivity(activityId);
  const choice = activity.choices.find((candidate) => candidate.id === choiceId);
  if (!choice) return;

  sandboxState = completeActivity(sandboxState, activityId, choiceId);
  sandboxHandle?.scene.applyActivityChoice(activityId, choiceId);
  renderSandboxState();
  dialogText.textContent = choice.response;
  dialogChoices.innerHTML = "";
  btnDialogClose.textContent = "Back to neighbourhood";
  btnDialogClose.focus();
  announce(`${activity.title} added to the neighbourhood journal.`);
}

function closeDialog(restoreFocus = true): void {
  if (!dialogOverlay.classList.contains("active")) return;
  dialogOverlay.classList.remove("active");
  setWorldControls(true);
  if (restoreFocus) focusWorld();
}

function renderSandboxState(): void {
  renderMeters();
  renderJournal();
  const completedForEvening = Math.min(
    sandboxState.completedActivities.length,
    ACTIVITIES_REQUIRED_FOR_EVENING
  );
  dayProgress.textContent = sandboxState.eveningReady
    ? "The evening gathering is ready. You can join now or keep exploring."
    : `Complete any 3 activities to gather at the void deck. ${completedForEvening} of ${ACTIVITIES_REQUIRED_FOR_EVENING} ready.`;
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
    if (isComplete(memoryState)) completeMemoryActivity();
    else announce("A pair found at the memory table.");
    return;
  }

  renderMemoryBoard();
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

function openEvening(): void {
  if (!sandboxState.eveningReady) return;
  eveningTitle.textContent = "The block feels different tonight.";
  eveningText.textContent = buildEveningReflection(sandboxState);
  btnKeepExploring.hidden = false;
  btnEndDay.textContent = "End the day";
  eveningOverlay.classList.add("active");
  setWorldControls(false);
  btnKeepExploring.focus();
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
    eveningText.textContent =
      "Ageing well is not one perfect solution. It is a neighbourhood that keeps making room for people to contribute on their own terms.";
    btnKeepExploring.hidden = true;
    btnEndDay.textContent = "Return to title";
    btnEndDay.focus();
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
  ).filter((element) => !element.hidden);
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

btnDialogClose.addEventListener("click", () => closeDialog());
btnMemoryRestart.addEventListener("click", restartMemoryGame);
btnMemoryLeave.addEventListener("click", () => closeMemory());
btnEvening.addEventListener("click", openEvening);
btnKeepExploring.addEventListener("click", () => closeEvening());
btnEndDay.addEventListener("click", handleEndDay);

for (const button of document.querySelectorAll<HTMLButtonElement>("[data-direction]")) {
  const vectors: Record<string, [number, number]> = {
    up: [0, -1],
    down: [0, 1],
    left: [-1, 0],
    right: [1, 0],
  };
  const vector = vectors[button.dataset.direction ?? ""];
  if (!vector) continue;

  const startMovement = (event: PointerEvent) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    sandboxHandle?.scene.setVirtualDirection(vector[0], vector[1]);
  };
  const stopMovement = () => sandboxHandle?.scene.setVirtualDirection(0, 0);
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
syncJournalLayout();
btnStart.focus();
