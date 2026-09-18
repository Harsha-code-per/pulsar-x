/**
 * PULSAR-X: Scientific Reference Core
 * Canonical Rømer Light-Travel Delay Calculation.
 * Implements the authoritative PULSAR-X sign convention.
 */

import type { Vector3Like } from "../../types/simulation";
import { SPEED_OF_LIGHT_MPS } from "../constants/astronomy";
import { assertFinite } from "../math/finite";

/**
 * Calculates the geometric Rømer delay in seconds [s].
 * 
 * SIGN CONVENTION:
 * - n_hat points from the Solar System Barycenter outward toward the pulsar.
 * - r_sc points from the Solar System Barycenter toward the spacecraft.
 * 
 * Equation:
 *   dt_Roemer = (n_hat · r_sc) / c
 * 
 * Physical Interpretation:
 * - When (n_hat · r_sc) > 0, the spacecraft is displaced toward the pulsar relative to the SSB.
 * - The incoming planar wavefront reaches the spacecraft BEFORE it reaches the SSB origin.
 * - Relationship: t_sc_true = t_ssb - dt_Roemer, or t_ssb = t_sc_true + dt_Roemer.
 */
export function calculateRoemerDelay_s(n_hat: Vector3Like, r_sc_m: Vector3Like): number {
  const dotProduct = n_hat.x * r_sc_m.x + n_hat.y * r_sc_m.y + n_hat.z * r_sc_m.z;
  assertFinite(dotProduct, "n_hat · r_sc");
  return dotProduct / SPEED_OF_LIGHT_MPS;
}

/**
 * Converts true spacecraft arrival time to coordinate arrival time at the Solar System Barycenter:
 * t_ssb = t_sc_true + dt_Roemer
 */
export function spacecraftTimeToBarycentricTime_s(
  t_sc_true_s: number,
  n_hat: Vector3Like,
  r_sc_m: Vector3Like
): number {
  assertFinite(t_sc_true_s, "t_sc_true_s");
  const dt_R = calculateRoemerDelay_s(n_hat, r_sc_m);
  return t_sc_true_s + dt_R;
}

/**
 * Converts barycentric coordinate arrival time to true arrival time at the spacecraft:
 * t_sc_true = t_ssb - dt_Roemer
 */
export function barycentricTimeToSpacecraftTime_s(
  t_ssb_s: number,
  n_hat: Vector3Like,
  r_sc_m: Vector3Like
): number {
  assertFinite(t_ssb_s, "t_ssb_s");
  const dt_R = calculateRoemerDelay_s(n_hat, r_sc_m);
  return t_ssb_s - dt_R;
}
