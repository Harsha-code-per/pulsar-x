/**
 * PULSAR-X: Scientific Reference Core
 * Authoritative physical and astronomical constants (CODATA / IAU / IERS conventions).
 * All constants are strictly expressed in SI units.
 */

/** Speed of light in vacuum in meters per second [m/s] (Exact definition) */
export const SPEED_OF_LIGHT_MPS = 299_792_458;

/** Astronomical Unit in meters [m] (IAU 2012 exact definition) */
export const ASTRONOMICAL_UNIT_M = 149_597_870_700;

/** Heliocentric gravitational parameter (G * M_sun) in [m^3 / s^2] */
export const MU_SUN_M3PS2 = 1.32712440018e20;

/** Geocentric gravitational parameter (G * M_earth) in [m^3 / s^2] */
export const MU_EARTH_M3PS2 = 3.986004418e14;

/** Jovian gravitational parameter (G * M_jupiter) in [m^3 / s^2] */
export const MU_JUPITER_M3PS2 = 1.26686534e17;

/** Nominal solar equatorial radius in meters [m] */
export const SOLAR_RADIUS_M = 6.9634e8;

/** Earth mean radius in meters [m] */
export const EARTH_RADIUS_M = 6.371e6;

/** Jupiter mean equatorial radius in meters [m] */
export const JUPITER_RADIUS_M = 7.1492e7;

/** Seconds in a standard Julian day [s] */
export const SECONDS_PER_DAY = 86_400;

/** Seconds in a standard Julian year [s] (365.25 days) */
export const SECONDS_PER_JULIAN_YEAR = 31_557_600;

/** Standard acceleration due to gravity on Earth surface [m/s^2] */
export const STANDARD_GRAVITY_MPS2 = 9.80665;
