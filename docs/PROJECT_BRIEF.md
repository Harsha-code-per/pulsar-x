# PULSAR-X — Project Brief

## Project Identity
- **Project Name:** PULSAR-X
- **Tagline:** DEEP SPACE NAVIGATION WITHOUT GPS
- **Domain:** Scientific Computing / Real-Time 3D Simulation / Aerospace Navigation / Cinematic Web Experience

---

## 1. The Core Question
> **"How can an autonomous spacecraft determine its exact position and velocity in deep space when Earth GPS satellites and terrestrial ground tracking are unavailable?"**

When humanity sends spacecraft beyond low Earth orbit—toward cislunar space, Mars, the outer gas giants, or into the interstellar medium—terrestrial navigation paradigms collapse:
1. **GPS Is Terrestrially Bound:** GPS constellation antennae point downward toward Earth. Once a probe passes high Earth orbit, signal strength plummets, sidelobes vanish, and GPS becomes unusable.
2. **Ground Tracking Has High Latency & Bottlenecks:** Tracking via NASA’s Deep Space Network (DSN) requires giant ground antennae. At Mars distances, radio round-trip light times reach up to 44 minutes; at Saturn, nearly 3 hours. During dynamic orbital insertion maneuvers, time-critical descent sequences, or solar conjunction blackouts, real-time Earth guidance is physically impossible.
3. **Inertial Dead Reckoning Drifts:** Onboard gyroscopes and accelerometers accumulate unbounded integration drift over time, requiring periodic external absolute position fixes.

---

## 2. The Core Idea: Celestial GPS via Pulsar Timing (XPNAV)
**PULSAR-X** simulates the solution currently pioneering the frontier of autonomous deep-space exploration: **X-ray Pulsar Navigation (XPNAV)**.

Rapidly rotating neutron stars (millisecond pulsars, or MSPs) sweep collimated beams of X-ray radiation across the cosmos with atomic-clock precision. By mounting an X-ray detector on a spacecraft:
1. The spacecraft observes periodic pulse arrival times (Time of Arrival, or TOA) from multiple known pulsars across the celestial sphere.
2. Comparing observed arrival times against an onboard barycentric clock model reveals the geometric **Rømer delay**, which directly encodes the spacecraft's 3D position relative to the Solar System Barycenter.
3. Relativistic corrections (**Einstein gravitational time dilation** and **Shapiro path curvature delay**) refine the observations down to kilometer-level precision.
4. An onboard **Iterated Extended Kalman Filter (IEKF)** fuses these relativistic pseudoranges to compute continuous, autonomous 3D position, velocity, and clock bias corrections—**creating a universal, unjammable navigation system that functions anywhere in the cosmos.**

---

## 3. The Core Differentiator: Cinematic Science Experience
Most astronomical or aerospace projects fall into one of two extremes:
- An academic, dry web dashboard with dense tables and static plots.
- A generic, gamified 3D demo with glowing neon cards, arcade physics, and fictional sci-fi tropes.

**PULSAR-X breaks this dichotomy.** It presents a **competition-grade, authentic numerical simulation** embedded inside a **serious, cinematic science documentary experience**.
- The physics, orbital mechanics, relativistic time transformations, and Kalman filter recursions are genuine.
- The visual presentation draws inspiration from:
  - High-end NASA/JPL mission visualizations.
  - Prestigious science documentaries (*Cosmos*, BBC *The Planets*).
  - Cinematic hard science fiction (*Interstellar*, *2001: A Space Odyssey*).
  - Authentic mission control flight displays (Apollo Guidance Computer, ESA ESOC, JPL).
- The experience features an original **18-scene cinematic narrative arc**, supported by **procedural Web Audio sound synthesis** where the user can literally hear the spin rate and X-ray photon arrivals of each millisecond pulsar.

---

## 4. Dual Operational Modes

### Mode 1: Cinematic Mission Mode
- A film-like, guided narrative journey through 18 choreographed scenes.
- Follows an autonomous deep-space probe from Earth departure, through the crisis of GPS and ground-link loss, to the discovery of cosmic pulsars, the tension of position uncertainty, and the ultimate triumph of autonomous celestial lock.
- Directed with dynamic GSAP camera choreography, authentic aerospace HUD overlays, dramatic lighting, and simulation-synchronized procedural audio.

### Mode 2: Science Lab Mode
- An interactive, hands-on scientific experimentation environment for students, engineers, and astronomy enthusiasts.
- Full manual control over the simulation parameters:
  - Inject timing jitter and observe how the 3D position uncertainty ellipsoid expands.
  - Disable individual pulsar beacons to examine Geometric Dilution of Precision (GDOP) and singular geometries.
  - Induce solar occultation flares and test filter recovery.
  - Inspect live **Recharts** visualizations: folded X-ray pulse profiles, TOA residuals, and covariance convergence plots.

---

## 5. Visual & Design Aesthetics

- **Curated Scientific Palette:** Deep cosmic blacks (`#020408`), deep void indigos, restrained aerospace cyan (`#00f0ff`) for locked telemetry, alert amber (`#ffb700`) for degraded geometry, and emergency red (`#ff3366`) for navigation divergence.
- **Typography:** Crisp, modern aerospace typography combining Geist Sans for clean headlines, Geist Mono for high-frequency telemetry counters, and Inter for explanatory documentation.
- **No Gimmicks:** No random floating cards, no neon cyberpunk gradients, no arcade sound effects. Every element on screen serves a concrete scientific or narrative function.
- **Micro-Animations & Telemetry:** Smooth, responsive telemetry readouts that communicate live mathematical activity without stalling the 60 FPS WebGL render canvas.
