/**
 * PULSAR-X: Scientific Reference Core
 * 3x3 Matrix mathematical primitive (stored row-major as a flat 9-element array).
 */

import type { Vector3Like } from "../../types/simulation";
import { Vector3 } from "./vector3";
import { assertFinite, assertFiniteArray, NumericalInstabilityError } from "./finite";

export class Matrix3 {
  /** 9 elements stored in row-major order: [m00, m01, m02, m10, m11, m12, m20, m21, m22] */
  public readonly elements: readonly number[];

  constructor(elements: readonly number[]) {
    if (elements.length !== 9) {
      throw new Error(`Matrix3 requires exactly 9 elements, received ${elements.length}`);
    }
    this.elements = assertFiniteArray(elements, "Matrix3.elements");
  }

  public static zero(): Matrix3 {
    return new Matrix3([0, 0, 0, 0, 0, 0, 0, 0, 0]);
  }

  public static identity(): Matrix3 {
    return new Matrix3([
      1, 0, 0,
      0, 1, 0,
      0, 0, 1,
    ]);
  }

  public static diagonal(d0: number, d1: number, d2: number): Matrix3 {
    return new Matrix3([
      d0, 0, 0,
      0, d1, 0,
      0, 0, d2,
    ]);
  }

  public get(row: number, col: number): number {
    return this.elements[row * 3 + col];
  }

  public trace(): number {
    return this.elements[0] + this.elements[4] + this.elements[8];
  }

  public transpose(): Matrix3 {
    const e = this.elements;
    return new Matrix3([
      e[0], e[3], e[6],
      e[1], e[4], e[7],
      e[2], e[5], e[8],
    ]);
  }

  public add(m: Matrix3): Matrix3 {
    const a = this.elements;
    const b = m.elements;
    const out = new Array<number>(9);
    for (let i = 0; i < 9; i++) {
      out[i] = a[i] + b[i];
    }
    return new Matrix3(out);
  }

  public scale(s: number): Matrix3 {
    assertFinite(s, "Matrix3 scale");
    const e = this.elements;
    const out = new Array<number>(9);
    for (let i = 0; i < 9; i++) {
      out[i] = e[i] * s;
    }
    return new Matrix3(out);
  }

  public multiply(m: Matrix3): Matrix3 {
    const a = this.elements;
    const b = m.elements;
    const out = new Array<number>(9);

    for (let r = 0; r < 3; r++) {
      const r3 = r * 3;
      for (let c = 0; c < 3; c++) {
        out[r3 + c] =
          a[r3 + 0] * b[0 * 3 + c] +
          a[r3 + 1] * b[1 * 3 + c] +
          a[r3 + 2] * b[2 * 3 + c];
      }
    }
    return new Matrix3(out);
  }

  public multiplyVector(v: Vector3Like): Vector3 {
    const e = this.elements;
    return new Vector3(
      e[0] * v.x + e[1] * v.y + e[2] * v.z,
      e[3] * v.x + e[4] * v.y + e[5] * v.z,
      e[6] * v.x + e[7] * v.y + e[8] * v.z
    );
  }

  public determinant(): number {
    const e = this.elements;
    const a = e[0], b = e[1], c = e[2];
    const d = e[3], f = e[4], g = e[5];
    const h = e[6], i = e[7], k = e[8];

    return a * (f * k - g * i) - b * (d * k - g * h) + c * (d * i - f * h);
  }

  public inverse(): Matrix3 {
    const det = this.determinant();
    if (Math.abs(det) < 1e-18 || !Number.isFinite(det)) {
      throw new NumericalInstabilityError(`Cannot invert Matrix3 with singular determinant: ${det}`);
    }

    const e = this.elements;
    const a = e[0], b = e[1], c = e[2];
    const d = e[3], f = e[4], g = e[5];
    const h = e[6], i = e[7], k = e[8];

    const invDet = 1.0 / det;
    return new Matrix3([
      (f * k - g * i) * invDet,
      (c * i - b * k) * invDet,
      (b * g - c * f) * invDet,

      (g * h - d * k) * invDet,
      (a * k - c * h) * invDet,
      (c * d - a * g) * invDet,

      (d * i - f * h) * invDet,
      (b * h - a * i) * invDet,
      (a * f - b * d) * invDet,
    ]);
  }

  public isSymmetric(tolerance = 1e-9): boolean {
    const e = this.elements;
    return (
      Math.abs(e[1] - e[3]) <= tolerance &&
      Math.abs(e[2] - e[6]) <= tolerance &&
      Math.abs(e[5] - e[7]) <= tolerance
    );
  }
}
