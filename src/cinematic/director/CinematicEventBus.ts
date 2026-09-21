/**
 * PULSAR-X: Cinematic Domain
 * Cinematic Event Bus: Strongly typed event dispatching for scientific and narrative milestones.
 */

export type CinematicEventType =
  | "SIMULATION_READY"
  | "GNSS_DEGRADED"
  | "GNSS_LOST"
  | "GROUND_LINK_LOST"
  | "PULSAR_ACQUIRED"
  | "PULSAR_LOST"
  | "OBSERVATION_AVAILABLE"
  | "NAVIGATION_DEGRADED"
  | "NAVIGATION_RECOVERED"
  | "NAVIGATION_LOCKED"
  | "SOLAR_OCCULTATION"
  | "MISSION_ARRIVAL"
  | "CINEMATIC_COMPLETE"
  | "SCENE_ENTERED"
  | "SCENE_EXITED";

export interface CinematicEvent<T = Record<string, unknown>> {
  readonly type: CinematicEventType;
  readonly timestamp_s: number;
  readonly payload?: T;
}

export type CinematicEventListener<T = Record<string, unknown>> = (event: CinematicEvent<T>) => void;

export class CinematicEventBus {
  private listeners = new Map<CinematicEventType, Set<CinematicEventListener<unknown>>>();
  private history: CinematicEvent[] = [];
  private maxHistoryLength = 100;

  public on<T = Record<string, unknown>>(
    type: CinematicEventType,
    listener: CinematicEventListener<T>
  ): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    const set = this.listeners.get(type)!;
    set.add(listener as CinematicEventListener<unknown>);

    return () => {
      set.delete(listener as CinematicEventListener<unknown>);
    };
  }

  public emit<T = Record<string, unknown>>(
    type: CinematicEventType,
    payload?: T,
    timestamp_s?: number
  ): void {
    const event: CinematicEvent<T> = {
      type,
      timestamp_s: timestamp_s ?? (typeof performance !== "undefined" ? performance.now() / 1000.0 : Date.now() / 1000.0),
      payload,
    };

    // Store in history
    this.history.push(event as CinematicEvent);
    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }

    const set = this.listeners.get(type);
    if (set) {
      for (const listener of set) {
        try {
          listener(event);
        } catch (err) {
          console.error(`[CinematicEventBus] Error in listener for event ${type}:`, err);
        }
      }
    }
  }

  public getHistory(): readonly CinematicEvent[] {
    return this.history;
  }

  public clearHistory(): void {
    this.history = [];
  }

  public clear(): void {
    this.listeners.clear();
    this.history = [];
  }
}

/** Global singleton event bus instance */
export const defaultCinematicEventBus = new CinematicEventBus();
