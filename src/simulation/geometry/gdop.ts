/**
 * PULSAR-X: Scientific Reference Core
 * Geometric Dilution of Precision (GDOP, PDOP, TDOP) Calculations.
 * Strictly separates 3D Position-Only Geometry from 4D Spacetime Geometry.
 */

import type { Vector3Like } from "../../types/simulation";
import type { GeometryMetrics } from "../../types/navigation";
import { MatrixNxN } from "../math/matrix-nxn";
import { assertFinite } from "../math/finite";

/**
 * Computes the 3D Position-Only Dilution of Precision (PDOP_pos) from an array of direction vectors:
 *   G = [n_hat_1, ..., n_hat_m]^T  (m x 3)
 *   PDOP_pos = sqrt( trace( (G^T * G)^-1 ) )
 */
export function calculatePositionOnlyDop(directionVectors: readonly Vector3Like[]): number {
  const m = directionVectors.length;
  if (m < 3) {
    return Infinity;
  }

  // Construct m x 3 matrix G
  const G = new MatrixNxN(m, 3);
  for (let i = 0; i < m; i++) {
    G.set(i, 0, directionVectors[i].x);
    G.set(i, 1, directionVectors[i].y);
    G.set(i, 2, directionVectors[i].z);
  }

  // Normal matrix: N = G^T * G (3 x 3)
  const N = G.transpose().multiply(G);

  try {
    const invN = N.inversePositiveDefinite();
    const trace = invN.trace();
    return trace > 0 ? Math.sqrt(trace) : Infinity;
  } catch {
    return Infinity;
  }
}

/**
 * Computes full 4D Geometric Dilution of Precision metrics (GDOP, PDOP, TDOP, condition number, rank)
 * from active line-of-sight unit vectors:
 * 
 *   H_geom = [ n_hat_i^T, 1 ] (m x 4)
 *   Q = (H_geom^T * H_geom)^-1 (4 x 4)
 */
export function calculateGeometryMetrics(directionVectors: readonly Vector3Like[]): GeometryMetrics {
  const m = directionVectors.length;
  if (m < 4) {
    const pdopOnly = calculatePositionOnlyDop(directionVectors);
    return {
      pdop: pdopOnly,
      gdop: Infinity,
      tdop: Infinity,
      conditionNumber: Infinity,
      rank: m,
      activeCount: m,
    };
  }

  // Construct m x 4 matrix H_geom
  const H = new MatrixNxN(m, 4);
  for (let i = 0; i < m; i++) {
    H.set(i, 0, directionVectors[i].x);
    H.set(i, 1, directionVectors[i].y);
    H.set(i, 2, directionVectors[i].z);
    H.set(i, 3, 1.0); // Receiver clock bias projection
  }

  // Normal matrix: N = H^T * H (4 x 4)
  const N = H.transpose().multiply(H);

  try {
    const invN = N.inversePositiveDefinite();

    const q00 = invN.get(0, 0);
    const q11 = invN.get(1, 1);
    const q22 = invN.get(2, 2);
    const q33 = invN.get(3, 3);

    const posTrace = q00 + q11 + q22;
    const pdop = posTrace > 0 ? Math.sqrt(posTrace) : Infinity;
    const tdop = q33 > 0 ? Math.sqrt(q33) : Infinity;
    const gdop = posTrace + q33 > 0 ? Math.sqrt(posTrace + q33) : Infinity;

    // Approximate condition number using diagonal ratio
    const diag = [N.get(0, 0), N.get(1, 1), N.get(2, 2), N.get(3, 3)];
    const maxDiag = Math.max(...diag);
    const minDiag = Math.min(...diag);
    const conditionNumber = minDiag > 0 ? maxDiag / minDiag : Infinity;

    return {
      pdop: assertFinite(pdop, "pdop"),
      gdop: assertFinite(gdop, "gdop"),
      tdop: assertFinite(tdop, "tdop"),
      conditionNumber,
      rank: 4,
      activeCount: m,
    };
  } catch {
    // Singular or near-singular normal matrix (e.g. coplanar pulsars)
    return {
      pdop: Infinity,
      gdop: Infinity,
      tdop: Infinity,
      conditionNumber: Infinity,
      rank: Math.min(m, 3),
      activeCount: m,
    };
  }
}
