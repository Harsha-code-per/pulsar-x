# PULSAR-X — Master Development Roadmap (Phases 1–13)

## 1. Roadmap Strategy & Phase Structure

To ensure rigorous architectural discipline and prevent chaotic development, **PULSAR-X** is structured into **13 distinct, sequential engineering phases**. Each phase has explicit dependencies, concrete deliverables, and measurable acceptance criteria.

No phase may be started until the preceding phase has satisfied all verification gates.

---

## 2. Detailed Phase Breakdown

---

### PHASE 1: Architecture, Scientific Design & Engineering Planning (CURRENT)
- **Objective:** Establish the complete architectural foundation, scientific mathematical models, cinematic narrative structure, performance criteria, validation suite, and permanent engineering rules.
- **Dependencies:** Initial repository inspection.
- **Deliverables:**
  - `AGENTS.md` (Permanent engineering rules & nextjs-agent-rules preservation)
  - `docs/ARCHITECTURE.md` (System domains, decoupled layers, dependency audit, data flows)
  - `docs/SCIENTIFIC_MODEL.md` (XPNAV physics, relativistic TOA equations, IEKF solver formulation)
  - `docs/CINEMATIC_DESIGN.md` (18-scene director specification, camera choreography, cues)
  - `docs/PERFORMANCE.md` (Performance targets, worker decoupling, instancing, quality tiers)
  - `docs/ASSET_PLAN.md` (Asset catalog, licenses, procedural fallbacks)
  - `docs/VALIDATION_PLAN.md` (4-tier verification protocol: science, simulation, rendering, application)
  - `docs/ROADMAP.md` (13-phase master execution plan)
  - `docs/PROJECT_BRIEF.md` (High-level vision, tagline, two operating modes)
- **Verification:**
  - `npm run lint` exits code `0`.
  - `npm run build` exits code `0`.
  - No new unapproved dependencies in `package.json`.
  - `package-lock.json` remains authoritative.

---

### PHASE 2: Scientific Core Engine
- **Objective:** Implement the pure TypeScript scientific computing engine for celestial mechanics and pulsar timing in isolation from any UI or 3D code.
- **Dependencies:** Phase 1 architecture approval.
- **Deliverables:**
  - `src/sim/math/vector3.ts` & `matrix3.ts` (High-performance 3D vector and matrix math routines).
  - `src/sim/astronomy/constants.ts` (Astronomical and physical constants in SI units).
  - `src/sim/astronomy/pulsar-catalog.ts` (Validated pulsar astronomical database: ATNF / NICER).
  - `src/sim/physics/orbit-propagator.ts` (Keplerian + perturbations RK4 integrator).
  - `src/sim/physics/relativistic-toa.ts` (Rømer, dimensionally audited Einstein, regularized Shapiro delay calculators).
  - `src/sim/navigation/iekf-solver.ts` (8-state Iterated Extended Kalman Filter with dynamic observability over time).
  - `src/sim/navigation/gdop.ts` (Distinct Position-only PDOP and 4D GDOP condition calculators).
- **Verification:**
  - Unit tests executing Known-Answer Tests (KAT) for 3D state inversion.
  - Automated dimensional analysis assertions ensuring all delay functions return physical seconds.
  - Verification of canonical Rømer delay at $1\text{ AU}$ ($499.00478\dots\text{ s}$) with sign check.
  - Verification of monotonic covariance growth during measurement outages.
  - Energy conservation test on RK4 Keplerian propagation ($< 10^{-6}$ error).

---

### PHASE 3: Simulation Web Worker
- **Objective:** Encapsulate the scientific engine into an off-thread Web Worker with a high-throughput, zero-allocation messaging protocol.
- **Dependencies:** Phase 2.
- **Deliverables:**
  - `src/workers/simulation.worker.ts` (Worker loop with fixed $\Delta t$ simulation clock).
  - `src/workers/protocol.ts` (Strict TypeScript discriminated union message types).
  - `src/workers/telemetry-buffer.ts` (Flat Float64Array binary telemetry serializer/deserializer).
  - `src/hooks/use-simulation-worker.ts` (React hook managing worker lifecycle and heartbeats).
- **Verification:**
  - Worker runs at 100 Hz internal ticks without blocking the main browser thread.
  - Zero JSON allocations on the high-frequency telemetry channel.
  - Clean worker termination and restart on demand.

