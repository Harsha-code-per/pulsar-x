/**
 * PULSAR-X: Scientific Reference Core
 * Covariance and Uncertainty Ellipsoid Decomposition.
 * Extracts position error covariance and computes principal 1-sigma, 2-sigma, 3-sigma semi-axes.
 */

import type { UncertaintyAxes, NavigationCovariance } from "../../types/navigation";
import { Matrix3 } from "../math/matrix3";
import { Vector3 } from "../math/vector3";
import { eigenSymmetric3x3 } from "../math/eigen";
import { assertFinite } from "../math/finite";

/**
 * Extracts the 3x3 position covariance matrix from an 8x8 navigation covariance structure.
 */
export function extractPositionCovarianceMatrix(cov: NavigationCovariance): Matrix3 {
  const m = cov.matrix8x8;
  // Extract upper-left 3x3 block from 8x8 row-major matrix
  return new Matrix3([
    m[0 * 8 + 0], m[0 * 8 + 1], m[0 * 8 + 2],
    m[1 * 8 + 0], m[1 * 8 + 1], m[1 * 8 + 2],
    m[2 * 8 + 0], m[2 * 8 + 1], m[2 * 8 + 2],
  ]);
}

/**
 * Decomposes 3x3 position covariance into principal orientation axes and 1-sigma, 2-sigma, 3-sigma semi-major axes.
 */
export function decomposeUncertaintyAxes(posCov: Matrix3): UncertaintyAxes {
  const { eigenvalues, eigenvectors } = eigenSymmetric3x3(posCov);

  // Ensure non-negative eigenvalues due to small numerical roundoff
  const l0 = Math.max(0.0, eigenvalues[0]);
  const l1 = Math.max(0.0, eigenvalues[1]);
  const l2 = Math.max(0.0, eigenvalues[2]);

  const s0 = Math.sqrt(l0);
  const s1 = Math.sqrt(l1);
  const s2 = Math.sqrt(l2);

  return {
    sigma1_m: new Vector3(assertFinite(s0), assertFinite(s1), assertFinite(s2)),
    sigma2_m: new Vector3(assertFinite(2.0 * s0), assertFinite(2.0 * s1), assertFinite(2.0 * s2)),
    sigma3_m: new Vector3(assertFinite(3.0 * s0), assertFinite(3.0 * s1), assertFinite(3.0 * s2)),
    eigenvectors: [eigenvectors[0], eigenvectors[1], eigenvectors[2]],
    eigenvalues_m2: [l0, l1, l2],
  };
}

/**
 * Creates an initial diagonal 8x8 navigation covariance structure.
 */
export function createDiagonalCovariance(
  posStdDev_m: number,
  velStdDev_mps: number,
  clockBiasStdDev_s: number,
  clockDriftStdDev_rate: number
): NavigationCovariance {
  const m = new Array<number>(64).fill(0);
  const c = 299_792_458; // SPEED_OF_LIGHT_MPS

  const posVar = posStdDev_m * posStdDev_m;
  const velVar = velStdDev_mps * velStdDev_mps;
  const clockBiasVar_m2 = (clockBiasStdDev_s * c) * (clockBiasStdDev_s * c);
  const clockDriftVar_mps2 = (clockDriftStdDev_rate * c) * (clockDriftStdDev_rate * c);

  // Position variances (diag 0, 1, 2)
  m[0 * 8 + 0] = posVar;
  m[1 * 8 + 1] = posVar;
  m[2 * 8 + 2] = posVar;

  // Velocity variances (diag 3, 4, 5)
  m[3 * 8 + 3] = velVar;
  m[4 * 8 + 4] = velVar;
  m[5 * 8 + 5] = velVar;

  // Scaled clock variances (diag 6, 7)
  m[6 * 8 + 6] = clockBiasVar_m2;
  m[7 * 8 + 7] = clockDriftVar_mps2;

  return {
    matrix8x8: m,
    positionVariance_m2: 3.0 * posVar,
    velocityVariance_mps2: 3.0 * velVar,
    clockBiasVariance_s2: clockBiasStdDev_s * clockBiasStdDev_s,
    clockDriftVariance_rate2: clockDriftStdDev_rate * clockDriftStdDev_rate,
  };
}
