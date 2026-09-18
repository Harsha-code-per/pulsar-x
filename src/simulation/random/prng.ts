/**
 * PULSAR-X: Scientific Reference Core
 * Deterministic Pseudo-Random Number Generator (PRNG).
 * Uses the Mulberry32 32-bit algorithm to guarantee bit-for-bit reproducible simulations.
 */

import { assertFinite } from "../math/finite";

export class SeededPRNG {
  private state: number;

  constructor(seed: number) {
    // Force 32-bit integer initialization
    this.state = (Math.floor(assertFinite(seed, "seed")) >>> 0) || 193721;
  }

  /**
   * Generates a deterministic unsigned 32-bit integer.
   */
  public nextInt(): number {
    let z = (this.state += 0x6d2b79f5);
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return (z ^ (z >>> 14)) >>> 0;
  }

  /**
   * Generates a deterministic uniform floating-point number in [0, 1).
   */
  public nextFloat(): number {
    return this.nextInt() / 4294967296.0;
  }

  /**
   * Generates a standard normal random variable N(mean, stdDev^2) using the Box-Muller transform.
   */
  public nextGaussian(mean = 0.0, stdDev = 1.0): number {
    assertFinite(mean, "mean");
    assertFinite(stdDev, "stdDev");

    let u1 = this.nextFloat();
    const u2 = this.nextFloat();

    // Prevent log(0)
    while (u1 <= 1e-15) {
      u1 = this.nextFloat();
    }

    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z0 * stdDev;
  }

  /**
   * Generates an exponentially distributed random variable with parameter lambda (rate):
   * PDF: f(t) = lambda * exp(-lambda * t).
   */
  public nextExponential(rate: number): number {
    assertFinite(rate, "rate");
    if (rate <= 0) {
      throw new Error(`Exponential rate must be positive, received ${rate}`);
    }
    let u = this.nextFloat();
    while (u <= 1e-15) {
      u = this.nextFloat();
    }
    return -Math.log(1.0 - u) / rate;
  }

  /**
   * Generates a Poisson random variate with expected count lambda.
   */
  public nextPoisson(lambda: number): number {
    assertFinite(lambda, "lambda");
    if (lambda < 0) {
      throw new Error(`Poisson lambda must be non-negative, received ${lambda}`);
    }
    if (lambda === 0) {
      return 0;
    }

    // For large lambda, use Gaussian approximation with continuity correction
    if (lambda > 30.0) {
      const g = this.nextGaussian(lambda, Math.sqrt(lambda));
      return Math.max(0, Math.round(g));
    }

    // Knuth's algorithm for moderate lambda
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1.0;

    do {
      k++;
      p *= this.nextFloat();
    } while (p > L);

    return k - 1;
  }

  /**
   * Spawns an independent child PRNG derived deterministically from the current state.
   */
  public fork(): SeededPRNG {
    return new SeededPRNG(this.nextInt());
  }
}
