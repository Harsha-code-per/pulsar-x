/**
 * PULSAR-X: Scientific Reference Core Tests
 * Unit Conversions & Dimensional Rigor Tests.
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  phaseCyclesToTime_s,
  timeToPhaseCycles,
  timeToRange_m,
  rangeToTime_s,
  phaseCyclesToRange_m,
  rangeToPhaseCycles,
  wrapPhaseToCycle,
  wrapPhaseResidual,
} from "../../src/simulation/units/conversions";
import { SPEED_OF_LIGHT_MPS } from "../../src/simulation/constants/astronomy";

test("Unit Conversions: Phase <-> Time", () => {
  const f0 = 500.0; // 500 Hz (P = 2 ms)
  const phase = 0.25; // 1/4 cycle = 0.5 ms
  const expectedTime_s = 0.0005;

  const t = phaseCyclesToTime_s(phase, f0);
  assert.ok(Math.abs(t - expectedTime_s) < 1e-12);

  const backPhase = timeToPhaseCycles(t, f0);
  assert.ok(Math.abs(backPhase - phase) < 1e-12);
});

test("Unit Conversions: Time <-> Range", () => {
  const time_s = 1.0;
  const range_m = timeToRange_m(time_s);
  assert.strictEqual(range_m, SPEED_OF_LIGHT_MPS);

  const backTime = rangeToTime_s(range_m);
  assert.strictEqual(backTime, 1.0);
});

test("Unit Conversions: Direct Phase <-> Range", () => {
  const f0 = 1000.0; // 1 kHz
  const phase = 1.0; // 1 full cycle = 1 ms light travel distance ~ 299,792.458 m
  const range_m = phaseCyclesToRange_m(phase, f0);
  assert.ok(Math.abs(range_m - 299_792.458) < 1e-6);

  const backPhase = rangeToPhaseCycles(range_m, f0);
  assert.ok(Math.abs(backPhase - phase) < 1e-12);
});

test("Phase Wrapping: wrapPhaseToCycle and wrapPhaseResidual", () => {
  assert.strictEqual(wrapPhaseToCycle(0.0), 0.0);
  assert.strictEqual(wrapPhaseToCycle(1.0), 0.0);
  assert.ok(Math.abs(wrapPhaseToCycle(1.75) - 0.75) < 1e-12);
  assert.ok(Math.abs(wrapPhaseToCycle(-0.25) - 0.75) < 1e-12);

  assert.strictEqual(wrapPhaseResidual(0.0), 0.0);
  assert.ok(Math.abs(wrapPhaseResidual(0.2) - 0.2) < 1e-12);
  assert.ok(Math.abs(wrapPhaseResidual(0.8) - (-0.2)) < 1e-12);
  assert.ok(Math.abs(wrapPhaseResidual(-0.1) - (-0.1)) < 1e-12);
});
