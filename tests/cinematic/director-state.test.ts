/**
 * PULSAR-X: Cinematic Domain Tests
 * Unit tests for Director State Machine, transitions, and error handling.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DirectorStateMachine,
  DirectorStateError,
  VALID_DIRECTOR_TRANSITIONS,
  type DirectorState,
} from "../../src/cinematic/director/DirectorState";

describe("Director State Machine", () => {
  it("initializes in IDLE state by default", () => {
    const sm = new DirectorStateMachine();
    assert.equal(sm.getState(), "IDLE");
  });

  it("follows the complete happy path: IDLE -> LOADING -> READY -> PLAYING -> COMPLETED", () => {
    const sm = new DirectorStateMachine();
    const transitions: DirectorState[] = [];
    sm.subscribe((state) => transitions.push(state));

    sm.transitionTo("LOADING");
    assert.equal(sm.getState(), "LOADING");

    sm.transitionTo("READY");
    assert.equal(sm.getState(), "READY");

    sm.transitionTo("PLAYING");
    assert.equal(sm.getState(), "PLAYING");

    sm.transitionTo("COMPLETED");
    assert.equal(sm.getState(), "COMPLETED");

    assert.deepEqual(transitions, ["LOADING", "READY", "PLAYING", "COMPLETED"]);
  });

  it("supports PLAYING <-> PAUSED toggling", () => {
    const sm = new DirectorStateMachine("READY");
    sm.transitionTo("PLAYING");
    assert.equal(sm.getState(), "PLAYING");

    sm.transitionTo("PAUSED");
    assert.equal(sm.getState(), "PAUSED");

    sm.transitionTo("PLAYING");
    assert.equal(sm.getState(), "PLAYING");
  });

  it("supports SEEKING from PLAYING and PAUSED", () => {
    const sm1 = new DirectorStateMachine("PLAYING");
    sm1.transitionTo("SEEKING");
    assert.equal(sm1.getState(), "SEEKING");
    sm1.transitionTo("PLAYING");
    assert.equal(sm1.getState(), "PLAYING");

    const sm2 = new DirectorStateMachine("PAUSED");
    sm2.transitionTo("SEEKING");
    assert.equal(sm2.getState(), "SEEKING");
    sm2.transitionTo("PAUSED");
    assert.equal(sm2.getState(), "PAUSED");
  });

  it("throws DirectorStateError on invalid state transitions", () => {
    const sm = new DirectorStateMachine("IDLE");

    assert.throws(
      () => sm.transitionTo("PLAYING"),
      (err: unknown) => {
        assert.ok(err instanceof DirectorStateError);
        assert.equal(err.fromState, "IDLE");
        assert.equal(err.toState, "PLAYING");
        return true;
      }
    );

    assert.throws(
      () => sm.transitionTo("PAUSED"),
      (err: unknown) => {
        assert.ok(err instanceof DirectorStateError);
        assert.equal(err.fromState, "IDLE");
        assert.equal(err.toState, "PAUSED");
        return true;
      }
    );
  });

  it("allows transitions to ERROR from any operational state", () => {
    const states: DirectorState[] = ["IDLE", "LOADING", "READY", "PLAYING", "PAUSED", "SEEKING", "COMPLETED"];
    for (const st of states) {
      assert.ok(
        VALID_DIRECTOR_TRANSITIONS[st].includes("ERROR"),
        `State ${st} must allow transition to ERROR`
      );
    }
  });

  it("resets cleanly to IDLE", () => {
    const sm = new DirectorStateMachine("PLAYING");
    sm.reset();
    assert.equal(sm.getState(), "IDLE");
  });
});
