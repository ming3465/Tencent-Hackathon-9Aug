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
import { startTitleCast } from "./game/titleCast.js";
import {
  DEFAULT_APPEARANCE,
  DEFAULT_PLAYER_NAME,
  HAIR_COLOURS,
  MAX_PLAYER_NAME_LENGTH,
  personalise,
  type PlayerAppearance,
  sanitiseAppearance,
  sanitisePlayerName,
  SHIRT_COLOURS,
  SKIN_TONES,
  TROUSER_COLOURS,
} from "./game/playerIdentity.js";
import { renderPlayerPreview } from "./game/playerPreview.js";
import {
  carriedErrand,
  CARRY_ERRANDS,
  type CarryErrand,
  errandById,
} from "./game/carryErrands.js";
import {
  CAMPAIGN_PORTRAITS,
  renderCampaignPortrait,
  type PortraitMood,
} from "./game/campaignPortrait.js";
import {
  ESTATE_MAP_LANDMARKS,
  ESTATE_MAP_PATHS,
  estateMapAnchorLocation,
  getEstateMapPosition,
  projectEstateMapPoint,
} from "./game/estateMap.js";
import {
  JOURNAL_CATEGORIES,
  buildQuestTrackerView,
  buildJournalView,
  defaultJournalEntryId,
  type JournalCategory,
  type JournalEntryView,
} from "./game/journal.js";
import { selectNpcIntent } from "./game/kampungMind.js";
import { shouldAutoStartStoryBeat } from "./game/storyAutoStart.js";
import {
  reducePauseState,
  type PauseViewState,
} from "./game/pauseState.js";
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

type CampaignSceneModule = typeof import("./game/campaignScene.js");
type CampaignLoaderPhase = "idle" | "opening" | "slow" | "failed" | "ready";

interface NetworkConnection {
  readonly saveData?: boolean;
  readonly effectiveType?: string;
}

interface CampaignLoaderSmokeControl {
  prepareHeldLoad(): void;
  releaseHeldLoad(): void;
  failNextLoad(): void;
  failNextSave(): void;
  showSlowState(): void;
  getSnapshot(): {
    readonly phase: CampaignLoaderPhase;
    readonly loading: boolean;
    readonly attempt: number;
    readonly starts: number;
    readonly imports: number;
    readonly cached: boolean;
    readonly canvasCount: number;
    readonly storageAvailable: boolean;
  };
}

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing required element #${id}`);
  return element as T;
}

const screenTitle = byId<HTMLElement>("screen-title");
const screenSandbox = byId<HTMLElement>("screen-sandbox");
const mainElement = byId<HTMLElement>("main");
const btnStart = byId<HTMLButtonElement>("btn-start");
const inputPlayerName = byId<HTMLInputElement>("input-player-name");
const identityLooks = byId<HTMLElement>("identity-looks");
const identityCaption = byId<HTMLElement>("identity-preview-caption");
const playerPreviewCanvas = byId<HTMLCanvasElement>("player-preview");
const btnSurpriseLook = byId<HTMLButtonElement>("btn-surprise-look");
const btnContinue = byId<HTMLButtonElement>("btn-continue");
const btnOptions = byId<HTMLButtonElement>("btn-options");
const btnCredits = byId<HTMLButtonElement>("btn-credits");
const btnBegin = byId<HTMLButtonElement>("btn-begin");
const titleCastCanvas = byId<HTMLCanvasElement>("title-cast");
const foundTitleFrame = document.querySelector<HTMLElement>(".title-frame");
if (!foundTitleFrame) throw new Error("Missing required .title-frame");
const titleFrame: HTMLElement = foundTitleFrame;
const btnTitleSound = byId<HTMLButtonElement>("btn-title-sound");
const btnTitleFullscreen = byId<HTMLButtonElement>("btn-title-fullscreen");
const volumeTitleMusic = byId<HTMLInputElement>("volume-title-music");
const volumeTitleSfx = byId<HTMLInputElement>("volume-title-sfx");
const btnReturnTitle = byId<HTMLButtonElement>("btn-return-title");
const btnMenu = byId<HTMLButtonElement>("btn-menu");
const worldShell = byId<HTMLElement>("world-shell");
const sandboxStage = byId<HTMLElement>("sandbox-stage");
const campaignLoader = byId<HTMLElement>("campaign-loader");
const campaignLoaderMessage = byId<HTMLElement>("campaign-loader-message");
const btnCampaignLoadCancel = byId<HTMLButtonElement>("btn-campaign-load-cancel");
const btnCampaignLoadRetry = byId<HTMLButtonElement>("btn-campaign-load-retry");
const areaName = byId<HTMLElement>("area-name");
const chapterLabel = byId<HTMLElement>("chapter-label");
const liveRegion = byId<HTMLElement>("live-region");
const estateMinimap = byId<HTMLButtonElement>("estate-minimap");
const hudRail = byId<HTMLElement>("hud-rail");
const questTracker = byId<HTMLElement>("quest-tracker");
const minimapPlace = byId<HTMLElement>("minimap-place");
const minimapPlayer = byId<HTMLElement>("minimap-player");
const minimapLayout = document.getElementById("minimap-layout") as unknown as SVGGElement;
if (!minimapLayout) throw new Error("Missing required #minimap-layout");

const interactionPrompt = byId<HTMLElement>("interaction-prompt");
const nearbyText = byId<HTMLElement>("nearby-text");
const carryIndicator = byId<HTMLElement>("carry-indicator");
const btnTouchInteract = byId<HTMLButtonElement>("btn-touch-interact");
const foundTouchControls = document.querySelector<HTMLElement>(".touch-controls");
if (!foundTouchControls) throw new Error("Missing required .touch-controls");
const touchControls: HTMLElement = foundTouchControls;

const btnSound = byId<HTMLButtonElement>("btn-sound");
const btnFullscreen = byId<HTMLButtonElement>("btn-fullscreen");
const foundTopbarActions = document.querySelector<HTMLElement>(".topbar-actions");
if (!foundTopbarActions) throw new Error("Missing required .topbar-actions");
const topbarActions: HTMLElement = foundTopbarActions;
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

const pauseOverlay = byId<HTMLElement>("pause-overlay");
const pausePanel = byId<HTMLElement>("pause-panel");
const pauseViewMain = byId<HTMLElement>("pause-view-main");
const pauseViewSettings = byId<HTMLElement>("pause-view-settings");
const pauseViewConfirm = byId<HTMLElement>("pause-view-confirm");
const btnPauseResume = byId<HTMLButtonElement>("btn-pause-resume");
const btnPauseSettings = byId<HTMLButtonElement>("btn-pause-settings");
const btnPauseTitle = byId<HTMLButtonElement>("btn-pause-title");
const btnSettingsBack = byId<HTMLButtonElement>("btn-settings-back");
const btnConfirmCancel = byId<HTMLButtonElement>("btn-confirm-cancel");
const memoryOverlay = byId<HTMLElement>("memory-overlay");
const eveningOverlay = byId<HTMLElement>("evening-overlay");

const meterElements = {
  connection: byId<HTMLElement>("meter-connection"),
  purpose: byId<HTMLElement>("meter-purpose"),
  comfort: byId<HTMLElement>("meter-comfort"),
} satisfies Record<keyof KampungMeters, HTMLElement>;

const DEMO_MODE = parseDemoMode(window.location.search);
const SMOKE_MODE =
  new URLSearchParams(window.location.search).get("smoke") === "1";
const FORCE_CANVAS =
  new URLSearchParams(window.location.search).get("renderer") === "canvas";
const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)");
const audio = new KampungAudio(readStoredAudioSettings());
const smokeWindow = window as Window & {
  __kampungSmoke?: {
    getMotionSnapshot: () => CampaignMotionSnapshot | null;
    getRendererKind: () => "webgl" | "canvas" | null;
    isPaused: () => boolean;
    resetTouchInput: () => void;
    setPlayerPosition: (x: number, y: number) => void;
    tryInteract: () => void;
  };
  __kampungLoaderSmoke?: CampaignLoaderSmokeControl;
  /** Errand registry, so the harness drives real points rather than literals. */
  __kampungErrands?: readonly CarryErrand[];
};

let campaignStorageAvailable = true;
let campaignStorageWarningLogged = false;
let storageWarningAnnounced = false;
let smokeSaveFault = false;

function noteCampaignStorageFailure(error: unknown): void {
  campaignStorageAvailable = false;
  if (campaignStorageWarningLogged) return;
  campaignStorageWarningLogged = true;
  console.warn("Campaign progress could not be stored", error);
}

