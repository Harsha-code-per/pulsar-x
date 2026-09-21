# PULSAR-X — Critical Navigation Solver Telemetry Audit

## 1. Executive Summary

In accordance with Section 30 of the Phase 5 engineering requirements, an exhaustive source-code audit was conducted on the active simulation engine producing navigation telemetry for **PULSAR-X**.

The objective is to determine with zero ambiguity whether the live navigation state displayed in the HUD, developer overlay, and 3D visualization is produced by:
- An Iterated Extended Kalman Filter (IEKF),
- A Batch Least Squares solver, or
- Another estimation algorithm.

---

## 2. Definitive Finding

> [!IMPORTANT]
> **Definitive Solver Identification**:
> The active, live navigation telemetry is produced by an **Iterative Batch Weighted Least Squares Solver** (`solveBatchLeastSquares`), augmented with **Runge-Kutta 4th-Order (RK4) Orbital Dead-Reckoning** (`deadReckonStep`) and finite-difference velocity estimation smoothed against orbital dynamics.
> 
> While historical documentation and comments in earlier planning briefs referenced an "Iterated Extended Kalman Filter (IEKF)", **the active runtime execution path strictly invokes `solveBatchLeastSquares`**. 
>
> In strict compliance with the **PULSAR-X Scientific Integrity Constitution** (`AGENTS.md` and `docs/SCIENTIFIC_INTEGRITY.md`), all new UI labels, developer diagnostics, and documentation must accurately identify the solver as **Iterative Batch Least Squares / Dynamic Estimator**, and must **never falsely label it as an IEKF or Kalman Filter**.

---

## 3. End-to-End Execution Call Chain

The complete execution chain from worker simulation tick to telemetry output is traced below:

```
SimulationRuntime.advanceScientificStep() (dt = 0.05 s)
│
├── 1. Fault Countdown Processing (SimulationFault[])
│
├── 2. True Dynamics Propagation (stepSpacecraftStateRK4)
│      └── Heliocentric 2-body + optional planetary perturbations (Sun, Earth, Jupiter)
│
├── 3. True Clock State Propagation (stepClockState)
│      └── Deterministic polynomial drift + PRNG phase diffusion
│
├── 4. Photon Event Accumulation (accumulatePhotons)
│      └── Inhomogeneous Poisson draws per active pulsar:
│          rate = (flux * effectiveArea * 0.01) + backgroundRate
│
├── 5. Observation Batch Check (observationAccumulator_s >= observationInterval_s)
│      │
│      ├── [BRANCH A: Batch Interval Reached (cadence = 0.5 s)]
│      │   └── SimulationRuntime.processObservationBatch()
│      │       │
│      │       ├── Formulate BatchObservationInput[]:
│      │       │   - directionVector: n_hat_i
│      │       │   - measuredPseudorange_m = (trueRoemer_s + clockBias_s + jitter_s) * c
│      │       │   - sigma_m = jitter_s * c
│      │       │
│      │       ├── Solvability Check: if (batchInputs.length >= 4)
│      │       │   │
│      │       │   ├── [>= 4 Pulsars Available]
│      │       │   │   └── solveBatchLeastSquares(batchInputs, initialGuess)
│      │       │   │       ├── Solves delta_x = (H^T W H)^(-1) H^T W delta_z iteratively (Gauss-Newton)
│      │       │   │       ├── Returns: position_m, clockBias_s, covariance4x4, rmsResidual_m, status: LOCKED
│      │       │   │       │
│      │       │   │       ├── Velocity Estimation:
│      │       │   │       │   velEst = (estimatedPosition_m - prevEstPos) / dtObs
│      │       │   │       │   estimatedVelocity_mps = estimatedVelocity_mps * 0.7 + velEst * 0.3
│      │       │   │       │
│      │       │   │       └── Covariance Matrix Update:
│      │       │   │           covarianceMatrix[0..2, 0..2] = solverResult.covariance4x4[0..2, 0..2]
│      │       │   │
│      │       │   └── [< 4 Pulsars Available]
│      │       │       └── SimulationRuntime.handleSolverFailure()
│      │       │           ├── navStatus = "DEGRADED"
│      │       │           └── Covariance growth: diag += 1e6 * processNoiseScale
│      │       │
│      │       └── emitAnalyticalTelemetry() (emits folded profiles & residuals)
│      │
│      └── [BRANCH B: Intermediate Step (Between Batches)]
│          └── SimulationRuntime.deadReckonStep(dt_s)
│              ├── Propagates estimated position using stepSpacecraftStateRK4
│              ├── Integrates clock bias: estimatedClockBias_s += clockDrift_rate * dt_s
│              └── Applies continuous covariance diffusion: diag += 100.0 * dt_s * processNoiseScale
│
└── 6. Telemetry Emission (emitTelemetryFrame)
       └── Broadcasts WorkerTelemetryFrame containing position, velocity, covariance, GDOP, PDOP, navStatus
```

