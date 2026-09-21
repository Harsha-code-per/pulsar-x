/**
 * PULSAR-X: Scientific Reference Core
 * 8-State Navigation State Vector Representations and Conversions.
 */

import type { NavigationState } from "../../types/navigation";
import { Vector3 } from "../math/vector3";
import { SPEED_OF_LIGHT_MPS } from "../constants/astronomy";
import { assertFinite } from "../math/finite";

/**
 * Converts a unit-safe NavigationState object into a flat 8-element array:
 * [x_m, y_m, z_m, vx_mps, vy_mps, vz_mps, c * clockBias_s, c * clockDrift_rate]
 */
export function navigationStateToFlatVector8(state: NavigationState): Float64Array {
  const v = new Float64Array(8);
  v[0] = state.position_m.x;
  v[1] = state.position_m.y;
  v[2] = state.position_m.z;
  v[3] = state.velocity_mps.x;
  v[4] = state.velocity_mps.y;
  v[5] = state.velocity_mps.z;
  v[6] = state.clockBias_s * SPEED_OF_LIGHT_MPS; // Scaled to equivalent distance in meters
  v[7] = state.clockDrift_rate * SPEED_OF_LIGHT_MPS; // Scaled to equivalent velocity in m/s
  return v;
}

/**
 * Converts a flat 8-element state array back into a unit-safe NavigationState object.
 */
export function flatVector8ToNavigationState(v: ArrayLike<number>): NavigationState {
  if (v.length !== 8) {
    throw new Error(`Expected 8-element vector, received length: ${v.length}`);
  }

  const c = SPEED_OF_LIGHT_MPS;
  return {
    position_m: new Vector3(assertFinite(v[0]), assertFinite(v[1]), assertFinite(v[2])),
    velocity_mps: new Vector3(assertFinite(v[3]), assertFinite(v[4]), assertFinite(v[5])),
    clockBias_s: assertFinite(v[6]) / c,
    clockDrift_rate: assertFinite(v[7]) / c,
  };
}

/**
 * Constructs the instantaneous measurement sensitivity row H_i (1 x 8) for pulsar i:
 * 
 *   H_i = [ n_x, n_y, n_z, 0, 0, 0, 1, 0 ]
 * 
 * OBSERVABILITY PRINCIPLE:
 * Notice that columns 3, 4, 5 (velocity) and column 7 (clock drift) are strictly zero!
 * A single instantaneous scalar TOA observation cannot directly observe velocity or clock drift.
 * Full 8-state observability is achieved only through dynamic state propagation over time
 * across the spacecraft's orbital trajectory.
 */
export function createMeasurementRow8(n_hat: Vector3): number[] {
  return [n_hat.x, n_hat.y, n_hat.z, 0.0, 0.0, 0.0, 1.0, 0.0];
}
