# PULSAR-X — Target System Architecture

## 1. Architectural Overview & System Decomposition

**PULSAR-X** is an interactive, competition-grade astronomical simulation of deep-space navigation using millisecond X-ray pulsars (XPNAV). The architecture is designed to guarantee **scientific determinism**, **60+ FPS rendering performance**, and **cinematic narrative pacing** while maintaining a clean, decoupled code structure.

### High-Level Data Flow Diagram

```
+---------------------------------------------------------------------------------------+
|                                    USER INTERACTION                                    |
|   +------------------------------------+    +-------------------------------------+   |
|   |       CINEMATIC CONTROLS           |    |         SCIENCE LAB CONTROLS        |   |
|   | Play / Pause / Scrub / Skip Scene  |    | Inject Noise / Disable Beacons / dt |   |
|   +-----------------+------------------+    +------------------+------------------+   |
+---------------------|------------------------------------------|----------------------+
                      |                                          |
                      | Dispatch Actions                         | Update Parameters
                      v                                          v
+---------------------------------------------------------------------------------------+
|                                MAIN THREAD STATE LAYER                                |
|   +------------------------------------+    +-------------------------------------+   |
|   |         useCinematicStore          |    |         useSimulationStore          |   |
|   | Active Scene, Camera Waypoints     |    | Scenario Config, Clock Scale, State |   |
|   +-----------------+------------------+    +------------------+------------------+   |
|                     |                                          |                      |
|                     | Timeline Triggers                        | PostMessage (Params) |
|                     v                                          v                      |
+---------------------------------------------------------------------------------------+
                                                                 |
                                       Transferable ArrayBuffer  |
                                       or JSON Command Payload   v
+---------------------------------------------------------------------------------------+
|                              SIMULATION WEB WORKER THREAD                              |
|                                                                                       |
|   +--------------------+     +---------------------+     +------------------------+   |
|   |  SIMULATION CLOCK  | --> |   ORBIT PROPAGATOR  | --> |   RELATIVISTIC TOA     |   |
|   | Fixed dt, Seed PRNG|     | Spacecraft State    |     | Rømer, Einstein, Shap. |   |
|   +--------------------+     +---------------------+     +-----------+------------+   |
|                                                                      |                |
|                                                                      v                |
|   +--------------------+     +---------------------+     +------------------------+   |
|   | TELEMETRY SERIAL.  | <-- |  IEKF STATE SOLVER  | <-- |   OBSERVATION ENGINE   |   |
|   | Flat Float64Array  |     | Position, Covariance|     | Photon Poisson Counts  |   |
|   +---------+----------+     +---------------------+     +------------------------+   |
+-------------|-------------------------------------------------------------------------+
              |
              | High-Frequency Telemetry Stream (ArrayBuffer / Transferable @ 60Hz)
              v
+---------------------------------------------------------------------------------------+
|                                MAIN THREAD CONSUMERS                                  |
|                                                                                       |
|   +-------------------------------------------------------------------------------+   |
|   |                         RING BUFFER / TELEMETRY DECODER                       |   |
|   +-----------------------+-------------------------------+-----------------------+   |
|                           |                               |                           |
|       Downsampled (15-20Hz) Direct Interpolation (60-120Hz)| Synchronous Events        |
|                           v                               v                           v
|   +-------------------------------+ +---------------------------+ +---------------+   |
|   |       HUD & SCIENCE LAB       | |    3D RENDER PIPELINE     | |   PROCEDURAL  |   |
|   | - Recharts TOA Residuals      | | - R3F Canvas & Scene Graph| |   AUDIO (API) |   |
|   | - GDOP Error Ellipse Readouts | | - Spacecraft & Beacons    | | - Pulse Audio |   |
|   | - Coordinate Error Discrepancy| | - Custom Beam Shaders     | | - Thruster Hum|   |
|   | - Photon Count Histograms     | | - Postprocessing Passes   | | - Alarm SFX   |   |
|   +-------------------------------+ +---------------------------+ +---------------+   |
+---------------------------------------------------------------------------------------+
```

---

## 2. Major Architectural Domains

