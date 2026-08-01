/**
 * Centralized audio for Kampung SG.
 *
 * Every sound is synthesized with the Web Audio API at runtime, so the game
 * ships no audio files: nothing to license, nothing to download, and no
 * missing-asset failure on a judge's machine. Sounds are named events routed
 * through category buses (music / sfx / ui) rather than scattered play() calls,
 * so mute and volume stay global and repeated effects can be throttled.
 *
 * The pure settings helpers are kept free of Web Audio so they can be unit
 * tested without a browser.
 */

export type SoundCategory = "music" | "sfx" | "ui";

export type SoundEvent =
  | "step"
  | "interact"
  | "choice"
  | "match"
  | "mismatch"
  | "activity-complete"
  | "overlay-open"
  | "overlay-close"
  | "evening"
  | "day-complete";

export interface AudioSettings {
  muted: boolean;
  music: number;
  sfx: number;
}

export const AUDIO_STORAGE_KEY = "kampung-sg.audio";

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  muted: false,
  music: 0.45,
  sfx: 0.7,
};

export function clampVolume(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(1, Math.max(0, numeric));
}

export function normalizeAudioSettings(raw: unknown): AudioSettings {
  if (typeof raw !== "object" || raw === null) {
    return { ...DEFAULT_AUDIO_SETTINGS };
  }
  const candidate = raw as Partial<Record<keyof AudioSettings, unknown>>;
  return {
    muted: candidate.muted === true,
    music:
      candidate.music === undefined
        ? DEFAULT_AUDIO_SETTINGS.music
        : clampVolume(candidate.music),
    sfx:
      candidate.sfx === undefined
        ? DEFAULT_AUDIO_SETTINGS.sfx
        : clampVolume(candidate.sfx),
  };
}

export function categoryGain(settings: AudioSettings, category: SoundCategory): number {
  if (settings.muted) return 0;
  return category === "music" ? clampVolume(settings.music) : clampVolume(settings.sfx);
}

export function readStoredAudioSettings(storage?: Pick<Storage, "getItem">): AudioSettings {
  try {
    const store = storage ?? window.localStorage;
    const raw = store.getItem(AUDIO_STORAGE_KEY);
    return raw ? normalizeAudioSettings(JSON.parse(raw)) : { ...DEFAULT_AUDIO_SETTINGS };
  } catch {
    return { ...DEFAULT_AUDIO_SETTINGS };
  }
}

/** Minimum milliseconds between repeats, so held movement keys cannot machine-gun. */
const THROTTLE_MS: Partial<Record<SoundEvent, number>> = {
  step: 290,
  match: 90,
  mismatch: 160,
};

const DAY_SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
const EVENING_SCALE = [174.61, 196.0, 220.0, 261.63, 293.66, 329.63];

interface ToneOptions {
  frequency: number;
  duration: number;
  category: SoundCategory;
  type?: OscillatorType;
  gain?: number;
  attack?: number;
  glideTo?: number;
  delay?: number;
}

export class KampungAudio {
  private settings: AudioSettings;
  private context: AudioContext | null = null;
  private buses: Record<SoundCategory, GainNode> | null = null;
  private reverbSend: GainNode | null = null;
  private lastPlayed = new Map<SoundEvent, number>();
  private ambienceTimer: ReturnType<typeof setInterval> | null = null;
  private eveningMood = false;
  private suspendedByVisibility = false;

