/**
 * PULSAR-X: Scientific Reference Core Tests
 * Batch Non-Linear Least Squares Solver Tests.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { Vector3 } from "../../src/simulation/math/vector3";
import { SPEED_OF_LIGHT_MPS } from "../../src/simulation/constants/astronomy";
import { solveBatchLeastSquares } from "../../src/simulation/navigation/batch-solver";
import type { BatchObservationInput } from "../../src/simulation/navigation/batch-solver";

test("Batch Solver: Known-Answer Test (KAT) Position and Clock Inversion", () => {
  // Ground truth position in deep space (arbitrary non-trivial coordinates)
  const r_true = new Vector3(1.2e11, -4.5e10, 8.2e9); // meters
  const clockBias_true_s = 2.5e-5; // 25 microseconds
  const b_true_m = clockBias_true_s * SPEED_OF_LIGHT_MPS;

  // 4 tetrahedral non-coplanar beacons
  const directions = [
    new Vector3(1, 0, 0),
    new Vector3(0, 1, 0),
    new Vector3(0, 0, 1),
    new Vector3(1 / Math.sqrt(3), 1 / Math.sqrt(3), 1 / Math.sqrt(3)).normalize(),
  ];

  // Synthesize exact noiseless pseudoranges: rho = n · r + b
  const observations: BatchObservationInput[] = directions.map((dir) => ({
    directionVector: dir,
    measuredPseudorange_m: dir.dot(r_true) + b_true_m,
    sigma_m: 1.0, // 1 meter uncertainty
  }));

  // Start with a large initial error (e.g. 50,000 km away and zero clock bias)
  const initialGuess = {
    position_m: r_true.add(new Vector3(5e7, -3e7, 2e7)),
    clockBias_s: 0.0,
  };

  const result = solveBatchLeastSquares(observations, initialGuess, {
    maxIterations: 20,
    convergenceTolerance_m: 1e-4,
  });

  assert.strictEqual(result.status, "LOCKED");
  assert.ok(result.iterations <= 5, `Expected convergence in few iterations: ${result.iterations}`);

  // Reconstructed position error should be well under 1 millimeter (machine precision limit)
  const posError_m = result.position_m.distanceTo(r_true);
  assert.ok(
    posError_m < 1e-3,
    `Position error ${posError_m} m exceeds sub-millimeter precision tolerance`
  );

  // Reconstructed clock bias error should be under 1 picosecond
  const clockError_s = Math.abs(result.clockBias_s - clockBias_true_s);
  assert.ok(
    clockError_s < 1e-12,
    `Clock bias error ${clockError_s} s exceeds sub-picosecond tolerance`
  );

  assert.ok(result.rmsResidual_m < 1e-3);
});

test("Batch Solver: Rejects Singular Geometry (< 4 Beacons)", () => {
  const threeObs: BatchObservationInput[] = [
    { directionVector: new Vector3(1, 0, 0), measuredPseudorange_m: 1000, sigma_m: 1 },
    { directionVector: new Vector3(0, 1, 0), measuredPseudorange_m: 1000, sigma_m: 1 },
    { directionVector: new Vector3(0, 0, 1), measuredPseudorange_m: 1000, sigma_m: 1 },
  ];

  const result = solveBatchLeastSquares(threeObs, {
    position_m: Vector3.zero(),
    clockBias_s: 0,
  });

  assert.strictEqual(result.status, "SINGULAR_GEOMETRY");
  assert.strictEqual(result.iterations, 0);
});
