/**
 * PULSAR-X: 3D Rendering Domain
 * Telemetry Adapter & Smooth Interpolator.
 *
 * Bridges discrete, authoritative scientific worker telemetry into
 * continuous 60-120 Hz Three.js visual transforms without mutating scientific truth.
 */

import type { WorkerTelemetryFrame } from "../../workers/telemetry";
import { scientificToRenderPosition, scientificVelocityToRender } from "../coordinates/scaling";
import type { Vector3Like } from "../../types/simulation";

export interface RenderVisualState {
  /** Simulation coordinate time in seconds [s] */
  readonly simulationTime_s: number;
  /** True spacecraft render position [x, y, z] */
  readonly truePositionRender: [number, number, number];
  /** Estimated spacecraft render position [x, y, z] */
  readonly estimatedPositionRender: [number, number, number];
  /** Velocity vector in render units */
  readonly velocityRender: [number, number, number];
  /** Physical position error in meters */
  readonly positionError_m: number;
  /** Physical velocity error in meters per second */
  readonly velocityError_mps: number;
  /** Receiver clock bias in seconds */
  readonly clockBias_s: number;
  /** 4D GDOP */
  readonly gdop: number;
  /** 3D PDOP */
  readonly pdop: number;
  /** Filter status */
  readonly status: WorkerTelemetryFrame["navigationStatus"];
  /** Active pulsar bitmask */
  readonly activePulsarMask: number;
  /** Total photon count */
  readonly photonCount: number;
  /** Total observation count */
  readonly observationCount: number;
  /** 1-sigma, 2-sigma, 3-sigma semi-major axes in meters */
  readonly sigma1_m: Vector3Like;
  readonly sigma2_m: Vector3Like;
  readonly sigma3_m: Vector3Like;
  /** Covariance eigenvalues in m^2 */
  readonly eigenvalues_m2: readonly [number, number, number];
  /** Post-fit residual RMS in meters */
  readonly rmsResidual_m: number;
}

export class TelemetryAdapter {
  private prevFrame: WorkerTelemetryFrame | null = null;
  private currentFrame: WorkerTelemetryFrame | null = null;
  private lastUpdateTimestamp = 0;

  /**
   * Updates the adapter with the latest incoming worker telemetry packet.
   */
  public pushFrame(frame: WorkerTelemetryFrame): void {
    this.prevFrame = this.currentFrame;
    this.currentFrame = frame;
    this.lastUpdateTimestamp = Date.now();
  }

  public hasData(): boolean {
    return this.currentFrame !== null;
  }

  public getRawFrame(): WorkerTelemetryFrame | null {
    return this.currentFrame;
  }

  /**
   * Computes the visual state at the current frame or linearly interpolated between
   * the previous and current telemetry frames.
   *
   * @param alpha Interpolation factor in [0.0, 1.0] (default 1.0 for latest snapshot)
   */
  public getVisualState(alpha = 1.0): RenderVisualState | null {
    if (!this.currentFrame) return null;

    const curr = this.currentFrame;
    const prev = this.prevFrame ?? curr;
    const clampedAlpha = Math.max(0.0, Math.min(1.0, alpha));

    // Interpolate positions in physical meters first to preserve physical meaning
    const truePos_m: Vector3Like = {
      x: prev.spacecraftPosition_m.x + (curr.spacecraftPosition_m.x - prev.spacecraftPosition_m.x) * clampedAlpha,
      y: prev.spacecraftPosition_m.y + (curr.spacecraftPosition_m.y - prev.spacecraftPosition_m.y) * clampedAlpha,
      z: prev.spacecraftPosition_m.z + (curr.spacecraftPosition_m.z - prev.spacecraftPosition_m.z) * clampedAlpha,
    };

    const estPos_m: Vector3Like = {
      x: prev.estimatedPosition_m.x + (curr.estimatedPosition_m.x - prev.estimatedPosition_m.x) * clampedAlpha,
      y: prev.estimatedPosition_m.y + (curr.estimatedPosition_m.y - prev.estimatedPosition_m.y) * clampedAlpha,
      z: prev.estimatedPosition_m.z + (curr.estimatedPosition_m.z - prev.estimatedPosition_m.z) * clampedAlpha,
    };

    const vel_mps: Vector3Like = {
      x: prev.spacecraftVelocity_mps.x + (curr.spacecraftVelocity_mps.x - prev.spacecraftVelocity_mps.x) * clampedAlpha,
      y: prev.spacecraftVelocity_mps.y + (curr.spacecraftVelocity_mps.y - prev.spacecraftVelocity_mps.y) * clampedAlpha,
      z: prev.spacecraftVelocity_mps.z + (curr.spacecraftVelocity_mps.z - prev.spacecraftVelocity_mps.z) * clampedAlpha,
    };

    const simTime_s = prev.simulationTime_s + (curr.simulationTime_s - prev.simulationTime_s) * clampedAlpha;
    const posErr_m = prev.positionError_m + (curr.positionError_m - prev.positionError_m) * clampedAlpha;

    return {
      simulationTime_s: simTime_s,
      truePositionRender: scientificToRenderPosition(truePos_m),
      estimatedPositionRender: scientificToRenderPosition(estPos_m),
      velocityRender: scientificVelocityToRender(vel_mps),
      positionError_m: posErr_m,
      velocityError_mps: curr.velocityError_mps,
      clockBias_s: curr.clockBias_s,
      gdop: curr.gdop,
      pdop: curr.pdop,
      status: curr.navigationStatus,
      activePulsarMask: curr.activePulsarMask,
      photonCount: curr.photonCount,
      observationCount: curr.observationCount,
      sigma1_m: curr.uncertaintyAxes1Sigma_m,
      sigma2_m: curr.uncertaintyAxes2Sigma_m,
      sigma3_m: curr.uncertaintyAxes3Sigma_m,
      eigenvalues_m2: curr.eigenvalues_m2,
      rmsResidual_m: curr.solverStatus.rmsResidual_m,
    };
  }
}
