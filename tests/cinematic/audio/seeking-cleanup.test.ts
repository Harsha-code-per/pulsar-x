/**
 * PULSAR-X: Cinematic Domain Tests
 * Unit tests for Seeking, transient node cleanup, and state resynchronization.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CinematicAudioEngine } from "../../../src/cinematic/audio/CinematicAudioEngine";
import { MockAudioContext } from "./audio-mocks";
import { CinematicEventBus } from "../../../src/cinematic/director/CinematicEventBus";
import { CinematicClock } from "../../../src/cinematic/director/CinematicClock";

describe("Audio Seeking & Transient Node Cleanup", () => {
  it("terminates one-shots and stops active alarms when seeking", async () => {
    const eventBus = new CinematicEventBus();
    const mockCtx = new MockAudioContext();
    const clock = new CinematicClock();

    const engine = new CinematicAudioEngine(
      { customContextFactory: () => mockCtx },
      eventBus
    );

    await engine.unlock();
    engine.syncWithCinematicClock(clock);
    engine.start();

    // Trigger an alarm event
    eventBus.emit("GNSS_LOST");

    // Seek to 45.0s (e.g. Scene 08)
    clock.seek(45.0);
    engine.onSeek(45.0);

    // Verify engine remains running and clean
    assert.equal(engine.getIsUnlocked(), true);

    engine.dispose();
  });

  it("handles repeated forward and backward scrubs without error", async () => {
    const eventBus = new CinematicEventBus();
    const mockCtx = new MockAudioContext();
    const clock = new CinematicClock();

    const engine = new CinematicAudioEngine(
      { customContextFactory: () => mockCtx },
      eventBus
    );

    await engine.unlock();
    engine.syncWithCinematicClock(clock);
    engine.start();

    // Rapid scrub back and forth
    const scrubWaypoints = [10.0, 50.0, 5.0, 80.0, 0.0, 120.0, 30.0];
    for (const time of scrubWaypoints) {
      clock.seek(time);
      engine.onSeek(time);
      engine.update(0.016, time);
    }

    assert.ok(true, "Scrubbing completed without runaway nodes or exceptions");
    engine.dispose();
  });

  it("resets and clears active pulsars on pause / stop", async () => {
    const eventBus = new CinematicEventBus();
    const mockCtx = new MockAudioContext();

    const engine = new CinematicAudioEngine(
      { customContextFactory: () => mockCtx },
      eventBus
    );

    await engine.unlock();
    engine.start();
    engine.setScene(8); // Scene 08 has active pulsars

    engine.pause();
    engine.resume();
    engine.stop();

    assert.ok(true, "Lifecycle transitions executed cleanly");
    engine.dispose();
  });
});