function noteCampaignStorageSuccess(): void {
  campaignStorageAvailable = true;
  campaignStorageWarningLogged = false;
  storageWarningAnnounced = false;
}

function loadCampaignSafely(
  fallback: CampaignStateV1 | null = null,
): CampaignStateV1 | null {
  try {
    const saved = loadCampaign(window.localStorage, DEMO_MODE);
    if (!saved && fallback && !fallback.demo) {
      saveCampaign(window.localStorage, fallback);
    }
    noteCampaignStorageSuccess();
    return saved ?? fallback;
  } catch (error) {
    noteCampaignStorageFailure(error);
    return fallback;
  }
}

function saveCampaignSafely(state: CampaignStateV1): boolean {
  try {
    if (SMOKE_MODE && smokeSaveFault) {
      smokeSaveFault = false;
      throw new DOMException("Smoke campaign save failure", "QuotaExceededError");
    }
    const saved = saveCampaign(window.localStorage, state);
    noteCampaignStorageSuccess();
    return saved;
  } catch (error) {
    noteCampaignStorageFailure(error);
    return false;
  }
}

function clearCampaignSafely(): boolean {
  try {
    const cleared = clearCampaign(window.localStorage, DEMO_MODE);
    noteCampaignStorageSuccess();
    return cleared;
  } catch (error) {
    noteCampaignStorageFailure(error);
    return false;
  }
}

let campaignState = createCampaignState({ demo: DEMO_MODE });

/**
 * Resolves the `{player}` token in story text against the name the player
 * chose on the title screen.
 *
 * Applied at every point story text reaches the DOM. A missed site would show
 * a judge a literal "{player}", so `browser-smoke.mjs` scans the rendered
 * document for unresolved tokens rather than trusting this list to be
 * complete.
 */
function pn(text: string): string {
  return personalise(text, campaignState.playerName);
}
let savedCampaign = loadCampaignSafely();
let campaignHandle: CampaignGameHandle | null = null;
let journalOpen = false;
let pauseState: PauseViewState = "closed";
let pauseRestoreFocus: HTMLElement | null = null;
let fullscreenChangeFromSettings = false;
const pauseAccessibilitySnapshot = new Map<
  HTMLElement,
  { ariaHidden: string | null; inert: boolean }
>();
let journalCategory: JournalCategory = "story";
let journalRenderedRevision = -1;
let trackedRequestEntryId: string | null = null;
let trackedRequestTitle: string | null = null;
const selectedJournalEntries: Partial<Record<JournalCategory, string>> = {};
const destroyedCampaignHandles = new WeakSet<CampaignGameHandle>();
let campaignScenePromise: Promise<CampaignSceneModule> | null = null;
let campaignLoading = false;
let campaignAttemptSequence = 0;
let activeCampaignAttempt = 0;
let campaignLoaderPhase: CampaignLoaderPhase = "idle";
let campaignSlowTimer: ReturnType<typeof setTimeout> | null = null;
let cancelScheduledCampaignPrefetch: (() => void) | null = null;
let campaignStarts = 0;
let campaignImports = 0;
let smokeLoadFault: "none" | "hold" | "fail" = "none";
let releaseHeldCampaignLoad: (() => void) | null = null;
let announceTimer: ReturnType<typeof setTimeout> | null = null;
let typeTimer: ReturnType<typeof setInterval> | null = null;
let dialogueLines: readonly string[] = [];
let dialogueIndex = 0;
let dialogueNpcId: NpcId | null = null;
let dialogueChoicesToShow: readonly IntentChoiceDefinition[] = [];
let dialogueChoiceHandler:
  | ((choice: IntentChoiceDefinition) => void)
  | null = null;

function showScreen(id: "screen-title" | "screen-sandbox"): void {
  for (const el of [screenTitle, screenSandbox]) {
    el.classList.remove("fade-in");
  }
  screenTitle.classList.toggle("active", id === "screen-title");
  screenSandbox.classList.toggle("active", id === "screen-sandbox");
  // Two-frame rAF so the browser paints the display:block before opacity animates
  const target = id === "screen-title" ? screenTitle : screenSandbox;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      target.classList.add("fade-in");
    });
  });
}

function announce(message: string): void {
  liveRegion.textContent = "";
  if (announceTimer) clearTimeout(announceTimer);
  announceTimer = setTimeout(() => {
    liveRegion.textContent = message;
  }, 40);
}

function setInputModality(modality: "keyboard" | "pointer"): void {
  document.documentElement.dataset.inputModality = modality;
}

function focusWorld(): void {
  if (
    !screenSandbox.classList.contains("active")
    || campaignLoading
    || campaignLoaderPhase === "slow"
    || campaignLoaderPhase === "failed"
    || pauseState !== "closed"
    || journalOpen
    || dialogOverlay.classList.contains("active")
  ) {
    return;
  }
  mainElement.removeAttribute("inert");
  mainElement.removeAttribute("aria-hidden");
  sandboxStage.removeAttribute("inert");
  sandboxStage.focus({ preventScroll: true });
  campaignHandle?.setControlsEnabled(true);
}

function restoreGameViewportOrigin(): void {
  requestAnimationFrame(() => {
    if (
      screenSandbox.classList.contains("active")
      && !isGameFullscreen()
    ) {
      window.scrollTo(0, 0);
    }
  });
}

function setWorldControls(enabled: boolean): void {
  campaignHandle?.setControlsEnabled(enabled);
}

function renderPauseView(): void {
  pauseViewMain.hidden = pauseState !== "paused";
  pauseViewSettings.hidden = pauseState !== "settings";
  pauseViewConfirm.hidden = pauseState !== "confirm-title";
  const labelId = pauseState === "settings"
    ? "settings-title"
    : pauseState === "confirm-title"
      ? "confirm-title-heading"
      : "pause-title";
  pauseOverlay.setAttribute("aria-labelledby", labelId);
}

function snapshotAndHidePauseBackground(): void {
  pauseAccessibilitySnapshot.clear();
  for (const element of [
    mainElement,
    dialogOverlay,
    memoryOverlay,
    eveningOverlay,
  ]) {
    pauseAccessibilitySnapshot.set(element, {
      ariaHidden: element.getAttribute("aria-hidden"),
      inert: element.hasAttribute("inert"),
    });
    element.setAttribute("aria-hidden", "true");
    element.setAttribute("inert", "");
  }
}

function restorePauseBackground(): void {
  for (const [element, snapshot] of pauseAccessibilitySnapshot) {
    if (snapshot.ariaHidden === null) element.removeAttribute("aria-hidden");
    else element.setAttribute("aria-hidden", snapshot.ariaHidden);
    element.toggleAttribute("inert", snapshot.inert);
  }
  pauseAccessibilitySnapshot.clear();
}

function openPause(): void {
  if (
    pauseState !== "closed"
    || !campaignHandle
    || !screenSandbox.classList.contains("active")
    || campaignLoading
    || campaignLoaderPhase === "opening"
    || campaignLoaderPhase === "slow"
    || campaignLoaderPhase === "failed"
  ) {
    return;
  }
  pauseRestoreFocus = document.activeElement instanceof HTMLElement
    ? document.activeElement
    : null;
  pauseState = reducePauseState(pauseState, "open");
  renderPauseView();
  pauseOverlay.classList.add("active");
  pauseOverlay.setAttribute("aria-hidden", "false");
  pauseOverlay.removeAttribute("inert");
  btnMenu.setAttribute("aria-expanded", "true");
  document.body.classList.add("game-paused");
  campaignHandle.setPaused(true);
  audio.setPauseDuck(true);
  btnPauseResume.focus();
  snapshotAndHidePauseBackground();
  audio.play("overlay-open");
  announce("Paused. Resume, open Settings, or return to the title.");
}

function showPauseState(next: "paused" | "settings" | "confirm-title"): void {
  if (pauseState === "closed") return;
  pauseState = next;
  renderPauseView();
  if (next === "settings") {
    renderSoundControls();
    btnSound.focus();
  } else if (next === "confirm-title") {
    btnConfirmCancel.focus();
  } else {
    btnPauseResume.focus();
  }
}

function resumePause(): void {
  if (pauseState === "closed") return;
  pauseState = reducePauseState(pauseState, "resume");
  pauseOverlay.classList.remove("active");
  pauseOverlay.setAttribute("aria-hidden", "true");
  pauseOverlay.setAttribute("inert", "");
  btnMenu.setAttribute("aria-expanded", "false");
  document.body.classList.remove("game-paused");
  restorePauseBackground();
  mainElement.removeAttribute("inert");
  mainElement.removeAttribute("aria-hidden");
  campaignHandle?.setPaused(false);
  audio.setPauseDuck(false);
  audio.play("overlay-close");
  const restore = pauseRestoreFocus;
  pauseRestoreFocus = null;
  if (restore?.isConnected && !restore.hasAttribute("inert")) {
    restore.focus();
  } else {
    focusWorld();
  }
  restoreGameViewportOrigin();
  announce("Resumed.");
}

