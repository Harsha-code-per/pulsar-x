/**
 * PULSAR-X: Scientific Reference Core
 * Deterministic Scientific Scenarios (Scenarios A through H).
 * Each scenario defines explicit initial states, active pulsar configurations, noise levels, and seeds.
 */

import type { SpacecraftState, ClockState, SimulationConfig } from "../../types/simulation";
import type { Pulsar } from "../../types/pulsar";
import { Vector3 } from "../math/vector3";
import { INITIAL_PULSAR_CATALOG, computeDirectionVector } from "../pulsars/catalog";
import { ASTRONOMICAL_UNIT_M } from "../constants/astronomy";
import { degToRad } from "../units/conversions";

export interface ScenarioDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly seed: number;
  readonly config: SimulationConfig;
  readonly initialSpacecraftState: SpacecraftState;
  readonly initialClockState: ClockState;
  readonly pulsars: readonly Pulsar[];
}

/**
 * Creates four perfectly orthogonal synthetic pulsars along tetrahedral axes for Known-Answer Tests (KAT).
 */
export function createOrthogonalSyntheticPulsars(): Pulsar[] {
  const directions = [
    new Vector3(1, 0, 0),
    new Vector3(0, 1, 0),
    new Vector3(0, 0, 1),
    new Vector3(1 / Math.sqrt(3), 1 / Math.sqrt(3), 1 / Math.sqrt(3)),
  ];

  return directions.map((dir, idx) => ({
    id: `SYNTH_PSR_${idx + 1}`,
    name: `Synthetic Beacon ${idx + 1}`,
    ra_rad: 0,
    dec_rad: 0,
    directionVector: dir.normalize(),
    timing: {
      epoch_s: 0.0,
      referencePhase_cycles: 0.0,
      f0_hz: 500.0,
      f1_hzps: 0.0,
      f2_hzps2: 0.0,
    },
    flux_phcm2s: 0.01,
    pulseWidth_cycles: 0.05,
    state: "ACTIVE",
  }));
}

/**
 * SCENARIO A: Perfect Known-Answer Geometry
 * 4 orthogonal synthetic pulsars, zero noise, known 1 AU position.
 */
export function getScenarioA(): ScenarioDefinition {
  return {
    id: "SCENARIO_A",
    name: "Perfect Known-Answer Geometry",
    description: "Zero-noise validation test with 4 orthogonal synthetic beacons at 1 AU.",
    seed: 10001,
    config: {
      dt_s: 0.01,
      seed: 10001,
      timeAcceleration: 1.0,
      enablePlanetaryPerturbations: false,
      detectorArea_cm2: 2000.0,
      backgroundRate_phps: 0.0,
    },
    initialSpacecraftState: {
      position_m: new Vector3(ASTRONOMICAL_UNIT_M, 0, 0),
      velocity_mps: new Vector3(0, 29780.0, 0),
      acceleration_mps2: new Vector3(-0.00593, 0, 0),
      time_s: 0.0,
    },
    initialClockState: {
      clockBias_s: 0.0,
      clockDrift_rate: 0.0,
      spacecraftTime_s: 0.0,
    },
    pulsars: createOrthogonalSyntheticPulsars(),
  };
}

/**
 * SCENARIO B: Four-Pulsar Navigation (Realistic Millisecond Constellation)
 */
export function getScenarioB(): ScenarioDefinition {
  return {
    id: "SCENARIO_B",
    name: "Four-Pulsar Navigation",
    description: "Standard deep-space navigation using 4 real millisecond pulsars.",
    seed: 10002,
    config: {
      dt_s: 0.01,
      seed: 10002,
      timeAcceleration: 50.0,
      enablePlanetaryPerturbations: true,
      detectorArea_cm2: 2000.0,
      backgroundRate_phps: 0.05,
    },
    initialSpacecraftState: {
      position_m: new Vector3(1.2 * ASTRONOMICAL_UNIT_M, 0.4 * ASTRONOMICAL_UNIT_M, 0.05 * ASTRONOMICAL_UNIT_M),
      velocity_mps: new Vector3(-8000.0, 26000.0, 1200.0),
      acceleration_mps2: Vector3.zero(),
      time_s: 0.0,
    },
    initialClockState: {
      clockBias_s: 1.2e-5, // +12 microseconds
      clockDrift_rate: 1.5e-11,
      spacecraftTime_s: 1.2e-5,
    },
    pulsars: INITIAL_PULSAR_CATALOG.slice(0, 4),
  };
}

