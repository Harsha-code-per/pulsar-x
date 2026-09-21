/**
 * PULSAR-X: Scientific Reference Core
 * Jacobi Eigenvalue Algorithm for 3x3 Symmetric Matrices.
 * Diagonalizes symmetric covariance matrices to yield sorted eigenvalues and orthonormal eigenvectors.
 */

import { Vector3 } from "./vector3";
import { Matrix3 } from "./matrix3";
import { assertFinite, NumericalInstabilityError } from "./finite";

export interface EigenDecomposition3x3 {
  /** Sorted eigenvalues in descending order: lambda1 >= lambda2 >= lambda3 */
  readonly eigenvalues: readonly [number, number, number];
  /** Corresponding orthonormal eigenvectors (each has unit length) */
  readonly eigenvectors: readonly [Vector3, Vector3, Vector3];
}

/**
 * Computes exact eigenvalue and eigenvector decomposition of a 3x3 real symmetric matrix
 * using the classical Jacobi cyclic rotation algorithm.
 */
export function eigenSymmetric3x3(A: Matrix3, maxIterations = 50, tolerance = 1e-15): EigenDecomposition3x3 {
  if (!A.isSymmetric(1e-6)) {
    throw new NumericalInstabilityError("Jacobi eigen decomposition requires a symmetric matrix");
  }

  // Work with a mutable copy of the 3x3 matrix elements
  const a = Array.from(A.elements);

  // V begins as the 3x3 identity matrix (accumulates Givens orthogonal rotations)
  const v = [
    1, 0, 0,
    0, 1, 0,
    0, 0, 1,
  ];

  for (let iter = 0; iter < maxIterations; iter++) {
    // Find the largest off-diagonal element
    let p = 0;
    let q = 1;
    let maxOffDiag = Math.abs(a[0 * 3 + 1]);

    const off02 = Math.abs(a[0 * 3 + 2]);
    if (off02 > maxOffDiag) {
      maxOffDiag = off02;
      p = 0;
      q = 2;
    }

    const off12 = Math.abs(a[1 * 3 + 2]);
    if (off12 > maxOffDiag) {
      maxOffDiag = off12;
      p = 1;
      q = 2;
    }

    // Check for convergence
    if (maxOffDiag <= tolerance) {
      break;
    }

    // Compute Jacobi rotation angle
    const app = a[p * 3 + p];
    const aqq = a[q * 3 + q];
    const apq = a[p * 3 + q];

    const theta = (aqq - app) / (2.0 * apq);
    let t: number;
    if (theta >= 0.0) {
      t = 1.0 / (theta + Math.sqrt(1.0 + theta * theta));
    } else {
      t = -1.0 / (-theta + Math.sqrt(1.0 + theta * theta));
    }

    const c = 1.0 / Math.sqrt(1.0 + t * t);
    const s = t * c;
    const tau = s / (1.0 + c);

    // Apply rotation to matrix a
    a[p * 3 + p] = app - t * apq;
    a[q * 3 + q] = aqq + t * apq;
    a[p * 3 + q] = 0.0;
    a[q * 3 + p] = 0.0;

    for (let j = 0; j < 3; j++) {
      if (j !== p && j !== q) {
        const ajp = a[j * 3 + p];
        const ajq = a[j * 3 + q];
        a[j * 3 + p] = ajp - s * (ajq + tau * ajp);
        a[p * 3 + j] = a[j * 3 + p];
        a[j * 3 + q] = ajq + s * (ajp - tau * ajq);
        a[q * 3 + j] = a[j * 3 + q];
      }
    }

    // Accumulate transformation into eigenvectors matrix v
    for (let j = 0; j < 3; j++) {
      const vjp = v[j * 3 + p];
      const vjq = v[j * 3 + q];
      v[j * 3 + p] = vjp - s * (vjq + tau * vjp);
      v[j * 3 + q] = vjq + s * (vjp - tau * vjq);
    }
  }

  // Extract raw eigenvalues (diagonal elements of a)
  const rawPairs: Array<{ val: number; vec: Vector3 }> = [
    {
      val: assertFinite(a[0], "eigenval 0"),
      vec: new Vector3(v[0 * 3 + 0], v[1 * 3 + 0], v[2 * 3 + 0]).normalize(),
    },
    {
      val: assertFinite(a[4], "eigenval 1"),
      vec: new Vector3(v[0 * 3 + 1], v[1 * 3 + 1], v[2 * 3 + 1]).normalize(),
    },
    {
      val: assertFinite(a[8], "eigenval 2"),
      vec: new Vector3(v[0 * 3 + 2], v[1 * 3 + 2], v[2 * 3 + 2]).normalize(),
    },
  ];

  // Sort eigenvalues in descending order: lambda1 >= lambda2 >= lambda3
  rawPairs.sort((left, right) => right.val - left.val);

  return {
    eigenvalues: [rawPairs[0].val, rawPairs[1].val, rawPairs[2].val],
    eigenvectors: [rawPairs[0].vec, rawPairs[1].vec, rawPairs[2].vec],
  };
}
