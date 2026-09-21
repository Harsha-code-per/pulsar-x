/**
 * PULSAR-X: Cinematic Domain Tests
 * Unit tests for 18-Scene Storyboard, Catalog, and Timeline resolution.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CINEMATIC_SCENE_CATALOG, getSceneById, getSceneByKey } from "../../src/cinematic/scenes/catalog";
import { CinematicTimeline } from "../../src/cinematic/director/CinematicTimeline";

describe("18-Scene Storyboard & Catalog", () => {
  it("contains exactly 18 sequentially indexed scenes (1 to 18)", () => {
    assert.equal(CINEMATIC_SCENE_CATALOG.length, 18);
    for (let i = 0; i < 18; i++) {
      const scene = CINEMATIC_SCENE_CATALOG[i];
      assert.equal(scene.id, i + 1, `Scene at index ${i} must have id ${i + 1}`);
      assert.ok(scene.key.startsWith("SCENE_"), `Scene ${scene.id} key must start with SCENE_`);
      assert.ok(scene.name.length > 0, `Scene ${scene.id} must have a non-empty name`);
      assert.ok(scene.duration_s > 0, `Scene ${scene.id} duration must be positive`);
      assert.ok(scene.shots.length > 0, `Scene ${scene.id} must have at least one shot`);
      assert.ok(scene.hud.title.length > 0, `Scene ${scene.id} must have HUD title`);
      assert.ok(scene.hud.captions.length > 0, `Scene ${scene.id} must have at least one caption`);
    }
  });

  it("retrieves scenes by ID and key correctly", () => {
    const s1 = getSceneById(1);
    assert.ok(s1);
    assert.equal(s1.key, "SCENE_01_EARTH");

    const s18 = getSceneByKey("SCENE_18_FINAL_REVEAL");
    assert.ok(s18);
    assert.equal(s18.id, 18);

    assert.equal(getSceneById(99), undefined);
    assert.equal(getSceneByKey("NON_EXISTENT"), undefined);
  });

  it("computes cumulative timeline duration and resolves positions accurately", () => {
    const timeline = new CinematicTimeline(CINEMATIC_SCENE_CATALOG);
    const totalDuration = timeline.getTotalDuration();
    assert.ok(totalDuration > 100, `Total duration ${totalDuration}s should exceed 100 seconds`);

    // Position at t = 0 should be Scene 1
    const pos0 = timeline.resolvePosition(0.0);
    assert.equal(pos0.sceneIndex, 0);
    assert.equal(pos0.scene.id, 1);
    assert.equal(pos0.intraSceneTime_s, 0.0);
    assert.equal(pos0.progress, 0.0);

    // Position at total duration should be Scene 18
    const posEnd = timeline.resolvePosition(totalDuration);
    assert.equal(posEnd.sceneIndex, 17);
    assert.equal(posEnd.scene.id, 18);
    assert.equal(posEnd.progress, 1.0);

    // Position at midpoint should resolve to an intermediate scene
    const posMid = timeline.resolvePosition(totalDuration / 2);
    assert.ok(posMid.sceneIndex > 0 && posMid.sceneIndex < 17);
  });
});
