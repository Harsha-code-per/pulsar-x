/**
 * PULSAR-X: 3D Rendering Domain
 * Explicit Coordinate Transformation & Scale Management.
 *
 * Strictly separates SI physical meters (scientific ground truth) from
 * Three.js single-precision floating-point render units.
 *
 * Scaling Strategy:
 * - Macro / Heliocentric Scale: 1 AU (1.495978707e11 m) = 100.0 render units.
 * - Local Spacecraft Floating Origin: Spacecraft is rendered at a local relative position.
 * - Celestial Sphere: Pulsars and celestial beacons placed at a fixed visual horizon (radius 250.0 units).
 */

import type { Vector3Like } from "../../types/simulation";
import { ASTRONOMICAL_UNIT_M } from "../../simulation/constants/astronomy";

/**
 * Heliocentric scale factor: converts scientific meters to Three.js macro render units.
 * 1 AU = 100.0 units.
 */
export const HELIOCENTRIC_RENDER_SCALE = 100.0 / ASTRONOMICAL_UNIT_M;

/**
 * Inverse scale factor: converts Three.js macro render units back to scientific meters.
 */
export const RENDER_TO_SCIENTIFIC_SCALE = ASTRONOMICAL_UNIT_M / 100.0;

/**
 * Visual radius of the celestial beacon horizon in render units.
 */
export const CELESTIAL_HORIZON_RADIUS_UNITS = 250.0;

/**
 * Converts a scientific 3D position vector in meters (BCRS / Heliocentric frame)
 * into Three.js macro rendering coordinates.
 *
 * @param scientificPos_m Position vector in meters
 * @param originOffset_m Optional floating origin in meters (for high-precision local frames)
 * @returns Three.js [x, y, z] render coordinate tuple
 */
export function scientificToRenderPosition(
  scientificPos_m: Vector3Like,
  originOffset_m: Vector3Like = { x: 0, y: 0, z: 0 }
): [number, number, number] {
  const dx = (scientificPos_m.x - originOffset_m.x) * HELIOCENTRIC_RENDER_SCALE;
  const dy = (scientificPos_m.y - originOffset_m.y) * HELIOCENTRIC_RENDER_SCALE;
  const dz = (scientificPos_m.z - originOffset_m.z) * HELIOCENTRIC_RENDER_SCALE;
  return [dx, dy, dz];
}

/**
 * Converts a Three.js macro rendering position back to physical scientific meters.
 *
 * @param renderPos Three.js [x, y, z] coordinate tuple
 * @param originOffset_m Optional floating origin in meters
 * @returns Physical position in meters
 */
export function renderToScientificPosition(
  renderPos: readonly [number, number, number],
  originOffset_m: Vector3Like = { x: 0, y: 0, z: 0 }
): Vector3Like {
  return {
    x: originOffset_m.x + renderPos[0] * RENDER_TO_SCIENTIFIC_SCALE,
    y: originOffset_m.y + renderPos[1] * RENDER_TO_SCIENTIFIC_SCALE,
    z: originOffset_m.z + renderPos[2] * RENDER_TO_SCIENTIFIC_SCALE,
  };
}

/**
 * Converts a physical velocity vector (m/s) to macro render velocity (units/s).
 */
export function scientificVelocityToRender(velocity_mps: Vector3Like): [number, number, number] {
  return [
    velocity_mps.x * HELIOCENTRIC_RENDER_SCALE,
    velocity_mps.y * HELIOCENTRIC_RENDER_SCALE,
    velocity_mps.z * HELIOCENTRIC_RENDER_SCALE,
  ];
}

/**
 * Computes the 3D position of a distant celestial beacon (pulsar) on the visual celestial sphere.
 * Direction is preserved from the unit vector; distance is fixed to CELESTIAL_HORIZON_RADIUS_UNITS.
 *
 * @param directionVector Normalized direction vector pointing from SSB outward
 * @returns Three.js [x, y, z] coordinate tuple on the celestial horizon
 */
export function pulsarDirectionToHorizonPosition(
  directionVector: Vector3Like
): [number, number, number] {
  const norm = Math.hypot(directionVector.x, directionVector.y, directionVector.z) || 1.0;
  return [
    (directionVector.x / norm) * CELESTIAL_HORIZON_RADIUS_UNITS,
    (directionVector.y / norm) * CELESTIAL_HORIZON_RADIUS_UNITS,
    (directionVector.z / norm) * CELESTIAL_HORIZON_RADIUS_UNITS,
  ];
}

/**
 * Scales covariance uncertainty semi-major axes (in meters) for 3D visualization.
 * In macro mode, actual meters would be sub-pixel; this applies an explicit visual multiplier
 * while guaranteeing physical proportionality between the three axes.
 *
 * @param sigma_m Semi-axes lengths in physical meters (a, b, c)
 * @param visualMultiplier Magnification factor (e.g. 1.0 = 1:1 macro, 1000.0 = 1000x)
 * @param minVisualRadius Minimum clamped visual radius in render units
 * @returns Three.js [scaleX, scaleY, scaleZ] tuple in render units
 */
export function scaleUncertaintyAxesToRender(
  sigma_m: Vector3Like,
  visualMultiplier = 1.0,
  minVisualRadius = 0.5
): [number, number, number] {
  const sx = Math.max(minVisualRadius, sigma_m.x * HELIOCENTRIC_RENDER_SCALE * visualMultiplier);
  const sy = Math.max(minVisualRadius, sigma_m.y * HELIOCENTRIC_RENDER_SCALE * visualMultiplier);
  const sz = Math.max(minVisualRadius, sigma_m.z * HELIOCENTRIC_RENDER_SCALE * visualMultiplier);
  return [sx, sy, sz];
}

/**
 * Computes an explicit visual error vector between true and estimated positions.
 * Supports visual magnification for small navigation residuals.
 */
export function computeVisualErrorVector(
  truePos_m: Vector3Like,
  estPos_m: Vector3Like,
  magnificationFactor = 1.0
): {
  readonly startRender: [number, number, number];
  readonly endRender: [number, number, number];
  readonly errorMagnitude_m: number;
} {
  const start = scientificToRenderPosition(truePos_m);
  const dx_m = (estPos_m.x - truePos_m.x) * magnificationFactor;
  const dy_m = (estPos_m.y - truePos_m.y) * magnificationFactor;
  const dz_m = (estPos_m.z - truePos_m.z) * magnificationFactor;

  const end: [number, number, number] = [
    start[0] + dx_m * HELIOCENTRIC_RENDER_SCALE,
    start[1] + dy_m * HELIOCENTRIC_RENDER_SCALE,
    start[2] + dz_m * HELIOCENTRIC_RENDER_SCALE,
  ];

  const errorMagnitude_m = Math.hypot(
    estPos_m.x - truePos_m.x,
    estPos_m.y - truePos_m.y,
    estPos_m.z - truePos_m.z
  );

  return {
    startRender: start,
    endRender: end,
    errorMagnitude_m,
  };
}
