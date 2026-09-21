# PULSAR-X — Cinematic Experience Design

## 1. Cinematic Philosophy & Directorial Vision

**PULSAR-X** is crafted as a high-concept, serious scientific drama. Inspired by the visual sobriety of *Interstellar*, the observational documentary realism of *Apollo 11*, and authentic aerospace telemetry interfaces (NASA JPL Mission Control, ESA ESOC), it avoids arcade tropes, generic cyberpunk neon, and cartoonish sci-fi clichés.

Space is rendered as it truly is: **vast, silent, cold, and mathematically unforgiving**. The spacecraft is not a fantasy cruiser; it is a precision scientific probe equipped with sensitive X-ray optics, high-gain telemetry antennae, and reaction control thrusters.

### Numeric Classification Convention
In strict adherence to the **PULSAR-X Scientific Integrity Constitution**, every numerical figure in this document is explicitly classified into one of five categories:
- `[REAL_INPUT]`: True physical or astronomical constants (e.g. speed of light $c$, pulsar spin periods $P$, catalog sky coordinates $\alpha, \delta$).
- `[SIMULATION_OUTPUT]`: Dynamic values generated live by the simulation worker (e.g. true spacecraft state, estimated position error, covariance trace, instantaneous GDOP, photon counts, SNR).
- `[SCENARIO_TARGET]`: Scripted operational goals and milestone thresholds driving the narrative progression (e.g. target lock accuracy, distance trigger for GPS loss).
- `[DISPLAY_SCALE]`: Coordinate and geometry scaling factors applied strictly for visual rendering in the Three.js viewport.
- `[ARTISTIC_APPROXIMATION]`: Stylized cinematography values (e.g. camera lens FOV, lighting intensities, particle densities).

```
PHASE I: THE TERRESTRIAL UMBILICAL (Scenes 01–04)
  Earth Orbit -> Escape Burn -> Deep Space Void
PHASE II: THE CRISIS OF ISOLATION (Scenes 05–07)
  GPS Sidelobes Lost -> DSN Ground Link Lost -> Inertial Drift
PHASE III: THE CELESTIAL BEACONS (Scenes 08–10)
  First X-ray Pulse -> Triangulation Network -> Photon Folding
PHASE IV: CONVERGENCE & RESILIENCE (Scenes 11–16)
  Uncertainty Ellipsoid -> Kalman Lock -> Solar Blinding -> Recovery
PHASE V: ARRIVAL & TRANSCENDENCE (Scenes 17–18)
  Outer Solar System Target -> Macro Cosmic Clockwork
```

---

## 2. Detailed Scene-by-Scene Director Specifications

---

### Scene 01 — EARTH
- **Purpose:** Establish the baseline: Earth orbit security, where terrestrial navigation (GPS/GNSS) is effortless and ubiquitous.
- **Camera Position:** Low Earth Orbit, $400\text{ km}$ altitude `[SCENARIO_TARGET]`, $30^\circ$ oblique angle looking past the spacecraft toward the sunlit dawn terminator.
- **Camera Movement:** Slow orbital tracking shot (GSAP dolly along orbital velocity vector). FOV $45^\circ$ `[ARTISTIC_APPROXIMATION]`.
- **Lighting:** Intense directional sunlight from frame right, Earth reflected albedo soft blue fill from below. High contrast shadows.
- **Visual Focus:** The spacecraft's gold thermal foil and GPS patch antenna arrays glowing in sunlight.
- **Scientific Data Visible:**
  - Active GNSS Constellation: $N = 12$ satellites tracked `[SIMULATION_OUTPUT]`.
  - Position Error: $\pm 1.2\text{ m}$ `[SIMULATION_OUTPUT]`.
  - Clock Bias: $< 2\text{ ns}$ `[SIMULATION_OUTPUT]`.
  - Orbital Velocity: $7.66\text{ km/s}$ `[SIMULATION_OUTPUT]`.
- **UI / HUD:** Clean cyan aerospace HUD. "GNSS STATE: LOCKED", "TERRESTRIAL TIME SYNC: ACTIVE", miniature globe showing ground track.
- **Sound:** Low ambient hum of spacecraft life support / cooling pumps. Rhythmic 1 Hz telemetry heartbeat.
- **Transition:** Hard cinematic cut on thruster pre-ignition countdown.
- **Simulation Event:** Spacecraft state initialized in circular LEO; GPS satellite geometric vectors fully visible.

---

