<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# PULSAR-X — Permanent Engineering Rules & Architectural Constitution

These engineering rules govern all development, refactoring, and scientific computation for **PULSAR-X: Deep Space Navigation Without GPS**. Every engineer, agent, and contributor must strictly follow these rules without exception.

---

## 1. Package Manager & Workflow Discipline
- **`npm` Exclusively:** All package operations must use `npm` (`npm install`, `npm run <script>`, `npx`).
- **No Alternative Package Managers:** Never execute or migrate to `pnpm`, `yarn`, or `bun`. Do not generate or commit `pnpm-lock.yaml`, `yarn.lock`, or `bun.lockb`.
- **Lockfile Authority:** `package-lock.json` is the sole authoritative record of resolved dependencies. Never modify it manually or bypass it with `--no-package-lock` in committed changes.
- **Dependency Freeze:** Do not install new npm packages without an approved architectural RFC demonstrating that the existing stack cannot solve the problem.

---

## 2. TypeScript & Code Strictness
- **Strict Mode Enforced:** TypeScript `strict: true` must remain enabled across the entire workspace.
- **Zero `any` in Core Domains:** The use of `any` is strictly prohibited in the scientific simulation, navigation solver, worker messaging protocol, and state management layers. Use discriminated unions, generics, or `unknown` with runtime type guards.
- **Explicit Return Types:** All public functions, math utilities, solver steps, and worker message handlers must declare explicit return types.
- **Zero Unused Symbols:** Dead code, unused imports, and unreferenced variables must be cleaned up before committing (`noUnusedLocals`, `noUnusedParameters`).

---

## 3. Scientific Correctness & Physical Integrity
- **Simulation is Ground Truth:** The scientific simulation is the authoritative source of truth. The 3D renderer visualizes the simulation; the cinematic director may choreograph cameras and narrative pacing, but **must never fabricate or spoof scientific outputs**.
- **Explicit Units in Naming & Types:** All variables representing physical quantities must encode their unit in their identifier or type definition:
  - Distances: `_m` (meters), `_km` (kilometers), `_au` (astronomical units)
  - Velocities: `_mps` (meters per second), `_kmps` (kilometers per second)
  - Time & Periods: `_s` (seconds), `_ms` (milliseconds), `_ns` (nanoseconds)
  - Frequencies: `_hz` (Hertz), `_mhz` (Megahertz)
  - Angles: `_rad` (radians), `_deg` (degrees)
- **Deterministic Simulations:** Simulations must accept an explicit `seed` parameter and rely on a seeded pseudo-random number generator (PRNG, e.g., Mulberry32 or PCG). Given the same seed and initial spacecraft state, the trajectory and pulsar TOA noise profile must be bit-for-bit reproducible.
- **No Fictional Physics:** Relativistic time corrections (Rømer delay, Einstein gravitational redshift/time dilation, Shapiro delay) and navigation filter mechanics (Iterated Extended Kalman Filter, GDOP calculations) must follow genuine published astronomical and aerospace navigation literature (e.g., NASA SEXTANT/NICER, Bernhardt et al., Sheikh et al.).
- **Pedagogical Approximations Must Be Labeled:** Where numerical simplifications are required for real-time browser execution (e.g., analytical Keplerian planetary bodies instead of 500MB JPL DE440 ephemerides), code and comments must explicitly mark them: `// PEDAGOGICAL APPROXIMATION: [rationale]`.

---

## 4. Separation of Concerns & State Boundaries
- **Decouple Physics from Rendering:** Physics equations, orbital propagation, and navigation filtering must NEVER run inside React components, JSX renders, or R3F `useFrame` render callbacks.
- **Web Worker Physics Execution:** The simulation engine executes in a dedicated Web Worker on a fixed time step ($\Delta t$). The main UI thread only consumes downsampled, interpolated state snapshots.
- **State Store Stratification:**
  - `useSimulationStore`: Worker lifecycle, engine configuration, play/pause/reset controls.
  - `useTelemetryStore`: Ring-buffered telemetry snapshots updated at throttled rates (15–20 Hz) for HUD readouts and Recharts.
  - `useCinematicStore`: Director timeline, active narrative scene, camera waypoints, narrative text cues.
  - `useUIStore`: Active interface mode (Cinematic vs Science Lab), drawer states, audio settings, modal state.
- **Never Trigger React Rerenders on Physics Ticks:** Telemetry at high frequencies must be accessed via direct refs or transient Zustand subscriptions (`useStore.subscribe`) rather than driving React component rerenders at 60/120 Hz.

