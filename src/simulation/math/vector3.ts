/**
 * PULSAR-X: Scientific Reference Core
 * 3D Vector mathematical primitive.
 */

import type { Vector3Like } from "../../types/simulation";
import { assertFinite } from "./finite";

export class Vector3 implements Vector3Like {
  public readonly x: number;
  public readonly y: number;
  public readonly z: number;

  constructor(x: number, y: number, z: number) {
    this.x = assertFinite(x, "Vector3.x");
    this.y = assertFinite(y, "Vector3.y");
    this.z = assertFinite(z, "Vector3.z");
  }

  public static zero(): Vector3 {
    return new Vector3(0, 0, 0);
  }

  public static fromLike(v: Vector3Like): Vector3 {
    return new Vector3(v.x, v.y, v.z);
  }

  public add(v: Vector3Like): Vector3 {
    return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  public sub(v: Vector3Like): Vector3 {
    return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  public scale(s: number): Vector3 {
    assertFinite(s, "scale factor");
    return new Vector3(this.x * s, this.y * s, this.z * s);
  }

  public dot(v: Vector3Like): number {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  public cross(v: Vector3Like): Vector3 {
    return new Vector3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }

  public normSq(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  public norm(): number {
    return Math.sqrt(this.normSq());
  }

  public normalize(): Vector3 {
    const n = this.norm();
    if (n === 0 || !Number.isFinite(n)) {
      throw new Error("Cannot normalize zero-length or non-finite vector");
    }
    return new Vector3(this.x / n, this.y / n, this.z / n);
  }

  public distanceTo(v: Vector3Like): number {
    return this.sub(v).norm();
  }

  public toArray(): [number, number, number] {
    return [this.x, this.y, this.z];
  }

  public equals(v: Vector3Like, tolerance = 1e-9): boolean {
    return (
      Math.abs(this.x - v.x) <= tolerance &&
      Math.abs(this.y - v.y) <= tolerance &&
      Math.abs(this.z - v.z) <= tolerance
    );
  }
}