### Scene 02 — DEPARTURE
- **Purpose:** The break from Earth orbit. Visualizing the violent physics of translunar / interplanetary injection.
- **Camera Position:** Chase camera, $15\text{ m}$ `[DISPLAY_SCALE]` behind the main propulsion bell.
- **Camera Movement:** Camera shakes gently on ignition, then pulls back as acceleration pushes the spacecraft forward. FOV widens to $60^\circ$ `[ARTISTIC_APPROXIMATION]`.
- **Lighting:** Engine plume illuminates engine nozzles with cool white-blue glow; Earth terminator falls away into darkness behind.
- **Visual Focus:** Reaction control thruster pulses, engine gimbaling, and particle exhaust trail.
- **Scientific Data Visible:**
  - $\Delta V$ Applied: $+3,150\text{ m/s}$ `[SCENARIO_TARGET]`.
  - Trajectory: Hyperbolic escape trajectory ($\mathcal{E} > 0$) `[SIMULATION_OUTPUT]`.
  - Distance from Earth: Climbing rapidly ($1,000 \to 25,000\text{ km}$) `[SIMULATION_OUTPUT]`.
- **UI / HUD:** Burn profile progress bar, G-load meter ($1.8\text{ G}$) `[SIMULATION_OUTPUT]`, trajectory vector spline projected into 3D space.
- **Sound:** Deep sub-bass thruster rumble (filtered as if conducted through the spacecraft hull). Rising electronic carrier tone.
- **Transition:** Whip-pan along the departure vector into the cosmic dark.
- **Simulation Event:** Spacecraft switches from circular orbit to hyperbolic escape trajectory.

---

### Scene 03 — EARTH RECEDES
- **Purpose:** Conveying psychological and physical isolation as Earth transitions from a world to a distant blue sphere.
- **Camera Position:** Stationary inertial viewpoint in cislunar space looking back at Earth.
- **Camera Movement:** Slow continuous zoom-in as the spacecraft crosses the foreground from left to right, leaving Earth in the distant center.
- **Lighting:** Sunlight illuminates Earth's crescent; deep space remains pitch black.
- **Visual Focus:** The tiny blue marble suspended against an unblemished starfield.
- **Scientific Data Visible:**
  - Distance: $120,000\text{ km}$ `[SIMULATION_OUTPUT]`.
  - Round-Trip Light Time (RTLT): $0.80\text{ seconds}$ `[SIMULATION_OUTPUT]`.
  - Earth-Moon Barycenter vector.
- **UI / HUD:** HUD elements begin to compress. "TERRESTRIAL RANGE: 120,400 KM", ground station contact points shrinking.
- **Sound:** Engine sound completely cuts off into stark vacuum silence. Only the interior hum remains.
- **Transition:** Slow dissolve to black, then opening into the interplanetary medium.
- **Simulation Event:** Spacecraft crosses $100,000\text{ km}$ `[SCENARIO_TARGET]` distance threshold.

---

### Scene 04 — DEEP SPACE
- **Purpose:** Immerse the viewer in the sheer scale and emptiness of interplanetary space.
- **Camera Position:** Extreme long shot, $500\text{ m}$ `[DISPLAY_SCALE]` off the port bow.
- **Camera Movement:** Floating, slow rotational drift around the spacecraft. No apparent horizon or reference points.
- **Lighting:** Harsh, unsoftened directional solar key light ($100\%$ contrast, zero ambient fill). Stars pin-sharp.
- **Visual Focus:** The craft drifting gracefully, attitude thrusters firing occasional micro-bursts of gas.
- **Scientific Data Visible:**
  - Heliocentric Distance: $0.98\text{ AU}$ `[SIMULATION_OUTPUT]`.
  - Ambient Particle Density: $< 5\text{ protons/cm}^3$ `[ARTISTIC_APPROXIMATION]`.
  - Interplanetary Magnetic Field: $5\text{ nT}$ `[ARTISTIC_APPROXIMATION]`.
- **UI / HUD:** Minimalist telemetry mode. Pitch/Roll/Yaw gyros slowly calibrating.
- **Sound:** Low, desolate drone; absolute clarity of micro-thruster bursts.
- **Transition:** Sudden glitch in the HUD carrier lock graphic.
- **Simulation Event:** Spacecraft enters cruise phase; GPS receiver enters weak-signal mode.

---

