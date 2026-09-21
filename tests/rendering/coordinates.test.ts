/**
 * PULSAR-X: Rendering Domain Tests
 * Unit tests for coordinate transformation and scaling routines.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  HELIOCENTRIC_RENDER_SCALE,
  RENDER_TO_SCIENTIFIC_SCALE,
  CELESTIAL_HORIZON_RADIUS_UNITS,
  scientificToRenderPosition,
  renderToScientificPosition,
  scientificVelocityToRender,
  pulsarDirectionToHorizonPosition,
  scaleUncertaintyAxesToRender,
  computeVisualErrorVector,
} from "../../src/rendering/coordinates/scaling";
import { ASTRONOMICAL_UNIT_M } from "../../src/simulation/constants/astronomy";

describe("Rendering Coordinate Transforms & Scaling", () => {
  it("converts 1 AU on X-axis exactly to 100.0 render units", () => {
    const scientificPos = { x: ASTRONOMICAL_UNIT_M, y: 0, z: 0 };
    const renderPos = scientificToRenderPosition(scientificPos);

    assert.ok(Math.abs(renderPos[0] - 100.0) < 1e-12);
    assert.equal(renderPos[1], 0);
    assert.equal(renderPos[2], 0);
  });

  it("converts origin (0, 0, 0) to render origin (0, 0, 0)", () => {
    const renderPos = scientificToRenderPosition({ x: 0, y: 0, z: 0 });
    assert.deepEqual(renderPos, [0, 0, 0]);
  });

  it("preserves exact round-trip conversion between scientific and render spaces", () => {
    assert.ok(Math.abs(RENDER_TO_SCIENTIFIC_SCALE * HELIOCENTRIC_RENDER_SCALE - 1.0) < 1e-15);

    const originalPos = {
      x: 1.495978707e11 * 1.25, // 1.25 AU
      y: -2.345e10,
      z: 8.765e9,
    };

    const renderCoords = scientificToRenderPosition(originalPos);
    const roundTrip = renderToScientificPosition(renderCoords);

    assert.ok(Math.abs(roundTrip.x - originalPos.x) < 1e-4);
    assert.ok(Math.abs(roundTrip.y - originalPos.y) < 1e-4);
    assert.ok(Math.abs(roundTrip.z - originalPos.z) < 1e-4);
  });

  it("applies floating origin offset correctly", () => {
    const spacecraftPos = { x: 1.5e11, y: 2.0e11, z: 0 };
    const originOffset = { x: 1.5e11, y: 2.0e11, z: 0 };

    const localRender = scientificToRenderPosition(spacecraftPos, originOffset);
    assert.deepEqual(localRender, [0, 0, 0]);

    const offsetPos = { x: 1.5e11 + 1e8, y: 2.0e11, z: 0 };
    const offsetRender = scientificToRenderPosition(offsetPos, originOffset);
    assert.ok(offsetRender[0] > 0);
    assert.equal(offsetRender[1], 0);
    assert.equal(offsetRender[2], 0);
  });

  it("scales velocity proportionally by heliocentric render scale", () => {
    const velocity_mps = { x: 30000, y: 0, z: -5000 };
    const renderVel = scientificVelocityToRender(velocity_mps);

    assert.ok(Math.abs(renderVel[0] - 30000 * HELIOCENTRIC_RENDER_SCALE) < 1e-12);
    assert.equal(renderVel[1], 0);
    assert.ok(Math.abs(renderVel[2] - -5000 * HELIOCENTRIC_RENDER_SCALE) < 1e-12);
  });

  it("projects pulsar direction vectors onto the celestial horizon sphere of radius 250 units", () => {
    const dirVector = { x: 3, y: -4, z: 0 }; // norm = 5
    const horizonPos = pulsarDirectionToHorizonPosition(dirVector);

    const distance = Math.hypot(horizonPos[0], horizonPos[1], horizonPos[2]);
    assert.ok(Math.abs(distance - CELESTIAL_HORIZON_RADIUS_UNITS) < 1e-10);

    // Direction preserves ratio (3/5, -4/5, 0) * 250 = (150, -200, 0)
    assert.ok(Math.abs(horizonPos[0] - 150) < 1e-10);
    assert.ok(Math.abs(horizonPos[1] - -200) < 1e-10);
    assert.equal(horizonPos[2], 0);
  });

  it("scales covariance uncertainty axes with visual clamping", () => {
    // 100 meters uncertainty: without magnification would be ~6.68e-10 units
    const smallSigma = { x: 100, y: 50, z: 25 };
    const clampedScale = scaleUncertaintyAxesToRender(smallSigma, 1.0, 0.5);

    // All should be clamped to minVisualRadius = 0.5
    assert.equal(clampedScale[0], 0.5);
    assert.equal(clampedScale[1], 0.5);
    assert.equal(clampedScale[2], 0.5);

    // With 1e10 visual magnification:
    const magnifiedScale = scaleUncertaintyAxesToRender(smallSigma, 1e10, 0.5);
    assert.ok(magnifiedScale[0] > 0.5);
    // Relative proportionality preserved: x is 2x y, and y is 2x z
    assert.ok(Math.abs(magnifiedScale[0] / magnifiedScale[1] - 2.0) < 1e-4);
    assert.ok(Math.abs(magnifiedScale[1] / magnifiedScale[2] - 2.0) < 1e-4);
  });

  it("computes visual error vector with magnification factor", () => {
    const truePos = { x: 0, y: 0, z: 0 };
    const estPos = { x: 500, y: 0, z: 0 }; // 500m physical error

    const error1x = computeVisualErrorVector(truePos, estPos, 1.0);
    assert.equal(error1x.errorMagnitude_m, 500);

    const error1000x = computeVisualErrorVector(truePos, estPos, 1000.0);
    assert.equal(error1000x.errorMagnitude_m, 500); // physical magnitude uncorrupted

    const dx1x = error1x.endRender[0] - error1x.startRender[0];
    const dx1000x = error1000x.endRender[0] - error1000x.startRender[0];

    assert.ok(Math.abs(dx1000x / dx1x - 1000.0) < 1e-6);
  });
});
