/**
 * PULSAR-X: Web Worker Domain
 * Central Headless Simulation Runtime Engine.
 *
 * Orchestrates the existing Phase 2 scientific reference core inside the Worker thread.
 * Strictly decoupled from UI, DOM, WebGL, React, and audio.
 */

import type { SimulationConfig, SpacecraftState, ClockState, Vector3Like } from "../types/simulation";
import type { NavigationStatus, GeometryMetrics, UncertaintyAxes } from "../types/navigation";
import type { Pulsar, PhotonEvent } from "../types/pulsar";
import {
  WorkerLifecycleState,
  WorkerErrorCategory,
  WorkerCommand,
  SimulationInitPayload,
  ParameterUpdatePayload,
  SimulationFault,
} from "./protocol";
import {
  WorkerToMainMessage,
  WorkerTelemetryFrame,
  WorkerAnalyticalTelemetry,
  WorkerEventMessage,
} from "./telemetry";
import { Vector3 } from "../simulation/math/vector3";
import { Matrix3 } from "../simulation/math/matrix3";
import { MatrixNxN } from "../simulation/math/matrix-nxn";
import { assertFinite } from "../simulation/math/finite";
import { SeededPRNG } from "../simulation/random/prng";
import { stepSpacecraftStateRK4 } from "../simulation/dynamics/orbit-propagator";
import { stepClockState, createClockState } from "../simulation/timing/clock-model";
import { INITIAL_PULSAR_CATALOG } from "../simulation/pulsars/catalog";
import { calculateRoemerDelay_s } from "../simulation/timing/roemer";
import { calculateGeometryMetrics } from "../simulation/geometry/gdop";
import { decomposeUncertaintyAxes } from "../simulation/covariance/uncertainty";
import { solveBatchLeastSquares, BatchObservationInput } from "../simulation/navigation/batch-solver";
import { getScenarioById } from "../simulation/scenarios/scenarios";
import { foldPhotonEvents, FoldedProfile } from "../simulation/folding/epoch-folder";
import { SPEED_OF_LIGHT_MPS } from "../simulation/constants/astronomy";

/**
 * Internal representation of an active injected fault.
 */
interface ActiveFaultRecord {
  readonly fault: SimulationFault;
  readonly injectedAtSimTime_s: number;
  remainingDuration_s?: number;
}

export class SimulationRuntime {
  private state: WorkerLifecycleState = "UNINITIALIZED";
  private readonly postMessage: (msg: WorkerToMainMessage) => void;

  // Configuration & Seed
  private config: SimulationConfig = {
    dt_s: 0.05,
    seed: 193721,
    timeAcceleration: 1.0,
    enablePlanetaryPerturbations: true,
    detectorArea_cm2: 2000,
    backgroundRate_phps: 0.5,
  };
  private initialSeed = 193721;
  private prng!: SeededPRNG;

  // Initial conditions for reset
  private initialSpacecraftState!: SpacecraftState;
  private initialClockState!: ClockState;
  private initialActiveMask = 0b11111; // 5 pulsars active by default

  // Dynamic States
  private trueSpacecraftState!: SpacecraftState;
  private trueClockState!: ClockState;
  private estimatedPosition_m!: Vector3;
  private estimatedVelocity_mps!: Vector3;
  private estimatedClockBias_s = 0.0;
  private estimatedClockDrift_rate = 0.0;
  private covarianceMatrix = MatrixNxN.identity(8);
  private uncertaintyAxes!: UncertaintyAxes;
  private geometryMetrics!: GeometryMetrics;
  private navStatus: NavigationStatus = "UNINITIALIZED";

  // Pulsars & Observers
  private pulsars: readonly Pulsar[] = INITIAL_PULSAR_CATALOG;
  private activePulsarMask = 0b11111;
  private photonBuffers: Map<string, PhotonEvent[]> = new Map();
  private foldedProfiles: Map<string, FoldedProfile> = new Map();
  private observationCount = 0;
  private photonCount = 0;
  private lastSolverStatus = { converged: true, iterations: 0, rmsResidual_m: 0.0 };

  // Runtime Controls & Faults
  private playbackMultiplier = 1.0;
  private activeFaults: ActiveFaultRecord[] = [];
  private timingJitter_s = 1e-7;
  private processNoiseScale = 1.0;
  private observationAccumulator_s = 0.0;
  private observationInterval_s = 1.0; // 1s observation batching

