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

import type { MovementSurface } from "./movementFeel.js";

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

export function effectiveCategoryGain(
  settings: AudioSettings,
  category: SoundCategory,
  pauseDucked: boolean,
): number {
  const gain = categoryGain(settings, category);
  return category === "music" && pauseDucked ? gain * 0.35 : gain;
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
  step: 180,
  match: 90,
  mismatch: 160,
};

interface FootstepProfile {
  filter: BiquadFilterType;
  frequency: number;
  q: number;
  gain: number;
  duration: number;
  playbackRate: number;
}

export const FOOTSTEP_PROFILES: Readonly<
  Record<MovementSurface, FootstepProfile>
> = {
  grass: {
    filter: "lowpass",
    frequency: 520,
    q: 0.72,
    gain: 0.052,
    duration: 0.07,
    playbackRate: 0.9,
  },
  stone: {
    filter: "bandpass",
    frequency: 760,
    q: 1.6,
    gain: 0.047,
    duration: 0.052,
    playbackRate: 1.08,
  },
  indoor: {
    filter: "bandpass",
    frequency: 460,
    q: 1.05,
    gain: 0.036,
    duration: 0.05,
    playbackRate: 0.98,
  },
};

interface AmbientChord {
  voices: readonly [number, number, number];
  lead: number;
}

/**
 * Four-chord loops use inversions and shared tones so every voice moves by no
 * more than a perfect fourth between adjacent chords. The result is
 * intentionally calm and memorable rather than unrelated random notes.
 */
export const DAY_AMBIENT_PROGRESSION: readonly AmbientChord[] = [
  { voices: [130.81, 164.81, 196.0], lead: 261.63 },
  { voices: [123.47, 164.81, 196.0], lead: 246.94 },
  { voices: [110.0, 130.81, 164.81], lead: 220.0 },
  { voices: [110.0, 130.81, 174.61], lead: 261.63 },
];

export const EVENING_AMBIENT_PROGRESSION: readonly AmbientChord[] = [
  { voices: [87.31, 110.0, 130.81], lead: 174.61 },
  { voices: [82.41, 98.0, 130.81], lead: 164.81 },
  { voices: [110.0, 130.81, 164.81], lead: 146.83 },
  { voices: [98.0, 123.47, 146.83], lead: 130.81 },
];

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
  private footstepBuffer: AudioBuffer | null = null;
  private footstepIndex = 0;
  private lastPlayed = new Map<SoundEvent, number>();
  private ambienceTimer: ReturnType<typeof setInterval> | null = null;
  private ambienceStep = 0;
  private eveningMood = false;
  private suspendedByVisibility = false;
  private pauseDucked = false;

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
      send.gain.value = 0.32;
      send.connect(delay);

      const makeBus = (category: SoundCategory): GainNode => {
        const bus = context.createGain();
        bus.gain.value = effectiveCategoryGain(this.settings, category, this.pauseDucked);
        bus.connect(master);
        return bus;
      };

      this.context = context;
      this.reverbSend = send;
      this.buses = { music: makeBus("music"), sfx: makeBus("sfx"), ui: makeBus("ui") };
      this.footstepBuffer = this.createFootstepBuffer(context);
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

  /** Transiently lowers only music; this state is never written to storage. */
  setPauseDuck(active: boolean): void {
    if (this.pauseDucked === active) return;
    this.pauseDucked = active;
    this.applyGains();
  }

  play(event: SoundEvent): void {
    if (!this.context || !this.buses || this.settings.muted) return;
    if (!this.canPlay(event)) return;

    switch (event) {
      case "step":
        this.footstep("stone");
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

  playFootstep(surface: MovementSurface): void {
    if (!this.context || !this.buses || this.settings.muted) return;
    if (!this.canPlay("step")) return;
    this.footstep(surface);
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
    this.ambienceStep = 0;
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
    this.footstepBuffer = null;
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
        effectiveCategoryGain(this.settings, category, this.pauseDucked),
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
    const progression = this.eveningMood
      ? EVENING_AMBIENT_PROGRESSION
      : DAY_AMBIENT_PROGRESSION;
    const chord = progression[this.ambienceStep % progression.length];
    this.ambienceStep += 1;
    const duration = this.eveningMood ? 4.8 : 3.7;
    chord.voices.forEach((frequency, voice) => {
      this.tone({
        frequency,
        duration,
        category: "music",
        type: "sine",
        gain: voice === 0 ? 0.038 : 0.03,
        attack: this.eveningMood ? 1.35 : 1.0,
        delay: voice * 0.035,
      });
    });
    this.tone({
      frequency: chord.lead,
      duration: this.eveningMood ? 3.6 : 2.8,
      category: "music",
      type: "triangle",
      gain: 0.024,
      attack: 1.15,
      delay: 0.48,
    });
  }

  private canPlay(event: SoundEvent): boolean {
    if (!this.context) return false;
    const throttle = THROTTLE_MS[event];
    if (throttle === undefined) return true;
    const now = this.context.currentTime * 1000;
    const previous = this.lastPlayed.get(event);
    if (previous !== undefined && now - previous < throttle) return false;
    this.lastPlayed.set(event, now);
    return true;
  }

  private createFootstepBuffer(context: AudioContext): AudioBuffer {
    const frames = Math.floor(context.sampleRate * 0.075);
    const buffer = context.createBuffer(1, frames, context.sampleRate);
    const channel = buffer.getChannelData(0);
    let seed = 0x4b414d50;
    for (let index = 0; index < frames; index += 1) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const noise = seed / 0xffffffff * 2 - 1;
      channel[index] = noise * (1 - index / frames);
    }
    return buffer;
  }

  private footstep(surface: MovementSurface): void {
    if (!this.context || !this.buses || !this.footstepBuffer) return;
    const { context } = this;
    const profile = FOOTSTEP_PROFILES[surface];
    const cadenceVariation = [0.96, 1.04, 1, 1.02][this.footstepIndex % 4];
    this.footstepIndex += 1;
    const source = context.createBufferSource();
    source.buffer = this.footstepBuffer;
    source.playbackRate.value = profile.playbackRate * cadenceVariation;

    const filter = context.createBiquadFilter();
    filter.type = profile.filter;
    filter.frequency.value = profile.frequency * cadenceVariation;
    filter.Q.value = profile.q;

    const envelope = context.createGain();
    envelope.gain.setValueAtTime(profile.gain, context.currentTime);
    envelope.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + profile.duration,
    );

    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.buses.sfx);
    source.start();
    source.stop(context.currentTime + profile.duration + 0.015);
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
    if (this.reverbSend && category !== "ui") {
      envelope.connect(this.reverbSend);
    }

    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
  }
}
