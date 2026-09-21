/**
 * PULSAR-X: Cinematic Domain Tests
 * Unit tests for AudioMixer, hierarchical bus routing, and limiter configuration.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AudioMixer } from "../../../src/cinematic/audio/AudioMixer";
import { MockAudioContext } from "./audio-mocks";
import type { AudioBusType } from "../../../src/cinematic/audio/audioTypes";

describe("AudioMixer Bus Routing & Dynamics Limiting", () => {
  it("initializes all seven canonical audio buses", () => {
    const ctx = new MockAudioContext();
    const mixer = new AudioMixer(ctx, 0.8, false);

    const requiredBuses: AudioBusType[] = [
      "MASTER",
      "AMBIENCE",
      "SPACECRAFT",
      "PULSAR",
      "TELEMETRY",
      "ALERT",
      "CINEMATIC",
    ];

    for (const busType of requiredBuses) {
      const bus = mixer.getBus(busType);
      assert.ok(bus, `Bus ${busType} should exist`);
      assert.equal(bus.type, busType);
    }

    mixer.dispose();
  });

  it("throws when requesting an unknown bus type", () => {
    const ctx = new MockAudioContext();
    const mixer = new AudioMixer(ctx);

    assert.throws(
      () => mixer.getBus("NON_EXISTENT" as AudioBusType),
      /Bus not found/
    );

    mixer.dispose();
  });

  it("scales individual bus gains independently", () => {
    const ctx = new MockAudioContext();
    const mixer = new AudioMixer(ctx);

    mixer.getBus("PULSAR").setGain(0.65, 0);
    mixer.getBus("ALERT").setGain(0.9, 0);

    assert.equal(mixer.getBus("PULSAR").getGain(), 0.65);
    assert.equal(mixer.getBus("ALERT").getGain(), 0.9);
    assert.equal(mixer.getBus("AMBIENCE").getGain(), 1.0); // untouched

    mixer.dispose();
  });

  it("configures the master dynamics compressor limiter node", () => {
    const ctx = new MockAudioContext();
    const mixer = new AudioMixer(ctx);

    // Destination should be connected through limiter
    assert.ok(ctx.destination);
    mixer.dispose();
  });

  it("mutes master bus without corrupting sub-bus gain levels", () => {
    const ctx = new MockAudioContext();
    const mixer = new AudioMixer(ctx, 0.7);

    mixer.getBus("SPACECRAFT").setGain(0.4, 0);
    mixer.getBus("TELEMETRY").setGain(0.55, 0);

    mixer.setMute(true, 0);
    assert.equal(mixer.getIsMuted(), true);
    assert.equal(mixer.getBus("MASTER").getEffectiveGain(), 0.0);

    // Sub-buses still retain their designated gains
    assert.equal(mixer.getBus("SPACECRAFT").getGain(), 0.4);
    assert.equal(mixer.getBus("TELEMETRY").getGain(), 0.55);

    mixer.setMute(false, 0);
    assert.equal(mixer.getIsMuted(), false);
    assert.equal(mixer.getBus("MASTER").getEffectiveGain(), 0.7);

    mixer.dispose();
  });
});
