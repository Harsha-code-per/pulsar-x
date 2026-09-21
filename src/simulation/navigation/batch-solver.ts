/**
 * PULSAR-X: Scientific Reference Core
 * Batch Reference Solver (Gauss-Newton Non-Linear Least Squares).
 * Computes snapshot 4D position and clock bias fixes from simultaneous or batched observations.
 */

import type { Vector3Like } from "../../types/simulation";
import type { NavigationStatus } from "../../types/navigation";
import { Vector3 } from "../math/vector3";
import { MatrixNxN } from "../math/matrix-nxn";
import { SPEED_OF_LIGHT_MPS } from "../constants/astronomy";
import { assertFinite } from "../math/finite";

export interface BatchObservationInput {
  /** Unit line-of-sight vector pointing toward the pulsar */
  readonly directionVector: Vector3Like;
  /** Measured pseudorange observable in meters [m]: c * (t_obs - t_ref) */
  readonly measuredPseudorange_m: number;
  /** Measurement standard deviation in meters [m] */
  readonly sigma_m: number;
}

export interface BatchSolverResult {
  /** Estimated spacecraft position in meters [m] */
  readonly position_m: Vector3;
  /** Estimated receiver clock bias in seconds [s] */
  readonly clockBias_s: number;
  /** 4x4 estimation error covariance matrix (pos + c*clockBias) */
  readonly covariance4x4: MatrixNxN;
  /** Solver operational status */
  readonly status: NavigationStatus;
  /** Number of iterations performed */
  readonly iterations: number;
  /** Post-fit root-mean-square residual in meters [m] */
  readonly rmsResidual_m: number;
  /** Individual post-fit residuals in meters [m] */
  readonly residuals_m: readonly number[];
}

export interface BatchSolverOptions {
  readonly maxIterations?: number;
  readonly convergenceTolerance_m?: number;
}

/**
 * Executes iterative Gauss-Newton non-linear least squares state estimation:
 *   Minimizes sum of squared residuals: || z - (n_hat_i · r + c*clockBias) ||^2_W
 */
export function solveBatchLeastSquares(
  observations: readonly BatchObservationInput[],
  initialGuess: { position_m: Vector3Like; clockBias_s: number },
  options: BatchSolverOptions = {}
): BatchSolverResult {
  const m = observations.length;
  const maxIter = options.maxIterations ?? 20;
  const tol_m = options.convergenceTolerance_m ?? 1e-4;

  if (m < 4) {
    return {
      position_m: Vector3.fromLike(initialGuess.position_m),
      clockBias_s: initialGuess.clockBias_s,
      covariance4x4: MatrixNxN.zero(4, 4),
      status: "SINGULAR_GEOMETRY",
      iterations: 0,
      rmsResidual_m: Infinity,
      residuals_m: [],
    };
  }

  let rEst = Vector3.fromLike(initialGuess.position_m);
  let bEst_m = initialGuess.clockBias_s * SPEED_OF_LIGHT_MPS; // clock bias in equivalent meters

  let iter = 0;
  let converged = false;
  let lastCovariance = MatrixNxN.zero(4, 4);
  const residuals_m = new Array<number>(m).fill(0);

  for (iter = 0; iter < maxIter; iter++) {
    // Construct H (m x 4) and residual vector deltaZ (m)
    const H = new MatrixNxN(m, 4);
    const deltaZ = new Array<number>(m);
    const weights = new Array<number>(m);

    for (let i = 0; i < m; i++) {
      const obs = observations[i];
      const n = Vector3.fromLike(obs.directionVector);

      H.set(i, 0, n.x);
      H.set(i, 1, n.y);
      H.set(i, 2, n.z);
      H.set(i, 3, 1.0); // derivative w.r.t c * clockBias

      const sigma = Math.max(1e-6, obs.sigma_m);
      weights[i] = 1.0 / (sigma * sigma);

      // Predicted pseudorange: rho_pred = n · r_est + b_est
      const rhoPred_m = n.dot(rEst) + bEst_m;
      deltaZ[i] = obs.measuredPseudorange_m - rhoPred_m;
      residuals_m[i] = deltaZ[i];
    }

    // Normal matrix: N = H^T * W * H (4 x 4)
    const N = new MatrixNxN(4, 4);
    const rhs = new Array<number>(4).fill(0);

    for (let i = 0; i < m; i++) {
      const w = weights[i];
      const dz = deltaZ[i];

      const hRow = [H.get(i, 0), H.get(i, 1), H.get(i, 2), H.get(i, 3)];

      for (let r = 0; r < 4; r++) {
        rhs[r] += hRow[r] * w * dz;
        for (let c = 0; c < 4; c++) {
          N.set(r, c, N.get(r, c) + hRow[r] * w * hRow[c]);
        }
      }
    }

    // Solve N * deltaX = rhs
    let deltaX: number[];
    try {
      lastCovariance = N.inversePositiveDefinite();
      deltaX = lastCovariance.multiplyVector(rhs);
    } catch {
      return {
        position_m: rEst,
        clockBias_s: bEst_m / SPEED_OF_LIGHT_MPS,
        covariance4x4: MatrixNxN.zero(4, 4),
        status: "SINGULAR_GEOMETRY",
        iterations: iter + 1,
        rmsResidual_m: Infinity,
        residuals_m,
      };
    }

    // Update state
    rEst = rEst.add(new Vector3(deltaX[0], deltaX[1], deltaX[2]));
    bEst_m += deltaX[3];

    // Check step magnitude
    const posStep_m = Math.sqrt(
      deltaX[0] * deltaX[0] + deltaX[1] * deltaX[1] + deltaX[2] * deltaX[2]
    );

    if (posStep_m < tol_m && Math.abs(deltaX[3]) < tol_m) {
      converged = true;
      iter++;
      break;
    }
  }

  // Compute post-fit RMS residual
  let sumSq = 0;
  for (let i = 0; i < m; i++) {
    const n = Vector3.fromLike(observations[i].directionVector);
    const rhoPred = n.dot(rEst) + bEst_m;
    const res = observations[i].measuredPseudorange_m - rhoPred;
    residuals_m[i] = res;
    sumSq += res * res;
  }
  const rmsResidual_m = Math.sqrt(sumSq / m);

  return {
    position_m: rEst,
    clockBias_s: bEst_m / SPEED_OF_LIGHT_MPS,
    covariance4x4: lastCovariance,
    status: converged ? "LOCKED" : "DEGRADED",
    iterations: iter,
    rmsResidual_m: assertFinite(rmsResidual_m, "rmsResidual_m"),
    residuals_m,
  };
}
