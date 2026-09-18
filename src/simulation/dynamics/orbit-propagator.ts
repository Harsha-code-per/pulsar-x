/**
 * PULSAR-X: Scientific Reference Core
 * 6-DoF Spacecraft Orbit Propagator using 4th-Order Runge-Kutta (RK4) integration.
 */

import type { SpacecraftState, Vector3Like } from "../../types/simulation";
import { Vector3 } from "../math/vector3";
import { calculateGravitationalAcceleration_mps2 } from "./gravity";
import { assertFinite } from "../math/finite";

export interface PropagatorOptions {
  /** Applied spacecraft continuous thrust acceleration in meters per second squared [m/s^2] */
  readonly thrustAcceleration_mps2?: Vector3Like;
  /** Whether to include third-body analytical planetary perturbations */
  readonly enablePerturbations?: boolean;
}

/**
 * Propagates a spacecraft state forward by dt_s using classical 4th-Order Runge-Kutta (RK4) integration:
 *   dr/dt = v
 *   dv/dt = a_grav(r, t) + a_thrust
 */
export function stepSpacecraftStateRK4(
  current: SpacecraftState,
  dt_s: number,
  options: PropagatorOptions = {}
): SpacecraftState {
  assertFinite(dt_s, "dt_s");
  const t0 = current.time_s;
  const r0 = Vector3.fromLike(current.position_m);
  const v0 = Vector3.fromLike(current.velocity_mps);
  const thrust = options.thrustAcceleration_mps2
    ? Vector3.fromLike(options.thrustAcceleration_mps2)
    : Vector3.zero();
  const enablePerturbations = options.enablePerturbations ?? false;

  // Evaluation function for state derivatives: [dr/dt, dv/dt]
  const computeDerivative = (r: Vector3, v: Vector3, t: number): { dr: Vector3; dv: Vector3 } => {
    const aGrav = calculateGravitationalAcceleration_mps2(r, t, enablePerturbations);
    const aTotal = aGrav.add(thrust);
    return { dr: v, dv: aTotal };
  };

  // k1 = f(r0, v0, t0)
  const k1 = computeDerivative(r0, v0, t0);

  // k2 = f(r0 + 0.5*dt*k1.dr, v0 + 0.5*dt*k1.dv, t0 + 0.5*dt)
  const r1 = r0.add(k1.dr.scale(0.5 * dt_s));
  const v1 = v0.add(k1.dv.scale(0.5 * dt_s));
  const k2 = computeDerivative(r1, v1, t0 + 0.5 * dt_s);

  // k3 = f(r0 + 0.5*dt*k2.dr, v0 + 0.5*dt*k2.dv, t0 + 0.5*dt)
  const r2 = r0.add(k2.dr.scale(0.5 * dt_s));
  const v2 = v0.add(k2.dv.scale(0.5 * dt_s));
  const k3 = computeDerivative(r2, v2, t0 + 0.5 * dt_s);

  // k4 = f(r0 + dt*k3.dr, v0 + dt*k3.dv, t0 + dt)
  const r3 = r0.add(k3.dr.scale(dt_s));
  const v3 = v0.add(k3.dv.scale(dt_s));
  const k4 = computeDerivative(r3, v3, t0 + dt_s);

  // Combine RK4 weighted increments: (k1 + 2*k2 + 2*k3 + k4) / 6
  const dr = k1.dr
    .add(k2.dr.scale(2.0))
    .add(k3.dr.scale(2.0))
    .add(k4.dr)
    .scale(dt_s / 6.0);

  const dv = k1.dv
    .add(k2.dv.scale(2.0))
    .add(k3.dv.scale(2.0))
    .add(k4.dv)
    .scale(dt_s / 6.0);

  const nextR = r0.add(dr);
  const nextV = v0.add(dv);
  const nextT = t0 + dt_s;
  const nextAcc = calculateGravitationalAcceleration_mps2(nextR, nextT, enablePerturbations).add(thrust);

  return {
    position_m: nextR,
    velocity_mps: nextV,
    acceleration_mps2: nextAcc,
    time_s: nextT,
  };
}
