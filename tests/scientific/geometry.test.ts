/**
 * PULSAR-X: Scientific Reference Core Tests
 * Geometric Dilution of Precision (GDOP / PDOP) & Singularity Tests.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { Vector3 } from "../../src/simulation/math/vector3";
import {
  calculatePositionOnlyDop,
  calculateGeometryMetrics,
} from "../../src/simulation/geometry/gdop";

test("Geometry Metrics: Ideal Orthogonal Tetrahedral Constellation", () => {
  const directions = [
    new Vector3(1, 0, 0),
    new Vector3(0, 1, 0),
    new Vector3(0, 0, 1),
    new Vector3(1 / Math.sqrt(3), 1 / Math.sqrt(3), 1 / Math.sqrt(3)),
  ];

  const pdopOnly = calculatePositionOnlyDop(directions);
  assert.ok(Number.isFinite(pdopOnly));
  assert.ok(pdopOnly > 1.0 && pdopOnly < 5.0, `PDOP should be reasonable: ${pdopOnly}`);

  const metrics = calculateGeometryMetrics(directions);
  assert.strictEqual(metrics.rank, 4);
  assert.strictEqual(metrics.activeCount, 4);
  assert.ok(Number.isFinite(metrics.gdop));
  assert.ok(Number.isFinite(metrics.pdop));
  assert.ok(Number.isFinite(metrics.tdop));
  assert.ok(metrics.gdop >= metrics.pdop);
});

test("Geometry Metrics: Coplanar Constellation Singularity Detection", () => {
  // 4 pulsars lying completely in the Z = 0 plane
  const coplanar = [
    new Vector3(1, 0, 0),
    new Vector3(0, 1, 0),
    new Vector3(-1, 0, 0),
    new Vector3(0, -1, 0),
  ];

  const pdopOnly = calculatePositionOnlyDop(coplanar);
  assert.strictEqual(pdopOnly, Infinity, "Coplanar vectors must yield infinite position DOP");

  const metrics = calculateGeometryMetrics(coplanar);
  assert.strictEqual(metrics.gdop, Infinity, "Coplanar vectors must yield infinite GDOP");
  assert.strictEqual(metrics.pdop, Infinity);
  assert.ok(metrics.rank <= 3, "Rank must be <= 3 for coplanar vectors");
});

test("Geometry Metrics: Insufficient Beacons (< 4)", () => {
  const threeBeacons = [
    new Vector3(1, 0, 0),
    new Vector3(0, 1, 0),
    new Vector3(0, 0, 1),
  ];

  const pdopOnly = calculatePositionOnlyDop(threeBeacons);
  assert.ok(Number.isFinite(pdopOnly), "3 non-coplanar beacons can solve 3D position");

  const metrics = calculateGeometryMetrics(threeBeacons);
  assert.strictEqual(metrics.gdop, Infinity, "3 beacons cannot solve 4D spacetime position + clock");
  assert.strictEqual(metrics.activeCount, 3);
});
