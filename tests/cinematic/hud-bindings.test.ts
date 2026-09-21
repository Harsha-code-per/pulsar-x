/**
 * PULSAR-X: Cinematic Domain Tests
 * Unit tests for HUD telemetry bindings, numeric classification, and honest solver terminology.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CINEMATIC_SCENE_CATALOG } from "../../src/cinematic/scenes/catalog";
import type { NumericClassification } from "../../src/cinematic/scenes/types";
import type { WorkerTelemetryFrame } from "../../src/workers/telemetry";

describe("HUD Telemetry Bindings & Scientific Integrity", () => {
  const validClassifications: NumericClassification[] = [
    "REAL_INPUT",
    "SIMULATION_OUTPUT",
    "SCENARIO_TARGET",
    "DISPLAY_SCALE",
    "ARTISTIC_APPROXIMATION",
  ];

  const mockTelemetry: Partial<WorkerTelemetryFrame> = {
    simulationTime_s: 10.0,
    spacecraftPosition_m: { x: 1.496e11, y: 0, z: 0 },
    spacecraftVelocity_mps: { x: 0, y: 0, z: 29780 },
    positionError_m: 1420.0,
    velocityError_mps: 0.035,
    clockBias_s: -1.24e-8,
    gdop: 2.14,
    activePulsarMask: 15,
    photonCount: 1440,
    navigationStatus: "LOCKED",
    solverStatus: {
      converged: true,
      iterations: 3,
      rmsResidual_m: 42.5,
    },
  };

  it("verifies all telemetry badges across all 18 scenes declare valid classifications", () => {
    let badgeCount = 0;
    for (const scene of CINEMATIC_SCENE_CATALOG) {
      if (scene.hud.badges) {
        for (const badge of scene.hud.badges) {
          badgeCount++;
          assert.ok(
            validClassifications.includes(badge.classification),
            `Scene ${scene.id} badge "${badge.label}" has invalid classification: ${badge.classification}`
          );
        }
      }
    }
    assert.ok(badgeCount > 30, `Expected at least 30 telemetry badges across catalog, found ${badgeCount}`);
  });

  it("verifies badge getValue functions safely return non-empty strings with null and mock telemetry", () => {
    for (const scene of CINEMATIC_SCENE_CATALOG) {
      if (scene.hud.badges) {
        for (const badge of scene.hud.badges) {
          // Test with null
          const valNull = badge.getValue(null);
          assert.equal(typeof valNull, "string");
          assert.ok(valNull.length > 0, `Scene ${scene.id} badge "${badge.label}" returned empty string on null`);

          // Test with mock
          const valMock = badge.getValue(mockTelemetry as WorkerTelemetryFrame);
          assert.equal(typeof valMock, "string");
          assert.ok(valMock.length > 0, `Scene ${scene.id} badge "${badge.label}" returned empty string on mock`);
        }
      }
    }
  });

  it("strictly prohibits 'Kalman' or 'IEKF' in all captions, titles, alerts, and badge labels", () => {
    const forbidden = ["kalman", "iekf"];
    for (const scene of CINEMATIC_SCENE_CATALOG) {
      const textsToCheck: string[] = [
        scene.name,
        scene.description,
        scene.hud.title,
        scene.hud.subtitle,
        scene.hud.alert ?? "",
        ...scene.hud.captions,
        ...(scene.hud.badges ? scene.hud.badges.map((b) => `${b.label} ${b.getValue(null)}`) : []),
      ];

      for (const text of textsToCheck) {
        const lower = text.toLowerCase();
        for (const word of forbidden) {
          assert.ok(
            !lower.includes(word),
            `Scene ${scene.id} violates solver terminology by containing "${word}" in: "${text}"`
          );
        }
      }
    }
  });
});