function closePauseForTeardown(): void {
  if (pauseState === "closed") return;
  pauseState = "closed";
  pauseOverlay.classList.remove("active");
  pauseOverlay.setAttribute("aria-hidden", "true");
  pauseOverlay.setAttribute("inert", "");
  btnMenu.setAttribute("aria-expanded", "false");
  document.body.classList.remove("game-paused");
  restorePauseBackground();
  audio.setPauseDuck(false);
  pauseRestoreFocus = null;
}

function isGameFullscreen(): boolean {
  return document.fullscreenElement === document.documentElement;
}

function renderFullscreenControl(): void {
  const active = isGameFullscreen();
  document.documentElement.classList.toggle("game-fullscreen", active);
  worldShell.classList.toggle("fullscreen-active", active);
  btnFullscreen.setAttribute("aria-pressed", String(active));
  btnFullscreen.setAttribute(
    "aria-label",
    active ? "Exit full screen" : "Enter full screen",
  );
  btnFullscreen.dataset.shortLabel = active ? "Exit" : "Expand";
  btnFullscreen.textContent = active ? "Exit full screen" : "Full screen";
}

async function enterGameFullscreen(reportFailure = true): Promise<void> {
  const root = document.documentElement;
  if (typeof root.requestFullscreen !== "function") {
    if (reportFailure) {
      announce("Full screen is not available in this browser.");
      focusWorld();
    }
    return;
  }
  try {
    await root.requestFullscreen();
  } catch {
    if (reportFailure) {
      announce("Full screen was blocked. The game remains ready to play.");
      focusWorld();
    }
  }
}

async function toggleGameFullscreen(): Promise<void> {
  if (isGameFullscreen()) {
    try {
      await document.exitFullscreen();
    } catch {
      announce("Use Escape to leave full screen.");
    }
    return;
  }
  await enterGameFullscreen();
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

function setCampaignLaunchButtonsDisabled(disabled: boolean): void {
  btnStart.disabled = disabled;
  btnContinue.disabled = disabled;
  btnBegin.disabled = disabled;
}

function clearCampaignSlowTimer(): void {
  if (campaignSlowTimer === null) return;
  clearTimeout(campaignSlowTimer);
  campaignSlowTimer = null;
}

function renderCampaignLoader(phase: CampaignLoaderPhase): void {
  campaignLoaderPhase = phase;
  campaignLoader.dataset.phase = phase;
  campaignLoader.hidden = phase === "idle" || phase === "ready";
  const blocksWorldControls = phase === "opening" || phase === "slow" || phase === "failed";
  for (const surface of [
    sandboxStage,
    hudRail,
    interactionPrompt,
    touchControls,
    topbarActions,
  ]) {
    surface.toggleAttribute("inert", blocksWorldControls);
  }
  btnCampaignLoadCancel.hidden = phase !== "slow" && phase !== "failed";
  btnCampaignLoadRetry.hidden = phase !== "failed";
  if (phase === "opening") {
    campaignLoaderMessage.textContent = "Opening the neighbourhood…";
  } else if (phase === "slow") {
    campaignLoaderMessage.textContent = "Still opening; you can go back to the title";
  } else if (phase === "failed") {
    campaignLoaderMessage.textContent =
      "The estate could not open. Please try again or go back to the title.";
  }
}

function showCampaignSlowState(attempt: number): void {
  if (attempt !== activeCampaignAttempt || !campaignLoading) return;
  renderCampaignLoader("slow");
  announce("Still opening. You can go back to the title.");
  setTimeout(() => {
    if (attempt === activeCampaignAttempt && campaignLoading) {
      btnCampaignLoadCancel.focus();
    }
  }, 0);
}

function isCurrentCampaignAttempt(attempt: number): boolean {
  return attempt === activeCampaignAttempt
    && screenSandbox.classList.contains("active");
}

function destroyCampaignHandle(handle: CampaignGameHandle | null): void {
  if (!handle || destroyedCampaignHandles.has(handle)) return;
  destroyedCampaignHandles.add(handle);
  handle.game.destroy(true);
}

function importCampaignScene(): Promise<CampaignSceneModule> {
  campaignImports += 1;
  const fault = smokeLoadFault;
  smokeLoadFault = "none";
  if (SMOKE_MODE && fault === "fail") {
    return Promise.reject(new Error("Smoke campaign loader import failure"));
  }
  if (SMOKE_MODE && fault === "hold") {
    return new Promise<void>((resolve) => {
      releaseHeldCampaignLoad = resolve;
    }).then(() => import("./game/campaignScene.js"));
  }
  return import("./game/campaignScene.js");
}

function loadCampaignScene(): Promise<CampaignSceneModule> {
  if (campaignScenePromise) return campaignScenePromise;
  const cachedPromise = importCampaignScene().catch((error: unknown) => {
    if (campaignScenePromise === cachedPromise) campaignScenePromise = null;
    throw error;
  });
  campaignScenePromise = cachedPromise;
  return cachedPromise;
}

function shouldPrefetchCampaignScene(): boolean {
  const connection = (
    navigator as Navigator & { readonly connection?: NetworkConnection }
  ).connection;
  const effectiveType = connection?.effectiveType?.toLowerCase();
  return connection?.saveData !== true
    && effectiveType !== "2g"
    && effectiveType !== "slow-2g";
}

function scheduleCampaignScenePrefetch(): void {
  if (!shouldPrefetchCampaignScene()) return;
  const prefetch = (): void => {
    cancelScheduledCampaignPrefetch = null;
    void loadCampaignScene().catch(() => {
      // Speculative failure is silent; loadCampaignScene clears its cache so
      // an explicit Start or Continue can retry and report a useful message.
    });
  };
  if (typeof window.requestIdleCallback === "function") {
    const idleId = window.requestIdleCallback(prefetch, { timeout: 2500 });
    cancelScheduledCampaignPrefetch = () => window.cancelIdleCallback(idleId);
    return;
  }
  const timeoutId = window.setTimeout(prefetch, 1200);
  cancelScheduledCampaignPrefetch = () => window.clearTimeout(timeoutId);
}

function prefetchCampaignSceneAfterTitleLoad(): void {
  const schedule = (): void => {
    const titleArt = document.querySelector<HTMLImageElement>(".title-art");
    if (!titleArt || titleArt.complete) {
      scheduleCampaignScenePrefetch();
      return;
    }
    const afterTitleArt = (): void => scheduleCampaignScenePrefetch();
    titleArt.addEventListener("load", afterTitleArt, { once: true });
    titleArt.addEventListener("error", afterTitleArt, { once: true });
  };
  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });
}

if (SMOKE_MODE) {
  // Exposing the data, not hard-coded coordinates, keeps the browser check
  // honest when an errand is moved or added.
  smokeWindow.__kampungErrands = CARRY_ERRANDS;
  smokeWindow.__kampungLoaderSmoke = {
    prepareHeldLoad(): void {
      cancelScheduledCampaignPrefetch?.();
      cancelScheduledCampaignPrefetch = null;
      releaseHeldCampaignLoad?.();
      releaseHeldCampaignLoad = null;
      campaignScenePromise = null;
      smokeLoadFault = "hold";
    },
    releaseHeldLoad(): void {
      releaseHeldCampaignLoad?.();
      releaseHeldCampaignLoad = null;
    },
    failNextLoad(): void {
      cancelScheduledCampaignPrefetch?.();
      cancelScheduledCampaignPrefetch = null;
      campaignScenePromise = null;
      smokeLoadFault = "fail";
    },
    failNextSave(): void {
      smokeSaveFault = true;
    },
    showSlowState(): void {
      showCampaignSlowState(activeCampaignAttempt);
    },
    getSnapshot() {
      return {
        phase: campaignLoaderPhase,
        loading: campaignLoading,
        attempt: activeCampaignAttempt,
        starts: campaignStarts,
        imports: campaignImports,
        cached: campaignScenePromise !== null,
        canvasCount: sandboxStage.querySelectorAll("canvas").length,
        storageAvailable: campaignStorageAvailable,
      };
    },
  };
}

