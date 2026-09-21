/**
 * PULSAR-X: Scientific Reference Core Tests
 * Mathematical primitives: Vector3, Matrix3, MatrixNxN, Cholesky, LU, and Jacobi Eigenvalue Decomposition.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { Vector3 } from "../../src/simulation/math/vector3";
import { Matrix3 } from "../../src/simulation/math/matrix3";
import { MatrixNxN } from "../../src/simulation/math/matrix-nxn";
import { eigenSymmetric3x3 } from "../../src/simulation/math/eigen";

test("Vector3: basic arithmetic, dot, cross, norm", () => {
  const v1 = new Vector3(1, 2, 3);
  const v2 = new Vector3(4, 5, 6);

  const vSum = v1.add(v2);
  assert.deepStrictEqual(vSum.toArray(), [5, 7, 9]);

  const vSub = v2.sub(v1);
  assert.deepStrictEqual(vSub.toArray(), [3, 3, 3]);

  const vScaled = v1.scale(2.5);
  assert.deepStrictEqual(vScaled.toArray(), [2.5, 5, 7.5]);

  assert.strictEqual(v1.dot(v2), 1 * 4 + 2 * 5 + 3 * 6); // 32

  const cross = v1.cross(v2);
  // [2*6 - 3*5, 3*4 - 1*6, 1*5 - 2*4] = [-3, 6, -3]
  assert.deepStrictEqual(cross.toArray(), [-3, 6, -3]);
  assert.strictEqual(cross.dot(v1), 0); // Orthogonal to v1
  assert.strictEqual(cross.dot(v2), 0); // Orthogonal to v2

  const vNorm = new Vector3(3, 4, 0);
  assert.strictEqual(vNorm.norm(), 5);
  const unit = vNorm.normalize();
  assert.strictEqual(unit.norm(), 1.0);
});

test("Matrix3: multiplication, determinant, transpose, inverse", () => {
  const I = Matrix3.identity();
  const m = new Matrix3([
    2, 0, 1,
    1, 3, 0,
    0, 2, 4,
  ]);

  // Identity multiplication
  const multI = m.multiply(I);
  assert.deepStrictEqual(Array.from(multI.elements), Array.from(m.elements));

  // Determinant: 2*(3*4 - 0) - 0 + 1*(1*2 - 3*0) = 2*12 + 2 = 26
  assert.strictEqual(m.determinant(), 26);

  // Invert and check M * M^-1 = I
  const inv = m.inverse();
  const product = m.multiply(inv);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const expected = r === c ? 1.0 : 0.0;
      assert.ok(
        Math.abs(product.get(r, c) - expected) < 1e-12,
        `Mismatch at (${r},${c}): ${product.get(r, c)}`
      );
    }
  }
});

test("MatrixNxN: Cholesky decomposition and positive-definite linear solve", () => {
  // Construct symmetric positive-definite 4x4 matrix
  // A = [ 4  1 -1  0 ]
  //     [ 1  5  2  1 ]
  //     [-1  2  6  2 ]
  //     [ 0  1  2  7 ]
  const A = new MatrixNxN(4, 4, [
    4,  1, -1,  0,
    1,  5,  2,  1,
   -1,  2,  6,  2,
    0,  1,  2,  7,
  ]);

  const b = [7, 18, 23, 27];

  // Solve A * x = b via Cholesky
  const xCholesky = A.solveCholesky(b);
  const Ax = A.multiplyVector(xCholesky);

  for (let i = 0; i < 4; i++) {
    assert.ok(
      Math.abs(Ax[i] - b[i]) < 1e-10,
      `Cholesky residual error at row ${i}: ${Ax[i]} vs ${b[i]}`
    );
  }

  // Also solve via LU
  const xLU = A.solveLU(b);
  for (let i = 0; i < 4; i++) {
    assert.ok(
      Math.abs(xLU[i] - xCholesky[i]) < 1e-10,
      `LU vs Cholesky mismatch at ${i}: ${xLU[i]} vs ${xCholesky[i]}`
    );
  }
});

test("Jacobi Eigen Decomposition 3x3: diagonalizes symmetric matrices accurately", () => {
  // Known symmetric matrix with analytical eigenvalues
  // A = [ 2  -1   0 ]
  //     [-1   2  -1 ]
  //     [ 0  -1   2 ]
  // Trace = 6. Eigenvalues are 2 + sqrt(2) ~ 3.414, 2.0, 2 - sqrt(2) ~ 0.5857
  const A = new Matrix3([
    2, -1,  0,
   -1,  2, -1,
    0, -1,  2,
  ]);

  const { eigenvalues, eigenvectors } = eigenSymmetric3x3(A);

  assert.strictEqual(eigenvalues.length, 3);
  assert.ok(eigenvalues[0] >= eigenvalues[1]);
  assert.ok(eigenvalues[1] >= eigenvalues[2]);

  const expected0 = 2.0 + Math.SQRT2;
  const expected1 = 2.0;
  const expected2 = 2.0 - Math.SQRT2;

  assert.ok(Math.abs(eigenvalues[0] - expected0) < 1e-9);
  assert.ok(Math.abs(eigenvalues[1] - expected1) < 1e-9);
  assert.ok(Math.abs(eigenvalues[2] - expected2) < 1e-9);

  // Orthonormality check of eigenvectors
  const [v0, v1, v2] = eigenvectors;
  assert.ok(Math.abs(v0.norm() - 1.0) < 1e-9);
  assert.ok(Math.abs(v1.norm() - 1.0) < 1e-9);
  assert.ok(Math.abs(v2.norm() - 1.0) < 1e-9);

  assert.ok(Math.abs(v0.dot(v1)) < 1e-9);
  assert.ok(Math.abs(v0.dot(v2)) < 1e-9);
  assert.ok(Math.abs(v1.dot(v2)) < 1e-9);

  // Reconstruct A: v * lambda * v^T = A
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const reconstructed =
        eigenvalues[0] * v0.toArray()[r] * v0.toArray()[c] +
        eigenvalues[1] * v1.toArray()[r] * v1.toArray()[c] +
        eigenvalues[2] * v2.toArray()[r] * v2.toArray()[c];

      assert.ok(
        Math.abs(reconstructed - A.get(r, c)) < 1e-9,
        `Reconstruction mismatch at (${r},${c})`
      );
    }
  }
});
