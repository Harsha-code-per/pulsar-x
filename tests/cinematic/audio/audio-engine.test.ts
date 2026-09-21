/**
 * PULSAR-X: Cinematic Domain Tests
 * Unit tests for CinematicAudioEngine initialization, unlock, and lifecycle.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CinematicAudioEngine } from "../../../src/cinematic/audio/CinematicAudioEngine";
import { MockAudioContext } from "./audio-mocks";
import { CinematicEventBus } from "../../../src/cinematic/director/CinematicEventBus";
import { useAudioStore } from "../../../src/cinematic/audio/AudioState";

describe("CinematicAudioEngine Lifecycle & Controls", () => {
  it("initializes without throwing and remains locked until user gesture", () => {
    const eventBus = new CinematicEventBus();
    const engine = new CinematicAudioEngine(
      { customContextFactory: () => new MockAudioContext() },
      eventBus
    );

    assert.equal(engine.getIsUnlocked(), false);
    assert.equal(engine.getContext(), null);
    engine.dispose();
  });

  it("unlocks successfully on simulated user interaction", async () => {
    const eventBus = new CinematicEventBus();
    const mockCtx = new MockAudioContext();
    const engine = new CinematicAudioEngine(
      { customContextFactory: () => mockCtx },
      eventBus
    );

    const unlocked = await engine.unlock();
    assert.equal(unlocked, true);
    assert.equal(engine.getIsUnlocked(), true);
    assert.equal(mockCtx.state, "running");
    assert.equal(useAudioStore.getState().unlocked, true);

    engine.dispose();
  });

  it("supports start, pause, resume, and stop controls", async () => {
    const eventBus = new CinematicEventBus();
    const mockCtx = new MockAudioContext();
    const engine = new CinematicAudioEngine(
      { customContextFactory: () => mockCtx },
      eventBus
    );

    await engine.unlock();
    engine.start();
    engine.pause();
    engine.resume();
    engine.stop();

    assert.equal(engine.getIsUnlocked(), true);
    engine.dispose();
  });

  it("adjusts master volume and synchronizes with reactive store", async () => {
    const eventBus = new CinematicEventBus();
    const mockCtx = new MockAudioContext();
    const engine = new CinematicAudioEngine(
      { customContextFactory: () => mockCtx, initialVolume: 0.75 },
      eventBus
    );

    await engine.unlock();
    engine.setVolume(0.5);
    assert.equal(useAudioStore.getState().masterVolume, 0.5);
    assert.equal(engine.getMixer()?.getMasterVolume(), 0.5);

    // Clamps to [0, 1]
    engine.setVolume(1.5);
    assert.equal(engine.getMixer()?.getMasterVolume(), 1.0);

    engine.setVolume(-0.2);
    assert.equal(engine.getMixer()?.getMasterVolume(), 0.0);

    engine.dispose();
  });

  it("toggles mute cleanly without altering target volume", async () => {
    const eventBus = new CinematicEventBus();
    const mockCtx = new MockAudioContext();
    const engine = new CinematicAudioEngine(
      { customContextFactory: () => mockCtx, initialVolume: 0.8 },
      eventBus
    );

    await engine.unlock();
    assert.equal(engine.getMixer()?.getIsMuted(), false);

    engine.setMute(true);
    assert.equal(engine.getMixer()?.getIsMuted(), true);
    assert.equal(useAudioStore.getState().isMuted, true);
    assert.equal(engine.getMixer()?.getMasterVolume(), 0.8); // volume target preserved

    engine.toggleMute();
    assert.equal(engine.getMixer()?.getIsMuted(), false);
    assert.equal(useAudioStore.getState().isMuted, false);

    engine.dispose();
  });

  it("applies scene-specific audio profiles on scene selection", async () => {
    const eventBus = new CinematicEventBus();
    const mockCtx = new MockAudioContext();
    const engine = new CinematicAudioEngine(
      { customContextFactory: () => mockCtx },
      eventBus
    );

    await engine.unlock();

    // Scene 01 (Earth): high spacecraft, zero pulsar
    engine.setScene(1);
    const gainsS01 = engine.getMixer()?.getBusGains();
    assert.equal(gainsS01?.SPACECRAFT, 0.5);
    assert.equal(gainsS01?.PULSAR, 0.0);

    // Scene 08 (First Pulsar): pulsar gain elevated
    engine.setScene(8);
    const gainsS08 = engine.getMixer()?.getBusGains();
    assert.equal(gainsS08?.PULSAR, 0.75);

    // Scene 14 (Signal Failure / Solar): alert elevated, pulsar attenuated
    engine.setScene(14);
    const gainsS14 = engine.getMixer()?.getBusGains();
    assert.equal(gainsS14?.ALERT, 0.85);
    assert.equal(gainsS14?.PULSAR, 0.20);

    engine.dispose();
  });
});
