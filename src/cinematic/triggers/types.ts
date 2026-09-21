/**
 * PULSAR-X: Cinematic Domain
 * Cinematic Trigger Types and Resolution Protocol.
 */

import type { WorkerTelemetryFrame } from "../../workers/telemetry";
import type { CinematicEventType } from "../director/CinematicEventBus";

export type TriggerType =
  | "TELEMETRY_TRIGGER"
  | "EVENT_TRIGGER"
  | "PLAYHEAD_TRIGGER"
  | "MANUAL_TRIGGER";

export interface CinematicTriggerContext {
  readonly playhead_s: number;
  readonly sceneElapsed_s: number;
  readonly telemetry: WorkerTelemetryFrame | null;
  readonly activeEvents: readonly CinematicEventType[];
}

export interface CinematicTrigger {
  readonly id: string;
  readonly type: TriggerType;
  /**
   * Priority of execution:
   * Event (100+) > Telemetry (50-99) > Playhead (10-49) > Manual (0)
   */
  readonly priority: number;
  /** Required event type if EVENT_TRIGGER */
  readonly eventType?: CinematicEventType;
  /** Predicate function evaluating live context */
  readonly condition?: (context: CinematicTriggerContext) => boolean;
  /** Narrative or operational description */
  readonly description: string;
}

export function evaluateTrigger(
  trigger: CinematicTrigger,
  context: CinematicTriggerContext
): boolean {
  switch (trigger.type) {
    case "EVENT_TRIGGER":
      if (trigger.eventType && context.activeEvents.includes(trigger.eventType)) {
        return trigger.condition ? trigger.condition(context) : true;
      }
      return false;

    case "TELEMETRY_TRIGGER":
      return trigger.condition ? trigger.condition(context) : false;

    case "PLAYHEAD_TRIGGER":
      return trigger.condition ? trigger.condition(context) : false;

    case "MANUAL_TRIGGER":
      return false; // Only executed via explicit user command
  }
}