---

## 5. Web Worker Architecture & Data Protocol
- **Zero-Allocation Data Transfer:** High-frequency telemetry between the simulation worker and the main thread must utilize `ArrayBuffer` transferables or flat `Float64Array`/`Float32Array` buffers to avoid V8 garbage collection spikes.
- **Strongly Typed Message Schema:** All messages between the main thread and worker must be defined as strict TypeScript discriminated unions (`type WorkerMessage = { type: 'INIT'; payload: ... } | ...`).
- **Resilient Worker Lifecycle:** If the worker terminates or encounters an unhandled exception, the main thread must detect the failure, update UI diagnostics gracefully, and offer deterministic state recovery.

---

## 6. Rendering & Three.js Performance Discipline
- **Draw Call Minimization:** Keep total WebGL draw calls under 50 per frame.
- **GPU Instancing Mandatory:** Repeated objects (stars in the cosmic skybox, dust particles, constellation nodes, photon pulse markers) must use `THREE.InstancedMesh` or custom point geometries with custom vertex attributes.
- **Single Global Renderer:** Never spawn multiple `<Canvas>` elements concurrently. Transition between Cinematic and Science Lab modes using shared camera rigs and layer masks.
- **Resource Disposal:** All Three.js geometries, materials, textures, and custom render targets must be explicitly disposed of (`dispose()`) upon unmounting to prevent GPU memory leaks.
- **Shader Quality & Performance:** Custom GLSL shaders must include precision qualifiers (`precision highp float;`), avoid branching inside inner loops, and provide fallback implementations for low-end GPUs.
- **Dynamic Resolution & DPR Clamping:** Device pixel ratio must be clamped to `Math.min(window.devicePixelRatio, 2)` to prevent 4K/retina thermal throttling.

---

## 7. Cinematic Director System
- **Pacing & Choreography:** Camera moves and scene transitions must be driven by GSAP timelines operating on Three.js cameras and post-processing uniforms.
- **Event-Driven Milestones:** Cinematic transitions should hook into genuine simulation state thresholds (e.g., GPS carrier SNR dropping below acquisition limit triggers Scene 05; Kalman covariance convergence triggers Scene 13).
- **Graceful Interruption:** The user must be able to pause, scrub, or break out into Science Lab mode at any time without corrupting the running simulation clock.

---

## 8. Procedural Audio Synthesis
- **Zero Asset Dependencies:** Core acoustic feedback (spacecraft hum, pulsar pulse train clicks, telemetry locks, Geiger-like X-ray photon arrivals) must be generated procedurally via the native Web Audio API.
- **Simulation Synchronization:** Audio oscillators and gain envelopes must be modulated directly by active simulation parameters (e.g., pulsar audio frequency matches pulse frequency $\nu = 1/P$).
- **Mute & Volume Safety:** Web Audio must respect user gesture requirements (`AudioContext.resume()` on first interaction), provide immediate master mute controls, and avoid harsh clipping with a master limiter/compressor node.

---

## 9. Accessibility, UI & Browser Compatibility
- **Reduced Motion:** Respect `prefers-reduced-motion: reduce`. When active, disable rapid camera pans, warping hyperspace effects, and violent HUD glitch animations in favor of gentle cross-fades.
- **Keyboard Navigable:** All controls in both Cinematic HUD and Science Lab modes must be fully navigable via keyboard (`Tab`, `Enter`, `Space`, `ArrowKeys`).
- **High Contrast & Legibility:** Ensure aerospace telemetry readouts adhere to WCAG 2.1 AA contrast ratios against dark space backgrounds.
- **Cross-Browser Verification:** Test and ensure functionality across Chromium (Chrome/Edge/Brave), Firefox (Gecko), and Safari (WebKit), including iOS mobile WebGL constraints.
- **Static Vercel Deployment:** The app must compile and build cleanly via `next build` targeting static client-side execution with zero reliance on persistent Node server backends.

---

## 10. Git Discipline & Verification Standards
- **Feature Branching:** Work only on designated feature branches (e.g., `feat/phase-1-architecture`).
- **No Destructive Operations:** Never force-push (`git push --force`), never rebase public tracking branches, never commit generated secrets or environment files (`.env*.local`).
- **Verification Gate:** No task is complete until both `npm run lint` and `npm run build` exit with code `0`.
- **Honest Performance & Science Claims:** Never report estimated or synthetic benchmark numbers as measured facts. Always distinguish theoretical targets from empirical measurements.
