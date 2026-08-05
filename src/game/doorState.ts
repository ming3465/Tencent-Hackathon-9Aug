export type DoorTransitionState = "closed" | "opening" | "open" | "transitioning";

/** Pure guard whose clock is supplied by the paused Phaser scene. */
export class DoorTransitionController {
  private state: DoorTransitionState;

  constructor(startsOpen = false) {
    this.state = startsOpen ? "open" : "closed";
  }

  getState(): DoorTransitionState {
    return this.state;
  }

  beginOpening(): boolean {
    if (this.state !== "closed") return false;
    this.state = "opening";
    return true;
  }

  finishOpening(): boolean {
    if (this.state !== "opening") return false;
    this.state = "open";
    return true;
  }

  beginTransition(): boolean {
    if (this.state === "closed" || this.state === "transitioning") return false;
    this.state = "transitioning";
    return true;
  }

  canActivate(): boolean {
    return this.state === "closed" || this.state === "open";
  }

  reset(startsOpen = false): void {
    this.state = startsOpen ? "open" : "closed";
  }
}