  // Telemetry Cadence & Ring Buffers
  private telemetryInterval_ms = 50; // 20 Hz
  private analyticalInterval_ms = 1000; // 1 Hz
  private lastTelemetryEmitWall_ms = 0;
  private lastAnalyticalEmitWall_ms = 0;
  private stepsExecuted = 0;

  // Bounded Ring Buffers (Max 100 points)
  private readonly maxHistoryCapacity = 100;
  private historySimTime: number[] = [];
  private historyPosError: number[] = [];
  private historyGdop: number[] = [];
  private historyRmsResidual: number[] = [];

  // Active Timer Loop
  private timerHandle: ReturnType<typeof setInterval> | null = null;
  private lastTickWall_ms = 0;

  constructor(postMessage: (msg: WorkerToMainMessage) => void) {
    this.postMessage = postMessage;
  }

  public getState(): WorkerLifecycleState {
    return this.state;
  }

  private transitionState(newState: WorkerLifecycleState): void {
    const previousState = this.state;
    this.state = newState;
    this.postMessage({
      type: "STATE_CHANGED",
      state: newState,
      previousState,
    });
  }

  // ==========================================================================
  // Command Dispatcher
  // ==========================================================================

  public handleCommand(command: WorkerCommand): void {
    try {
      switch (command.type) {
        case "SIM_INIT":
          this.execInit(command.payload);
          this.ack(command.commandId, command.type, "SUCCESS");
          break;
        case "SIM_START":
          this.execStart();
          this.ack(command.commandId, command.type, "SUCCESS");
          break;
        case "SIM_PAUSE":
          this.execPause();
          this.ack(command.commandId, command.type, "SUCCESS");
          break;
        case "SIM_RESUME":
          this.execResume();
          this.ack(command.commandId, command.type, "SUCCESS");
          break;
        case "SIM_STEP":
          this.execStep(command.payload?.stepCount ?? 1);
          this.ack(command.commandId, command.type, "SUCCESS");
          break;
        case "SIM_SET_PLAYBACK":
          this.execSetPlayback(command.payload.playbackMultiplier);
          this.ack(command.commandId, command.type, "SUCCESS");
          break;
        case "SIM_UPDATE_PARAMS":
          this.execUpdateParams(command.payload);
          this.ack(command.commandId, command.type, "SUCCESS");
          break;
        case "SIM_INJECT_FAULT":
          this.execInjectFault(command.payload);
          this.ack(command.commandId, command.type, "SUCCESS");
          break;
        case "SIM_RESET":
          this.execReset(command.payload?.preserveSeed ?? true);
          this.ack(command.commandId, command.type, "SUCCESS");
          break;
        case "SIM_STOP":
          this.execStop();
          this.ack(command.commandId, command.type, "SUCCESS");
          break;
        default:
          this.postError("INVALID_COMMAND", `Unknown command type received: ${(command as { type?: unknown }).type}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.postError("WORKER_INTERNAL_ERROR", `Exception while executing command ${command.type}: ${message}`, err);
    }
  }

  // ==========================================================================
  // Command Executions
  // ==========================================================================

  public execInit(payload?: SimulationInitPayload): void {
    if (this.state === "RUNNING") {
      this.execPause();
    }
    this.transitionState("INITIALIZING");

    const scenario = payload?.scenarioId ? getScenarioById(payload.scenarioId) : undefined;
    const seed = payload?.seed ?? scenario?.seed ?? 193721;
    this.initialSeed = seed;

    this.config = {
      dt_s: payload?.config?.dt_s ?? scenario?.config?.dt_s ?? 0.05,
      seed,
      timeAcceleration: payload?.config?.timeAcceleration ?? scenario?.config?.timeAcceleration ?? 1.0,
      enablePlanetaryPerturbations:
        payload?.config?.enablePlanetaryPerturbations ?? scenario?.config?.enablePlanetaryPerturbations ?? true,
      detectorArea_cm2: payload?.config?.detectorArea_cm2 ?? scenario?.config?.detectorArea_cm2 ?? 2000,
      backgroundRate_phps: payload?.config?.backgroundRate_phps ?? scenario?.config?.backgroundRate_phps ?? 0.5,
    };

    if (payload?.playbackMultiplier !== undefined) {
      this.playbackMultiplier = Math.max(0.1, payload.playbackMultiplier);
    }
    if (payload?.telemetryInterval_ms !== undefined) {
      this.telemetryInterval_ms = Math.max(10, payload.telemetryInterval_ms);
    }
    if (payload?.analyticalInterval_ms !== undefined) {
      this.analyticalInterval_ms = Math.max(100, payload.analyticalInterval_ms);
    }

    // Initialize PRNG & Subsystems
    this.prng = new SeededPRNG(this.config.seed);

    // Initial state vectors
    if (payload?.initialSpacecraftState) {
      this.initialSpacecraftState = payload.initialSpacecraftState;
    } else if (scenario?.initialSpacecraftState) {
      this.initialSpacecraftState = scenario.initialSpacecraftState;
    } else {
      // Default Heliocentric 1.0 AU circular orbit
      this.initialSpacecraftState = {
        position_m: { x: 1.495978707e11, y: 0, z: 0 },
        velocity_mps: { x: 0, y: 29780.0, z: 0 },
        acceleration_mps2: { x: -0.00593, y: 0, z: 0 },
        time_s: 0,
      };
    }

    if (payload?.initialClockState) {
      this.initialClockState = payload.initialClockState;
    } else if (scenario?.initialClockState) {
      this.initialClockState = scenario.initialClockState;
    } else {
      this.initialClockState = createClockState(0.0, 1e-9, 0.0);
    }

    this.initialActiveMask = 0b11111;
    this.activePulsarMask = this.initialActiveMask;

    this.setupInitialState();
    this.transitionState("READY");
    this.emitTelemetryFrame(true);
  }

  private setupInitialState(): void {
    this.trueSpacecraftState = { ...this.initialSpacecraftState };
    this.trueClockState = { ...this.initialClockState };

    // Initial estimate has a perturbation representing pre-nav fix error
    const truePos = Vector3.fromLike(this.trueSpacecraftState.position_m);
    const trueVel = Vector3.fromLike(this.trueSpacecraftState.velocity_mps);

    // Initial perturbation: 100km offset
    this.estimatedPosition_m = new Vector3(
      truePos.x + 80000.0,
      truePos.y - 60000.0,
      truePos.z + 10000.0
    );
    this.estimatedVelocity_mps = new Vector3(trueVel.x + 5.0, trueVel.y - 2.0, trueVel.z);
    this.estimatedClockBias_s = this.trueClockState.clockBias_s + 1e-4;
    this.estimatedClockDrift_rate = this.trueClockState.clockDrift_rate;

    // Initial Covariance: 100km standard deviation (1e10 m^2)
    this.covarianceMatrix = MatrixNxN.identity(8);
    for (let i = 0; i < 3; i++) {
      this.covarianceMatrix.set(i, i, 1e10);
      this.covarianceMatrix.set(i + 3, i + 3, 1e2);
    }
    this.covarianceMatrix.set(6, 6, 1e-8 * SPEED_OF_LIGHT_MPS * SPEED_OF_LIGHT_MPS);
    this.covarianceMatrix.set(7, 7, 1e-16 * SPEED_OF_LIGHT_MPS * SPEED_OF_LIGHT_MPS);

    this.navStatus = "CONVERGING";
    this.activeFaults = [];
    this.observationCount = 0;
    this.photonCount = 0;
    this.observationAccumulator_s = 0.0;
    this.stepsExecuted = 0;

    // Reset history buffers
    this.historySimTime = [];
    this.historyPosError = [];
    this.historyGdop = [];
    this.historyRmsResidual = [];

    // Photon buffers for pulsars
    this.photonBuffers.clear();
    this.foldedProfiles.clear();
    for (const pulsar of this.pulsars) {
      this.photonBuffers.set(pulsar.id, []);
      this.foldedProfiles.set(pulsar.id, {
        binCount: 64,
        counts: new Array<number>(64).fill(0),
        normalized: new Array<number>(64).fill(0),
        totalPhotons: 0,
        peakBinIndex: 0,
        peakPhase_cycles: 0,
      });
    }

    this.updateGeometryAndUncertainty();
  }

  public execStart(): void {
    if (this.state !== "READY" && this.state !== "PAUSED") {
      this.postError("INVALID_COMMAND", `Cannot start simulation from state: ${this.state}`);
      return;
    }
    this.transitionState("RUNNING");
    this.lastTickWall_ms = Date.now();
    this.startLoop();
  }

  public execPause(): void {
    if (this.state !== "RUNNING") return;
    this.stopLoop();
    this.transitionState("PAUSED");
  }

  public execResume(): void {
    if (this.state !== "PAUSED") return;
    this.transitionState("RUNNING");
    this.lastTickWall_ms = Date.now();
    this.startLoop();
  }

  public execStep(count = 1): void {
    if (this.state !== "READY" && this.state !== "PAUSED") {
      this.postError("INVALID_COMMAND", `Cannot step simulation from state: ${this.state}`);
      return;
    }
    const steps = Math.max(1, Math.min(1000, count));
    for (let i = 0; i < steps; i++) {
      this.advanceScientificStep();
    }
    this.emitTelemetryFrame(true);
  }

  public execSetPlayback(multiplier: number): void {
    if (!Number.isFinite(multiplier) || multiplier <= 0) {
      this.postError("INVALID_CONFIGURATION", `Invalid playback multiplier: ${multiplier}`);
      return;
    }
    this.playbackMultiplier = multiplier;
  }

  public execUpdateParams(payload: ParameterUpdatePayload): void {
    if (payload.playbackMultiplier !== undefined) {
      this.execSetPlayback(payload.playbackMultiplier);
    }
    if (payload.timingJitter_s !== undefined) {
      this.timingJitter_s = assertFinite(Math.max(0, payload.timingJitter_s));
    }
    if (payload.detectorArea_cm2 !== undefined) {
      this.config = {
        ...this.config,
        detectorArea_cm2: assertFinite(Math.max(1, payload.detectorArea_cm2)),
      };
    }
    if (payload.backgroundRate_phps !== undefined) {
      this.config = {
        ...this.config,
        backgroundRate_phps: assertFinite(Math.max(0, payload.backgroundRate_phps)),
      };
    }
    if (payload.observationDuration_s !== undefined) {
      this.observationInterval_s = assertFinite(Math.max(0.1, payload.observationDuration_s));
    }
    if (payload.activePulsarMask !== undefined) {
      this.activePulsarMask = payload.activePulsarMask & 0b11111;
      this.updateGeometryAndUncertainty();
    }
    if (payload.clockDrift_rate !== undefined) {
      this.estimatedClockDrift_rate = assertFinite(payload.clockDrift_rate);
    }
    if (payload.processNoiseScale !== undefined) {
      this.processNoiseScale = assertFinite(Math.max(0, payload.processNoiseScale));
    }
  }

  public execInjectFault(fault: SimulationFault): void {
    if (fault.type === "CLEAR_FAULT") {
      if (fault.targetFaultType || fault.pulsarId) {
        this.activeFaults = this.activeFaults.filter(
          (f) =>
            (fault.targetFaultType ? f.fault.type !== fault.targetFaultType : true) &&
            (fault.pulsarId && "pulsarId" in f.fault ? (f.fault as { pulsarId: string }).pulsarId !== fault.pulsarId : true)
        );
      } else {
        this.activeFaults = [];
      }
      this.postEvent("FAULT_CLEARED", { cleared: fault });
      this.updateGeometryAndUncertainty();
      return;
    }

    this.activeFaults.push({
      fault,
      injectedAtSimTime_s: this.trueSpacecraftState.time_s,
      remainingDuration_s: fault.duration_s,
    });

    this.postEvent("FAULT_INJECTED", { fault });
    this.updateGeometryAndUncertainty();
  }

  public execReset(preserveSeed = true): void {
    this.stopLoop();
    if (!preserveSeed) {
      this.config = { ...this.config, seed: this.initialSeed };
    }
    this.prng = new SeededPRNG(this.initialSeed);
    this.activePulsarMask = this.initialActiveMask;
    this.setupInitialState();
    this.transitionState("READY");
    this.postEvent("SIMULATION_RESET", { seed: this.initialSeed, simTime_s: 0 });
    this.emitTelemetryFrame(true);
    this.emitAnalyticalTelemetry(true);
  }

  public execStop(): void {
    this.stopLoop();
    this.transitionState("STOPPED");
  }

  // ==========================================================================
  // Core Scientific Stepping Loop
  // ==========================================================================

  public advanceScientificStep(): void {
    const dt = this.config.dt_s;

    // 1. Process active faults countdown
    for (let i = this.activeFaults.length - 1; i >= 0; i--) {
      const record = this.activeFaults[i];
      if (record.remainingDuration_s !== undefined) {
        record.remainingDuration_s -= dt;
        if (record.remainingDuration_s <= 0) {
          const expiredFault = record.fault;
          this.activeFaults.splice(i, 1);
          this.postEvent("FAULT_CLEARED", { fault: expiredFault, reason: "DURATION_EXPIRED" });
        }
      }
    }

    // 2. Spacecraft dynamics propagation (RK4)
    this.trueSpacecraftState = stepSpacecraftStateRK4(this.trueSpacecraftState, dt, {
      enablePerturbations: this.config.enablePlanetaryPerturbations,
    });

    // 3. Spacecraft clock update
    let addedDrift = 0.0;
    const clockFault = this.activeFaults.find((f) => f.fault.type === "CLOCK_DRIFT");
    if (clockFault && clockFault.fault.type === "CLOCK_DRIFT") {
      addedDrift = clockFault.fault.addedDrift_rate;
    }
    this.trueClockState = stepClockState(this.trueClockState, this.trueSpacecraftState.time_s, dt, this.prng);
    if (addedDrift !== 0.0) {
      this.trueClockState = {
        ...this.trueClockState,
        clockDrift_rate: this.trueClockState.clockDrift_rate + addedDrift,
        clockBias_s: this.trueClockState.clockBias_s + addedDrift * dt,
      };
    }

    // 4. Photon event accumulation
    this.accumulatePhotons(dt);

    // 5. Check observation accumulation window
    this.observationAccumulator_s += dt;
    if (this.observationAccumulator_s >= this.observationInterval_s) {
      this.observationAccumulator_s = 0.0;
      this.processObservationBatch();
    } else {
      // Dead reckoning step for estimated state between observation updates
      this.deadReckonStep(dt);
    }

    this.stepsExecuted++;
    this.updateGeometryAndUncertainty();
  }

  private accumulatePhotons(dt_s: number): void {
    let sensorEfficiency = 1.0;
    const sensorFault = this.activeFaults.find((f) => f.fault.type === "SENSOR_DEGRADATION");
    if (sensorFault && sensorFault.fault.type === "SENSOR_DEGRADATION") {
      sensorEfficiency = sensorFault.fault.efficiencyMultiplier;
    }

    const effectiveArea = this.config.detectorArea_cm2 * sensorEfficiency;

    for (let i = 0; i < this.pulsars.length; i++) {
      const bit = 1 << i;
      if ((this.activePulsarMask & bit) === 0) continue;
      const pulsar = this.pulsars[i];

      // Check if pulsar has dropout or occultation fault
      const isDropped = this.activeFaults.some(
        (f) =>
          (f.fault.type === "PULSAR_DROPOUT" || f.fault.type === "SOLAR_OCCULTATION") &&
          f.fault.pulsarId === pulsar.id
      );
      if (isDropped) continue;

      const buffer = this.photonBuffers.get(pulsar.id);
      if (!buffer) continue;

      // Expected photon arrival rate: flux * area + background
      const rate = pulsar.flux_phcm2s * effectiveArea * 0.01 + this.config.backgroundRate_phps;
      const expectedPhotons = rate * dt_s;

      // Deterministic Poisson draw
      const count = this.prng.nextPoisson(expectedPhotons);
      this.photonCount += count;

      if (count > 0) {
        // True phase at spacecraft reception
        const rTrue = Vector3.fromLike(this.trueSpacecraftState.position_m);
        const tSc = this.trueClockState.spacecraftTime_s;
        const roemerDelay_s = calculateRoemerDelay_s(pulsar.directionVector, rTrue);
        const tSsb = tSc - this.trueClockState.clockBias_s + roemerDelay_s;
        const phase = (pulsar.timing.f0_hz * tSsb) % 1.0;
        const positivePhase = phase < 0 ? phase + 1.0 : phase;

        for (let k = 0; k < count; k++) {
          buffer.push({
            timestamp_s: tSc,
            pulsarId: pulsar.id,
            isSignal: true,
            phase_cycles: positivePhase,
          });
        }

        // Keep buffer bounded
        if (buffer.length > 500) {
          buffer.splice(0, buffer.length - 500);
        }

        // Fold photons
        this.foldedProfiles.set(pulsar.id, foldPhotonEvents(buffer, 64));
      }
    }
  }

  private processObservationBatch(): void {
    const batchInputs: BatchObservationInput[] = [];

    let timingNoiseMultiplier = 1.0;
    const noiseFault = this.activeFaults.find((f) => f.fault.type === "TIMING_NOISE_SPIKE");
    if (noiseFault && noiseFault.fault.type === "TIMING_NOISE_SPIKE") {
      timingNoiseMultiplier = noiseFault.fault.multiplier;
    }

    const rTrue = Vector3.fromLike(this.trueSpacecraftState.position_m);

    for (let i = 0; i < this.pulsars.length; i++) {
      const bit = 1 << i;
      if ((this.activePulsarMask & bit) === 0) continue;
      const pulsar = this.pulsars[i];

      // Check faults
      const isFaulted = this.activeFaults.some(
        (f) =>
          (f.fault.type === "PULSAR_DROPOUT" || f.fault.type === "SOLAR_OCCULTATION") &&
          f.fault.pulsarId === pulsar.id
      );
      if (isFaulted) continue;

      // True Rømer delay and true TOA
      const trueRoemer_s = calculateRoemerDelay_s(pulsar.directionVector, rTrue);
      const jitter_s = this.prng.nextGaussian(0, this.timingJitter_s * timingNoiseMultiplier);
      const measuredPseudorange_m = (trueRoemer_s + this.trueClockState.clockBias_s + jitter_s) * SPEED_OF_LIGHT_MPS;

      batchInputs.push({
        directionVector: pulsar.directionVector,
        measuredPseudorange_m,
        sigma_m: this.timingJitter_s * timingNoiseMultiplier * SPEED_OF_LIGHT_MPS,
      });
    }

    this.observationCount += batchInputs.length;
    if (batchInputs.length > 0) {
      this.postEvent("OBSERVATION_AVAILABLE", { count: batchInputs.length });
    }

    // Solve navigation if >= 4 pulsars available
    if (batchInputs.length >= 4) {
      const solverResult = solveBatchLeastSquares(
        batchInputs,
        {
          position_m: this.estimatedPosition_m,
          clockBias_s: this.estimatedClockBias_s,
        }
      );

      this.lastSolverStatus = {
        converged: solverResult.status === "LOCKED",
        iterations: solverResult.iterations,
        rmsResidual_m: solverResult.rmsResidual_m,
      };

      if (solverResult.status === "LOCKED") {
        const prevEstPos = this.estimatedPosition_m;
        this.estimatedPosition_m = solverResult.position_m;
        this.estimatedClockBias_s = solverResult.clockBias_s;

        // Velocity finite-difference estimation smoothed with orbit dynamics
        const dtObs = this.observationInterval_s;
        const velEst = this.estimatedPosition_m.sub(prevEstPos).scale(1.0 / dtObs);
        if (velEst.norm() < 100000.0) {
          this.estimatedVelocity_mps = this.estimatedVelocity_mps.scale(0.7).add(velEst.scale(0.3));
        }

        // Update covariance matrix from solver 4x4 covariance
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            this.covarianceMatrix.set(r, c, solverResult.covariance4x4.get(r, c));
          }
        }

        if (this.navStatus !== "LOCKED") {
          const prev = this.navStatus;
          this.navStatus = "LOCKED";
          this.postEvent(prev === "DEGRADED" ? "NAVIGATION_RECOVERED" : "NAVIGATION_LOCKED", {
            rmsResidual_m: solverResult.rmsResidual_m,
          });
        }
      } else {
        this.handleSolverFailure();
      }
    } else {
      // Under-determined: Not enough pulsars for instantaneous fix
      this.handleSolverFailure();
    }
  }

  private handleSolverFailure(): void {
    if (this.navStatus === "LOCKED") {
      this.navStatus = "DEGRADED";
      this.postEvent("NAVIGATION_DEGRADED", {
        reason: "INSUFFICIENT_PULSARS_OR_SOLVER_DIVERGENCE",
      });
    }
    // Grow covariance uncertainty due to lack of measurement updates
    const growth = 1e6 * this.processNoiseScale;
    for (let i = 0; i < 3; i++) {
      const current = this.covarianceMatrix.get(i, i);
      this.covarianceMatrix.set(i, i, current + growth);
    }
  }

  private deadReckonStep(dt_s: number): void {
    // Propagate estimated position using dynamics
    const estState: SpacecraftState = {
      position_m: this.estimatedPosition_m,
      velocity_mps: this.estimatedVelocity_mps,
      acceleration_mps2: { x: 0, y: 0, z: 0 },
      time_s: this.trueSpacecraftState.time_s,
    };
    const nextEstState = stepSpacecraftStateRK4(estState, dt_s, {
      enablePerturbations: this.config.enablePlanetaryPerturbations,
    });
    this.estimatedPosition_m = Vector3.fromLike(nextEstState.position_m);
    this.estimatedVelocity_mps = Vector3.fromLike(nextEstState.velocity_mps);
    this.estimatedClockBias_s += this.estimatedClockDrift_rate * dt_s;

    // Small continuous covariance diffusion
    const diffusion = 100.0 * dt_s * this.processNoiseScale;
    for (let i = 0; i < 3; i++) {
      this.covarianceMatrix.set(i, i, this.covarianceMatrix.get(i, i) + diffusion);
    }
  }

  private updateGeometryAndUncertainty(): void {
    // Filter active pulsars (mask minus faults)
    const activeDirections: Vector3Like[] = [];
    for (let i = 0; i < this.pulsars.length; i++) {
      const bit = 1 << i;
      if ((this.activePulsarMask & bit) === 0) continue;
      const pulsar = this.pulsars[i];
      const isFaulted = this.activeFaults.some(
        (f) =>
          (f.fault.type === "PULSAR_DROPOUT" || f.fault.type === "SOLAR_OCCULTATION") &&
          f.fault.pulsarId === pulsar.id
      );
      if (!isFaulted) {
        activeDirections.push(pulsar.directionVector);
      }
    }

    this.geometryMetrics = calculateGeometryMetrics(activeDirections);

    // Extract 3x3 position covariance
    const p3x3 = new Matrix3([
      this.covarianceMatrix.get(0, 0), this.covarianceMatrix.get(0, 1), this.covarianceMatrix.get(0, 2),
      this.covarianceMatrix.get(1, 0), this.covarianceMatrix.get(1, 1), this.covarianceMatrix.get(1, 2),
      this.covarianceMatrix.get(2, 0), this.covarianceMatrix.get(2, 1), this.covarianceMatrix.get(2, 2),
    ]);
    this.uncertaintyAxes = decomposeUncertaintyAxes(p3x3);
  }

  // ==========================================================================
  // Timer & Cadence Loop
  // ==========================================================================

  private startLoop(): void {
    if (this.timerHandle) return;
    const tickInterval_ms = 25; // 40 Hz wall timer
    this.timerHandle = setInterval(() => {
      if (this.state !== "RUNNING") return;
      this.onTimerTick();
    }, tickInterval_ms);
  }

  private stopLoop(): void {
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
  }

  private onTimerTick(): void {
    const now = Date.now();
    const wallElapsed_s = Math.min(0.2, (now - this.lastTickWall_ms) / 1000.0);
    this.lastTickWall_ms = now;

    // Determine how many scientific steps to advance based on playback multiplier
    const simTimeTarget_s = wallElapsed_s * this.playbackMultiplier;
    const stepsToRun = Math.max(1, Math.round(simTimeTarget_s / this.config.dt_s));

    for (let i = 0; i < stepsToRun; i++) {
      this.advanceScientificStep();
    }

    // Telemetry emission cadence
    if (now - this.lastTelemetryEmitWall_ms >= this.telemetryInterval_ms) {
      this.emitTelemetryFrame(false);
      this.lastTelemetryEmitWall_ms = now;
    }

    // Analytical telemetry cadence
    if (now - this.lastAnalyticalEmitWall_ms >= this.analyticalInterval_ms) {
      this.emitAnalyticalTelemetry(false);
      this.lastAnalyticalEmitWall_ms = now;
    }
  }

  // ==========================================================================
  // Telemetry Emission
  // ==========================================================================

  public emitTelemetryFrame(force = false): void {
    const now = Date.now();
    if (!force && now - this.lastTelemetryEmitWall_ms < this.telemetryInterval_ms) return;

    const truePos = Vector3.fromLike(this.trueSpacecraftState.position_m);
    const estPos = this.estimatedPosition_m;
    const posErr = truePos.distanceTo(estPos);

    const trueVel = Vector3.fromLike(this.trueSpacecraftState.velocity_mps);
    const estVel = this.estimatedVelocity_mps;
    const velErr = trueVel.distanceTo(estVel);

    const biasErr = Math.abs(this.trueClockState.clockBias_s - this.estimatedClockBias_s);

    // Append to bounded ring buffer
    this.historySimTime.push(this.trueSpacecraftState.time_s);
    this.historyPosError.push(posErr);
    this.historyGdop.push(this.geometryMetrics.gdop);
    this.historyRmsResidual.push(this.lastSolverStatus.rmsResidual_m);

    if (this.historySimTime.length > this.maxHistoryCapacity) {
      this.historySimTime.shift();
      this.historyPosError.shift();
      this.historyGdop.shift();
      this.historyRmsResidual.shift();
    }

    const frame: WorkerTelemetryFrame = {
      type: "TELEMETRY_FRAME",
      simulationTime_s: this.trueSpacecraftState.time_s,
      spacecraftPosition_m: truePos,
      spacecraftVelocity_mps: trueVel,
      estimatedPosition_m: estPos,
      estimatedVelocity_mps: estVel,
      positionError_m: assertFinite(posErr),
      velocityError_mps: assertFinite(velErr),
      clockBias_s: this.trueClockState.clockBias_s,
      clockDrift_rate: this.estimatedClockDrift_rate,
      clockBiasError_s: assertFinite(biasErr),
      gdop: this.geometryMetrics.gdop,
      pdop: this.geometryMetrics.pdop,
      tdop: this.geometryMetrics.tdop,
      navigationStatus: this.navStatus,
      activePulsarMask: this.activePulsarMask,
      observationCount: this.observationCount,
      photonCount: this.photonCount,
      uncertaintyAxes1Sigma_m: this.uncertaintyAxes.sigma1_m,
      uncertaintyAxes2Sigma_m: this.uncertaintyAxes.sigma2_m,
      uncertaintyAxes3Sigma_m: this.uncertaintyAxes.sigma3_m,
      eigenvalues_m2: this.uncertaintyAxes.eigenvalues_m2,
      eigenvectors: this.uncertaintyAxes.eigenvectors,
      solverStatus: {
        converged: this.lastSolverStatus.converged,
        iterations: this.lastSolverStatus.iterations,
        rmsResidual_m: this.lastSolverStatus.rmsResidual_m,
      },
      simulationRate: this.playbackMultiplier,
      playbackMultiplier: this.playbackMultiplier,
      wallClockTimestamp: now,
    };

    this.postMessage(frame);
  }

  public emitAnalyticalTelemetry(force = false): void {
    const now = Date.now();
    if (!force && now - this.lastAnalyticalEmitWall_ms < this.analyticalInterval_ms) return;

    // Calculate residual statistics from history
    let mean = 0.0;
    let min = Infinity;
    let max = -Infinity;
    const count = this.historyRmsResidual.length;

    if (count > 0) {
      for (const r of this.historyRmsResidual) {
        mean += r;
        if (r < min) min = r;
        if (r > max) max = r;
      }
      mean /= count;
    } else {
      min = 0;
      max = 0;
    }

    let variance = 0.0;
    if (count > 1) {
      for (const r of this.historyRmsResidual) {
        variance += (r - mean) * (r - mean);
      }
      variance /= count;
    }

    // Profile statistics from epoch folders
    const profileStats = this.pulsars.map((p) => {
      const profile = this.foldedProfiles.get(p.id);
      return {
        pulsarId: p.id,
        bins: profile ? profile.normalized : new Array<number>(64).fill(0),
        snr_db: 25.0,
        photonCount: profile ? profile.totalPhotons : 0,
      };
    });

    const analytical: WorkerAnalyticalTelemetry = {
      type: "ANALYTICAL_TELEMETRY",
      simulationTime_s: this.trueSpacecraftState.time_s,
      toaResidualStatistics: {
        mean_m: mean,
        stdDev_m: Math.sqrt(variance),
        min_m: min === Infinity ? 0 : min,
        max_m: max === -Infinity ? 0 : max,
        count,
      },
      pulseProfileStatistics: profileStats,
      history: {
        simulationTime_s: [...this.historySimTime],
        positionError_m: [...this.historyPosError],
        gdop: [...this.historyGdop],
        rmsResidual_m: [...this.historyRmsResidual],
      },
      activeFaults: this.activeFaults.map((f) => ({
        type: f.fault.type,
        details: JSON.stringify(f.fault),
        remainingDuration_s: f.remainingDuration_s,
      })),
    };

    this.postMessage(analytical);
  }

  // ==========================================================================
  // Helper Post Methods
  // ==========================================================================

  private ack(commandId: string | undefined, commandType: WorkerCommand["type"], status: "SUCCESS" | "IGNORED"): void {
    this.postMessage({
      type: "SIM_COMMAND_ACK",
      commandId,
      commandType,
      status,
    });
  }

  private postEvent(event: WorkerEventMessage["event"], details: Record<string, unknown>): void {
    this.postMessage({
      type: "WORKER_EVENT",
      event,
      timestamp_s: this.trueSpacecraftState ? this.trueSpacecraftState.time_s : 0,
      details,
    });
  }

  private postError(category: WorkerErrorCategory, message: string, details?: unknown): void {
    this.postMessage({
      type: "WORKER_ERROR",
      category,
      message,
      details,
      timestamp_s: this.trueSpacecraftState ? this.trueSpacecraftState.time_s : 0,
    });
  }
}