### Scene 05 — GPS LOST
- **Purpose:** The foundational crisis: GPS signals, broadcast by satellites focused toward Earth, become physically unobservable.
- **Camera Position:** Tight macro shot on the spacecraft's GPS patch antenna array.
- **Camera Movement:** Jittery micro-shake, rapid push-in to the antenna face.
- **Lighting:** Dimming HUD light reflected off the spacecraft chassis; red alert indicators flash.
- **Visual Focus:** Virtual GPS signal rays flickering, stretching, and snapping off one by one.
- **Scientific Data Visible:**
  - Carrier-to-Noise Ratio ($C/N_0$): Plummeting from $45\text{ dB-Hz} \to < 15\text{ dB-Hz}$ `[SIMULATION_OUTPUT]`.
  - Visible GPS Satellites: $12 \to 4 \to 1 \to 0$ `[SIMULATION_OUTPUT]`.
  - Instantaneous GDOP: Undefined ($\to \infty$) `[SIMULATION_OUTPUT]`.
  - Position Uncertainty: Expanding at accumulated dead-reckoning drift rate `[SIMULATION_OUTPUT]`.
- **UI / HUD:** Warning amber switches to flashing red: "CRITICAL: GNSS CARRIER LOCK LOST", "DILUTION OF PRECISION EXCEEDED".
- **Sound:** Descending warble alarm tone; static burst as the digital receiver loses phase lock.
- **Transition:** Flash of chromatic aberration across the screen.
- **Simulation Event:** Distance exceeds $50,000\text{ km}$ `[SCENARIO_TARGET]`; simulation engine drops all GPS pseudorange observations.

---

### Scene 06 — GROUND LINK LOST
- **Purpose:** Depict the loss of direct ground contact (Deep Space Network occultation / transmitter failure), forcing total autonomy.
- **Camera Position:** High-angle shot looking down onto the high-gain parabolic dish antenna.
- **Camera Movement:** Smooth pan as the parabolic dish slews in search of the Earth beacon, finding only empty void.
- **Lighting:** Monochromatic deep-space starlight; Earth is now a dim magnitude -2 dot `[ARTISTIC_APPROXIMATION]`.
- **Visual Focus:** The robotic gimbal joint of the high-gain antenna reaching its mechanical limit stop.
- **Scientific Data Visible:**
  - DSN X-band Uplink: $0.0\text{ bps}$ (LOST) `[SCENARIO_TARGET]`.
  - One-Way Light Time: $> 12\text{ minutes}$ `[SIMULATION_OUTPUT]`.
  - Navigation Autonomy Index: $100\%$ REQUIRED.
- **UI / HUD:** "COMM LINK STATUS: BLACKOUT", "EXTERNAL GUIDANCE: UNAVAILABLE", "SWITCHING TO AUTONOMOUS NAVIGATION SUITE".
- **Sound:** Distant digital handshaking audio fizzles out into white noise, replaced by an urgent cockpit warning pulse.
- **Transition:** Slow zoom-in on the spacecraft's scientific optical bay.
- **Simulation Event:** Ground tracking ranging updates disabled in simulation worker.

---

### Scene 07 — SEARCH FOR ALTERNATIVE NAVIGATION
- **Purpose:** The spacecraft initiates sky survey protocols, searching for alternative celestial positioning beacons.
- **Camera Position:** Frontal 3/4 view of the spacecraft's X-ray collimator and star tracker bay.
- **Camera Movement:** Dynamic orbital sweep following the craft's attitude reorientation maneuvers.
- **Lighting:** Stark rim lighting from the distant Sun; faint blue sensor reticles sweep outward.
- **Visual Focus:** The motorized X-ray collimator gimbal slewing across celestial coordinates.
- **Scientific Data Visible:**
  - Sky Survey Grid: Equatorial Coordinates $(\alpha, \delta)$ scanning.
  - Optical Star Tracker: Fixed-attitude star pattern matched (35 guide stars identified) `[ARTISTIC_APPROXIMATION]`.
  - X-Ray Energy Band: $0.5 - 10\text{ keV}$ detector active `[REAL_INPUT]`.
- **UI / HUD:** Coordinate reticle sweeping across celestial spheres; polar plot scanning for periodic sources.
- **Sound:** Precision stepper-motor whirring; rhythmic sonar-like scanning acoustic pings.
- **Transition:** Sudden sharp audio chime and screen freeze frame on an energetic X-ray source.
- **Simulation Event:** Spacecraft attitude aligns toward target pulsar catalog coordinates.

---