---

### PHASE 4: 3D Celestial Environment
- **Objective:** Construct the Three.js / React Three Fiber world scene graph, celestial coordinates, planetary bodies, and starfield.
- **Dependencies:** Phase 1.
- **Deliverables:**
  - `src/components/canvas/SceneRoot.tsx` (R3F canvas container with adaptive DPR).
  - `src/components/canvas/celestial/Starfield.tsx` (Instanced 25,000-star Hipparcos skybox).
  - `src/components/canvas/celestial/Sun.tsx` (Solar light source and procedural corona shader).
  - `src/components/canvas/celestial/Earth.tsx` (High-resolution Earth globe with atmospheric rim).
  - `src/components/canvas/spacecraft/Spacecraft.tsx` (Probe 3D mesh with articulable collimators).
  - `src/components/canvas/CameraRig.tsx` (Flexible camera controller supporting GSAP and user orbit).
- **Verification:**
  - Sustained 60 FPS on desktop with $< 30$ total draw calls.
  - Proper coordinate transformation matching the ICRF inertial frame.

---

### PHASE 5: Pulsar Visual System
- **Objective:** Implement the visual representations of millisecond pulsars, sweeping relativistic beams, and line-of-sight navigation vectors.
- **Dependencies:** Phase 2, Phase 4.
- **Deliverables:**
  - `src/components/canvas/pulsars/PulsarBeacon.tsx` (Neutron star core, spinning magnetic axis).
  - `src/components/canvas/pulsars/RelativisticJetShader.ts` (Volumetric beam GLSL shader).
  - `src/components/canvas/pulsars/SightlineVectors.tsx` (Dynamic line geometry connecting craft to pulsars).
  - `src/components/canvas/spacecraft/UncertaintyEllipsoid.tsx` (3D wireframe covariance ellipsoid).
- **Verification:**
  - Pulsar visual rotation speeds synchronize with true astronomical periods or normalized pedagogical tempos.
  - Uncertainty ellipsoid dynamically stretches, rotates, and contracts according to live Kalman covariance eigenvalues.

---

### PHASE 6: Cinematic Director
- **Objective:** Implement the GSAP-driven narrative director orchestrating the 18-scene sequence, camera choreographies, and caption overlays.
- **Dependencies:** Phase 3, Phase 4, Phase 5.
- **Deliverables:**
  - `src/cinematic/director-timeline.ts` (Master GSAP timeline definition across Scenes 01–18).
  - `src/cinematic/scene-definitions.ts` (Camera waypoints, lighting states, and duration configs).
  - `src/components/hud/CinematicHUD.tsx` (Subtitles, mission status badges, timeline scrubber).
  - `src/cinematic/simulation-triggers.ts` (Event listeners binding simulation milestones to scenes).
- **Verification:**
  - Smooth execution of full 18-scene narrative with zero frame hitching during camera transitions.
  - Ability to pause, scrub, resume, or break out into manual inspection at any frame.

---

### PHASE 7: Procedural Audio Engine
- **Objective:** Build the browser-native Web Audio synthesizer providing realistic, simulation-synchronized acoustic feedback.
- **Dependencies:** Phase 3.
- **Deliverables:**
  - `src/audio/audio-context-manager.ts` (Safe AudioContext initialization, unlock on gesture, master volume).
  - `src/audio/synths/pulsar-strobe-synth.ts` (Strobe tone generator matched to millisecond pulsar spin).
  - `src/audio/synths/photon-geiger-synth.ts` (Poisson noise burst generator for X-ray photon arrivals).
  - `src/audio/synths/spacecraft-ambience-synth.ts` (Low-frequency hull vibration and filtered noise).
  - `src/audio/synths/telemetry-chimes.ts` (Aerospace dual-tone lock cues and warning alarms).
- **Verification:**
  - Zero external MP3/WAV network requests.
  - Smooth modulation of audio pitch/timing by live simulation telemetry.
  - Master mute button immediately silences all audio nodes.

---

