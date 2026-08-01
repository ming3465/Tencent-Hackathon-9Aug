import { describe, expect, it } from "vitest";
import {
  ACTIVITIES,
  METER_MAX,
  buildChoiceScript,
  buildDialogueScript,
  buildEveningReflection,
  completeActivity,
  createSandboxState,
  endDay,
  getActivity,
  isActivityComplete,
} from "../sandboxState.js";

describe("sandbox progression", () => {
  it("starts with an open day and empty Kampung Spirit meters", () => {
    const state = createSandboxState();
    expect(state.completedActivities).toEqual([]);
    expect(state.meters).toEqual({ connection: 0, purpose: 0, comfort: 0 });
    expect(state.eveningReady).toBe(false);
    expect(state.dayEnded).toBe(false);
  });

  it("applies the selected activity effects", () => {
    const state = completeActivity(createSandboxState(), "garden", "herbs");
    expect(state.meters).toEqual({ connection: 1, purpose: 2, comfort: 0 });
    expect(state.choices.garden).toBe("herbs");
    expect(isActivityComplete(state, "garden")).toBe(true);
  });

  it("does not reward the same activity twice", () => {
    const once = completeActivity(createSandboxState(), "garden", "flowers");
    const twice = completeActivity(once, "garden", "flowers");
    expect(twice).toBe(once);
  });

  it("keeps both resident choices valid but distinct", () => {
    const herbs = completeActivity(createSandboxState(), "garden", "herbs");
    const flowers = completeActivity(createSandboxState(), "garden", "flowers");
    expect(herbs.meters).not.toEqual(flowers.meters);
    expect(herbs.completedActivities).toEqual(flowers.completedActivities);
  });

  it("unlocks the evening after any three activities", () => {
    let state = createSandboxState();
    state = completeActivity(state, "garden", "herbs");
    state = completeActivity(state, "noticeboard", "chess");
    expect(state.eveningReady).toBe(false);
    state = completeActivity(state, "safe-route", "rest-point");
    expect(state.eveningReady).toBe(true);
  });

  it("does not end the day before the evening is ready", () => {
    const state = completeActivity(createSandboxState(), "memory-table", "completed");
    expect(endDay(state)).toBe(state);
  });

  it("ends a ready day without changing its activity results", () => {
    let state = createSandboxState();
    state = completeActivity(state, "garden", "herbs");
    state = completeActivity(state, "noticeboard", "stories");
    state = completeActivity(state, "memory-table", "completed");
    const ended = endDay(state);
    expect(ended.dayEnded).toBe(true);
    expect(ended.completedActivities).toEqual(state.completedActivities);
    expect(ended.meters).toEqual(state.meters);
  });

  it("caps every meter at the documented maximum", () => {
    let state = createSandboxState();
    for (const activity of ACTIVITIES) {
      state = completeActivity(state, activity.id, activity.choices[0].id);
    }
    expect(state.meters.connection).toBeLessThanOrEqual(METER_MAX);
    expect(state.meters.purpose).toBeLessThanOrEqual(METER_MAX);
    expect(state.meters.comfort).toBeLessThanOrEqual(METER_MAX);
  });

  it("rejects a choice that does not belong to the activity", () => {
    expect(() => completeActivity(createSandboxState(), "garden", "invalid")).toThrow(
      "Unknown choice invalid for activity garden"
    );
  });

  it("builds the evening reflection from the player's actual choices", () => {
    let state = createSandboxState();
    state = completeActivity(state, "garden", "flowers");
    state = completeActivity(state, "noticeboard", "chess");
    state = completeActivity(state, "safe-route", "rest-point");
    const reflection = buildEveningReflection(state);
    expect(reflection).toContain("flower seat");
    expect(reflection).toContain("chess invitation");
    expect(reflection).toContain("rest point");
    expect(reflection).not.toContain("shared herbs");
  });

  it("provides a safe fallback before any activity is complete", () => {
    expect(buildEveningReflection(createSandboxState())).toContain("room for tomorrow's neighbours");
  });
});

describe("buildDialogueScript", () => {
  it("plays the full introduction before an activity is completed", () => {
    const state = createSandboxState();
    const script = buildDialogueScript(state, "garden");
    expect(script.phase).toBe("intro");
    expect(script.speaker).toBe("Aunty Mei");
    expect(script.lines).toEqual(getActivity("garden").introLines);
    expect(script.lines.length).toBeGreaterThan(1);
    expect(script.offersChoices).toBe(true);
  });

  it("plays the shorter revisit lines once the activity is done", () => {
    const state = completeActivity(createSandboxState(), "garden", "herbs");
    const script = buildDialogueScript(state, "garden");
    expect(script.phase).toBe("completed");
    expect(script.lines).toEqual(getActivity("garden").completedLines);
    expect(script.offersChoices).toBe(false);
  });

  it("gives every activity a non-empty script in both states", () => {
    for (const activity of ACTIVITIES) {
      const fresh = buildDialogueScript(createSandboxState(), activity.id);
      expect(fresh.lines.length).toBeGreaterThan(0);
      fresh.lines.forEach((line) => expect(line.trim().length).toBeGreaterThan(0));

      const done = completeActivity(
        createSandboxState(),
        activity.id,
        activity.choices[0].id
      );
      const revisit = buildDialogueScript(done, activity.id);
      expect(revisit.lines.length).toBeGreaterThan(0);
    }
  });
});

describe("buildChoiceScript", () => {
  it("returns the response lines for the chosen option", () => {
    const script = buildChoiceScript("noticeboard", "chess");
    expect(script.phase).toBe("response");
    expect(script.offersChoices).toBe(false);
    expect(script.lines).toEqual(
      getActivity("noticeboard").choices.find((c) => c.id === "chess")?.responseLines
    );
  });

  it("gives every choice of every activity a non-empty response", () => {
    for (const activity of ACTIVITIES) {
      for (const choice of activity.choices) {
        const script = buildChoiceScript(activity.id, choice.id);
        expect(script.lines.length).toBeGreaterThan(0);
        script.lines.forEach((line) => expect(line.trim().length).toBeGreaterThan(0));
      }
    }
  });

  it("rejects a choice that does not belong to the activity", () => {
    expect(() => buildChoiceScript("garden", "chess")).toThrow();
  });
});

describe("demo-mode judge path", () => {
  it("defaults to three activities for the real game", () => {
    expect(createSandboxState().requiredForEvening).toBe(3);
  });

  it("unlocks the evening after two activities when configured for demo", () => {
    let state = createSandboxState(2);
    state = completeActivity(state, "noticeboard", "chess");
    expect(state.eveningReady).toBe(false);
    state = completeActivity(state, "garden", "herbs");
    expect(state.eveningReady).toBe(true);
  });

  it("does not unlock the real game early", () => {
    let state = createSandboxState();
    state = completeActivity(state, "noticeboard", "chess");
    state = completeActivity(state, "garden", "herbs");
    expect(state.eveningReady).toBe(false);
  });

  it("clamps nonsense thresholds into the playable range", () => {
    expect(createSandboxState(0).requiredForEvening).toBe(1);
    expect(createSandboxState(99).requiredForEvening).toBe(4);
  });

  it("still ends the day and reflects the two demo choices", () => {
    let state = createSandboxState(2);
    state = completeActivity(state, "noticeboard", "chess");
    state = completeActivity(state, "safe-route", "shelter");
    state = endDay(state);
    expect(state.dayEnded).toBe(true);
    const reflection = buildEveningReflection(state);
    expect(reflection).toContain("Uncle Ravi");
    expect(reflection).toContain("Mdm Siti");
  });
});
