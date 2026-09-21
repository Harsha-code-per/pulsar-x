/**
 * PULSAR-X: 3D Rendering Domain
 * CameraController Abstraction for User Orbit, Scripted Sequences,
 * and Future Cinematic Director System.
 */

import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

export interface CameraTargetConfig {
  readonly position: [number, number, number];
  readonly target: [number, number, number];
  readonly fov?: number;
  readonly duration_s?: number;
  readonly onComplete?: () => void;
}

interface ActiveTransition {
  readonly startPos: THREE.Vector3;
  readonly endPos: THREE.Vector3;
  readonly startTarget: THREE.Vector3;
  readonly endTarget: THREE.Vector3;
  readonly startFov: number;
  readonly endFov: number;
  readonly duration_s: number;
  elapsed_s: number;
  readonly onComplete?: () => void;
}

/**
 * Smooth cubic ease-in-out function for camera choreography transitions.
 */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class CameraController {
  private target = new THREE.Vector3(0, 0, 0);
  private position = new THREE.Vector3(0, 50, 140);
  private fov = 45;
  private isUserControlEnabled = true;
  private activeTransition: ActiveTransition | null = null;

  public setTarget(x: number, y: number, z: number): void {
    this.target.set(x, y, z);
  }

  public getTarget(): THREE.Vector3 {
    return this.target;
  }

  public setPosition(x: number, y: number, z: number): void {
    this.position.set(x, y, z);
  }

  public getPosition(): THREE.Vector3 {
    return this.position;
  }

  public setFOV(fov: number): void {
    this.fov = Math.max(10, Math.min(120, fov));
  }

  public getFOV(): number {
    return this.fov;
  }

  public lookAt(x: number, y: number, z: number): void {
    this.target.set(x, y, z);
  }

  public enableUserControl(): void {
    this.isUserControlEnabled = true;
  }

  public disableUserControl(): void {
    this.isUserControlEnabled = false;
  }

  public canUserControl(): boolean {
    return this.isUserControlEnabled;
  }

  public isTransitioning(): boolean {
    return this.activeTransition !== null;
  }

  /**
   * Starts a smooth, interpolated transition to a new camera configuration.
   * Disables user control during the transition.
   */
  public transitionTo(config: CameraTargetConfig): void {
    const duration = config.duration_s ?? 2.0;

    if (duration <= 0.001) {
      this.setPosition(config.position[0], config.position[1], config.position[2]);
      this.setTarget(config.target[0], config.target[1], config.target[2]);
      if (config.fov !== undefined) {
        this.setFOV(config.fov);
      }
      this.activeTransition = null;
      config.onComplete?.();
      return;
    }

    this.isUserControlEnabled = false;
    this.activeTransition = {
      startPos: this.position.clone(),
      endPos: new THREE.Vector3(config.position[0], config.position[1], config.position[2]),
      startTarget: this.target.clone(),
      endTarget: new THREE.Vector3(config.target[0], config.target[1], config.target[2]),
      startFov: this.fov,
      endFov: config.fov ?? this.fov,
      duration_s: duration,
      elapsed_s: 0,
      onComplete: config.onComplete,
    };
  }

  /**
   * Updates camera position, lookAt, and FOV.
   * Advances active transitions and smoothly updates Three.js camera & controls.
   */
  public update(
    delta_s: number,
    camera?: THREE.Camera,
    controls?: OrbitControlsImpl | null
  ): void {
    if (this.activeTransition) {
      const trans = this.activeTransition;
      trans.elapsed_s += delta_s;
      const rawProgress = Math.min(1.0, trans.elapsed_s / trans.duration_s);
      const easedProgress = easeInOutCubic(rawProgress);

      this.position.lerpVectors(trans.startPos, trans.endPos, easedProgress);
      this.target.lerpVectors(trans.startTarget, trans.endTarget, easedProgress);
      this.fov = trans.startFov + (trans.endFov - trans.startFov) * easedProgress;

      if (rawProgress >= 1.0) {
        const cb = trans.onComplete;
        this.activeTransition = null;
        this.isUserControlEnabled = true;
        cb?.();
      }
    }

    if (camera) {
      camera.position.copy(this.position);

      if ("fov" in camera && typeof (camera as THREE.PerspectiveCamera).fov === "number") {
        const pCam = camera as THREE.PerspectiveCamera;
        if (Math.abs(pCam.fov - this.fov) > 0.01) {
          pCam.fov = this.fov;
          pCam.updateProjectionMatrix();
        }
      }

      if (controls && this.isUserControlEnabled) {
        controls.target.copy(this.target);
        controls.update();
      } else {
        camera.lookAt(this.target);
      }
    }
  }
}

/** Global singleton camera controller instance for rendering and director modules */
export const defaultCameraController = new CameraController();