### PHASE 8: Science Lab & Telemetry Dashboard
- **Objective:** Build the interactive laboratory interface allowing users to experiment with parameters, view live Recharts plots, and observe filter behavior.
- **Dependencies:** Phase 2, Phase 3.
- **Deliverables:**
  - `src/components/lab/ScienceLabModal.tsx` (Split-screen / modal aerospace laboratory drawer).
  - `src/components/lab/charts/PulseProfileChart.tsx` (Recharts folded photon count vs phase $\phi$).
  - `src/components/lab/charts/ToaResidualChart.tsx` (Scatter plot of TOA residuals over time).
  - `src/components/lab/charts/GdopChart.tsx` (Real-time GDOP trend plot).
  - `src/components/lab/controls/ExperimentSliders.tsx` (Jitter, clock drift, and beacon toggles).
- **Verification:**
  - Moving the jitter slider immediately scales the 3D uncertainty ellipsoid and residual spread.
  - Recharts plots render smoothly without stalling the 3D canvas.

---

### PHASE 9: Competition Mode & Failure Scenarios
- **Objective:** Implement interactive challenge scenarios where users must navigate a probe through navigation failures to reach a target destination.
- **Dependencies:** Phase 6, Phase 8.
- **Deliverables:**
  - `src/competition/scenarios.ts` (Pre-configured challenge missions: Solar Flare Blackout, Lost in Deep Space, Single Beacon Recovery).
  - `src/competition/scoring-engine.ts` (Evaluates flight accuracy, fuel consumption, and time-to-lock).
  - `src/components/hud/CompetitionHUD.tsx` (Mission objectives checklist, timer, accuracy score).
- **Verification:**
  - Deterministic evaluation of user performance across identical random seeds.
  - Clean reset and replay functionality.

---

### PHASE 10: Visual Polish & High-End Shaders
- **Objective:** Elevate visual aesthetics to the highest cinematic standard: postprocessing refinement, filmic tone mapping, and cockpit reflections.
- **Dependencies:** Phase 4, Phase 5, Phase 6.
- **Deliverables:**
  - `src/components/canvas/postprocessing/PostProcessingManager.tsx` (Selective bloom, vignette, chromatic aberration).
  - `src/components/canvas/shaders/AtmosphereShader.ts` (Realistic Rayleigh/Mie atmospheric scattering).
  - Dynamic camera lens flares when panning across the Sun or high-energy pulsars.
- **Verification:**
  - Visual fidelity benchmarked against high-end space documentary cinematography.
  - Zero visual glitches across low, medium, and high quality presets.

---

### PHASE 11: Performance Optimization & Cross-Device Scaling
- **Objective:** Optimize memory usage, minimize draw calls, and implement dynamic resolution scaling for lower-spec devices.
- **Dependencies:** All previous phases.
- **Deliverables:**
  - Dynamic quality switcher (LOW / MEDIUM / HIGH / CINEMATIC).
  - Dynamic DPR scaling based on real-time frame time monitoring.
  - Geometry and material disposal audit to prevent memory leaks.
- **Verification:**
  - 60+ FPS on mid-range hardware (Apple M1, GTX 1650).
  - 30+ FPS on integrated Intel Iris Xe mobile graphics.
  - Clean memory footprint: JS heap stable over 30-minute continuous execution.

---

### PHASE 12: Scientific Validation & Benchmarking
- **Objective:** Execute the automated Known-Answer Test suite and compare simulated XPNAV performance metrics against published historical results from NASA SEXTANT (Mitchell et al. 2018).
- **Dependencies:** Phase 2, Phase 3, Phase 8.
- **Deliverables:**
  - `src/__tests__/scientific-kat.test.ts` (Automated analytical tests).
  - `src/__tests__/relativistic-delays.test.ts` (Rømer, Einstein, Shapiro delay tests).
  - `docs/SCIENTIFIC_VALIDATION_REPORT.md` (Documented numerical accuracy benchmarks).
- **Verification:**
  - All automated scientific tests pass with 100% assertion success.
  - Clear distinction maintained between NASA flight results and PULSAR-X educational scenario targets.

---

### PHASE 13: Production Deployment & Competition Submission
- **Objective:** Final production build, accessibility audit, SEO optimization, and live Vercel deployment.
- **Dependencies:** All previous phases.
- **Deliverables:**
  - Vercel production deployment configuration.
  - Full keyboard accessibility and screen reader support.
  - Comprehensive `README.md` and user manual.
  - Submission packaging and video walk-through capture.
- **Verification:**
  - `npm run lint` exits code `0`.
  - `npm run build` exits code `0`.
  - Lighthouse performance, accessibility, and best practices scores $\ge 90$.
