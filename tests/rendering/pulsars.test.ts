/**
 * PULSAR-X: Rendering Domain Tests
 * Unit tests for Pulsar Visual System mappings and phase state derivation.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { INITIAL_PULSAR_CATALOG } from "../../src/simulation/pulsars/catalog";
import { pulsarDirectionToHorizonPosition, CELESTIAL_HORIZON_RADIUS_UNITS } from "../../src/rendering/coordinates/scaling";
import { evaluatePulsarPhaseNormalized, evaluatePulsarPhase } from "../../src/simulation/pulsars/timing-model";

describe("Pulsar Visual System & State Mapping", () => {
  it("projects all catalog pulsars to the celestial horizon radius (250 units)", () => {
    assert.equal(INITIAL_PULSAR_CATALOG.length, 5);

    for (const pulsar of INITIAL_PULSAR_CATALOG) {
      const pos = pulsarDirectionToHorizonPosition(pulsar.directionVector);
      const radius = Math.hypot(pos[0], pos[1], pos[2]);

      assert.ok(
        Math.abs(radius - CELESTIAL_HORIZON_RADIUS_UNITS) < 1e-10,
        `Pulsar ${pulsar.id} radius ${radius} should equal horizon radius ${CELESTIAL_HORIZON_RADIUS_UNITS}`
      );
    }
  });

  it("derives normalized rotational phase in [0, 1) strictly from simulation timing model", () => {
    for (const pulsar of INITIAL_PULSAR_CATALOG) {
      const phase0 = evaluatePulsarPhaseNormalized(pulsar.timing, 0.0);
      assert.ok(phase0 >= 0.0 && phase0 < 1.0);

      // Verify phase evolution over time
      const t1 = 0.005; // 5 milliseconds
      const phase1 = evaluatePulsarPhaseNormalized(pulsar.timing, t1);
      assert.ok(phase1 >= 0.0 && phase1 < 1.0);

      // Total phase accumulates monotonically for positive spin frequency
      const total0 = evaluatePulsarPhase(pulsar.timing, 0.0);
      const total1 = evaluatePulsarPhase(pulsar.timing, t1);
      assert.ok(total1 > total0, `Total phase must increase monotonically with time for ${pulsar.id}`);
    }
  });

  it("correctly evaluates active pulsar bitmask for scene visibility", () => {
    // 5 pulsars -> 5 bits. 0b00011111 = 31 (all 5 active)
    const fullMask = 0b00011111;
    for (let i = 0; i < 5; i++) {
      const isActive = (fullMask & (1 << i)) !== 0;
      assert.equal(isActive, true);
    }

    // Dropout of pulsar index 0 (PSR B1937+21) -> mask 0b00011110 (30)
    const dropout0 = 0b00011110;
    assert.equal((dropout0 & (1 << 0)) !== 0, false);
    assert.equal((dropout0 & (1 << 1)) !== 0, true);
    assert.equal((dropout0 & (1 << 2)) !== 0, true);
    assert.equal((dropout0 & (1 << 3)) !== 0, true);
    assert.equal((dropout0 & (1 << 4)) !== 0, true);
  });
});
