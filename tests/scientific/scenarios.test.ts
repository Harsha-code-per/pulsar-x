/**
 * PULSAR-X: Scientific Reference Core Tests
 * Scenario Execution Tests (Scenarios A through H).
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  getScenarioA,
  getScenarioB,
  getScenarioC,
  getScenarioD,
  getScenarioE,
  getScenarioF,
  getScenarioG,
  getScenarioH,
} from "../../src/simulation/scenarios/scenarios";
import { calculateGeometryMetrics } from "../../src/simulation/geometry/gdop";

test("Scenarios: Setup and Geometry Verification", () => {
  // Scenario A (Orthogonal)
  const scA = getScenarioA();
  const dirsA = scA.pulsars.map((p) => p.directionVector);
  const geomA = calculateGeometryMetrics(dirsA);
  assert.strictEqual(geomA.rank, 4);
  assert.ok(geomA.gdop < 4.0);

  // Scenario B (Realistic MSPs)
  const scB = getScenarioB();
  const dirsB = scB.pulsars.map((p) => p.directionVector);
  const geomB = calculateGeometryMetrics(dirsB);
  assert.strictEqual(geomB.rank, 4);
  assert.ok(Number.isFinite(geomB.gdop));

  // Scenario D (Single-pulsar dropout: 3 active, 1 occulted)
  const scD = getScenarioD();
  const activeD = scD.pulsars.filter((p) => p.state === "ACTIVE").map((p) => p.directionVector);
  assert.strictEqual(activeD.length, 3);
  const geomD = calculateGeometryMetrics(activeD);
  assert.strictEqual(geomD.gdop, Infinity, "3 beacons cannot yield finite instantaneous GDOP");

  // Scenario F (Coplanar)
  const scF = getScenarioF();
  const dirsF = scF.pulsars.map((p) => p.directionVector);
  const geomF = calculateGeometryMetrics(dirsF);
  assert.ok(geomF.gdop > 15.0 || !Number.isFinite(geomF.gdop), "Coplanar must have severe dilution");

  // Scenarios C, E, G, H have valid definitions
  assert.strictEqual(getScenarioC().id, "SCENARIO_C");
  assert.strictEqual(getScenarioE().id, "SCENARIO_E");
  assert.strictEqual(getScenarioG().id, "SCENARIO_G");
  assert.strictEqual(getScenarioH().id, "SCENARIO_H");
});
