/**
 * PULSAR-X: Scientific Reference Core
 * General NxM matrix primitive and small linear equation solvers (Cholesky & LU decomposition).
 */

import { assertFinite, NumericalInstabilityError } from "./finite";

export class MatrixNxN {
  public readonly rows: number;
  public readonly cols: number;
  public readonly elements: Float64Array;

  constructor(rows: number, cols: number, elements?: ArrayLike<number>) {
    if (rows <= 0 || cols <= 0) {
      throw new Error(`Invalid dimensions: ${rows}x${cols}`);
    }
    this.rows = rows;
    this.cols = cols;
    this.elements = new Float64Array(rows * cols);

    if (elements) {
      if (elements.length !== rows * cols) {
        throw new Error(
          `Expected ${rows * cols} elements, received ${elements.length}`
        );
      }
      for (let i = 0; i < elements.length; i++) {
        this.elements[i] = assertFinite(elements[i], `MatrixNxN[${i}]`);
      }
    }
  }

  public static zero(rows: number, cols: number): MatrixNxN {
    return new MatrixNxN(rows, cols);
  }

  public static identity(n: number): MatrixNxN {
    const m = new MatrixNxN(n, n);
    for (let i = 0; i < n; i++) {
      m.set(i, i, 1.0);
    }
    return m;
  }

  public get(row: number, col: number): number {
    return this.elements[row * this.cols + col];
  }

  public set(row: number, col: number, val: number): void {
    this.elements[row * this.cols + col] = assertFinite(val, `MatrixNxN(${row},${col})`);
  }

  public clone(): MatrixNxN {
    return new MatrixNxN(this.rows, this.cols, this.elements);
  }

