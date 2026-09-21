/**
 * PULSAR-X: Scientific Reference Core
 * Gravitational Acceleration and Planetary Perturbation Models.
 */

import { Vector3 } from "../math/vector3";
import {
  MU_SUN_M3PS2,
  MU_EARTH_M3PS2,
  MU_JUPITER_M3PS2,
  ASTRONOMICAL_UNIT_M,
  SECONDS_PER_JULIAN_YEAR,
} from "../constants/astronomy";

/**
 * Analytical circular approximation of Earth's position from the SSB at coordinate time t:
 * r_earth(t) = a_earth * [cos(omega*t), sin(omega*t), 0]
 */
export function getAnalyticalEarthPosition_m(time_s: number): Vector3 {
  const omega = (2.0 * Math.PI) / SECONDS_PER_JULIAN_YEAR;
  const angle = omega * time_s;
  return new Vector3(
    ASTRONOMICAL_UNIT_M * Math.cos(angle),
    ASTRONOMICAL_UNIT_M * Math.sin(angle),
    0.0
  );
}

/**
 * Analytical circular approximation of Jupiter's position from the SSB at coordinate time t:
 * r_jupiter(t) = a_jupiter * [cos(omega*t), sin(omega*t), 0]
 */
export function getAnalyticalJupiterPosition_m(time_s: number): Vector3 {
  const a_jupiter_m = 5.2044 * ASTRONOMICAL_UNIT_M;
  const period_jupiter_s = 11.862 * SECONDS_PER_JULIAN_YEAR;
  const omega = (2.0 * Math.PI) / period_jupiter_s;
  const angle = omega * time_s + 1.2; // Initial phase offset
  return new Vector3(
    a_jupiter_m * Math.cos(angle),
    a_jupiter_m * Math.sin(angle),
    0.0
  );
}

/**
 * Calculates total gravitational acceleration at spacecraft position r_sc_m at coordinate time t.
 * Central Sun gravity + optional analytical third-body perturbations.
 */
export function calculateGravitationalAcceleration_mps2(
  r_sc_m: Vector3,
  time_s: number,
  enablePerturbations = false
): Vector3 {
  const rSunNorm = r_sc_m.norm();
  if (rSunNorm === 0) {
    throw new Error("Singular position at solar origin");
  }

  // Central solar gravitational acceleration: a = - (mu_sun / r^3) * r
  const sunFactor = -MU_SUN_M3PS2 / (rSunNorm * rSunNorm * rSunNorm);
  let totalAcc = r_sc_m.scale(sunFactor);

  if (enablePerturbations) {
    // Earth gravitational perturbation (indirect + direct)
    const rEarth = getAnalyticalEarthPosition_m(time_s);
    const rRelEarth = rEarth.sub(r_sc_m);
    const dEarth = rRelEarth.norm();
    const dEarthSun = rEarth.norm();
    if (dEarth > 1000.0) {
      const directEarth = rRelEarth.scale(MU_EARTH_M3PS2 / (dEarth * dEarth * dEarth));
      const indirectEarth = rEarth.scale(-MU_EARTH_M3PS2 / (dEarthSun * dEarthSun * dEarthSun));
      totalAcc = totalAcc.add(directEarth).add(indirectEarth);
    }

    // Jupiter gravitational perturbation (indirect + direct)
    const rJup = getAnalyticalJupiterPosition_m(time_s);
    const rRelJup = rJup.sub(r_sc_m);
    const dJup = rRelJup.norm();
    const dJupSun = rJup.norm();
    if (dJup > 1000.0) {
      const directJup = rRelJup.scale(MU_JUPITER_M3PS2 / (dJup * dJup * dJup));
      const indirectJup = rJup.scale(-MU_JUPITER_M3PS2 / (dJupSun * dJupSun * dJupSun));
      totalAcc = totalAcc.add(directJup).add(indirectJup);
    }
  }

  return totalAcc;
}