/**
 * SCENARIO C: High Measurement Noise
 */
export function getScenarioC(): ScenarioDefinition {
  return {
    id: "SCENARIO_C",
    name: "High Measurement Noise",
    description: "Severe Poisson counting noise and elevated background radiation.",
    seed: 10003,
    config: {
      dt_s: 0.01,
      seed: 10003,
      timeAcceleration: 50.0,
      enablePlanetaryPerturbations: false,
      detectorArea_cm2: 500.0, // Smaller detector area reduces SNR
      backgroundRate_phps: 2.0, // High background count
    },
    initialSpacecraftState: {
      position_m: new Vector3(1.1 * ASTRONOMICAL_UNIT_M, 0, 0),
      velocity_mps: new Vector3(0, 28000.0, 0),
      acceleration_mps2: Vector3.zero(),
      time_s: 0.0,
    },
    initialClockState: {
      clockBias_s: 5.0e-6,
      clockDrift_rate: 2.0e-11,
      spacecraftTime_s: 5.0e-6,
    },
    pulsars: INITIAL_PULSAR_CATALOG.slice(0, 4),
  };
}

/**
 * SCENARIO D: Single-Pulsar Dropout (3 Pulsars Active)
 */
export function getScenarioD(): ScenarioDefinition {
  const pulsars = INITIAL_PULSAR_CATALOG.slice(0, 4).map((p, idx) => ({
    ...p,
    state: (idx === 0 ? "OCCULTED" : "ACTIVE") as Pulsar["state"],
  }));

  return {
    id: "SCENARIO_D",
    name: "Single-Pulsar Dropout",
    description: "Primary timing beacon occulted; filter operates on 3 line-of-sight constraints.",
    seed: 10004,
    config: {
      dt_s: 0.01,
      seed: 10004,
      timeAcceleration: 50.0,
      enablePlanetaryPerturbations: false,
      detectorArea_cm2: 2000.0,
      backgroundRate_phps: 0.05,
    },
    initialSpacecraftState: {
      position_m: new Vector3(1.3 * ASTRONOMICAL_UNIT_M, 0.2 * ASTRONOMICAL_UNIT_M, 0),
      velocity_mps: new Vector3(0, 25000.0, 0),
      acceleration_mps2: Vector3.zero(),
      time_s: 0.0,
    },
    initialClockState: {
      clockBias_s: 0.0,
      clockDrift_rate: 1.0e-11,
      spacecraftTime_s: 0.0,
    },
    pulsars,
  };
}

/**
 * SCENARIO E: Multiple-Pulsar Dropout (2 Pulsars Active)
 */
export function getScenarioE(): ScenarioDefinition {
  const pulsars = INITIAL_PULSAR_CATALOG.slice(0, 4).map((p, idx) => ({
    ...p,
    state: (idx < 2 ? "ACTIVE" : "OCCULTED") as Pulsar["state"],
  }));

  return {
    id: "SCENARIO_E",
    name: "Multiple-Pulsar Dropout",
    description: "Two beacons occulted; filter maintains dead reckoning with unconstrained axis growth.",
    seed: 10005,
    config: {
      dt_s: 0.01,
      seed: 10005,
      timeAcceleration: 50.0,
      enablePlanetaryPerturbations: false,
      detectorArea_cm2: 2000.0,
      backgroundRate_phps: 0.05,
    },
    initialSpacecraftState: {
      position_m: new Vector3(1.4 * ASTRONOMICAL_UNIT_M, 0, 0),
      velocity_mps: new Vector3(0, 24000.0, 0),
      acceleration_mps2: Vector3.zero(),
      time_s: 0.0,
    },
    initialClockState: {
      clockBias_s: 0.0,
      clockDrift_rate: 1.0e-11,
      spacecraftTime_s: 0.0,
    },
    pulsars,
  };
}

/**
 * SCENARIO F: Poor Geometry (Coplanar Constellation)
 */