  public transpose(): MatrixNxN {
    const out = new MatrixNxN(this.cols, this.rows);
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        out.set(c, r, this.get(r, c));
      }
    }
    return out;
  }

  public add(m: MatrixNxN): MatrixNxN {
    if (this.rows !== m.rows || this.cols !== m.cols) {
      throw new Error(`Dimension mismatch: ${this.rows}x${this.cols} vs ${m.rows}x${m.cols}`);
    }
    const out = new MatrixNxN(this.rows, this.cols);
    for (let i = 0; i < this.elements.length; i++) {
      out.elements[i] = this.elements[i] + m.elements[i];
    }
    return out;
  }

  public scale(s: number): MatrixNxN {
    assertFinite(s, "scale");
    const out = new MatrixNxN(this.rows, this.cols);
    for (let i = 0; i < this.elements.length; i++) {
      out.elements[i] = this.elements[i] * s;
    }
    return out;
  }

  public multiply(m: MatrixNxN): MatrixNxN {
    if (this.cols !== m.rows) {
      throw new Error(
        `Matrix multiplication dimension mismatch: ${this.rows}x${this.cols} by ${m.rows}x${m.cols}`
      );
    }
    const out = new MatrixNxN(this.rows, m.cols);
    const K = this.cols;
    const M = this.rows;
    const N = m.cols;

    for (let r = 0; r < M; r++) {
      for (let c = 0; c < N; c++) {
        let sum = 0;
        for (let k = 0; k < K; k++) {
          sum += this.get(r, k) * m.get(k, c);
        }
        out.set(r, c, sum);
      }
    }
    return out;
  }

  public multiplyVector(v: readonly number[]): number[] {
    if (this.cols !== v.length) {
      throw new Error(`Vector dimension mismatch: matrix has ${this.cols} cols, vector has ${v.length}`);
    }
    const out = new Array<number>(this.rows);
    for (let r = 0; r < this.rows; r++) {
      let sum = 0;
      for (let c = 0; c < this.cols; c++) {
        sum += this.get(r, c) * v[c];
      }
      out[r] = sum;
    }
    return out;
  }

  public trace(): number {
    if (this.rows !== this.cols) {
      throw new Error("Trace requires square matrix");
    }
    let sum = 0;
    for (let i = 0; i < this.rows; i++) {
      sum += this.get(i, i);
    }
    return sum;
  }

  /**
   * Cholesky Decomposition: A = L * L^T for symmetric positive-definite matrices.
   * Returns lower triangular matrix L.
   */
  public cholesky(): MatrixNxN {
    if (this.rows !== this.cols) {
      throw new Error("Cholesky requires square matrix");
    }
    const n = this.rows;
    const L = new MatrixNxN(n, n);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= i; j++) {
        let sum = 0;
        for (let k = 0; k < j; k++) {
          sum += L.get(i, k) * L.get(j, k);
        }

        if (i === j) {
          const val = this.get(i, i) - sum;
          if (val <= 1e-18) {
            throw new NumericalInstabilityError(
              `Matrix is not positive definite at row ${i}: diagonal value is ${val}`
            );
          }
          L.set(i, j, Math.sqrt(val));
        } else {
          const denom = L.get(j, j);
          if (Math.abs(denom) < 1e-18) {
            throw new NumericalInstabilityError(`Singular pivot in Cholesky at row ${j}`);
          }
          L.set(i, j, (this.get(i, j) - sum) / denom);
        }
      }
    }
    return L;
  }

  /**
   * Solves A * x = b for symmetric positive-definite A via Cholesky decomposition.
   */
  public solveCholesky(b: readonly number[]): number[] {
    const L = this.cholesky();
    const n = this.rows;

    // Forward substitution: L * y = b
    const y = new Array<number>(n);
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let k = 0; k < i; k++) {
        sum += L.get(i, k) * y[k];
      }
      y[i] = (b[i] - sum) / L.get(i, i);
    }

    // Back substitution: L^T * x = y
    const x = new Array<number>(n);
    for (let i = n - 1; i >= 0; i--) {
      let sum = 0;
      for (let k = i + 1; k < n; k++) {
        sum += L.get(k, i) * x[k]; // L^T(i, k) = L(k, i)
      }
      x[i] = (y[i] - sum) / L.get(i, i);
    }
    return x;
  }

  /**
   * Inverts a symmetric positive-definite matrix via Cholesky factorization.
   */
  public inversePositiveDefinite(): MatrixNxN {
    const n = this.rows;
    const inv = new MatrixNxN(n, n);
    const e = new Array<number>(n).fill(0);

    for (let col = 0; col < n; col++) {
      e[col] = 1.0;
      const x = this.solveCholesky(e);
      e[col] = 0.0;
      for (let row = 0; row < n; row++) {
        inv.set(row, col, x[row]);
      }
    }
    return inv;
  }

  /**
   * General linear equation solve A * x = b via Gaussian Elimination with Partial Pivoting.
   */
  public solveLU(b: readonly number[]): number[] {
    if (this.rows !== this.cols) {
      throw new Error("SolveLU requires square matrix");
    }
    const n = this.rows;
    const A = this.clone();
    const x = Array.from(b);

    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i;
      let maxVal = Math.abs(A.get(i, i));
      for (let k = i + 1; k < n; k++) {
        const val = Math.abs(A.get(k, i));
        if (val > maxVal) {
          maxVal = val;
          maxRow = k;
        }
      }

      if (maxVal < 1e-15) {
        throw new NumericalInstabilityError(`Singular matrix encountered in LU solve at row ${i}`);
      }

      // Swap rows
      if (maxRow !== i) {
        for (let k = 0; k < n; k++) {
          const tmp = A.get(i, k);
          A.set(i, k, A.get(maxRow, k));
          A.set(maxRow, k, tmp);
        }
        const tmpB = x[i];
        x[i] = x[maxRow];
        x[maxRow] = tmpB;
      }

      // Eliminate below
      for (let k = i + 1; k < n; k++) {
        const factor = A.get(k, i) / A.get(i, i);
        for (let j = i; j < n; j++) {
          A.set(k, j, A.get(k, j) - factor * A.get(i, j));
        }
        x[k] -= factor * x[i];
      }
    }

    // Back substitution
    for (let i = n - 1; i >= 0; i--) {
      let sum = 0;
      for (let j = i + 1; j < n; j++) {
        sum += A.get(i, j) * x[j];
      }
      x[i] = (x[i] - sum) / A.get(i, i);
    }
    return x;
  }

  /**
   * General matrix inversion via LU decomposition with partial pivoting.
   */
  public inverse(): MatrixNxN {
    const n = this.rows;
    if (n !== this.cols) {
      throw new Error("Matrix inverse requires square matrix");
    }
    const inv = new MatrixNxN(n, n);
    const e = new Array<number>(n).fill(0);

    for (let col = 0; col < n; col++) {
      e[col] = 1.0;
      const x = this.solveLU(e);
      e[col] = 0.0;
      for (let row = 0; row < n; row++) {
        inv.set(row, col, x[row]);
      }
    }
    return inv;
  }

  /**
   * Extracts a submatrix block from (startRow, startCol) with dimensions (subRows, subCols).
   */
  public getBlock(startRow: number, startCol: number, subRows: number, subCols: number): MatrixNxN {
    const out = new MatrixNxN(subRows, subCols);
    for (let r = 0; r < subRows; r++) {
      for (let c = 0; c < subCols; c++) {
        out.set(r, c, this.get(startRow + r, startCol + c));
      }
    }
    return out;
  }
}