### Scene 08 — FIRST PULSAR DETECTED
- **Purpose:** The discovery: a rhythmic, periodic cosmic signal punches through the X-ray background noise.
- **Camera Position:** Direct point-of-view from the X-ray detector telescope looking into deep space.
- **Camera Movement:** Rapid hyper-zoom through the cosmos, traveling thousands of light-years in seconds to reveal a spinning neutron star.
- **Lighting:** Blinding, razor-sharp blue-white synchrotron beams sweeping through space.
- **Visual Focus:** The hyper-dense neutron star ($10\text{ km}$ radius `[REAL_INPUT]`, rotating 642 times per second `[REAL_INPUT]`).
- **Visual vs Physical Note:** *The visual volumetric beams and accretion glow are artistic approximations; the underlying rotational timing $\nu = 641.928\text{ Hz}$ is physically simulated.*
- **Scientific Data Visible:**
  - Source ID: **PSR B1937+21** (Vulpecula) `[REAL_INPUT]`.
  - Observed Frequency: $\nu = 641.928\text{ Hz}$ `[REAL_INPUT]`.
  - Spin Period: $P = 1.5578\text{ ms}$ `[REAL_INPUT]`.
  - Distance: $\approx 10,400\text{ light-years}$ `[REAL_INPUT]`.
- **UI / HUD:** Oscilloscope trace spikes with a regular pulse train; "PERIODIC X-RAY SOURCE CONFIRMED", "CLOCK STABILITY: $10^{-12}$" `[REAL_INPUT]`.
- **Sound:** High-frequency, hypnotic mechanical buzzing tone ($642\text{ Hz}$) pulsing in sync with the simulated spin rate.
- **Transition:** Camera zooms back to the spacecraft, with an illuminated line of sight connecting to the distant pulsar.
- **Simulation Event:** Simulation engine registers first pulsar signal; pulse phase counter begins incrementing.

---

### Scene 09 — PULSAR NETWORK REVEALED
- **Purpose:** Expand the scope: reveal the full three-dimensional cosmic navigation grid across the Milky Way.
- **Camera Position:** Wide celestial perspective with the spacecraft in the center.
- **Camera Movement:** 360-degree orbital rotation around the spacecraft, pulling out to reveal the surrounding cosmic sphere.
- **Lighting:** The universe awakens: four distinct pulsar beacons illuminate from disparate directions in the galactic plane.
- **Visual Focus:** Geometric line-of-sight rays connecting the spacecraft to the pulsar network.
- **Scientific Data Visible:**
  - Active Constellation:
    - PSR B1937+21 (MSP, $\nu = 641.9\text{ Hz}$) `[REAL_INPUT]`
    - PSR B1821-24 (MSP, $\nu = 327.4\text{ Hz}$) `[REAL_INPUT]`
    - PSR J0437-4715 (MSP, $\nu = 173.7\text{ Hz}$) `[REAL_INPUT]`
    - PSR B0531+21 (Crab, $\nu = 29.9\text{ Hz}$) `[REAL_INPUT]`
  - Geometric Angular Separation: Non-coplanar ($> 45^\circ$ between all pairs) `[REAL_INPUT]`.
- **UI / HUD:** Full celestial triangulation mesh rendered on the HUD; "XPNAV CONSTELLATION: 4/4 ACQUIRED"; Instantaneous GDOP: $\approx 2.1$ `[SIMULATION_OUTPUT, SCENARIO_TARGET]`.
- **Sound:** Multi-layered polyphonic chord constructed from the audible frequencies of each active pulsar's spin rate.
- **Transition:** Smooth focus shift down to the spacecraft's onboard signal processing bus.
- **Simulation Event:** Four non-coplanar pulsars locked; measurement matrix $H$ achieves rank 4.

---

