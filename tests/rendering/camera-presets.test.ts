/**
 * PULSAR-X: Rendering Domain Tests
 * Unit tests for Cinematic Camera Presets.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CINEMATIC_CAMERA_PRESETS,
  CinematicPresetId,
  CameraContext,
} from "../../src/rendering/cameras/presets";

describe("Cinematic Camera Presets", () => {
  const dummyContext: CameraContext = {
    spacecraftPosRender: [100, 5, -20],
    estimatedPosRender: [100.1, 5.05, -19.95],
    velocityRender: [0.05, 0.0, 0.02],
    earthPosRender: [92, 0, -18],
    activePulsarId: "PSR_B1937+21",
  };

  const presetIds: CinematicPresetId[] = [
    "EARTH_ORBIT",
    "EARTH_DEPARTURE",
    "SPACECRAFT_HERO",
    "PULSAR_REVEAL",
    "NETWORK_OVERVIEW",
    "UNCERTAINTY_CLOSE",
    "SOLAR_INTERFERENCE",
    "DESTINATION_APPROACH",
  ];

  it("defines all eight required cinematic camera presets", () => {
    for (const id of presetIds) {
      const preset = CINEMATIC_CAMERA_PRESETS[id];
      assert.ok(preset, `Preset ${id} must exist`);
      assert.equal(preset.id, id);
      assert.ok(preset.name.length > 0, "Preset must have a name");
      assert.ok(preset.description.length > 0, "Preset must have a description");
      assert.ok(preset.fov >= 15 && preset.fov <= 90, `FOV ${preset.fov} should be reasonable`);
      assert.ok(preset.near > 0, "Near plane must be positive");
      assert.ok(preset.far > preset.near, "Far plane must exceed near plane");
      assert.ok(preset.transitionDuration_s > 0, "Transition duration must be positive");
    }
  });

  it("resolves valid, finite positions and targets for all presets", () => {
    for (const id of presetIds) {
      const preset = CINEMATIC_CAMERA_PRESETS[id];
      const { position, target } = preset.resolve(dummyContext);

      assert.equal(position.length, 3, "Position must have 3 coordinates");
      assert.equal(target.length, 3, "Target must have 3 coordinates");

      for (let i = 0; i < 3; i++) {
        assert.ok(Number.isFinite(position[i]), `Position[${i}] in ${id} must be finite: ${position[i]}`);
        assert.ok(Number.isFinite(target[i]), `Target[${i}] in ${id} must be finite: ${target[i]}`);
      }

      // Camera position should not be coincident with target
      const dist = Math.hypot(
        position[0] - target[0],
        position[1] - target[1],
        position[2] - target[2]
      );
      assert.ok(dist > 0.1, `Camera position and target must not be coincident in ${id}`);
    }
  });

  it("correctly orients EARTH_DEPARTURE behind spacecraft along velocity vector", () => {
    const departure = CINEMATIC_CAMERA_PRESETS.EARTH_DEPARTURE;
    const { position, target } = departure.resolve(dummyContext);

    // Context velocity is positive X and positive Z
    // Camera position should be behind (lower X, lower Z) relative to spacecraft
    const sc = dummyContext.spacecraftPosRender;
    assert.ok(position[0] < sc[0], "Departure camera X should be behind spacecraft");
    assert.ok(position[2] < sc[2], "Departure camera Z should be behind spacecraft");
    assert.ok(target[0] > sc[0], "Departure target X should be ahead of spacecraft");
  });
});