function renderTitleActions(): void {
  const hasSave = savedCampaign !== null && !DEMO_MODE;
  // Start always shows. With the character creator behind it, Start *is* start
  // over - and "Begin the story" asks before it replaces anything.
  btnStart.hidden = false;
  btnContinue.hidden = !hasSave;
}

async function startCampaign(state: CampaignStateV1): Promise<void> {
  resetTouchInputState();
  if (campaignLoading || campaignHandle) return;
  // A fresh launch must never inherit background inertness from a browser
  // fullscreen or modal teardown race.
  mainElement.removeAttribute("inert");
  mainElement.removeAttribute("aria-hidden");
  campaignLoading = true;
  campaignStarts += 1;
  const attempt = ++campaignAttemptSequence;
  activeCampaignAttempt = attempt;
  setCampaignLaunchButtonsDisabled(true);
  renderCampaignLoader("opening");
  clearCampaignSlowTimer();
  campaignSlowTimer = setTimeout(
    () => showCampaignSlowState(attempt),
    12_000,
  );

  let attemptHandle: CampaignGameHandle | null = null;
  let pendingReadyLocation: LocationId | null = null;
  let saveUnavailable = false;
  const handleReady = (locationId: LocationId): void => {
    if (!isCurrentCampaignAttempt(attempt) || campaignHandle !== attemptHandle) {
      destroyCampaignHandle(attemptHandle);
      return;
    }
    if (campaignLoading) {
      campaignLoading = false;
      clearCampaignSlowTimer();
      renderCampaignLoader("ready");
      setCampaignLaunchButtonsDisabled(false);
    }
    sandboxStage.setAttribute("aria-busy", "false");
    setTimeout(() => {
      if (isCurrentCampaignAttempt(attempt)) focusWorld();
    }, 0);
    audio.startAmbience();
    announce(
      `${NPC_BY_ID.get("voice")?.name ?? "The Voice"}: ${
        locationId === "y-flat"
          ? "Move when you are ready. Nothing here is timed."
          : "Location ready."
      }${
        saveUnavailable
          ? " Progress cannot be saved in this browser session."
          : ""
      }`,
    );
    if (saveUnavailable) storageWarningAnnounced = true;
  };

  try {
    audio.unlock();
    campaignState = state;
    const saved = saveCampaignSafely(campaignState);
    saveUnavailable = !campaignState.demo && !saved;
    if (saved && !campaignState.demo) savedCampaign = campaignState;
    renderCampaign();
    showScreen("screen-sandbox");
    sandboxStage.setAttribute("aria-busy", "true");

    const { createCampaignGame } = await loadCampaignScene();
    if (!isCurrentCampaignAttempt(attempt)) return;
    const createdHandle = createCampaignGame(
      "sandbox-stage",
      {
        onReady: (locationId) => {
          if (!attemptHandle) {
            pendingReadyLocation = locationId;
            return;
          }
          handleReady(locationId);
        },
        onNearbyInteraction: (interaction) => {
          if (isCurrentCampaignAttempt(attempt)) {
            updateNearbyPrompt(interaction);
            maybeAutoStartStoryBeat(interaction);
          }
        },
        onInteract: (interaction) => {
          if (isCurrentCampaignAttempt(attempt)) {
            return handleWorldInteraction(interaction);
          }
          return false;
        },
        onLocationChange: (locationId, name) => {
          if (!isCurrentCampaignAttempt(attempt)) return;
          areaName.textContent = pn(name);
          worldShell.classList.toggle(
            "interior-framing",
            locationId !== "estate",
          );
          queueCampaignViewportResize();
          hasWalkedSinceLocationChange = false;
          dispatchCampaign({ type: "visit-location", locationId });
          announce(`${name}. Location changed.`);
        },
        onStep: (surface) => {
          hasWalkedSinceLocationChange = true;
          if (!isCurrentCampaignAttempt(attempt)) return;
          audio.playFootstep(surface);
          renderMinimap();
        },
      },
      {
        initialLocation: state.currentLocation,
        state,
        playerSpeed: DEMO_MODE ? 260 : undefined,
        reducedMotion: REDUCED_MOTION.matches,
        renderer: FORCE_CANVAS ? "canvas" : "auto",
      },
    );
    attemptHandle = createdHandle;
    if (!isCurrentCampaignAttempt(attempt)) {
      destroyCampaignHandle(createdHandle);
      return;
    }
    campaignHandle = createdHandle;
    if (pendingReadyLocation !== null) {
      const locationId = pendingReadyLocation;
      pendingReadyLocation = null;
      handleReady(locationId);
    }
    if (SMOKE_MODE) {
      smokeWindow.__kampungSmoke = {
        getMotionSnapshot: () => campaignHandle?.getMotionSnapshot() ?? null,
        getRendererKind: () => campaignHandle?.getRendererKind() ?? null,
        isPaused: () => campaignHandle?.isPaused() ?? false,
        resetTouchInput: resetTouchInputState,
        setPlayerPosition: (x, y) => {
          campaignHandle?.setPlayerPosition({ x, y });
        },
        tryInteract: () => campaignHandle?.tryInteract(),
      };
    }
    renderMinimap();
    queueCampaignViewportResize();
  } catch (error) {
    if (attempt !== activeCampaignAttempt) {
      destroyCampaignHandle(attemptHandle);
      return;
    }
    console.error(error);
    destroyCampaignHandle(attemptHandle);
    if (campaignHandle === attemptHandle) campaignHandle = null;
    campaignLoading = false;
    clearCampaignSlowTimer();
    showScreen("screen-sandbox");
    sandboxStage.setAttribute("aria-busy", "false");
    renderCampaignLoader("failed");
    setCampaignLaunchButtonsDisabled(false);
    announce("The estate could not open. Try again or go back to the title.");
    setTimeout(() => {
      if (isCurrentCampaignAttempt(attempt)) btnCampaignLoadRetry.focus();
    }, 0);
  }
}

/**
 * Title-screen character customiser.
 *
 * The option lists come straight from the same constants that colour the baked
 * sprite, and the preview calls the same painter, so there is exactly one
 * source of truth for what the player looks like.
 */
const LOOK_GROUPS = [
  { key: "skin", legend: "Skin", options: SKIN_TONES },
  { key: "hair", legend: "Hair", options: HAIR_COLOURS },
  { key: "shirt", legend: "Shirt", options: SHIRT_COLOURS },
  { key: "trousers", legend: "Trousers", options: TROUSER_COLOURS },
] as const;

let chosenAppearance: PlayerAppearance = { ...DEFAULT_APPEARANCE };

function swatchHex(colour: number): string {
  return `#${(colour >>> 0).toString(16).padStart(6, "0")}`;
}

function refreshIdentityPreview(): void {
  renderPlayerPreview(playerPreviewCanvas, chosenAppearance);
  identityCaption.textContent = sanitisePlayerName(inputPlayerName.value);
}

function buildIdentityControls(): void {
  identityLooks.replaceChildren();
  for (const group of LOOK_GROUPS) {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "look-group";
    const legend = document.createElement("legend");
    legend.className = "look-legend";
    legend.textContent = group.legend;
    const options = document.createElement("div");
    options.className = "look-options";

    for (const option of group.options) {
      const label = document.createElement("label");
      label.className = "look-option";

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = `look-${group.key}`;
      radio.value = option.id;
      radio.checked = chosenAppearance[group.key] === option.value;
      radio.addEventListener("change", () => {
        if (!radio.checked) return;
        chosenAppearance = { ...chosenAppearance, [group.key]: option.value };
        refreshIdentityPreview();
      });

      const swatch = document.createElement("span");
      swatch.className = "look-swatch";
      swatch.style.setProperty("--swatch", swatchHex(option.value));

      const text = document.createElement("span");
      text.className = "look-text";
      text.textContent = option.label;

      // The visible word is what the label announces; the swatch is decorative.
      swatch.setAttribute("aria-hidden", "true");
      label.append(radio, swatch, text);
      options.appendChild(label);
    }

    fieldset.append(legend, options);
    identityLooks.appendChild(fieldset);
  }
  refreshIdentityPreview();
}

function pickRandomLook(): void {
  for (const group of LOOK_GROUPS) {
    const choice = group.options[Math.floor(Math.random() * group.options.length)];
    if (choice) chosenAppearance = { ...chosenAppearance, [group.key]: choice.value };
  }
  for (const group of LOOK_GROUPS) {
    const selected = group.options.find(
      (option) => option.value === chosenAppearance[group.key],
    );
    const radio = identityLooks.querySelector<HTMLInputElement>(
      `input[name="look-${group.key}"][value="${selected?.id ?? ""}"]`,
    );
    if (radio) radio.checked = true;
  }
  refreshIdentityPreview();
  announce("Picked a new look for your character.");
}