### Scene 10 — SIGNAL OBSERVATIONS
- **Purpose:** Demonstrate the mathematics: individual sparse X-ray photons are gathered and folded into a pristine light curve.
- **Camera Position:** Split-screen view showing the X-ray detector sensor grid and live telemetry.
- **Camera Movement:** Microscopic push-in on the silicon drift detector pixel grid as individual X-ray photons hit.
- **Lighting:** Dark, moody blue sensor chamber with brief, glowing impact sparks on each photon strike.
- **Visual Focus:** The photon phase-folding histogram building up from random noise into a recognizable pulse profile.
- **Scientific Data Visible:**
  - Source Flux: $F_x = 0.0012\text{ photons/cm}^2\text{/s}$ `[REAL_INPUT]`.
  - Effective Detector Area: $A_{det} = 2,000\text{ cm}^2$ `[SCENARIO_TARGET]`.
  - Physical Arrival Rate: $R_{phys} = 2.4\text{ photons/s}$ `[SIMULATION_OUTPUT]`.
  - Simulation Time Acceleration: $\kappa = 50\times$ `[SCENARIO_TARGET]`.
  - Accumulated Counts: $N = 1,440\text{ photons}$ ($T_{obs} = 12\text{ s}$) `[SIMULATION_OUTPUT]`.
  - Phase Binning: $\phi \in [0.0, 1.0)$ in 128 bins `[SCENARIO_TARGET]`.
  - Cross-Correlation SNR: $14.8\text{ dB}$ `[SIMULATION_OUTPUT]`.
- **UI / HUD:** Real-time pulse profile folding curve rendering live in the HUD; phase residual gauge aligning to zero.
- **Sound:** Geiger counter clicks accelerating and synchronizing into a steady, clean pulse rhythm.
- **Transition:** Match cut from the folded graph to the 3D position error ellipsoid surrounding the spacecraft.
- **Simulation Event:** Epoch folding algorithm calculates TOA residual $\Delta t_{obs} - \Delta t_{pred}$.

---

### Scene 11 — POSITION UNCERTAINTY
- **Purpose:** Show the problem before the solution: the spacecraft's true position is blurred across a massive error cloud.
- **Camera Position:** External view, $50\text{ m}$ `[DISPLAY_SCALE]` away, looking at the spacecraft centered inside a massive red wireframe ellipsoid.
- **Camera Movement:** Slow continuous roll around the craft, emphasizing the elongated shape of the uncertainty volume.
- **Lighting:** Pulsing red/amber volumetric light emanating from the error ellipsoid wires.
- **Visual Focus:** The craft floating inside an uncertainty volume spanning thousands of kilometers.
- **Scientific Data Visible:**
  - $3\sigma$ Position Error: $\pm 42,500\text{ km}$ `[SIMULATION_OUTPUT, SCENARIO_TARGET]`.
  - Velocity Uncertainty: $\pm 18\text{ m/s}$ `[SIMULATION_OUTPUT, SCENARIO_TARGET]`.
  - Clock Drift Uncertainty: $\pm 1.4\times 10^{-7}\text{ s}$ `[SIMULATION_OUTPUT, SCENARIO_TARGET]`.
- **UI / HUD:** "KALMAN FILTER STATUS: UNCONVERGED", "POSITION CONFIDENCE: LOW", 3D covariance matrix readout.
- **Sound:** Low, dissonant harmonic drone representing uncertainty; warning alert beeps at 2-second intervals.
- **Transition:** Rapid sequential flashes as the Iterated Extended Kalman Filter executes its recursion steps.
- **Simulation Event:** Initial covariance $P_0$ is large; dead reckoning has accumulated drift.

---

### Scene 12 — NAVIGATION CONVERGENCE
- **Purpose:** The scientific breakthrough: relativistic TOA corrections and dynamic Kalman updates shrink the error ellipsoid in real time.
- **Camera Position:** Isometric view showing the spacecraft, the intersecting line-of-sight rays, and the shrinking ellipsoid.
- **Camera Movement:** Camera steadily moves inward toward the spacecraft as the wireframe ellipsoid collapses around it.
- **Lighting:** The red warning light gradually shifts to soothing amber, then deep cyan as accuracy improves.
- **Visual Focus:** The wireframe ellipsoid shrinking symmetrically: $40,000\text{ km} \to 5,000\text{ km} \to 200\text{ km} \to 5\text{ km}$ `[SIMULATION_OUTPUT, SCENARIO_TARGET]`.
- **Scientific Data Visible:**
  - Relativistic Rømer Delay: $\Delta t_R = 492.1284\text{ s}$ applied `[SIMULATION_OUTPUT]`.
  - Einstein Delay: $+1.66\text{ ms}$ applied `[SIMULATION_OUTPUT]`.
  - Shapiro Delay: $+0.042\text{ ms}$ applied `[SIMULATION_OUTPUT]`.
  - Kalman Gain $K$: Actively driving state updates `[SIMULATION_OUTPUT]`.
