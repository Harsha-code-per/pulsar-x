/**
 * PULSAR-X: Scientific Reference Core
 * Astronomical Millisecond Pulsar (MSP) Navigation Catalog.
 * Based on published ATNF Pulsar Database and NASA NICER/SEXTANT mission datasets.
 */

import type { Pulsar } from "../../types/pulsar";
import { Vector3 } from "../math/vector3";
import { degToRad } from "../units/conversions";

/**
 * Computes unit line-of-sight direction vector n_hat from Right Ascension and Declination:
 * n_hat = [cos(dec)*cos(ra), cos(dec)*sin(ra), sin(dec)]
 */
export function computeDirectionVector(ra_rad: number, dec_rad: number): Vector3 {
  const cosDec = Math.cos(dec_rad);
  return new Vector3(
    cosDec * Math.cos(ra_rad),
    cosDec * Math.sin(ra_rad),
    Math.sin(dec_rad)
  );
}

/**
 * Initial astronomical pulsar catalog for deep-space XNAV navigation.
 */
export const INITIAL_PULSAR_CATALOG: readonly Pulsar[] = [
  {
    id: "PSR_B1937+21",
    name: "PSR B1937+21",
    ra_rad: degToRad(294.910667),
    dec_rad: degToRad(21.583083),
    directionVector: computeDirectionVector(degToRad(294.910667), degToRad(21.583083)),
    distance_m: 10400 * 9.4607e15, // ~10,400 light-years
    timing: {
      epoch_s: 0.0,
      referencePhase_cycles: 0.0,
      f0_hz: 641.92824833, // P ~ 1.5578 ms
      f1_hzps: -4.331e-14,
      f2_hzps2: 0.0,
    },
    flux_phcm2s: 0.0012,
    pulseWidth_cycles: 0.04,
    state: "ACTIVE",
  },
  {
    id: "PSR_B1821-24",
    name: "PSR B1821-24",
    ra_rad: degToRad(276.133333),
    dec_rad: degToRad(-24.869722),
    directionVector: computeDirectionVector(degToRad(276.133333), degToRad(-24.869722)),
    distance_m: 17900 * 9.4607e15, // in globular cluster M28
    timing: {
      epoch_s: 0.0,
      referencePhase_cycles: 0.0,
      f0_hz: 327.405596, // P ~ 3.0543 ms
      f1_hzps: -1.615e-13,
      f2_hzps2: 0.0,
    },
    flux_phcm2s: 0.0008,
    pulseWidth_cycles: 0.05,
    state: "ACTIVE",
  },
  {
    id: "PSR_J0437-4715",
    name: "PSR J0437-4715",
    ra_rad: degToRad(69.31625),
    dec_rad: degToRad(-47.2525),
    directionVector: computeDirectionVector(degToRad(69.31625), degToRad(-47.2525)),
    distance_m: 510 * 9.4607e15, // ~510 light-years (closest known MSP)
    timing: {
      epoch_s: 0.0,
      referencePhase_cycles: 0.0,
      f0_hz: 173.687946, // P ~ 5.7574 ms
      f1_hzps: -1.728e-15,
      f2_hzps2: 0.0,
    },
    flux_phcm2s: 0.0021,
    pulseWidth_cycles: 0.06,
    state: "ACTIVE",
  },
  {
    id: "PSR_J0218+4232",
    name: "PSR J0218+4232",
    ra_rad: degToRad(34.724167),
    dec_rad: degToRad(42.536389),
    directionVector: computeDirectionVector(degToRad(34.724167), degToRad(42.536389)),
    distance_m: 10100 * 9.4607e15,
    timing: {
      epoch_s: 0.0,
      referencePhase_cycles: 0.0,
      f0_hz: 430.461066, // P ~ 2.32309 ms
      f1_hzps: -1.434e-14,
      f2_hzps2: 0.0,
    },
    flux_phcm2s: 0.0006,
    pulseWidth_cycles: 0.08,
    state: "ACTIVE",
  },
  {
    id: "PSR_B0531+21",
    name: "Crab Pulsar",
    ra_rad: degToRad(83.633083),
    dec_rad: degToRad(22.0145),
    directionVector: computeDirectionVector(degToRad(83.633083), degToRad(22.0145)),
    distance_m: 6500 * 9.4607e15,
    timing: {
      epoch_s: 0.0,
      referencePhase_cycles: 0.0,
      f0_hz: 29.946923, // P ~ 33.392 ms
      f1_hzps: -3.77535e-10, // Rapid spin-down
      f2_hzps2: 1.1147e-20,
    },
    flux_phcm2s: 1.54, // Very bright in X-rays
    pulseWidth_cycles: 0.12,
    state: "ACTIVE",
  },
];