/**
 * Brings the last player's name and look back to the title screen.
 *
 * This is the whole of "saving your account" that this game will ever do: the
 * profile lives in the same local save as the campaign, so there is no password
 * to forget, no server holding anyone's name, and nothing to sign in to. A
 * returning player finds themselves already filled in; starting over keeps
 * their character instead of resetting them to a stranger.
 */
function restoreSavedIdentity(): void {
  if (!savedCampaign) return;
  inputPlayerName.value = savedCampaign.playerName === DEFAULT_PLAYER_NAME
    ? ""
    : savedCampaign.playerName;
  chosenAppearance = { ...savedCampaign.playerAppearance };
}

type TitleView = "menu" | "new-game" | "options" | "credits";

/**
 * Switches which panel the title screen is showing.
 *
 * Deliberately the same shape as `showPauseState` - one visible section at a
 * time, focus moved to the first control in it so keyboard and screen-reader
 * users are not left behind on a hidden button.
 */
function showTitleView(view: TitleView): void {
  const views: readonly [TitleView, string][] = [
    ["menu", "title-view-menu"],
    ["new-game", "title-view-new-game"],
    ["options", "title-view-options"],
    ["credits", "title-view-credits"],
  ];
  for (const [id, elementId] of views) {
    const section = document.getElementById(elementId);
    if (section) section.hidden = id !== view;
  }
  titleFrame.dataset.view = view;
  const focusTarget: Record<TitleView, HTMLElement> = {
    menu: savedCampaign && !DEMO_MODE ? btnContinue : btnStart,
    "new-game": inputPlayerName,
    options: btnTitleSound,
    credits: btnCredits,
  };
  focusTarget[view].focus();
}

inputPlayerName.addEventListener("input", () => {
  identityCaption.textContent = sanitisePlayerName(inputPlayerName.value);
});
btnSurpriseLook.addEventListener("click", pickRandomLook);
inputPlayerName.maxLength = MAX_PLAYER_NAME_LENGTH;
restoreSavedIdentity();
buildIdentityControls();
titleFrame.dataset.view = "menu";
startTitleCast(titleCastCanvas, { reducedMotion: REDUCED_MOTION.matches });

function startNewCampaign(): void {
  // A new run replays the story from the top.
  autoStartedStoryBeats.clear();
  void startCampaign(
    createCampaignState({
      demo: DEMO_MODE,
      playerName: sanitisePlayerName(inputPlayerName.value),
      playerAppearance: sanitiseAppearance(chosenAppearance),
    }),
  );
}

function continueCampaign(): void {
  if (!savedCampaign) return;
  void startCampaign(savedCampaign);
}

/**
 * "Begin the story" from the new-game view.
 *
 * There is no separate "Start over" button any more - with the creator behind
 * Start, Start *is* start over. So the confirmation moves here, and only fires
 * when there is actually a save to lose.
 */
function beginNewCampaign(): void {
  if (savedCampaign && !DEMO_MODE) {
    const confirmed = window.confirm(
      pn("Start Kampung SG again from {player}'s house? Your current campaign save will be replaced."),
    );
    if (!confirmed) return;
    clearCampaignSafely();
    savedCampaign = null;
  }
  startNewCampaign();
}

function returnToTitle(): void {
  resetTouchInputState();
  closePauseForTeardown();
  mainElement.removeAttribute("inert");
  mainElement.removeAttribute("aria-hidden");
  activeCampaignAttempt = ++campaignAttemptSequence;
  campaignLoading = false;
  clearCampaignSlowTimer();
  renderCampaignLoader("idle");
  setCampaignLaunchButtonsDisabled(false);
  closeJournal(false);
  closeDialogue(false);
  updateNearbyPrompt(null);
  audio.stopAmbience();
  const handle = campaignHandle;
  campaignHandle = null;
  destroyCampaignHandle(handle);
  delete smokeWindow.__kampungSmoke;
  sandboxStage.innerHTML = "";
  sandboxStage.setAttribute("aria-busy", "false");
  savedCampaign = loadCampaignSafely(
    campaignState.demo ? null : campaignState,
  );
  renderTitleActions();
  showTitleView("menu");
  showScreen("screen-title");
  if (isGameFullscreen()) void document.exitFullscreen();
  (savedCampaign ? btnContinue : btnStart).focus();
}

function dispatchCampaign(event: CampaignEvent): void {
  const previousChapter = campaignState.currentChapter;
  const next = reduceCampaign(campaignState, event);
  if (next === campaignState) return;
  campaignState = next;
  const saved = saveCampaignSafely(campaignState);
  if (saved && !campaignState.demo) savedCampaign = campaignState;
  campaignHandle?.setCampaignState(campaignState);
  renderCampaign();
  if (previousChapter !== campaignState.currentChapter) {
    const nextTitle = campaignState.currentChapter === "free-explore"
      ? "Free exploration"
      : CHAPTER_BY_ID.get(campaignState.currentChapter)?.title ?? "Next chapter";
    audio.play("activity-complete");
    announce(`${nextTitle} unlocked. The estate remembers what you changed.`);
  }
  if (!saved && !campaignState.demo && !storageWarningAnnounced) {
    storageWarningAnnounced = true;
    announce(
      "This change is available now, but progress cannot be saved in this browser session.",
    );
  }
}

function updateNearbyPrompt(interaction: WorldInteraction | null): void {
  const visible = interaction !== null;
  interactionPrompt.setAttribute("aria-hidden", String(!visible));
  btnTouchInteract.disabled = !visible;
  nearbyText.textContent = pn(
    interaction?.label ?? "Move closer to a person, doorway, or object.",
  );
  btnTouchInteract.textContent = interaction === null
    ? "Interact"
    : interaction.kind === "door" || interaction.kind === "exit"
      ? "Enter"
      : interaction.kind === "flavour" || interaction.kind === "quest-object"
        ? "Look"
        : "Talk";
}

/**
 * Story beats that have already opened themselves on approach.
 *
 * Keyed by NPC and intent, so a beat fires once. Re-entering a location or
 * walking past the same person again does not replay it, and once the state
 * moves on to a different intent that NPC can open a new beat.
 */
const autoStartedStoryBeats = new Set<string>();

/**
 * Whether the player has taken a step since the current location loaded.
 *
 * Approach-triggered beats must be *approached*. Without this, spawning
 * within range of someone throws a dialogue on screen before the player has
 * seen the room or touched a key, which reads as a cutscene they did not
 * start - and hides the "press E" affordance the rest of the game relies on.
 */
let hasWalkedSinceLocationChange = false;

function isDialogueOpen(): boolean {
  return dialogOverlay.getAttribute("aria-hidden") === "false";
}

/**
 * Opens a main-story beat as soon as the player walks up to the person it
 * belongs to, instead of waiting for a press.
 *
 * The story is the point of the game; making the player guess that a
 * particular neighbour is the one holding the next scene turned authored
 * writing into a hunt. Only `main-story` intents do this - requests,
 * greetings and clues still wait to be chosen, so approaching someone never
 * takes an action away from the player.
 */
function maybeAutoStartStoryBeat(interaction: WorldInteraction | null): void {
  if (!interaction || interaction.kind !== "npc") return;

  let intent: NpcIntentDefinition;
  try {
    intent = selectNpcIntent({
      state: campaignState,
      expertiseNeeded: currentExpertiseNeeds(),
      npcId: interaction.npcId,
    });
  } catch {
    return;
  }
  const key = `${interaction.npcId}:${intent.id}`;
  if (!shouldAutoStartStoryBeat({
    intentKind: intent.kind,
    beatKey: key,
    firedBeats: autoStartedStoryBeats,
    dialogueOpen: isDialogueOpen(),
    paused: pauseState !== "closed",
    inWorld: screenSandbox.classList.contains("active"),
    hasWalked: hasWalkedSinceLocationChange,
  })) {
    return;
  }
  autoStartedStoryBeats.add(key);
  openNpc(interaction.npcId, { preferredIntentId: intent.id });
}

