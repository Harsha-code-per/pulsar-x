/**
 * PULSAR-X: Rendering Domain Tests
 * Unit tests for TelemetryAdapter and interpolation logic.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { TelemetryAdapter } from "../../src/rendering/adapter/telemetry-adapter";
import type { WorkerTelemetryFrame } from "../../src/workers/telemetry";

function createMockTelemetryFrame(overrides: Partial<WorkerTelemetryFrame> = {}): WorkerTelemetryFrame {
  return {
    type: "TELEMETRY_FRAME",
    simulationTime_s: 100.0,
    spacecraftPosition_m: { x: 1.5e11, y: 0, z: 0 },
    spacecraftVelocity_mps: { x: 0, y: 30000, z: 0 },
    estimatedPosition_m: { x: 1.5e11 + 100, y: 0, z: 0 },
    estimatedVelocity_mps: { x: 0, y: 30005, z: 0 },
    positionError_m: 100.0,
    velocityError_mps: 5.0,
    clockBias_s: 1e-6,
    clockDrift_rate: 1e-10,
    clockBiasError_s: 1e-8,
    gdop: 2.1,
    pdop: 1.8,
    tdop: 1.1,
    navigationStatus: "LOCKED",
    activePulsarMask: 0b00011111,
    observationCount: 42,
    photonCount: 1540,
    uncertaintyAxes1Sigma_m: { x: 30, y: 20, z: 10 },
    uncertaintyAxes2Sigma_m: { x: 60, y: 40, z: 20 },
    uncertaintyAxes3Sigma_m: { x: 90, y: 60, z: 30 },
    eigenvalues_m2: [900, 400, 100],
    solverStatus: {
      converged: true,
      iterations: 3,
      rmsResidual_m: 1.2,
    },
    simulationRate: 1.0,
    playbackMultiplier: 1.0,
    wallClockTimestamp: 1000,
    ...overrides,
  };
}

describe("TelemetryAdapter & Interpolator", () => {
  it("initializes without data", () => {
    const adapter = new TelemetryAdapter();
    assert.equal(adapter.hasData(), false);
    assert.equal(adapter.getRawFrame(), null);
    assert.equal(adapter.getVisualState(), null);
  });

  it("ingests telemetry frame and extracts visual state correctly", () => {
    const adapter = new TelemetryAdapter();
    const frame = createMockTelemetryFrame();
    adapter.pushFrame(frame);

    assert.equal(adapter.hasData(), true);
    assert.deepEqual(adapter.getRawFrame(), frame);

    const visualState = adapter.getVisualState();
    assert.ok(visualState !== null);
    assert.equal(visualState.simulationTime_s, 100.0);
    assert.equal(visualState.positionError_m, 100.0);
    assert.equal(visualState.gdop, 2.1);
    assert.equal(visualState.status, "LOCKED");
    assert.equal(visualState.activePulsarMask, 0b00011111);
    assert.equal(visualState.photonCount, 1540);
    assert.equal(visualState.observationCount, 42);
    assert.deepEqual(visualState.eigenvalues_m2, [900, 400, 100]);
  });

  it("linearly interpolates state between consecutive telemetry frames", () => {
    const adapter = new TelemetryAdapter();

    const frameA = createMockTelemetryFrame({
      simulationTime_s: 10.0,
      spacecraftPosition_m: { x: 1.0e11, y: 0, z: 0 },
      estimatedPosition_m: { x: 1.0e11 + 200, y: 0, z: 0 },
      positionError_m: 200.0,
      spacecraftVelocity_mps: { x: 0, y: 20000, z: 0 },
    });

    const frameB = createMockTelemetryFrame({
      simulationTime_s: 20.0,
      spacecraftPosition_m: { x: 1.2e11, y: 0, z: 0 },
      estimatedPosition_m: { x: 1.2e11 + 100, y: 0, z: 0 },
      positionError_m: 100.0,
      spacecraftVelocity_mps: { x: 0, y: 22000, z: 0 },
    });

    adapter.pushFrame(frameA);
    adapter.pushFrame(frameB);

    // Alpha = 0.0 -> matches frameA
    const state0 = adapter.getVisualState(0.0);
    assert.ok(state0 !== null);
    assert.equal(state0.simulationTime_s, 10.0);
    assert.equal(state0.positionError_m, 200.0);

    // Alpha = 1.0 -> matches frameB
    const state1 = adapter.getVisualState(1.0);
    assert.ok(state1 !== null);
    assert.equal(state1.simulationTime_s, 20.0);
    assert.equal(state1.positionError_m, 100.0);

    // Alpha = 0.5 -> midpoint
    const stateMid = adapter.getVisualState(0.5);
    assert.ok(stateMid !== null);
    assert.equal(stateMid.simulationTime_s, 15.0);
    assert.equal(stateMid.positionError_m, 150.0);

    // Render coordinates should reflect interpolated position
    // (1.0e11 + 1.2e11)/2 = 1.1e11 m
    // 1.1e11 / 1.495978707e11 * 100 = 73.53046...
    assert.ok(stateMid.truePositionRender[0] > state0.truePositionRender[0]);
    assert.ok(stateMid.truePositionRender[0] < state1.truePositionRender[0]);
  });

  it("clamps interpolation alpha to [0, 1]", () => {
    const adapter = new TelemetryAdapter();
    const frameA = createMockTelemetryFrame({ simulationTime_s: 10.0 });
    const frameB = createMockTelemetryFrame({ simulationTime_s: 20.0 });

    adapter.pushFrame(frameA);
    adapter.pushFrame(frameB);

    const underflowState = adapter.getVisualState(-0.5);
    assert.equal(underflowState?.simulationTime_s, 10.0);

    const overflowState = adapter.getVisualState(1.5);
    assert.equal(overflowState?.simulationTime_s, 20.0);
  });
});