### 2.1 Application Domain (Next.js 16 App Router)
- **App Shell:** A unified, single-page application hosted at `/`. Rather than routing between disjoint pages, the application transitions dynamically between **Cinematic Mission Mode** and **Science Lab Mode** using layout layers.
- **Root Layout (`app/layout.tsx`):** Mounts global typography (Geist Sans, Geist Mono, Inter), dark-mode base tokens, viewport metadata, and the WebGL canvas host.
- **Client Root (`app/page.tsx`):** A client component orchestrator that instantiates the Simulation Web Worker, binds procedural audio listeners, mounts the R3F `<Canvas>`, and renders the HUD/Lab overlays.
- **Error Boundaries:** A dedicated `WebGLErrorBoundary` encapsulates the 3D viewport. If WebGL context loss occurs or shaders fail on non-standard mobile drivers, the UI displays an aerospace diagnostic fallback screen without crashing the application shell.
- **Loading & Initialization:** Pre-calculates astronomical constants, verifies WebGL2 capabilities, warms up procedural audio buffers, and displays a telemetry calibration loading screen.

### 2.2 Simulation Domain (Physics & Astronomy Core)
The simulation domain is completely decoupled from UI and rendering libraries. It runs strictly within the Web Worker.
- **Simulation Clock:** Driven by a high-resolution fixed time step ($\Delta t = 0.01\text{ s}$ or configurable). Supports accelerated time factors ($1\times, 5\times, 10\times, 50\times$) while guaranteeing numerical integrator stability.
- **Deterministic Seed Manager:** All stochastic processes (photon arrival Poisson noise, star tracker noise, clock drift) are governed by a PRNG initialized from an integer seed (`seed = 193721`).
- **Spacecraft Kinematics:** 6-DoF state vector $[\mathbf{r}, \mathbf{v}, \mathbf{a}]$ integrated using Runge-Kutta 4th Order (RK4). Gravitational acceleration includes Solar gravity, analytical Keplerian planetary perturbations, and spacecraft thrust impulses.
- **Pulsar Model:** Maintains an astronomical catalog of millisecond pulsars (e.g., PSR B1937+21, PSR B1821-24, PSR J0437-4715, PSR J0218+4232). Computes rotational phase evolution $\Phi(t) = \Phi_0 + \nu(t - t_0) + \frac{1}{2}\dot{\nu}(t - t_0)^2$.
- **Signal & Observation Model:** Translates spacecraft proper time into Barycentric Coordinate Time (TCB/TDB). Computes geometric Rømer delay, solar relativistic Einstein delay, and gravitational Shapiro delay with regularized solar impact parameters. Simulates discrete X-ray photon arrivals using inhomogeneous Poisson processes scaled by detector effective area ($A_{det} = 2,000\text{ cm}^2$) and simulation acceleration factor ($\kappa$).
- **Navigation Solver:** Implements both a Snapshot Non-Linear Least Squares solver and an 8-state Iterated Extended Kalman Filter (IEKF). Updates spacecraft state estimate $\mathbf{\hat{x}} \in \mathbb{R}^8$, error covariance matrix $P$, Position Dilution of Precision ($\text{PDOP}$), and full 4D Geometric Dilution of Precision ($\text{GDOP}$). *Observability Principle:* Instantaneous scalar TOA measurements directly constrain spatial position and clock bias along line-of-sight vectors; velocity $\mathbf{v}$ and clock drift $\dot{\delta} t$ are estimated dynamically over time via the orbital state transition matrix $\Phi$.
- **Uncertainty & Degradation Model:** Simulates sensor degradation, solar occultation blinding, cosmic ray background spikes, and clock jitter. When measurements are lost, the filter maintains state propagation via dead reckoning while covariance grows monotonically.

### 2.3 Web Worker Domain (Off-Thread Computing)
- **Worker Script (`src/workers/simulation.worker.ts`):** Dedicated worker thread created via standard Web Worker API (`new Worker(new URL(...), { type: 'module' })`).
- **Communication Protocol:**
  - **Main $\to$ Worker Commands:** Strongly typed command union (`SIM_INIT`, `SIM_STEP`, `SIM_SET_PLAYBACK`, `SIM_UPDATE_PARAMS`, `SIM_INJECT_FAULT`, `SIM_RESET`).
  - **Worker $\to$ Main Telemetry:** Dispatched using transferrable `ArrayBuffer` payloads encoding a flat binary telemetry structure (`Float64Array`).
- **Serialization Strategy:** Zero JSON stringification on the critical animation path. Key numerical state (spacecraft position $[x,y,z]$, estimated position $[\hat{x},\hat{y},\hat{z}]$, velocity $[v_x, v_y, v_z]$, GDOP, covariance eigenvalues $[\lambda_1, \lambda_2, \lambda_3]$, active pulsar lock mask) is packed directly into typed buffers.