- **UI / HUD:** Dynamic numerical counters spinning down rapidly; "CONVERGENCE IN PROGRESS: 45% ... 78% ... 96%".
- **Sound:** The dissonant drone harmonizes into a clean, resonant major chord; alert beeps give way to a steady aerospace telemetry tone.
- **Transition:** Sharp lens flare when the ellipsoid snaps onto the spacecraft hull.
- **Simulation Event:** IEKF measurement update loop converges; covariance $P$ traces drop below threshold.

---

### Scene 13 — POSITION LOCK
- **Purpose:** Triumph of autonomous science: the spacecraft knows exactly where it is in the cosmos, without Earth.
- **Camera Position:** Hero low-angle beauty shot of the entire spacecraft, perfectly stabilized.
- **Camera Movement:** Majestic, slow circular orbit around the spacecraft with stars drifting smoothly in parallax.
- **Lighting:** Pure, clean directional sunlight with crisp cyan HUD reflections on the craft's thermal blankets.
- **Visual Focus:** Spacecraft status beacon turning solid green; high-gain optics locked firmly onto pulsar targets.
- **Scientific Data Visible:**
  - Position Error: $\le 1.8\text{ km}$ `[SIMULATION_OUTPUT, SCENARIO_TARGET]`.
  - Velocity Accuracy: $\pm 0.04\text{ m/s}$ `[SIMULATION_OUTPUT, SCENARIO_TARGET]`.
  - Onboard Clock Offset Resolved: $\delta t = -12.4\text{ ns}$ `[SIMULATION_OUTPUT]`.
  - Autonomous Lock: **CONFIRMED** `[SIMULATION_OUTPUT]`.
- **UI / HUD:** HUD snaps to full green/cyan: "AUTONOMOUS CELESTIAL POSITION LOCK ACQUIRED", "SOLAR SYSTEM BARYCENTRIC COORDINATES LOCKED".
- **Sound:** Crisp aerospace confirmation chime (two-tone chime: C6 to G6). Resonant, peaceful space ambiance.
- **Transition:** Sudden red visual interference line tearing across the screen.
- **Simulation Event:** Navigation state error falls below operational tolerance; status set to `LOCKED`.

---

### Scene 14 — SIGNAL FAILURE
- **Purpose:** The unexpected crisis: a coronal mass ejection or solar occultation wipes out the primary timing beacon.
- **Camera Position:** Wide shot looking toward the Sun as a massive solar flare erupts along the line of sight to PSR B1937+21.
- **Camera Movement:** Violent camera recoil and shudder as the plasma cloud expands across the visual field.
- **Lighting:** Blinding, turbulent orange-red solar glare washing out the frame; harsh shadows cast across the spacecraft.
- **Visual Focus:** The golden sightline vector to the primary pulsar flickering, turning red, and shattering.
- **Scientific Data Visible:**
  - Solar Flare X-ray Flux: $10^4\times$ background saturation `[SCENARIO_TARGET]`.
  - Primary Beacon SNR: Drops to $0\text{ dB}$ (BLINDED) `[SIMULATION_OUTPUT]`.
  - Active Beacons: $4 \to 3$ `[SIMULATION_OUTPUT]`.
  - Instantaneous GDOP: Degrades from $2.1 \to 18.4$ `[SIMULATION_OUTPUT, SCENARIO_TARGET]`.
- **UI / HUD:** "WARNING: SOLAR INTERFERENCE DETECTED", "PRIMARY BEACON (PSR B1937+21) OCCULTED", "GEOMETRIC DILUTION CRITICAL".
- **Sound:** Low, distorted electrical buzz and harsh static roar replacing the clean harmonic audio.
- **Transition:** Screen shakes with chromatic aberration as the craft's position estimate begins to slip.
- **Simulation Event:** Simulated fault injected: SNR of primary pulsar forced to 0; occultation flag set.

---

### Scene 15 — NAVIGATION DEGRADATION
- **Purpose:** The tension of dead reckoning: with degraded geometry, position uncertainty starts ballooning again.
- **Camera Position:** Medium tracking shot of the spacecraft floating through the orange-tinted solar haze.
- **Camera Movement:** Slow pull-away as the uncertainty ellipsoid reappears, stretching into an elongated needle shape along the lost axis.
- **Lighting:** Dark amber warning lighting; solar plasma particles stream past the camera lens.
- **Visual Focus:** The elongated uncertainty ellipsoid growing larger with every passing second of dead reckoning.
- **Scientific Data Visible:**
  - Drift Rate: $+450\text{ m/minute}$ `[SIMULATION_OUTPUT, SCENARIO_TARGET]`.
  - Filter Covariance along Lost Axis: $\sigma_z^2$ increasing monotonically `[SIMULATION_OUTPUT]`.
  - Remaining Active Beacons: 3 (Insufficient for 4D instantaneous fix; dynamic filter propagating) `[SIMULATION_OUTPUT]`.
