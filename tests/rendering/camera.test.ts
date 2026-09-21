/**
 * PULSAR-X: Rendering Domain Tests
 * Unit tests for CameraController abstraction, transitions, and user controls.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CameraController } from "../../src/rendering/cameras/CameraController";

describe("CameraController Abstraction", () => {
  it("initializes with default target and position", () => {
    const controller = new CameraController();
    const target = controller.getTarget();
    const pos = controller.getPosition();

    assert.equal(target.x, 0);
    assert.equal(target.y, 0);
    assert.equal(target.z, 0);
    assert.equal(pos.x, 0);
    assert.equal(pos.y, 50);
    assert.equal(pos.z, 140);
    assert.equal(controller.getFOV(), 45);
    assert.equal(controller.canUserControl(), true);
    assert.equal(controller.isTransitioning(), false);
  });

  it("sets target, position, FOV, and lookAt accurately", () => {
    const controller = new CameraController();

    controller.setTarget(10, 20, 30);
    assert.equal(controller.getTarget().x, 10);
    assert.equal(controller.getTarget().y, 20);
    assert.equal(controller.getTarget().z, 30);

    controller.setPosition(100, 150, 200);
    assert.equal(controller.getPosition().x, 100);
    assert.equal(controller.getPosition().y, 150);
    assert.equal(controller.getPosition().z, 200);

    controller.setFOV(65);
    assert.equal(controller.getFOV(), 65);

    // FOV clamping test
    controller.setFOV(5);
    assert.equal(controller.getFOV(), 10); // Min clamp
    controller.setFOV(150);
    assert.equal(controller.getFOV(), 120); // Max clamp

    controller.lookAt(5, 5, 5);
    assert.equal(controller.getTarget().x, 5);
    assert.equal(controller.getTarget().y, 5);
    assert.equal(controller.getTarget().z, 5);
  });

  it("toggles user control state", () => {
    const controller = new CameraController();
    assert.equal(controller.canUserControl(), true);

    controller.disableUserControl();
    assert.equal(controller.canUserControl(), false);

    controller.enableUserControl();
    assert.equal(controller.canUserControl(), true);
  });

  it("handles instant zero-duration transitions", () => {
    const controller = new CameraController();
    let completed = false;

    controller.transitionTo({
      position: [50, 60, 70],
      target: [1, 2, 3],
      fov: 60,
      duration_s: 0,
      onComplete: () => {
        completed = true;
      },
    });

    assert.equal(completed, true);
    assert.equal(controller.getPosition().x, 50);
    assert.equal(controller.getPosition().y, 60);
    assert.equal(controller.getPosition().z, 70);
    assert.equal(controller.getTarget().x, 1);
    assert.equal(controller.getTarget().y, 2);
    assert.equal(controller.getTarget().z, 3);
    assert.equal(controller.getFOV(), 60);
    assert.equal(controller.isTransitioning(), false);
  });

  it("smoothly interpolates over duration and fires completion callback", () => {
    const controller = new CameraController();
    let completed = false;

    controller.setPosition(0, 0, 0);
    controller.setTarget(0, 0, 0);

    controller.transitionTo({
      position: [100, 100, 100],
      target: [10, 10, 10],
      duration_s: 2.0,
      onComplete: () => {
        completed = true;
      },
    });

    assert.equal(controller.isTransitioning(), true);
    assert.equal(controller.canUserControl(), false);

    // Advance 1 second (halfway)
    controller.update(1.0);
    assert.equal(controller.isTransitioning(), true);
    assert.equal(completed, false);
    assert.ok(controller.getPosition().x > 0);
    assert.ok(controller.getPosition().x < 100);

    // Advance remaining 1.1 seconds (complete)
    controller.update(1.1);
    assert.equal(controller.isTransitioning(), false);
    assert.equal(controller.canUserControl(), true);
    assert.equal(completed, true);
    assert.equal(controller.getPosition().x, 100);
    assert.equal(controller.getTarget().x, 10);
  });
});
