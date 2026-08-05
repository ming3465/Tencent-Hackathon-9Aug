export type PauseViewState = "closed" | "paused" | "settings" | "confirm-title";

export type PauseAction =
  | "open"
  | "resume"
  | "show-settings"
  | "show-confirm-title"
  | "escape";

export function reducePauseState(state: PauseViewState, action: PauseAction): PauseViewState {
  switch (action) {
    case "open":
      return state === "closed" ? "paused" : state;
    case "resume":
      return "closed";
    case "show-settings":
      return state === "paused" ? "settings" : state;
    case "show-confirm-title":
      return state === "paused" ? "confirm-title" : state;
    case "escape":
      if (state === "closed") return "paused";
      if (state === "settings" || state === "confirm-title") return "paused";
      return "closed";
  }
}
