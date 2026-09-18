/**
 * PULSAR-X: Scientific Reference Core
 * Strict numerical integrity and finite-value guards.
 */

export class NumericalInstabilityError extends Error {
  constructor(message: string, public readonly context?: Record<string, unknown>) {
    super(`NumericalInstabilityError: ${message}`);
    this.name = "NumericalInstabilityError";
  }
}

/**
 * Asserts that a scalar number is strictly finite (not NaN, not +Infinity, not -Infinity).
 */
export function assertFinite(val: number, name = "value"): number {
  if (!Number.isFinite(val)) {
    throw new NumericalInstabilityError(`Variable '${name}' is not finite: ${val}`);
  }
  return val;
}

/**
 * Asserts that all elements of an array or matrix are strictly finite.
 */
export function assertFiniteArray(arr: readonly number[], name = "array"): readonly number[] {
  for (let i = 0; i < arr.length; i++) {
    if (!Number.isFinite(arr[i])) {
      throw new NumericalInstabilityError(
        `Array '${name}' contains non-finite element at index ${i}: ${arr[i]}`
      );
    }
  }
  return arr;
}