function handleWorldInteraction(interaction: WorldInteraction): boolean {
  audio.play("interact");
  switch (interaction.kind) {
    case "npc":
      openNpc(interaction.npcId);
      return false;
    case "door":
    case "exit":
      return authorizeLocation(interaction.targetLocationId);
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
      return false;
    case "carry-pickup": {
      const errand = errandById(interaction.errandId);
      if (!errand) return false;
      dispatchCampaign({ type: "pick-up-errand", errandId: errand.id });
      openNarrative(errand.pickup.shortLabel, "The estate", errand.pickup.lines);
      announce(`Carrying ${errand.item}.`);
      return false;
    }
    case "carry-dropoff": {
      const errand = errandById(interaction.errandId);
      if (!errand) return false;
      dispatchCampaign({ type: "deliver-errand", errandId: errand.id });
      openNarrative(errand.dropoff.shortLabel, "The estate", errand.dropoff.lines);
      announce(`Delivered ${errand.item}.`);
      return false;
    }
    case "flavour":
      openNarrative(interaction.shortLabel, "The estate", interaction.lines);
      return false;
  }
}

function authorizeLocation(locationId: LocationId): boolean {
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
    return false;
  }
  if (campaignHandle?.getCurrentLocation() === locationId) {
    announce(`You are already in ${areaName.textContent ?? "this place"}.`);
    focusWorld();
    return false;
  }
  closeJournal(false);
  setWorldControls(false);
  audio.play("overlay-close");
  return true;
}

function visitLocation(locationId: LocationId): void {
  if (!authorizeLocation(locationId)) return;
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
  dialogOverlay.setAttribute("aria-hidden", "false");
  dialogOverlay.removeAttribute("inert");
  setWorldControls(false);
  audio.play("overlay-open");
  dialogKicker.textContent = pn(title);
  dialogSpeaker.textContent = pn(speaker);
  dialogueNpcId = npcId;
  // Set per-character accent glow for the visual-novel name plate and portrait frame
  const accentHex = npcId ? (CAMPAIGN_PORTRAITS[npcId]?.accent ?? null) : null;
  if (accentHex) {
    // Convert hex to a semi-transparent rgba glow colour
    const r = parseInt(accentHex.slice(1, 3), 16);
    const g = parseInt(accentHex.slice(3, 5), 16);
    const b = parseInt(accentHex.slice(5, 7), 16);
    dialogOverlay.style.setProperty("--portrait-glow", `rgba(${r},${g},${b},0.55)`);
    dialogOverlay.dataset.accent = accentHex;
  } else {
    dialogOverlay.style.removeProperty("--portrait-glow");
    delete dialogOverlay.dataset.accent;
  }
  dialogueChoiceHandler = onChoice;
  showDialogueScript(lines, choices, onChoice);
  btnDialogAdvance.focus();
}

