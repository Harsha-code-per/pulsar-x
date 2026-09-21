/**
 * PULSAR-X: Rendering Domain Tests
 * Unit tests for Trajectory styling and quality tier parameters.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { QUALITY_TIERS, RenderQualityTier } from "../../src/rendering/config/quality";

describe("Trajectory & VFX Quality Tier Parameters", () => {
  it("allocates trajectory history lengths monotonically across quality tiers", () => {
    assert.equal(QUALITY_TIERS.LOW.trajectoryHistoryLength, 150);
    assert.equal(QUALITY_TIERS.MEDIUM.trajectoryHistoryLength, 300);
    assert.equal(QUALITY_TIERS.HIGH.trajectoryHistoryLength, 600);
    assert.equal(QUALITY_TIERS.CINEMATIC.trajectoryHistoryLength, 1000);

    const tiers: RenderQualityTier[] = ["LOW", "MEDIUM", "HIGH", "CINEMATIC"];
    for (let i = 0; i < tiers.length - 1; i++) {
      const current = QUALITY_TIERS[tiers[i]].trajectoryHistoryLength;
      const next = QUALITY_TIERS[tiers[i + 1]].trajectoryHistoryLength;
      assert.ok(
        current < next,
        `Expected tier ${tiers[i]} (${current}) to have smaller history length than ${tiers[i + 1]} (${next})`
      );
    }
  });

  it("scales signal particles per beam and shader complexity across tiers", () => {
    assert.equal(QUALITY_TIERS.LOW.signalParticlesPerBeam, 1);
    assert.equal(QUALITY_TIERS.MEDIUM.signalParticlesPerBeam, 2);
    assert.equal(QUALITY_TIERS.HIGH.signalParticlesPerBeam, 3);
    assert.equal(QUALITY_TIERS.CINEMATIC.signalParticlesPerBeam, 4);

    assert.equal(QUALITY_TIERS.LOW.shaderComplexity, "LOW");
    assert.equal(QUALITY_TIERS.MEDIUM.shaderComplexity, "BALANCED");
    assert.equal(QUALITY_TIERS.HIGH.shaderComplexity, "FULL");
    assert.equal(QUALITY_TIERS.CINEMATIC.shaderComplexity, "FULL");
  });
});