export function getScenarioF(): ScenarioDefinition {
  // 4 pulsars lying nearly in the ecliptic plane (Z ~ 0)
  const coplanarPulsars: Pulsar[] = [0, 90, 180, 270].map((deg, idx) => ({
    id: `COPLANAR_${idx + 1}`,
    name: `Ecliptic Beacon ${idx + 1}`,
    ra_rad: degToRad(deg),
    dec_rad: degToRad(0.01 * (idx - 1.5)), // very small out-of-plane separation
    directionVector: computeDirectionVector(degToRad(deg), degToRad(0.01 * (idx - 1.5))),
    timing: {
      epoch_s: 0.0,
      referencePhase_cycles: 0.0,
      f0_hz: 400.0 + idx * 50.0,
      f1_hzps: -1.0e-14,
      f2_hzps2: 0.0,
    },
    flux_phcm2s: 0.002,
    pulseWidth_cycles: 0.05,
    state: "ACTIVE",
  }));

  return {
    id: "SCENARIO_F",
    name: "Poor Geometry (Coplanar Constellation)",
    description: "Pulsars lie near a single geometric plane, yielding high GDOP and vertical dilution.",
    seed: 10006,
    config: {
      dt_s: 0.01,
      seed: 10006,
      timeAcceleration: 50.0,
      enablePlanetaryPerturbations: false,
      detectorArea_cm2: 2000.0,
      backgroundRate_phps: 0.05,
    },
    initialSpacecraftState: {
      position_m: new Vector3(ASTRONOMICAL_UNIT_M, 0, 0),
      velocity_mps: new Vector3(0, 29780.0, 0),
      acceleration_mps2: Vector3.zero(),
      time_s: 0.0,
    },
    initialClockState: {
      clockBias_s: 0.0,
      clockDrift_rate: 0.0,
      spacecraftTime_s: 0.0,
    },
    pulsars: coplanarPulsars,
  };
}

/**
 * SCENARIO G: Signal Recovery After Outage
 */
export function getScenarioG(): ScenarioDefinition {
  return {
    id: "SCENARIO_G",
    name: "Signal Recovery After Outage",
    description: "Simulates initial 4-pulsar lock, full signal blackout, and rapid re-convergence.",
    seed: 10007,
    config: {
      dt_s: 0.01,
      seed: 10007,
      timeAcceleration: 50.0,
      enablePlanetaryPerturbations: false,
      detectorArea_cm2: 2000.0,
      backgroundRate_phps: 0.05,
    },
    initialSpacecraftState: {
      position_m: new Vector3(1.5 * ASTRONOMICAL_UNIT_M, 0.5 * ASTRONOMICAL_UNIT_M, 0),
      velocity_mps: new Vector3(-5000.0, 22000.0, 0),
      acceleration_mps2: Vector3.zero(),
      time_s: 0.0,
    },
    initialClockState: {
      clockBias_s: 2.0e-5,
      clockDrift_rate: 3.0e-11,
      spacecraftTime_s: 2.0e-5,
    },
    pulsars: INITIAL_PULSAR_CATALOG.slice(0, 4),
  };
}

/**
 * SCENARIO H: Clock Drift
 */
export function getScenarioH(): ScenarioDefinition {
  return {
    id: "SCENARIO_H",
    name: "Clock Drift",
    description: "Evaluates receiver clock bias decoupling under high oscillator drift (1e-8 s/s).",
    seed: 10008,
    config: {
      dt_s: 0.01,
      seed: 10008,
      timeAcceleration: 50.0,
      enablePlanetaryPerturbations: false,
      detectorArea_cm2: 2000.0,
      backgroundRate_phps: 0.05,
    },
    initialSpacecraftState: {
      position_m: new Vector3(ASTRONOMICAL_UNIT_M, 0, 0),
      velocity_mps: new Vector3(0, 29780.0, 0),
      acceleration_mps2: Vector3.zero(),
      time_s: 0.0,
    },
    initialClockState: {
      clockBias_s: 1.0e-4, // +100 microseconds initial bias
      clockDrift_rate: 1.0e-8, // High drift rate
      spacecraftTime_s: 1.0e-4,
    },
    pulsars: INITIAL_PULSAR_CATALOG.slice(0, 4),
  };
}

/**
 * Retrieves a scenario definition by string ID (e.g. "scenario-a", "SCENARIO_A").
 */
export function getScenarioById(id: string): ScenarioDefinition | undefined {
  const normalized = id.toUpperCase().replace("-", "_");
  switch (normalized) {
    case "SCENARIO_A": return getScenarioA();
    case "SCENARIO_B": return getScenarioB();
    case "SCENARIO_C": return getScenarioC();
    case "SCENARIO_D": return getScenarioD();
    case "SCENARIO_E": return getScenarioE();
    case "SCENARIO_F": return getScenarioF();
    case "SCENARIO_G": return getScenarioG();
    case "SCENARIO_H": return getScenarioH();
    default: return undefined;
  }
}