function showDialogueScript(
  lines: readonly string[],
  choices: readonly IntentChoiceDefinition[],
  onChoice: ((choice: IntentChoiceDefinition) => void) | null,
): void {
  dialogueLines = lines.map(pn);
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

function setDialoguePortraitMood(mood: PortraitMood): void {
  const effectiveMood = dialogueNpcId ? mood : "neutral";
  const current = dialogPortrait.querySelector<SVGElement>("svg");
  if (
    current?.dataset.portraitId === (dialogueNpcId ?? "estate")
    && current.dataset.mood === effectiveMood
  ) {
    return;
  }
  dialogPortrait.innerHTML = renderCampaignPortrait(
    dialogueNpcId,
    effectiveMood,
  );
  dialogPortrait.dataset.mood = effectiveMood;
}

function dialogueLineMood(): PortraitMood {
  if (dialogueLines.length <= 1) return "warm";
  if (dialogueIndex === 0) return "neutral";
  if (dialogueIndex >= dialogueLines.length - 1) return "warm";
  return "thoughtful";
}

function showDialogueLine(): void {
  const line = dialogueLines[dialogueIndex] ?? "";
  stopTyping();
  setDialoguePortraitMood(dialogueLineMood());
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
  // Reveal against the wall clock, not against the tick count.
  //
  // This used to advance a fixed number of characters per `setInterval` tick,
  // which silently assumed every tick was the 16ms it asked for. Under load -
  // a busy machine, a throttled tab, or the modest phone an older player is
  // actually holding - those ticks arrive far apart and the line crawled for
  // ten seconds or more. Deriving the index from elapsed time means a line
  // takes the same 1.4s to read out everywhere, and simply reveals in coarser
  // jumps when frames are scarce.
  const REVEAL_MS = 1440;
  const startedAt = performance.now();
  typeTimer = setInterval(() => {
    const progress = (performance.now() - startedAt) / REVEAL_MS;
    const index = Math.min(line.length, Math.ceil(progress * line.length));
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
    showDialogueLine();
    return;
  }
  finishDialogueScript();
}

function finishDialogueScript(): void {
  stopTyping();
  setDialoguePortraitMood(
    dialogueChoicesToShow.length ? "thoughtful" : "warm",
  );
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
    button.textContent = pn(choice.label);
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
  dialogOverlay.setAttribute("aria-hidden", "true");
  dialogOverlay.setAttribute("inert", "");
  dialogChoices.innerHTML = "";
  dialogueNpcId = null;
  delete dialogPortrait.dataset.mood;
  audio.play("overlay-close");
  if (restoreFocus) focusWorld();
}

function renderMinimapLayout(): void {
  const svgNamespace = "http://www.w3.org/2000/svg";
  minimapLayout.replaceChildren();
  for (const path of ESTATE_MAP_PATHS) {
    const x = Math.min(path.xPercent, path.end.xPercent);
    const y = Math.min(path.yPercent, path.end.yPercent);
    const width = Math.max(1, Math.abs(path.end.xPercent - path.xPercent));
    const height = Math.max(1, Math.abs(path.end.yPercent - path.yPercent));
    for (const className of ["minimap-road-shadow", "minimap-road"]) {
      const rectangle = document.createElementNS(svgNamespace, "rect");
      rectangle.setAttribute("class", className);
      rectangle.setAttribute("x", x.toFixed(2));
      rectangle.setAttribute("y", y.toFixed(2));
      rectangle.setAttribute("width", width.toFixed(2));
      rectangle.setAttribute("height", height.toFixed(2));
      rectangle.setAttribute("rx", "2");
      minimapLayout.appendChild(rectangle);
    }
  }
  for (const landmark of ESTATE_MAP_LANDMARKS) {
    const position = projectEstateMapPoint(landmark);
    const group = document.createElementNS(svgNamespace, "g");
    group.setAttribute("class", "minimap-landmark");
    group.dataset.mapLocation = landmark.locationId;
    group.setAttribute(
      "transform",
      `translate(${position.xPercent.toFixed(2)} ${position.yPercent.toFixed(2)})`,
    );
    const rectangle = document.createElementNS(svgNamespace, "rect");
    const width = landmark.shortLabel.length > 1 ? 14 : 11;
    rectangle.setAttribute("x", String(-width / 2));
    rectangle.setAttribute("y", "-4");
    rectangle.setAttribute("width", String(width));
    rectangle.setAttribute("height", "8");
    const label = document.createElementNS(svgNamespace, "text");
    label.setAttribute("y", "0.3");
    label.textContent = landmark.shortLabel;
    group.append(rectangle, label);
    minimapLayout.appendChild(group);
  }
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
  minimapPlace.textContent = pn(locationName);
  estateMinimap.setAttribute(
    "aria-label",
    `Circular estate map. You are at ${locationName}.${
      trackedRequestTitle ? ` Tracked request: ${trackedRequestTitle}.` : ""
    } Open Places in the Journal.`,
  );
}

function appendTrackerCard(
  card: ReturnType<typeof buildQuestTrackerView>["story"],
): void {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `quest-tracker-card ${card.kind}`;
  button.dataset.questTrackerKind = card.kind;
  if (card.entryId) button.dataset.questEntry = card.entryId;
  const kind = document.createElement("span");
  kind.className = "quest-tracker-kind";
  kind.textContent = card.kind === "story" ? "Main story" : "Tracked request";
  const title = document.createElement("strong");
  title.textContent = pn(card.title);
  const progress = document.createElement("span");
  progress.className = "quest-tracker-progress";
  const track = document.createElement("span");
  track.className = "quest-tracker-progress-track";
  track.setAttribute("role", "progressbar");
  track.setAttribute("aria-label", `${card.title} progress`);
  track.setAttribute("aria-valuemin", "0");
  track.setAttribute("aria-valuemax", String(card.progressTotal));
  track.setAttribute("aria-valuenow", String(card.progressCurrent));
  const fill = document.createElement("span");
  fill.style.width = `${card.progressTotal > 0
    ? (card.progressCurrent / card.progressTotal) * 100
    : 0}%`;
  track.appendChild(fill);
  const count = document.createElement("b");
  count.textContent = `${card.progressCurrent}/${card.progressTotal}`;
  progress.append(track, count);
  button.append(kind, title, progress);
  if (card.nextObjective) {
    const objective = document.createElement("span");
    objective.className = "quest-tracker-objective";
    objective.textContent = `Next · ${pn(card.nextObjective)}`;
    button.appendChild(objective);
  }
  button.setAttribute(
    "aria-label",
    `${kind.textContent}: ${card.title}. ${card.progressCurrent} of ${
      card.progressTotal
    } objectives complete.${
      card.nextObjective ? ` Next: ${card.nextObjective}.` : ""
    } Open in the Journal.`,
  );
  button.addEventListener("click", () => {
    openJournalEntry(card.category, card.entryId);
  });
  questTracker.appendChild(button);
}

/** Shows the errand in hand, so the parcel sprite is never the only cue. */
function renderCarryIndicator(): void {
  const errand = carriedErrand(campaignState);
  carryIndicator.hidden = errand === undefined;
  carryIndicator.textContent = errand ? `Carrying ${errand.item}` : "";
}

function renderQuestTracker(): void {
  const currentLocation =
    campaignHandle?.getCurrentLocation() ?? campaignState.currentLocation;
  const view = buildQuestTrackerView(
    campaignState,
    trackedRequestEntryId,
    currentLocation,
  );
  questTracker.replaceChildren();
  appendTrackerCard(view.story);
  if (view.request) appendTrackerCard(view.request);
  if (view.showRequestsAction) {
    const action = document.createElement("button");
    action.type = "button";
    action.className = "quest-tracker-requests-action";
    action.textContent = "Track a request";
    action.setAttribute(
      "aria-label",
      "Open the Requests tab in the Journal to track an optional request.",
    );
    action.addEventListener("click", () => openJournalEntry("requests", null));
    questTracker.appendChild(action);
  }
}

function renderCampaign(): void {
  renderMeters();
  renderJournal();
  renderQuestTracker();
  renderCarryIndicator();
  renderMinimap();
  const chapter = campaignState.currentChapter === "free-explore"
    ? null
    : CHAPTER_BY_ID.get(campaignState.currentChapter);
  chapterLabel.textContent = campaignState.currentChapter === "free-explore"
    ? "Story complete"
    : pn(`${chapter?.numberLabel ?? ""} · ${chapter?.title ?? ""}`);
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
    if (fill) {
      const prevWidth = parseFloat(fill.style.width || "0");
      const nextWidth = (value / KAMPUNG_METER_MAX) * 100;
      fill.style.width = `${nextWidth}%`;
      if (nextWidth > prevWidth) {
        fill.classList.remove("gain");
        // Re-trigger the animation even if already had the class
        void fill.offsetWidth; // eslint-disable-line @typescript-eslint/no-unused-expressions
        fill.classList.add("gain");
        fill.addEventListener("animationend", () => fill.classList.remove("gain"), { once: true });
      }
    }
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
  title.textContent = pn(entry.title);
  const meta = document.createElement("p");
  meta.className = "journal-detail-meta";
  meta.textContent = pn(entry.meta);
  const summary = document.createElement("p");
  summary.className = "journal-detail-summary";
  summary.textContent = pn(entry.summary);
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
      label.textContent = pn(objective.label);
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
  const trackable = entry.category === "requests" && !entry.locked;
  if (trackable) {
    const track = document.createElement("button");
    const tracked = trackedRequestEntryId === entry.id;
    track.type = "button";
    track.className = "journal-track-button";
    track.setAttribute("aria-pressed", String(tracked));
    track.textContent = tracked ? "Tracking quest" : "Track quest";
    track.addEventListener("click", () => {
      trackedRequestEntryId = tracked ? null : entry.id;
      renderJournal();
      renderQuestTracker();
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
    button.textContent = pn(action.label);
    button.disabled = action.disabled === true;
    button.addEventListener("click", action.run);
    actions.appendChild(button);
  }
  if (actions.childElementCount) journalDetail.appendChild(actions);
}

function renderJournal(): void {
  const currentLocation =
    campaignHandle?.getCurrentLocation() ?? campaignState.currentLocation;
  const view = buildJournalView(campaignState, currentLocation);
  const stateChanged = journalRenderedRevision !== campaignState.revision;
  journalRenderedRevision = campaignState.revision;

  journalChapterLabel.textContent = pn(view.chapterLabel);
  journalChapterTitle.textContent = pn(view.chapterTitle);
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
      title.textContent = pn(entry.title);
      const summary = document.createElement("p");
      summary.textContent = pn(entry.summary);
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
  renderJournalDetail(selectedEntry);
  const trackedEntry = view.entries.requests.find(
    (entry) => entry.id === trackedRequestEntryId && !entry.locked,
  );
  trackedRequestTitle = trackedEntry?.title ?? null;
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
        ? [{ label: "Use the first door", run: () => visitLocation("estate") }]
        : [{ label: "Listen to the Voice", run: () => openNpc("voice") }];
    case "chapter-1":
      return campaignState.objectives.includes("mr-long-step-seen")
        ? []
        : [{ label: "Visit Mr. Long", run: () => visitLocation("mr-long-flat") }];
    case "chapter-2": {
      const actions: JournalAction[] = [];
      if (!campaignState.objectives.includes("scam-check-shared")) {
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
          { label: "Visit Ben's house", run: () => visitLocation("ben-flat") },
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
        { label: pn("Return to {player}'s house"), run: () => visitLocation("y-flat") },
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

function openJournalEntry(
  category: JournalCategory,
  entryId: string | null,
): void {
  journalCategory = category;
  if (entryId) selectedJournalEntries[category] = entryId;
  openJournal();
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
  btnSound.setAttribute(
    "aria-label",
    settings.muted ? "Turn sound on" : "Mute sound",
  );
  btnSound.dataset.shortLabel = settings.muted ? "Muted" : "Sound";
  btnSound.textContent = settings.muted ? "Sound off" : "Sound on";
  volumeMusic.value = String(Math.round(settings.music * 100));
  volumeSfx.value = String(Math.round(settings.sfx * 100));
  // The title's Options panel shows the same state through its own controls -
  // separate ids because duplicating them would break every `getElementById`
  // in this file, but one source of truth behind both.
  btnTitleSound.setAttribute("aria-pressed", String(settings.muted));
  btnTitleSound.setAttribute(
    "aria-label",
    settings.muted ? "Turn sound on" : "Mute sound",
  );
  btnTitleSound.textContent = settings.muted ? "Sound off" : "Sound on";
  volumeTitleMusic.value = String(Math.round(settings.music * 100));
  volumeTitleSfx.value = String(Math.round(settings.sfx * 100));
}

btnStart.addEventListener("click", () => showTitleView("new-game"));
btnContinue.addEventListener("click", continueCampaign);
btnOptions.addEventListener("click", () => showTitleView("options"));
btnCredits.addEventListener("click", () => showTitleView("credits"));
btnBegin.addEventListener("click", beginNewCampaign);
for (const back of document.querySelectorAll<HTMLButtonElement>("[data-title-back]")) {
  back.addEventListener("click", () => showTitleView("menu"));
}

btnTitleSound.addEventListener("click", () => {
  audio.unlock();
  audio.setMuted(!audio.getSettings().muted);
  renderSoundControls();
  announce(audio.getSettings().muted ? "Sound muted." : "Sound on.");
});
btnTitleFullscreen.addEventListener("click", () => {
  void toggleGameFullscreen();
});
volumeTitleMusic.addEventListener("input", () => {
  audio.unlock();
  audio.setVolume("music", Number(volumeTitleMusic.value) / 100);
  renderSoundControls();
});
volumeTitleSfx.addEventListener("input", () => {
  audio.unlock();
  audio.setVolume("sfx", Number(volumeTitleSfx.value) / 100);
  renderSoundControls();
});
btnReturnTitle.addEventListener("click", returnToTitle);
btnMenu.addEventListener("click", openPause);
btnPauseResume.addEventListener("click", resumePause);
btnPauseSettings.addEventListener("click", () => showPauseState("settings"));
btnPauseTitle.addEventListener("click", () => showPauseState("confirm-title"));
btnSettingsBack.addEventListener("click", () => showPauseState("paused"));
btnConfirmCancel.addEventListener("click", () => showPauseState("paused"));
btnCampaignLoadCancel.addEventListener("click", returnToTitle);
btnCampaignLoadRetry.addEventListener("click", () => {
  void startCampaign(campaignState);
});
btnTouchInteract.addEventListener("click", () => campaignHandle?.tryInteract());

btnSound.addEventListener("click", () => {
  audio.unlock();
  audio.setMuted(!audio.getSettings().muted);
  renderSoundControls();
  announce(audio.getSettings().muted ? "Sound muted." : "Sound on.");
  setTimeout(focusWorld, 0);
});
btnFullscreen.addEventListener("click", () => {
  fullscreenChangeFromSettings = pauseState === "settings";
  void toggleGameFullscreen().finally(() => {
    window.setTimeout(() => {
      fullscreenChangeFromSettings = false;
    }, 300);
  });
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
pausePanel.addEventListener("keydown", (event) => trapFocusWithin(pausePanel, event));

const DIRECTION_VECTORS: Record<string, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};
const heldDirections = new Set<string>();

interface StageTapCandidate {
  pointerId: number;
  startX: number;
  startY: number;
  startedAt: number;
  rejected: boolean;
}

const activeStagePointers = new Set<number>();
let stageTapCandidate: StageTapCandidate | null = null;
let touchGestureSerial = 0;
const syntheticDirectionTimers = new Map<
  string,
  ReturnType<typeof setTimeout>
>();

function resetStageTapTracking(): void {
  activeStagePointers.clear();
  stageTapCandidate = null;
}

function resetTouchInputState(): void {
  touchGestureSerial += 1;
  resetStageTapTracking();
  heldDirections.clear();
  for (const timer of syntheticDirectionTimers.values()) clearTimeout(timer);
  syntheticDirectionTimers.clear();
  applyHeldDirections();
}

function isViewportTapPointer(event: PointerEvent): boolean {
  return event.pointerType === "touch" || event.pointerType === "pen";
}

function rejectStageTapIfDragged(event: PointerEvent): void {
  const candidate = stageTapCandidate;
  if (!candidate || candidate.pointerId !== event.pointerId) return;
  const dx = event.clientX - candidate.startX;
  const dy = event.clientY - candidate.startY;
  if (dx * dx + dy * dy > 12 * 12) candidate.rejected = true;
}

function viewportPointFromClient(
  clientX: number,
  clientY: number,
): { x: number; y: number } | null {
  const handle = campaignHandle;
  if (!handle) return null;
  const rect = handle.game.canvas.getBoundingClientRect();
  if (
    rect.width <= 0
    || rect.height <= 0
    || clientX < rect.left
    || clientX > rect.right
    || clientY < rect.top
    || clientY > rect.bottom
  ) {
    return null;
  }
  return {
    x: (clientX - rect.left) * (handle.game.scale.width / rect.width),
    y: (clientY - rect.top) * (handle.game.scale.height / rect.height),
  };
}

function finishStagePointer(event: PointerEvent, cancelled: boolean): void {
  if (!isViewportTapPointer(event)) return;
  rejectStageTapIfDragged(event);
  activeStagePointers.delete(event.pointerId);
  const candidate = stageTapCandidate;
  if (!candidate || candidate.pointerId !== event.pointerId) return;
  stageTapCandidate = null;
  if (
    cancelled
    || candidate.rejected
    || event.timeStamp - candidate.startedAt > 600
  ) {
    return;
  }
  const point = viewportPointFromClient(event.clientX, event.clientY);
  if (!point) return;
  campaignHandle?.handleViewportTap(point.x, point.y);
}

sandboxStage.addEventListener("pointerdown", (event) => {
  // Clicking the canvas targets Phaser's non-focusable <canvas>, not this
  // keyboard surface. Reclaim the stage explicitly so a prior topbar/control
  // focus cannot leave world controls disabled indefinitely.
  focusWorld();
  if (!isViewportTapPointer(event)) return;
  touchGestureSerial += 1;
  const startsFreshGesture = activeStagePointers.size === 0;
  if (
    (event.isPrimary || startsFreshGesture)
    && (stageTapCandidate === null || stageTapCandidate.rejected)
  ) {
    // A browser may omit one pointer-up after a multi-touch gesture, and some
    // synthetic/assistive touch paths misreport a new sole contact as
    // non-primary. With no active contact, this is a new gesture either way.
    resetStageTapTracking();
  }
  activeStagePointers.add(event.pointerId);
  if (activeStagePointers.size !== 1) {
    if (stageTapCandidate) stageTapCandidate.rejected = true;
    return;
  }
  if (event.button !== 0) return;
  stageTapCandidate = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    startedAt: event.timeStamp,
    rejected: false,
  };
});

const markPointerInput = (): void => setInputModality("pointer");
window.addEventListener("pointerdown", markPointerInput, {
  capture: true,
});
window.addEventListener("mousedown", markPointerInput, { capture: true });
window.addEventListener("touchstart", markPointerInput, {
  capture: true,
  passive: true,
});
document.addEventListener("click", (event) => {
  // CDP, older WebViews, and assistive pointer bridges may emit a trusted-style
  // click without the matching PointerEvent. Pointer clicks carry a click
  // count or screen coordinate; keyboard/AT button clicks carry neither.
  if (event.detail > 0 || event.clientX !== 0 || event.clientY !== 0) {
    markPointerInput();
  }
}, { capture: true });
document.addEventListener("keydown", (event) => {
  // Some browser/automation bridges emit repeated keyCode 0 events during a
  // pointer press. They do not represent keyboard navigation and must not
  // resurrect a focus ring between mouse-down and click.
  if (event.key !== "Unidentified") setInputModality("keyboard");
}, { capture: true });
window.addEventListener("pointermove", rejectStageTapIfDragged);
window.addEventListener("pointerup", (event) => finishStagePointer(event, false));
window.addEventListener("pointercancel", (event) => finishStagePointer(event, true));
const scheduleFinishedTouchCleanup = (event: TouchEvent): void => {
  if (event.touches.length !== 0) return;
  const gestureSerial = touchGestureSerial;
  window.setTimeout(() => {
    if (gestureSerial === touchGestureSerial) resetStageTapTracking();
  }, 50);
};
window.addEventListener("touchend", scheduleFinishedTouchCleanup, { passive: true });
window.addEventListener("touchcancel", scheduleFinishedTouchCleanup, { passive: true });
window.addEventListener("blur", resetTouchInputState);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) resetTouchInputState();
});

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
  button.addEventListener("click", (event) => {
    // Pointer input already has held-direction semantics above. A zero-detail
    // click is keyboard or assistive-technology activation, so give it one
    // short, deterministic movement pulse without duplicating touch movement.
    if (event.detail !== 0) return;
    heldDirections.add(direction);
    applyHeldDirections();
    const previousTimer = syntheticDirectionTimers.get(direction);
    if (previousTimer) clearTimeout(previousTimer);
    syntheticDirectionTimers.set(direction, setTimeout(() => {
      syntheticDirectionTimers.delete(direction);
      heldDirections.delete(direction);
      applyHeldDirections();
    }, 180));
  });
}

document.addEventListener("focusin", (event) => {
  if (!campaignHandle) return;
  const target = event.target;
  const isTouchControl =
    target instanceof Element && target.closest(".touch-controls") !== null;
  const isWorld =
    target === sandboxStage
    || target === campaignHandle.game.canvas
    || isTouchControl;
  setWorldControls(
    pauseState === "closed"
    && isWorld
    && !dialogOverlay.classList.contains("active")
    && !journalOpen,
  );
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  campaignHandle?.cancelTapNavigation();
  if (pauseState !== "closed") {
    const next = reducePauseState(pauseState, "escape");
    if (next === "closed") resumePause();
    else showPauseState(next);
    return;
  }
  openPause();
});

window.addEventListener("resize", queueCampaignViewportResize);
window.visualViewport?.addEventListener("resize", queueCampaignViewportResize);
document.addEventListener("fullscreenchange", () => {
  const active = isGameFullscreen();
  const changedFromSettings = fullscreenChangeFromSettings;
  fullscreenChangeFromSettings = false;
  renderFullscreenControl();
  queueCampaignViewportResize();
  if (!active) restoreGameViewportOrigin();
  if (!campaignHandle || !screenSandbox.classList.contains("active")) return;
  if (changedFromSettings && pauseState === "settings") {
    setTimeout(() => {
      if (pauseState === "settings") btnFullscreen.focus();
    }, 0);
    announce(active ? "Full screen on. Settings remain open." : "Full screen off. Settings remain open.");
    return;
  }
  if (!active) {
    if (pauseState === "settings" || pauseState === "confirm-title") {
      showPauseState("paused");
    } else {
      openPause();
    }
  }
});

showScreen("screen-title");
renderMinimapLayout();
renderCampaign();
renderSoundControls();
renderFullscreenControl();
renderPauseView();
renderTitleActions();
renderCampaignLoader("idle");
prefetchCampaignSceneAfterTitleLoad();
syncJournalLayout();
