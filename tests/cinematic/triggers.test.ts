/**
 * PULSAR-X: Cinematic Domain Tests
 * Unit tests for Cinematic Triggers and evaluation logic.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateTrigger,
  type CinematicTrigger,
  type CinematicTriggerContext,
} from "../../src/cinematic/triggers/types";
import type { WorkerTelemetryFrame } from "../../src/workers/telemetry";

describe("Cinematic Triggers", () => {
  const dummyTelemetry: Partial<WorkerTelemetryFrame> = {
    simulationTime_s: 15.0,
    positionError_m: 1200.0,
    gdop: 2.1,
    navigationStatus: "LOCKED",
  };

  it("evaluates EVENT_TRIGGER only when specified event is present", () => {
    const eventTrigger: CinematicTrigger = {
      id: "test_event",
      type: "EVENT_TRIGGER",
      eventType: "NAVIGATION_LOCKED",
      priority: 100,
      description: "Trigger when navigation locked event fires",
    };

    const contextWithoutEvent: CinematicTriggerContext = {
      playhead_s: 10.0,
      sceneElapsed_s: 2.0,
      telemetry: dummyTelemetry as WorkerTelemetryFrame,
      activeEvents: ["PULSAR_ACQUIRED"],
    };
    assert.equal(evaluateTrigger(eventTrigger, contextWithoutEvent), false);

    const contextWithEvent: CinematicTriggerContext = {
      playhead_s: 10.0,
      sceneElapsed_s: 2.0,
      telemetry: dummyTelemetry as WorkerTelemetryFrame,
      activeEvents: ["PULSAR_ACQUIRED", "NAVIGATION_LOCKED"],
    };
    assert.equal(evaluateTrigger(eventTrigger, contextWithEvent), true);
  });

  it("evaluates TELEMETRY_TRIGGER based on live telemetry condition", () => {
    const telemetryTrigger: CinematicTrigger = {
      id: "test_telemetry",
      type: "TELEMETRY_TRIGGER",
      priority: 50,
      condition: (ctx) => (ctx.telemetry ? ctx.telemetry.positionError_m <= 1500 : false),
      description: "Trigger when position error is <= 1.5 km",
    };

    const ctxPassing: CinematicTriggerContext = {
      playhead_s: 5.0,
      sceneElapsed_s: 1.0,
      telemetry: dummyTelemetry as WorkerTelemetryFrame,
      activeEvents: [],
    };
    assert.equal(evaluateTrigger(telemetryTrigger, ctxPassing), true);

    const ctxFailing: CinematicTriggerContext = {
      playhead_s: 5.0,
      sceneElapsed_s: 1.0,
      telemetry: { ...dummyTelemetry, positionError_m: 50000.0 } as WorkerTelemetryFrame,
      activeEvents: [],
    };
    assert.equal(evaluateTrigger(telemetryTrigger, ctxFailing), false);
  });

  it("evaluates PLAYHEAD_TRIGGER based on scene elapsed time", () => {
    const playheadTrigger: CinematicTrigger = {
      id: "test_playhead",
      type: "PLAYHEAD_TRIGGER",
      priority: 10,
      condition: (ctx) => ctx.sceneElapsed_s >= 8.0,
      description: "Trigger when 8 seconds elapsed in scene",
    };

    assert.equal(
      evaluateTrigger(playheadTrigger, {
        playhead_s: 15.0,
        sceneElapsed_s: 7.9,
        telemetry: null,
        activeEvents: [],
      }),
      false
    );

    assert.equal(
      evaluateTrigger(playheadTrigger, {
        playhead_s: 15.0,
        sceneElapsed_s: 8.1,
        telemetry: null,
        activeEvents: [],
      }),
      true
    );
  });
});