- **UI / HUD:** Warning amber flashing: "NAV STATUS: DEGRADED", "ESTIMATED POSITION DRIFT: ACCUMULATING", "ATTEMPTING AUTONOMOUS RECOVERY".
- **Sound:** Tense, rhythmic warning pulse at $0.8\text{ Hz}$; audible degradation of the synthesizer carrier wave.
- **Transition:** Rapid camera whip-pan to the spacecraft's secondary star tracker gimbal.
- **Simulation Event:** IEKF covariance grows due to process noise without sufficient measurement constraint.

---

### Scene 16 — SIGNAL RECOVERY
- **Purpose:** Aerospace resilience: the autonomous guidance computer slews to acquire a backup millisecond pulsar, restoring lock.
- **Camera Position:** Close-up on the X-ray collimator gimbal executing an autonomous emergency slew.
- **Camera Movement:** Rapid mechanical tracking pan following the sensor head as it locks onto a new celestial vector.
- **Lighting:** The harsh solar orange flare recedes into the background; a clean purple-violet beam pierces the void from deep space.
- **Visual Focus:** A new pulsar beacon—**PSR J0218+4232**—lights up in the sky, re-establishing non-coplanar geometry.
- **Scientific Data Visible:**
  - Backup Beacon Acquired: **PSR J0218+4232** ($\nu = 430.46\text{ Hz}$) `[REAL_INPUT]`.
  - Sky Angular Offset: $84.2^\circ$ from degraded axis `[REAL_INPUT]`.
  - Restored GDOP: $\approx 1.95$ `[SIMULATION_OUTPUT, SCENARIO_TARGET]`.
  - Covariance Volume: Collapses back down to $< 2\text{ km}^3$ `[SIMULATION_OUTPUT, SCENARIO_TARGET]`.
- **UI / HUD:** Rapid diagnostic cascade: "BACKUP BEACON LOCKED", "GEOMETRIC SINGULARITY RESOLVED", "RE-CONVERGENCE COMPLETE".
- **Sound:** The warning tone dissolves instantly into a bright, soaring synth crescendo as full harmony returns.
- **Transition:** Smooth visual dissolve into deep cosmic black, followed by the appearance of a majestic gas giant.
- **Simulation Event:** Secondary pulsar added to active filter set; IEKF covariance stabilizes; status restored to `LOCKED`.

---

### Scene 17 — DESTINATION
- **Purpose:** The reward of precision autonomous navigation: the spacecraft arrives precisely at its deep-space target (Jupiter / Europa waypoint).
- **Camera Position:** Epic widescreen composition: the colossal banded sphere of Jupiter dominates the upper frame; Europa glints in the distance.
- **Camera Movement:** Cinematic flyby dolly shot skimming along the spacecraft's orbital insertion trajectory.
- **Lighting:** Reflected golden light from Jupiter's swirling storms gently illuminates the underside of the spacecraft.
- **Visual Focus:** The spacecraft firing its orbital insertion thrusters with surgical precision, perfectly on trajectory.
- **Scientific Data Visible:**
  - Destination Target: Jupiter Orbital Insertion (JOI) `[SCENARIO_TARGET]`.
  - Simulated Trajectory Error: $< 400\text{ meters}$ `[SIMULATION_OUTPUT, SCENARIO_TARGET]`.
  - Velocity Vector Match: $\pm 0.01\text{ m/s}$ `[SIMULATION_OUTPUT, SCENARIO_TARGET]`.
  - Heliocentric Distance: $5.2\text{ AU}$ ($\approx 7.78 \times 10^8\text{ km}$) `[REAL_INPUT]`.
  - Simulated One-Way Light Time to Earth: $43.2\text{ minutes}$ `[SIMULATION_OUTPUT]`.
  - Simulated Cruise Duration: $412\text{ days}$ `[SCENARIO_TARGET]`.
