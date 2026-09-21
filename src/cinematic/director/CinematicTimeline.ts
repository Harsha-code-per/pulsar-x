/**
 * PULSAR-X: Cinematic Domain
 * Cinematic Timeline: Scene sequencing, shot resolution, and playhead calculations.
 */

import type { SceneDefinition } from "../scenes/types";
import type { ShotDefinition } from "../shots/types";

export interface TimelinePosition {
  readonly sceneIndex: number;
  readonly scene: SceneDefinition;
  readonly intraSceneTime_s: number;
  readonly shotIndex: number;
  readonly shot: ShotDefinition | null;
  readonly progress: number; // 0.0 to 1.0 across total timeline
}

export class CinematicTimeline {
  private scenes: readonly SceneDefinition[];
  private sceneStartTimes_s: number[] = [];
  private totalDuration_s = 0.0;

  constructor(scenes: readonly SceneDefinition[]) {
    this.scenes = scenes;
    this.recomputeOffsets();
  }

  public setScenes(scenes: readonly SceneDefinition[]): void {
    this.scenes = scenes;
    this.recomputeOffsets();
  }

  public getScenes(): readonly SceneDefinition[] {
    return this.scenes;
  }

  public getTotalDuration(): number {
    return this.totalDuration_s;
  }

  public getSceneStartTime(sceneIndex: number): number {
    if (sceneIndex < 0 || sceneIndex >= this.sceneStartTimes_s.length) {
      return 0.0;
    }
    return this.sceneStartTimes_s[sceneIndex];
  }

  private recomputeOffsets(): void {
    this.sceneStartTimes_s = [];
    let accum = 0.0;
    for (const scene of this.scenes) {
      this.sceneStartTimes_s.push(accum);
      accum += Math.max(0.1, scene.duration_s);
    }
    this.totalDuration_s = accum;
  }

  public resolvePosition(playhead_s: number): TimelinePosition {
    if (this.scenes.length === 0) {
      throw new Error("[CinematicTimeline] No scenes registered in timeline");
    }

    const clampedTime = Math.max(0.0, Math.min(this.totalDuration_s, playhead_s));

    // Binary or linear search for scene
    let sceneIndex = 0;
    for (let i = this.sceneStartTimes_s.length - 1; i >= 0; i--) {
      if (clampedTime >= this.sceneStartTimes_s[i]) {
        sceneIndex = i;
        break;
      }
    }

    const scene = this.scenes[sceneIndex];
    const sceneStart = this.sceneStartTimes_s[sceneIndex];
    const intraSceneTime_s = Math.max(0.0, clampedTime - sceneStart);

    // Resolve active shot within scene
    let shotIndex = 0;
    let shot: ShotDefinition | null = null;
    if (scene.shots.length > 0) {
      for (let s = scene.shots.length - 1; s >= 0; s--) {
        if (intraSceneTime_s >= scene.shots[s].start_s) {
          shotIndex = s;
          shot = scene.shots[s];
          break;
        }
      }
      if (!shot) {
        shot = scene.shots[0];
      }
    }

    const progress = this.totalDuration_s > 0 ? clampedTime / this.totalDuration_s : 0.0;

    return {
      sceneIndex,
      scene,
      intraSceneTime_s,
      shotIndex,
      shot,
      progress,
    };
  }
}
