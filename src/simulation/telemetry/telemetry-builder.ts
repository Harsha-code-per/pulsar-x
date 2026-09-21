/**
 * PULSAR-X: Scientific Reference Core
 * Serializable Navigation Telemetry Builder.
 */

import type { SpacecraftState, ClockState } from "../../types/simulation";
import type { NavigationEstimate, NavigationTelemetry } from "../../types/navigation";
import { Vector3 } from "../math/vector3";
import { assertFinite } from "../math/finite";

export interface TelemetryBuilderInput {
  readonly trueSpacecraftState: SpacecraftState;
  readonly trueClockState: ClockState;
  readonly estimate: NavigationEstimate;
  readonly activePulsarMask: number;
  readonly totalPhotonCount: number;
  readonly totalObservationCount: number;
}

/**
 * Constructs a clean, serializable telemetry snapshot from simulation and filter states.
 */
export function buildNavigationTelemetry(input: TelemetryBuilderInput): NavigationTelemetry {
  const truePos = Vector3.fromLike(input.trueSpacecraftState.position_m);
  const estPos = Vector3.fromLike(input.estimate.state.position_m);
  const positionError_m = truePos.distanceTo(estPos);

  const trueVel = Vector3.fromLike(input.trueSpacecraftState.velocity_mps);
  const estVel = Vector3.fromLike(input.estimate.state.velocity_mps);
  const velocityError_mps = trueVel.distanceTo(estVel);

  const trueBias = input.trueClockState.clockBias_s;
  const estBias = input.estimate.state.clockBias_s;
  const clockBiasError_s = Math.abs(trueBias - estBias);

  return {
    simulationTime_s: assertFinite(input.trueSpacecraftState.time_s),
    truePosition_m: truePos,
    trueVelocity_mps: trueVel,
    estimatedPosition_m: estPos,
    estimatedVelocity_mps: estVel,
    positionError_m: assertFinite(positionError_m),
    velocityError_mps: assertFinite(velocityError_mps),
    trueClockBias_s: assertFinite(trueBias),
    estimatedClockBias_s: assertFinite(estBias),
    clockBiasError_s: assertFinite(clockBiasError_s),
    estimatedClockDrift_rate: assertFinite(input.estimate.state.clockDrift_rate),
    gdop: assertFinite(input.estimate.geometry.gdop),
    pdop: assertFinite(input.estimate.geometry.pdop),
    tdop: assertFinite(input.estimate.geometry.tdop),
    activePulsarMask: input.activePulsarMask,
    totalPhotonCount: input.totalPhotonCount,
    totalObservationCount: input.totalObservationCount,
    status: input.estimate.status,
    uncertainty3Sigma_m: input.estimate.uncertaintyAxes.sigma3_m,
    rmsResidual_m: assertFinite(input.estimate.rmsResidual_m),
  };
}