  constructor(settings: AudioSettings = DEFAULT_AUDIO_SETTINGS) {
    this.settings = normalizeAudioSettings(settings);
    document.addEventListener("visibilitychange", this.handleVisibility);
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  /**
   * Browsers block audio until a user gesture, so this is called from the first
   * real interaction rather than at module load.
   */
  unlock(): void {
    if (!this.context) {
      const Ctor: typeof AudioContext | undefined =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;

      const context = new Ctor();
      const master = context.createGain();
      master.gain.value = 0.9;
      master.connect(context.destination);

      const delay = context.createDelay(1);
      delay.delayTime.value = 0.23;
      const feedback = context.createGain();
      feedback.gain.value = 0.26;
      const damp = context.createBiquadFilter();
      damp.type = "lowpass";
      damp.frequency.value = 2200;
      delay.connect(feedback);
      feedback.connect(damp);
      damp.connect(delay);
      delay.connect(master);

      const send = context.createGain();
      send.gain.value = 0.5;
      send.connect(delay);

      const makeBus = (category: SoundCategory): GainNode => {
        const bus = context.createGain();
        bus.gain.value = categoryGain(this.settings, category);
        bus.connect(master);
        return bus;
      };

      this.context = context;
      this.reverbSend = send;
      this.buses = { music: makeBus("music"), sfx: makeBus("sfx"), ui: makeBus("ui") };
    }

    if (this.context.state === "suspended") void this.context.resume();
  }

  setMuted(muted: boolean): void {
    this.settings = { ...this.settings, muted };
    this.applyGains();
    this.persist();
  }

  setVolume(category: "music" | "sfx", value: number): void {
    this.settings = { ...this.settings, [category]: clampVolume(value) };
    this.applyGains();
    this.persist();
  }

  play(event: SoundEvent): void {
    if (!this.context || !this.buses || this.settings.muted) return;

    const throttle = THROTTLE_MS[event];
    if (throttle !== undefined) {
      const now = this.context.currentTime * 1000;
      const previous = this.lastPlayed.get(event);
      if (previous !== undefined && now - previous < throttle) return;
      this.lastPlayed.set(event, now);
    }

    switch (event) {
      case "step":
        this.footstep();
        break;
      case "interact":
        this.tone({ frequency: 392, duration: 0.16, category: "ui", gain: 0.16 });
        this.tone({ frequency: 587.33, duration: 0.22, category: "ui", gain: 0.13, delay: 0.07 });
        break;
      case "choice":
        [523.25, 659.25, 783.99].forEach((frequency, index) =>
          this.tone({
            frequency,
            duration: 0.42,
            category: "sfx",
            gain: 0.17,
            delay: index * 0.075,
          })
        );
        break;
      case "match":
        this.tone({ frequency: 880, duration: 0.34, category: "sfx", gain: 0.18 });
        this.tone({ frequency: 1318.51, duration: 0.3, category: "sfx", gain: 0.09, delay: 0.05 });
        break;
      case "mismatch":
        this.tone({
          frequency: 196,
          duration: 0.3,
          category: "sfx",
          type: "sine",
          gain: 0.14,
          glideTo: 164.81,
        });
        break;
      case "activity-complete":
        [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) =>
          this.tone({
            frequency,
            duration: 0.5,
            category: "sfx",
            gain: 0.16,
            delay: index * 0.1,
          })
        );
        break;
      case "overlay-open":
        this.tone({ frequency: 440, duration: 0.14, category: "ui", gain: 0.1 });
        break;
      case "overlay-close":
        this.tone({ frequency: 330, duration: 0.14, category: "ui", gain: 0.09 });
        break;
      case "evening":
        [261.63, 329.63, 392.0].forEach((frequency, index) =>
          this.tone({
            frequency,
            duration: 2.4,
            category: "sfx",
            type: "sine",
            gain: 0.13,
            attack: 0.5,
            delay: index * 0.16,
          })
        );
        break;
      case "day-complete":
        [392.0, 523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) =>
          this.tone({
            frequency,
            duration: 1.4,
            category: "sfx",
            gain: 0.15,
            attack: 0.06,
            delay: index * 0.13,
          })
        );
        break;
    }
  }

  startAmbience(): void {
    if (this.ambienceTimer !== null || !this.context) return;
    const tick = (): void => this.ambientNote();
    tick();
    this.ambienceTimer = setInterval(tick, this.eveningMood ? 3400 : 2600);
  }

  stopAmbience(): void {
    if (this.ambienceTimer === null) return;
    clearInterval(this.ambienceTimer);
    this.ambienceTimer = null;
  }

  /** Shifts the ambient pad lower and slower once the evening gathering unlocks. */
  setEveningMood(evening: boolean): void {
    if (this.eveningMood === evening) return;
    this.eveningMood = evening;
    if (this.ambienceTimer !== null) {
      this.stopAmbience();
      this.startAmbience();
    }
  }

  dispose(): void {
    this.stopAmbience();
    document.removeEventListener("visibilitychange", this.handleVisibility);
    void this.context?.close();
    this.context = null;
    this.buses = null;
    this.reverbSend = null;
  }

  private handleVisibility = (): void => {
    if (!this.context) return;
    if (document.hidden) {
      this.suspendedByVisibility = this.context.state === "running";
      if (this.suspendedByVisibility) void this.context.suspend();
    } else if (this.suspendedByVisibility) {
      this.suspendedByVisibility = false;
      void this.context.resume();
    }
  };

  private applyGains(): void {
    if (!this.buses || !this.context) return;
    for (const category of Object.keys(this.buses) as SoundCategory[]) {
      this.buses[category].gain.setTargetAtTime(
        categoryGain(this.settings, category),
        this.context.currentTime,
        0.02
      );
    }
  }

  private persist(): void {
    try {
      window.localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      // Storage can be unavailable in private mode; settings simply do not persist.
    }
  }

  private ambientNote(): void {
    if (!this.context || this.settings.muted) return;
    const scale = this.eveningMood ? EVENING_SCALE : DAY_SCALE;
    const root = scale[Math.floor(Math.random() * scale.length)];
    this.tone({
      frequency: root,
      duration: this.eveningMood ? 4.2 : 3.4,
      category: "music",
      type: "sine",
      gain: 0.1,
      attack: 0.9,
    });
    if (Math.random() < 0.55) {
      this.tone({
        frequency: root * 1.5,
        duration: 3.0,
        category: "music",
        type: "sine",
        gain: 0.05,
        attack: 1.1,
        delay: 0.6,
      });
    }
  }

  private footstep(): void {
    if (!this.context || !this.buses) return;
    const { context } = this;
    const frames = Math.floor(context.sampleRate * 0.06);
    const buffer = context.createBuffer(1, frames, context.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < frames; index += 1) {
      channel[index] = (Math.random() * 2 - 1) * (1 - index / frames);
    }

    const source = context.createBufferSource();
    source.buffer = buffer;

    const filter = context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 380 + Math.random() * 160;
    filter.Q.value = 1.4;

    const envelope = context.createGain();
    envelope.gain.value = 0.05;

    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.buses.sfx);
    source.start();
    source.stop(context.currentTime + 0.07);
  }

  private tone(options: ToneOptions): void {
    if (!this.context || !this.buses) return;
    const { context } = this;
    const {
      frequency,
      duration,
      category,
      type = "triangle",
      gain = 0.15,
      attack = 0.012,
      glideTo,
      delay = 0,
    } = options;

    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (glideTo !== undefined) {
      oscillator.frequency.exponentialRampToValueAtTime(glideTo, start + duration);
    }

    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(gain, start + attack);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    oscillator.connect(envelope);
    envelope.connect(this.buses[category]);
    if (this.reverbSend) envelope.connect(this.reverbSend);

    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
  }
}