---

## 4. Detailed Specification of Inputs & Telemetry Fields

### 4.1 State Inputs
- `estimatedPosition_m`: 3D Cartesian coordinates in Solar System Barycentric (SSB) frame $[x, y, z]$ in meters ($\text{m}$).
- `estimatedVelocity_mps`: 3D velocity vector $[\dot{x}, \dot{y}, \dot{z}]$ in meters per second ($\text{m/s}$).
- `estimatedClockBias_s`: Spacecraft receiver clock bias $\delta t$ in seconds ($\text{s}$).
- `estimatedClockDrift_rate`: Clock drift rate $\dot{\delta t}$ in seconds per second ($\text{s/s}$).

### 4.2 Measurement Inputs
- `directionVector`: Unit vector $\mathbf{\hat{n}}_i$ from SSB toward pulsar.
- `measuredPseudorange_m`: Scalar pseudorange $z_i = c \cdot (\Delta t_{Rømer} + \delta t_{clock} + \epsilon_{jitter})$ in meters ($\text{m}$).
- `sigma_m`: Measurement 1-sigma uncertainty $\sigma_{range} = c \cdot \sigma_{jitter}$ in meters ($\text{m}$).

### 4.3 Covariance Source
- When $\ge 4$ pulsars are available: The upper-left $3\times 3$ block of the batch solver's $4\times 4$ normal equations inverse:
  $$P_{pos} = \left[ (H^T W H)^{-1} \right]_{1..3, 1..3}$$
- During dead reckoning ($< 4$ pulsars or between batches): Covariance diffuses continuously along diagonal elements via process noise accumulation.
- Principal axes and orientation: Computed via Jacobi eigendecomposition (`decomposeUncertaintyAxes`) yielding eigenvalues $\lambda_1 \ge \lambda_2 \ge \lambda_3$ and orthonormal eigenvectors $\mathbf{v}_1, \mathbf{v}_2, \mathbf{v}_3$.

---

## 5. Terminology Mismatches & Corrections

| Location | Prior Terminology | Audited Reality | Required Action |
| :--- | :--- | :--- | :--- |
| `ViewportControls.tsx` | "KALMAN FILTER STATUS" (in brief) | Batch Least Squares + RK4 Dead Reckoning | Label as "ESTIMATOR STATE" or "NAVIGATION FILTER" |
| `DeveloperOverlay.tsx` | "NAV STATE: LOCKED" | Accurate (Reflects solver convergence) | Maintain |
| `docs/CINEMATIC_DESIGN.md` | "Iterated Extended Kalman Filter (IEKF)" | Pedagogical narrative target | Maintain in narrative docs, but note runtime implementation |
| `docs/SCIENTIFIC_MODEL.md` | Equations for both Batch & Kalman | Fully documented in theory | Note that Phase 1–5 runtime employs the Batch solver |

---

## 6. Engineering Rule for Phase 5 & Beyond

1. **Do Not Replace the Solver**: The batch solver is stable, deterministic, computationally efficient for browser Web Workers, and passes all 57 automated tests. It must remain intact.
2. **Do Not Fabricate Terminology**: Never render "IEKF" or "Extended Kalman Filter" in user-facing UI when the underlying calculation is Batch Least Squares. Use scientifically honest terms:
   - "Autonomous Navigation Solver"
   - "Batch Estimator"
   - "Least Squares Navigation Filter"
3. **Preserve Ground Truth**: All covariance ellipsoids, position errors, and GDOP readouts in the 3D viewport originate directly from `solverResult.covariance4x4` and `calculateGeometryMetrics`.
