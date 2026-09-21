/**
 * PULSAR-X: Cinematic Domain
 * Director State Machine: Explicit states, valid transitions, and error handling.
 */

export type DirectorState =
  | "IDLE"
  | "LOADING"
  | "READY"
  | "PLAYING"
  | "PAUSED"
  | "SEEKING"
  | "COMPLETED"
  | "ERROR";

export class DirectorStateError extends Error {
  public readonly fromState: DirectorState;
  public readonly toState: DirectorState;

  constructor(fromState: DirectorState, toState: DirectorState, message?: string) {
    super(message ?? `Invalid Director state transition from ${fromState} to ${toState}`);
    this.name = "DirectorStateError";
    this.fromState = fromState;
    this.toState = toState;
  }
}

/**
 * Valid state transition graph.
 */
export const VALID_DIRECTOR_TRANSITIONS: Record<DirectorState, readonly DirectorState[]> = {
  IDLE: ["LOADING", "READY", "ERROR"],
  LOADING: ["READY", "ERROR"],
  READY: ["PLAYING", "SEEKING", "IDLE", "ERROR"],
  PLAYING: ["PAUSED", "SEEKING", "COMPLETED", "READY", "ERROR"],
  PAUSED: ["PLAYING", "SEEKING", "READY", "IDLE", "ERROR"],
  SEEKING: ["PLAYING", "PAUSED", "READY", "ERROR"],
  COMPLETED: ["READY", "IDLE", "PLAYING", "SEEKING", "ERROR"],
  ERROR: ["IDLE", "READY"],
};

export class DirectorStateMachine {
  private currentState: DirectorState = "IDLE";
  private listeners = new Set<(state: DirectorState, previous: DirectorState) => void>();

  constructor(initialState: DirectorState = "IDLE") {
    this.currentState = initialState;
  }

  public getState(): DirectorState {
    return this.currentState;
  }

  public canTransitionTo(targetState: DirectorState): boolean {
    const allowed = VALID_DIRECTOR_TRANSITIONS[this.currentState];
    return allowed ? allowed.includes(targetState) : false;
  }

  public transitionTo(targetState: DirectorState): void {
    if (!this.canTransitionTo(targetState)) {
      throw new DirectorStateError(this.currentState, targetState);
    }
    const prev = this.currentState;
    this.currentState = targetState;
    for (const listener of this.listeners) {
      listener(this.currentState, prev);
    }
  }

  public subscribe(listener: (state: DirectorState, previous: DirectorState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public reset(): void {
    const prev = this.currentState;
    this.currentState = "IDLE";
    for (const listener of this.listeners) {
      listener(this.currentState, prev);
    }
  }
}