- **UI / HUD:** "MISSION OBJECTIVE ACHIEVED", "AUTONOMOUS TRAJECTORY INSERTION: NOMINAL", "TOTAL TIME WITHOUT GPS: 412 DAYS".
- **Sound:** Deep, warm ambient drone with orchestral resonance; subtle crackle of Jupiter's natural decametric radio emissions `[ARTISTIC_APPROXIMATION]`.
- **Transition:** Slow zoom-out past the planet, outward into interstellar space.
- **Simulation Event:** Spacecraft completes simulated waypoint arrival criteria.

---

### Scene 18 — FINAL REVEAL
- **Purpose:** The philosophical capstone: pulling back from the spacecraft to reveal the entire Milky Way as an eternal clock.
- **Camera Position:** Macro cosmic view looking down onto the spiral arms of the Milky Way galaxy.
- **Camera Movement:** Continuous, breathtaking exponential pull-back from spacecraft scale ($10\text{ m}$) to galactic scale ($100,000\text{ light-years}$) `[DISPLAY_SCALE]`.
- **Lighting:** The shimmering, ethereal glow of hundreds of billions of stars; the pulsing network of pulsars glowing like cosmic lighthouse beams.
- **Visual Focus:** The interconnected grid of pulsar timing rays blanketing the entire galaxy, illustrating that the universe provides its own clocks.
- **Scientific Data Visible:**
  - Galactic Scale: $30\text{ kpc}$ across `[REAL_INPUT]`.
  - Pulsar Lifespans: $10^8 - 10^9\text{ years}$ of continuous rotation `[REAL_INPUT]`.
  - Final Narrative Text: *"Humanity no longer needs terrestrial lighthouses. The stars have always kept time."*
- **UI / HUD:** HUD gently fades out, leaving only the pristine, unobstructed cosmos.
- **Sound:** Ethereal, transcendent musical chords fading into cosmic silence, with the rhythmic $1.5\text{ ms}$ pulse of PSR B1937+21 as the eternal heartbeat.
- **Transition:** Fade to cinematic black with credits and seamless option to launch **SCIENCE LAB MODE**.
- **Simulation Event:** Playback reaches narrative completion; simulation remains live for user exploration.

---

## 3. Integration with Simulation Engine

The cinematic director is never decoupled from physical truth. Every camera cue and dramatic event is linked directly to simulation state predicates:

```typescript
// Cinematic State Trigger Mapping
interface CinematicTrigger {
  sceneId: number;
  condition: (telemetry: SimulationTelemetry) => boolean;
  onEnter: () => void;
}

export const CINEMATIC_TRIGGERS: CinematicTrigger[] = [
  {
    sceneId: 5, // GPS LOST
    condition: (t) => t.distanceFromEarth_km > 50000 && t.gpsLocked,
    onEnter: () => {
      // Trigger camera recoil & HUD alarm
    }
  },
  {
    sceneId: 13, // POSITION LOCK
    condition: (t) => t.kalmanCovarianceTrace < 4.0 && !t.hasAchievedLock,
    onEnter: () => {
      // Trigger two-tone chime & cyan HUD lock animation
    }
  },
  {
    sceneId: 14, // SIGNAL FAILURE
    condition: (t) => t.activeFaultType === 'SOLAR_OCCULTATION',
    onEnter: () => {
      // Trigger lens flare bloom & warning siren
    }
  }
];
```

---

## 4. Implementation Notes & Runtime Solver Clarification (Phase 6)

### 4.1 Authoritative Solver Architecture
In strict adherence to `docs/NAVIGATION_RUNTIME_AUDIT.md`, the live simulation runtime executes an **Iterative Batch Weighted Least Squares (WLS)** estimator with continuous **Runge-Kutta 4th Order (RK4) Dead Reckoning (`deadReckonStep`)** and orbital smoothing. Historical references in early design concepts to an "IEKF" or "Extended Kalman Filter" have been audited and updated across all Phase 6 cinematic captions, HUD badges, and telemetry strips to reflect `BATCH WLS + RK4 DR`.

### 4.2 Modular Scene Architecture
Rather than maintaining a monolithic script, Phase 6 implements the complete 18-scene sequence as modular, strongly-typed files in `src/cinematic/scenes/` (`scene01-earth.ts` through `scene18-final-reveal.ts`) aggregated in `catalog.ts`.

### 4.3 Trigger Priority & Event Bus
Triggers are evaluated with strict priority:
$$\text{EVENT\_TRIGGER} (100) > \text{TELEMETRY\_TRIGGER} (50) > \text{PLAYHEAD\_TRIGGER} (10)$$
ensuring genuine Worker physical state transitions drive narrative milestones.