### 2.4 Rendering Domain (Three.js & React Three Fiber)
- **Engine:** Three.js 0.186 under `@react-three/fiber` (R3F) 9.
- **Scene Graph Hierarchy:**
  ```
  SceneRoot
  ├── CelestialUniverse (Cosmic Background)
  │   ├── InstancedMilkyWayStars (25,000 instanced points)
  │   └── DeepSpaceSkybox (Procedural nebula shader)
  ├── SolarSystemBarycenter (Inertial reference frame origin)
  │   ├── SunNode (Light source + procedural corona shader)
  │   └── EarthNode (High-resolution globe + atmospheric rim shader)
  ├── PulsarBeacons (Group of active navigation beacons)
  │   └── PulsarNode (x N)
  │       ├── NeutronCoreMesh
  │       ├── RelativisticJetCones (Custom additive shader)
  │       └── SightlineVector (Dynamic line geometry to spacecraft)
  ├── SpacecraftNode (Rigid body + camera target)
  │   ├── SpacecraftModel (Detailed exploration probe)
  │   ├── XRayCollimatorGimbals (Orienting toward active pulsars)
  │   └── UncertaintyEllipsoid (Parametric wireframe mesh shaped by P-matrix)
  └── CameraRig (Orchestrated by Cinematic Director / User Orbit)
  ```
- **Post-Processing Pipeline (`@react-three/postprocessing`):**
  - Selective UnrealBloom: Accretion disks and relativistic pulsar jets.
  - Chromatic Aberration: Dynamically driven by navigation uncertainty (increases when GPS/Pulsar lock is lost).
  - Vignette & Film Grain: Cinematic 35mm film emulation.
  - Tone Mapping: ACESFilmicToneMapping for high dynamic range star lighting.

### 2.5 Cinematic Director Domain (GSAP & Story Orchestration)
- **Director Engine:** A dedicated module coordinating GSAP 3.15 timelines, camera positions, FOVs, focus targets, and narrative captions.
- **Decoupled Playhead:** Can either run autonomously along an 18-scene sequence or lock to the real-time simulation clock.
- **Simulation-Triggered Events:** Uses observer callbacks to trigger cinematic beats when physical thresholds are crossed:
  - When distance from Earth exceeds $50,000\text{ km} \implies$ Trigger Scene 05 (GPS Lost).
  - When Kalman filter covariance drops below target threshold $\implies$ Trigger Scene 13 (Position Lock).
- **User Override:** If the user moves the orbit controls or selects Science Lab mode, GSAP smoothly yields camera control without resetting simulation state.

### 2.6 Audio Domain (Web Audio API Procedural Synthesis)
- **No Heavy Audio Assets:** 100% procedurally synthesized in real time via native Web Audio nodes.
- **Synthesized Voice Architecture:**
  - **Pulsar Strobe Synth:** High-frequency pulse clicker synced to millisecond pulsar periods ($\nu = 1/P$).
  - **X-Ray Photon Geiger:** Random Poisson-distributed click generator whose frequency scales with observed X-ray flux.
  - **Spacecraft Life Support / Thruster Hum:** Low-frequency brown noise passed through resonant biquad bandpass filters.
  - **Telemetry Lock Tones:** Dual-tone multi-frequency (DTMF) style aerospace acquisition chimes.
  - **Alarm / Degraded Lock Warn:** Pulsing low-square wave warning klaxon.
- **Audio Context Safety:** Initialized in suspended state; resumes upon user interaction with a master volume and instant mute button.

### 2.7 Science Lab Domain (Interactive Analysis & Instrumentation)
- **Instrumentation Panel:** Built with shadcn/Base UI components and styled with Tailwind v4.
- **Live Data Plots via Recharts:**
  - **Pulse Profile Folding:** Folded photon count vs pulse phase $\phi \in [0, 1)$.
  - **TOA Residuals:** Scatter plot of observed minus predicted arrival times ($t_{obs} - t_{pred}$) over time.
  - **GDOP History:** Continuous line plot displaying Geometric Dilution of Precision.
  - **Position Error Convergence:** True error $||\mathbf{r}_{true} - \mathbf{\hat{r}}||$ vs estimated $3\sigma$ bounds.
- **Experimentation Controls:**
  - Slider: Injected timing jitter ($\sigma_t$).
  - Toggle: Disable individual pulsars to observe geometric degradation.
  - Slider: Spacecraft clock drift ($\dot{\delta t}$).
  - Button: Trigger solar occultation or sudden sensor failure.

### 2.8 State Domain (Stratified Zustand Stores)
State is explicitly segregated into four independent stores to prevent cross-domain rerenders:
1. `useSimulationStore`: Worker lifecycle, execution mode, scenario parameters, physical constants.
2. `useTelemetryStore`: Throttled (15–20 Hz) telemetry snapshots for React UI and Recharts.
3. `useCinematicStore`: Active scene (01–18), play/pause state, camera target, subtitles.
4. `useUIStore`: Active mode (Cinematic vs Science Lab), drawer positions, inspector target, audio levels.

