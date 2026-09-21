/**
 * PULSAR-X: Rendering Domain Tests
 * Unit tests for quality configuration and tier definitions.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { QUALITY_TIERS, getQualitySettings, RenderQualityTier } from "../../src/rendering/config/quality";

describe("Rendering Quality Tiers", () => {
  it("defines all four standard tiers", () => {
    const tiers: RenderQualityTier[] = ["LOW", "MEDIUM", "HIGH", "CINEMATIC"];
    for (const tier of tiers) {
      assert.ok(QUALITY_TIERS[tier], `Tier ${tier} should exist`);
      assert.equal(QUALITY_TIERS[tier].tier, tier);
    }
  });

  it("strictly enforces device pixel ratio clamp <= 2.0 to prevent 4K thermal throttling", () => {
    for (const tier of Object.values(QUALITY_TIERS)) {
      assert.ok(tier.maxDpr <= 2.0, `Tier ${tier.tier} exceeds maxDpr clamp of 2.0: ${tier.maxDpr}`);
    }
  });

  it("scales starfield particle density monotonically across tiers", () => {
    assert.ok(QUALITY_TIERS.LOW.starCount < QUALITY_TIERS.MEDIUM.starCount);
    assert.ok(QUALITY_TIERS.MEDIUM.starCount < QUALITY_TIERS.HIGH.starCount);
    assert.ok(QUALITY_TIERS.HIGH.starCount <= QUALITY_TIERS.CINEMATIC.starCount);
    assert.equal(QUALITY_TIERS.HIGH.starCount, 25000);
  });

  it("safely falls back to HIGH tier if unrecognized tier is provided", () => {
    // @ts-expect-error Testing fallback with invalid string
    const fallbackSettings = getQualitySettings("ULTRA_EXTREME");
    assert.equal(fallbackSettings.tier, "HIGH");
    assert.equal(fallbackSettings.starCount, 25000);
  });
});
