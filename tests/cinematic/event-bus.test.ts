/**
 * PULSAR-X: Cinematic Domain Tests
 * Unit tests for Cinematic Event Bus.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CinematicEventBus, type CinematicEvent } from "../../src/cinematic/director/CinematicEventBus";

describe("Cinematic Event Bus", () => {
  it("emits events to registered listeners", () => {
    const bus = new CinematicEventBus();
    const received: CinematicEvent[] = [];

    const unsub = bus.on("NAVIGATION_LOCKED", (evt) => {
      received.push(evt);
    });

    bus.emit("NAVIGATION_LOCKED", { error_m: 1400 });
    assert.equal(received.length, 1);
    assert.equal(received[0].type, "NAVIGATION_LOCKED");
    assert.deepEqual(received[0].payload, { error_m: 1400 });

    unsub();
    bus.emit("NAVIGATION_LOCKED", { error_m: 1200 });
    assert.equal(received.length, 1, "Listener should not fire after unsubscribe");
  });

  it("stores events in bounded history", () => {
    const bus = new CinematicEventBus();
    for (let i = 0; i < 120; i++) {
      bus.emit("OBSERVATION_AVAILABLE", { index: i });
    }

    const history = bus.getHistory();
    assert.equal(history.length, 100, "History should be bounded to 100 events");
    assert.equal((history[history.length - 1].payload as { index: number }).index, 119);
  });

  it("clears history and listeners cleanly", () => {
    const bus = new CinematicEventBus();
    let count = 0;
    bus.on("GNSS_LOST", () => count++);
    bus.emit("GNSS_LOST");
    assert.equal(count, 1);
    assert.equal(bus.getHistory().length, 1);

    bus.clear();
    assert.equal(bus.getHistory().length, 0);

    bus.emit("GNSS_LOST");
    assert.equal(count, 1, "Cleared listeners should not receive events");
  });
});