---

## 3. Dependency Architecture & Review

In accordance with Phase 1 instructions, the existing dependencies have been audited and categorized without adding unapproved packages:

| Dependency | Version | Architectural Domain | Purpose in PULSAR-X | Redundancy Assessment |
| :--- | :--- | :--- | :--- | :--- |
| `next` | 16.3.5 | Core Runtime | Next.js 16 framework, App Router, asset server, Turbopack | **Essential** |
| `react`, `react-dom` | 19.2.8 | Core Runtime | React 19 UI component foundation | **Essential** |
| `typescript` | ^5 | Core Tooling | Static typing across scientific and UI code | **Essential** |
| `three` | ^0.186.0 | 3D Rendering | WebGL 3D graphics engine | **Essential** |
| `@react-three/fiber` | ^9.7.0 | 3D Rendering | React reconciler for Three.js scene graph | **Essential** |
| `@react-three/drei` | ^10.7.8 | 3D Rendering | R3F camera controls, primitives, and shaders | **Essential** |
| `@react-three/postprocessing` | ^3.1.1 | 3D Rendering | Declarative post-processing pipeline for R3F | **Essential** |
| `postprocessing` | ^6.39.5 | 3D Rendering | Underlying high-performance postprocessing library | **Essential** |
| `gsap` | ^3.15.0 | Animation | Cinematic Director camera choreographies & timelines | **Essential** |
| `motion` | ^13.4.0 | UI Animation | Fluid React UI transitions, HUD cards, drawer transitions | **Keep** (UI only, distinct from 3D GSAP) |
| `zustand` | ^5.0.15 | State Management | Decoupled, performant state stores outside React | **Essential** |
| `recharts` | ^3.10.1 | Data Visualization | Scientific residual plots, light curves, GDOP charts | **Essential** |
| `lucide-react` | ^1.47.0 | UI / Icons | Aerospace telemetry and navigation iconography | **Essential** |
| `@base-ui/react` | ^1.8.0 | UI Components | Headless accessible UI primitives for shadcn | **Essential** |
| `tailwindcss` | ^4 | Styling | Utility CSS styling system | **Essential** |
| `clsx`, `tailwind-merge` | Latest | Styling | Dynamic className merging utilities | **Essential** |
| `cmdk` | ^1.1.1 | UI | Command palette for spacecraft mission navigation | **Optional** (Keep for search palette) |
| `cn` | ^0.3.0 | Utility | Standalone cn package (already in lib/utils) | Documented; keep to avoid churn |
| `tw-animate-css` | ^1.4.0 | Styling | Keyframe animations for HUD warning strobes | **Keep** |

**Verdict:** Zero new dependencies are required for Phase 1. The existing stack contains all necessary libraries for competitive 3D rendering, scientific charting, cinematic animation, and high-performance UI.

---

## 4. Reverse Data Flow (User Experiments $\to$ Simulation)

When the user interacts with Science Lab controls, parameters flow back into the simulation without recreating the Web Worker:

```
[Science Lab Slider: Injected Jitter = 120 ns]
                  |
                  v
       [useUIStore / Action Trigger]
                  |
                  v
[useSimulationStore.updateParameters({ timingJitter_ns: 120 })]
                  |
                  v  PostMessage({ type: 'UPDATE_PARAMS', payload: { ... } })
    [Simulation Web Worker Thread]
                  |
                  v
      [PulsarObservationEngine]
        Updates Gaussian noise variance: sigma_t = 120e-9
                  |
                  v  Next RK4 / IEKF Integration Step
        IEKF residual covariance R adjusted
        Position uncertainty ellipsoid immediately expands
                  |
                  v  Telemetry ArrayBuffer transfer
      [Main Thread 3D Viewport]
        UncertaintyEllipsoid mesh dynamically scales on next frame
```

---

## 5. Deployment & Vercel Constraints

- **Static Generation (`next build`):** Entire web application builds statically. No serverless functions or backend databases are required.
- **Worker Script Bundling:** Simulation workers are bundled directly by Next.js/Turbopack via worker URLs, eliminating CORS issues on CDN edge nodes.
- **Header Configurations:** COOP (Cross-Origin-Opener-Policy) and COEP (Cross-Origin-Embedder-Policy) will be configured in `next.config.ts` if `SharedArrayBuffer` is enabled in future phases, with graceful fallback to transferable `ArrayBuffer` objects for universal compatibility.
