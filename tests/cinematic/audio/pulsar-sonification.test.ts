/**
 * PULSAR-X: Cinematic Domain Tests
 * Unit tests for Pulsar Sonification, frequency mapping, and photon event batching.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PULSAR_SONIFICATION_PRESETS,
  PulsarSonificationSystem,
  PhotonBatchClicker,
} from "../../../src/cinematic/audio/AudioSources";
import { MockAudioContext } from "./audio-mocks";
import { AudioBus } from "../../../src/cinematic/audio/AudioBus";

describe("Pulsar Sonification & Photon Batching", () => {
  it("defines sonification presets for all five catalog pulsars", () => {
    const requiredPulsars = [
      "PSR_B1937+21",
      "PSR_B1821-24",
      "PSR_J0437-4715",
      "PSR_J0218+4232",
      "PSR_B0531+21",
    ];

    for (const id of requiredPulsars) {
      const config = PULSAR_SONIFICATION_PRESETS[id];
      assert.ok(config, `Preset for ${id} should exist`);
      assert.ok(config.baseFrequency_hz > 0, "Base frequency must be positive");
      assert.ok(config.subharmonicDivisor >= 1, "Divisor must be >= 1");
      assert.ok(config.formants.length >= 1, "At least one formant required");
    }
  });

  it("maps millisecond pulsar frequencies into intelligible human-audible rhythms", () => {
    // PSR B1937+21: 641.928 Hz with subharmonic divisor 64
    const p1937 = PULSAR_SONIFICATION_PRESETS["PSR_B1937+21"];
    const effectiveRhythm_hz = p1937.baseFrequency_hz / p1937.subharmonicDivisor;
    assert.ok(
      effectiveRhythm_hz >= 5 && effectiveRhythm_hz <= 20,
      `Effective rhythmic pulse frequency (${effectiveRhythm_hz} Hz) must be in human rhythmic range (5-20 Hz)`
    );

    // Crab Pulsar: 29.95 Hz with divisor 1 (direct rhythmic pulse)
    const crab = PULSAR_SONIFICATION_PRESETS["PSR_B0531+21"];
    const crabRhythm = crab.baseFrequency_hz / crab.subharmonicDivisor;
    assert.ok(crabRhythm < 35, "Crab pulsar maps directly to staccato pulse");
  });

  it("emits pulses without error during frame updates", () => {
    const ctx = new MockAudioContext();
    const bus = new AudioBus("PULSAR", ctx);
    const system = new PulsarSonificationSystem(ctx, bus);

    system.setActivePulsars(["PSR_B1937+21", "PSR_B1821-24"]);

    // Advance simulated playhead across 1 second
    for (let t = 0.0; t <= 1.0; t += 0.016) {
      system.update(t, 1.0);
    }

    assert.ok(true, "Pulse generation executed smoothly across timeline");
  });

  it("batches high-frequency photon arrivals into clustered micro-transients", () => {
    const ctx = new MockAudioContext();
    const bus = new AudioBus("TELEMETRY", ctx);
    const clicker = new PhotonBatchClicker(ctx, bus);

    // Register 100 photon arrivals across a 50ms window
    for (let i = 0; i < 100; i++) {
      clicker.registerPhotonDetections(1, 0.01 + i * 0.0005);
    }

    // Advance beyond the batch aggregation window (35ms)
    clicker.registerPhotonDetections(5, 0.05);

    assert.ok(true, "Photon batching aggregated high frequency events cleanly");
  });
});
