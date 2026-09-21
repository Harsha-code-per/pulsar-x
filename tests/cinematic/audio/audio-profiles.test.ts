/**
 * PULSAR-X: Cinematic Domain Tests
 * Unit tests for AudioProfiles, gain bounding, and profile interpolation.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  SCENE_AUDIO_PROFILES,
  getSceneAudioProfile,
  getSceneAudioProfileByKey,
  lerpAudioProfiles,
} from "../../../src/cinematic/audio/AudioProfiles";

describe("Scene Audio Profiles & Gain Interpolation", () => {
  it("defines profiles for all 18 narrative scenes", () => {
    assert.equal(SCENE_AUDIO_PROFILES.length, 18);
    for (let id = 1; id <= 18; id++) {
      const profile = getSceneAudioProfile(id);
      assert.equal(profile.sceneId, id);
      assert.ok(profile.sceneKey.startsWith("SCENE_"));

      // Verify all gains are clamped within [0, 1]
      assert.ok(profile.ambienceGain >= 0 && profile.ambienceGain <= 1);
      assert.ok(profile.spacecraftGain >= 0 && profile.spacecraftGain <= 1);
      assert.ok(profile.pulsarGain >= 0 && profile.pulsarGain <= 1);
      assert.ok(profile.telemetryGain >= 0 && profile.telemetryGain <= 1);
      assert.ok(profile.alertGain >= 0 && profile.alertGain <= 1);
      assert.ok(profile.cinematicGain >= 0 && profile.cinematicGain <= 1);
    }
  });

  it("retrieves scene profiles by key correctly", () => {
    const s01 = getSceneAudioProfileByKey("SCENE_01_EARTH");
    assert.equal(s01.sceneId, 1);

    const s18 = getSceneAudioProfileByKey("SCENE_18_FINAL_REVEAL");
    assert.equal(s18.sceneId, 18);
  });

  it("smoothly interpolates between two scene audio profiles", () => {
    const s01 = getSceneAudioProfile(1);
    const s02 = getSceneAudioProfile(2);

    const mid = lerpAudioProfiles(s01, s02, 0.5);

    const expectedAmbience = (s01.ambienceGain + s02.ambienceGain) / 2;
    assert.ok(Math.abs(mid.ambienceGain - expectedAmbience) < 1e-6);

    const expectedSpacecraft = (s01.spacecraftGain + s02.spacecraftGain) / 2;
    assert.ok(Math.abs(mid.spacecraftGain - expectedSpacecraft) < 1e-6);
  });
});
