import { describe, expect, it } from "vitest";
import {
  AUDIO_STORAGE_KEY,
  DAY_AMBIENT_PROGRESSION,
  DEFAULT_AUDIO_SETTINGS,
  EVENING_AMBIENT_PROGRESSION,
  FOOTSTEP_PROFILES,
  categoryGain,
  clampVolume,
  normalizeAudioSettings,
  readStoredAudioSettings,
  type AudioSettings,
} from "../audio.js";

describe("clampVolume", () => {
  it("keeps values inside the unit range", () => {
    expect(clampVolume(0.5)).toBe(0.5);
    expect(clampVolume(0)).toBe(0);
    expect(clampVolume(1)).toBe(1);
  });

  it("clamps values outside the unit range", () => {
    expect(clampVolume(-3)).toBe(0);
    expect(clampVolume(42)).toBe(1);
  });

  it("treats unusable input as silence rather than throwing", () => {
    expect(clampVolume(Number.NaN)).toBe(0);
    expect(clampVolume(undefined)).toBe(0);
    expect(clampVolume("loud")).toBe(0);
  });

  it("accepts numeric strings", () => {
    expect(clampVolume("0.25")).toBe(0.25);
  });
});

describe("normalizeAudioSettings", () => {
  it("returns defaults for missing or invalid input", () => {
    expect(normalizeAudioSettings(null)).toEqual(DEFAULT_AUDIO_SETTINGS);
    expect(normalizeAudioSettings(undefined)).toEqual(DEFAULT_AUDIO_SETTINGS);
    expect(normalizeAudioSettings("nope")).toEqual(DEFAULT_AUDIO_SETTINGS);
  });

  it("preserves valid stored settings", () => {
    expect(normalizeAudioSettings({ muted: true, music: 0.2, sfx: 0.9 })).toEqual({
      muted: true,
      music: 0.2,
      sfx: 0.9,
    });
  });

  it("clamps out-of-range stored volumes", () => {
    expect(normalizeAudioSettings({ muted: false, music: 9, sfx: -4 })).toEqual({
      muted: false,
      music: 1,
      sfx: 0,
    });
  });

  it("falls back to defaults for individually missing fields", () => {
    expect(normalizeAudioSettings({ music: 0.3 })).toEqual({
      muted: false,
      music: 0.3,
      sfx: DEFAULT_AUDIO_SETTINGS.sfx,
    });
  });

  it("treats any non-true muted value as unmuted", () => {
    expect(normalizeAudioSettings({ muted: "yes" }).muted).toBe(false);
    expect(normalizeAudioSettings({ muted: 1 }).muted).toBe(false);
  });

  it("never returns the shared default object", () => {
    const normalized = normalizeAudioSettings(null);
    normalized.music = 0;
    expect(DEFAULT_AUDIO_SETTINGS.music).not.toBe(0);
  });
});

describe("categoryGain", () => {
  const settings: AudioSettings = { muted: false, music: 0.4, sfx: 0.8 };

  it("routes each category to its own volume", () => {
    expect(categoryGain(settings, "music")).toBe(0.4);
    expect(categoryGain(settings, "sfx")).toBe(0.8);
    expect(Object.keys(FOOTSTEP_PROFILES).sort()).toEqual([
      "grass",
      "indoor",
      "stone",
    ]);
    expect(new Set(
      Object.values(FOOTSTEP_PROFILES).map((profile) => profile.frequency),
    ).size).toBe(3);
    for (const progression of [
      DAY_AMBIENT_PROGRESSION,
      EVENING_AMBIENT_PROGRESSION,
    ]) {
      expect(progression).toHaveLength(4);
      progression.forEach((chord, index) => {
        const next = progression[(index + 1) % progression.length]!;
        expect(chord.voices).toHaveLength(3);
        chord.voices.forEach((frequency, voice) => {
          const semitones = 12 * Math.abs(
            Math.log2(next.voices[voice]! / frequency),
          );
          expect(semitones).toBeLessThanOrEqual(5.01);
        });
        const leadSemitones = 12 * Math.abs(Math.log2(next.lead / chord.lead));
        expect(leadSemitones).toBeLessThanOrEqual(5.01);
      });
    }
  });

  it("routes interface sounds through the effects volume", () => {
    expect(categoryGain(settings, "ui")).toBe(0.8);
  });

  it("silences every category when muted", () => {
    const muted: AudioSettings = { ...settings, muted: true };
    expect(categoryGain(muted, "music")).toBe(0);
    expect(categoryGain(muted, "sfx")).toBe(0);
    expect(categoryGain(muted, "ui")).toBe(0);
  });
});

describe("readStoredAudioSettings", () => {
  it("reads and normalizes persisted settings", () => {
    const storage = {
      getItem: (key: string) =>
        key === AUDIO_STORAGE_KEY ? JSON.stringify({ muted: true, music: 5, sfx: 0.3 }) : null,
    };
    expect(readStoredAudioSettings(storage)).toEqual({ muted: true, music: 1, sfx: 0.3 });
  });

  it("falls back to defaults when nothing is stored", () => {
    expect(readStoredAudioSettings({ getItem: () => null })).toEqual(DEFAULT_AUDIO_SETTINGS);
  });

  it("falls back to defaults when stored data is corrupt", () => {
    expect(readStoredAudioSettings({ getItem: () => "{not json" })).toEqual(
      DEFAULT_AUDIO_SETTINGS
    );
  });

  it("falls back to defaults when storage itself throws", () => {
    expect(
      readStoredAudioSettings({
        getItem: () => {
          throw new Error("private mode");
        },
      })
    ).toEqual(DEFAULT_AUDIO_SETTINGS);
  });
});
