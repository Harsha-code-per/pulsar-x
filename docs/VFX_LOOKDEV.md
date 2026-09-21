# PULSAR-X: Cinematic Look Development & Advanced VFX Specification

## 1. Visual Philosophy & Aesthetic Tenets

PULSAR-X visualizes autonomous deep-space navigation using X-ray millisecond pulsars (XNAV). The visual design targets a synthesis of:
1. **Serious Scientific Cinema:** A grounded, cinematic aesthetic inspired by landmark space cinema (*Interstellar*, *2001: A Space Odyssey*).
2. **NASA-Style Aerospace Visualization:** Precision engineering graphics, calibrated telemetry overlays, and geometrically accurate trajectory and sightline representations (akin to NASA SEXTANT/NICER and JPL Eyes).
3. **High-End Science Documentary:** Informative, elegant visual breakdowns where every pixel communicates physical scale, energetic magnitude, or navigation state.
4. **Near-Future Spacecraft Cinematography:** Industrial aerospace probe hardware rendered with physical plausibility under directional sunlight and deep-space void contrast.

### Core Aesthetic Rules
- **No Neon Cyberpunk:** Prohibit electric purples, garish neon pinks, scanline noise, or arbitrary decorative sci-fi tropes.
- **Scientific Honesty:** Every visual effect must communicate information. Visual effects are explicit approximations (labeled as such) and must never misrepresent numerical simulation ground truth.
- **Restrained Color Hierarchy:** Color is reserved for semantic signaling (nominal lock, warning, critical error, physical temperature). The cosmic environment remains a natural deep black/navy void.

---

## 2. Color Language & Look-Development System

The centralized visual configuration system is defined in `src/rendering/config/lookdev.ts`.

| State / Domain | Primary Color | Hex Code | Visual Meaning |
| :--- | :--- | :--- | :--- |
| **Cosmic Void** | Deep Space Navy / Black | `#01030a` / `#000002` | Deep-space celestial backdrop |
| **Nominal Lock** | Controlled Cyan / Cool White | `#00f5ff` / `#e0f7fa` | Nominal navigation, convergent geometry, locked sightlines |
| **Degraded State** | Aerospace Amber | `#ffb703` | Degraded GDOP, elevated timing noise, timing residuals |
| **Critical Alert** | Restrained Red Alert | `#ff3366` | Beacon dropout, diverged estimator, singular geometry |
| **Pulsar Emission** | Relativistic Blue-White / Violet | `#70d6ff` / `#b388ff` | High-energy X-ray synchrotron emission cones |
| **Solar Body** | Solar Warm White / Gold | `#fff5ea` / `#ffd166` | Solar photosphere and K-corona |
| **Spacecraft MLI** | Vacuum Gold & Silver Mylar | `#d4af37` / `#e2e8f0` | Thermal insulation blankets |

### Visual Theme Presets (`VisualThemeMode`)
- `NOMINAL`: Default balanced state. Exposure 1.0, subtle cyan HUD accents, clear sightlines.
- `LOCKED`: Crisp emerald/cyan accent, tight covariance shell, maximum sightline clarity.
- `DEGRADED`: Amber accents, elevated covariance opacity, subtle optical chromatic aberration ($0.003$) signifying system stress.
- `CRITICAL`: Red alert accents, high covariance cage visibility, marked optical lens stress ($0.008$ chromatic aberration).
- `CINEMATIC`: Enhanced exposure ($1.10$), higher bloom ($0.65$), rich atmospheric Fresnel, and deep vignette.

---

## 3. Celestial Body Render Treatments

### 3.1 Multi-Layer Procedural Starfield (`Starfield.tsx`)
The starfield is organized into three distinct astronomical depth tiers to prevent flat skybox artifacts and provide authentic parallax during camera translation:
- **Tier 1 — Foreground Celestial Horizon (500 stars, $R \approx 320\text{–}480$):** Prominent nearby stars with apparent magnitude sizing and subtle scintillation.
- **Tier 2 — Mid Galactic Disk (2,500 stars, $R \approx 500\text{–}750$):** Clustered density along the galactic equator ($b \approx 0^\circ$).
- **Tier 3 — Deep Cosmic Background (7,000 stars, $R \approx 800\text{–}1100$):** Dense background stars providing cosmic depth.

**Astronomical Color Temperature:**
Star vertex colors are sampled according to genuine Harvard spectral classifications:
- **Class O / B:** Hot blue-white ($T > 10{,}000\text{ K}$, `#9bb0ff`)
- **Class A:** Pure white ($T \approx 7{,}500\text{–}10{,}000\text{ K}$, `#cad7ff`)
- **Class F / G:** Solar yellow-white ($T \approx 5{,}500\text{–}7{,}500\text{ K}$, `#fff4e8` / `#ffd2a1`)
- **Class K / M:** Cool orange-red ($T \approx 3{,}000\text{–}5{,}000\text{ K}$, `#ffcc6f` / `#ff6060`)

**Shader Optics:**
Points are rendered via custom GLSL shaders producing an Airy-disk intensity distribution with Gaussian soft falloff:
$$I(r) = \exp(-4.5 r^2)$$
eliminating square particle artifacts across all zoom levels.

### 3.2 Earth Node (`EarthNode.tsx`)
- **Rayleigh-Inspired Atmospheric Rim:** Custom Fresnel shader with exponent 3.2 and peak blue rim glow ($450\text{ nm}$ scattering approximation).
- **Soft Twilight Terminator:** Diffuse lighting computed with cosine-squared transition to avoid harsh cutoffs across day/night boundaries.
- **Ocean Specular Glint:** High-gloss ocean surface catching directional sunlight at glancing angles.
- **Continental City Lights:** Subdued nocturnal emission along landmasses on the unlit hemisphere, masked by solar incidence.
- **Atmospheric Cloud Deck:** Semi-transparent outer cloud sphere rotating independently at $0.0015\text{ rad/s}$.

### 3.3 Solar Body & Corona (`SunNode.tsx`)
- **Limb Darkening:** Evaluates standard Eddington-Barbier solar limb darkening:
  $$I(\mu) = I_0 [1 - u(1 - \mu)], \quad \mu = \cos\theta = \sqrt{1 - (r/R)^2}, \quad u \approx 0.60$$
- **Convective Granulation:** Procedural multi-frequency Simplex noise simulating solar granules and magnetic flux tubes.
- **Dynamic K-Corona:** Volumetric soft billboard with multi-layer radial falloff and flare intensity hook (`uFlareIntensity`).

---

## 4. Spacecraft Hardware & Propulsion VFX

### 4.1 Probe Materials & Geometry (`SpacecraftNode.tsx`)
The autonomous probe is modeled after deep-space XNAV demonstrators (e.g., SEXTANT/NICER on ISS, OSIRIS-REx, New Horizons):
- **Multilayer Insulation (MLI):** Gold and silver aluminized Mylar blankets with micro-creasing roughness ($0.38$) and metalness ($0.85$).
- **Photovoltaic Silicon Arrays:** Dark blue/indigo solar panels with anti-reflective coating specular reflections.
- **Primary Bus:** Lightweight carbon-fiber composite structural frame with titanium mounting brackets.
- **X-ray Timing Instrument (XTI):** Forward-facing silicon-drift detector collimator with beryllium entrance window.
- **Subsystem Status LEDs:** Micro-indicators for `COMM` (green), `PROP` (amber), `XTI` (cyan), and `NAV` (blinking lock).

### 4.2 Propulsion Visual Modes (`ThrusterPlume.tsx`)
Propulsion VFX are strictly state-driven with zero always-on glow:
1. `MAIN_BURN`: High-thrust chemical/bipropellant burn with supersonic expansion diamond shockwaves and core emission.
2. `RCS`: Intermittent cold-gas nitrogen pulse bursts for attitude control maneuvers.
3. `ION`: Delicate, high-specific-impulse xenon plasma glow ($I_{\text{sp}} > 3000\text{ s}$) with subtle axial elongation.
4. `OFF`: Complete extinction; zero residual particle or light emissions.

---

## 5. Pulsar Emissions & Detector Feedback

### 5.1 Pulsar Node Architecture (`PulsarNode.tsx`)
- **Neutron Star Core:** Compact, high-density core ($R \approx 10\text{–}12\text{ km}$ physically, scaled for visibility) with high-emissive lattice.
- **Magnetic Dipole Axis:** Tilted rotation axis $\alpha \approx 28^\circ$ producing relativistic lighthouse precession.
- **Synchrotron Emission Cones:** Dual relativistic particle beams along magnetic poles with exponential radial falloff and axial collimation.
- **Phase Modulation:** Beam opacity and core glow modulate strictly in sync with the pulsar's intrinsic spin period $P$:
  $$I(t) = I_{\text{base}} + I_{\text{peak}} \cdot \cos^2\left(\frac{\pi t}{P}\right)$$

### 5.2 Sightline Rays & Traveling Photons (`PulsarSightlines.tsx`)
- Sightline rays connect each active pulsar beacon to the spacecraft aperture.
- Photons travel strictly from the **pulsar toward the spacecraft** ($t \in [0, 1]$), reflecting physical photon arrival vectors.
- Ray opacity and particle cadence reflect active tracking status and look-development theme multipliers.

### 5.3 Localized Detector Feedback (`DetectorFeedback.tsx`)
- On every accumulated photon arrival event detected by the telemetry adapter, a localized cyan aperture flash ($120\text{ ms}$ decay) and expanding sensor ring trigger at the XTI collimator face.
- Fully instanced and non-allocating; zero garbage-collection overhead.

---

## 6. Oriented Covariance Ellipsoids (`UncertaintyEllipsoid.tsx`)

### Mathematical Ground Truth
The uncertainty ellipsoid visualizes the spatial covariance matrix $\mathbf{P}_{\text{pos}} \in \mathbb{R}^{3 \times 3}$.
1. **Eigendecomposition:** The simulation runtime performs a closed-form Jacobi eigendecomposition:
   $$\mathbf{P}_{\text{pos}} \mathbf{v}_i = \lambda_i \mathbf{v}_i, \quad i \in \{0, 1, 2\}$$
2. **Semi-Axis Radii:**
   $$r_i = k \cdot \sigma_{\text{scale}} \cdot \sqrt{\lambda_i}, \quad k \in \{1, 2, 3\} \text{ for } 1\sigma, 2\sigma, 3\sigma$$
3. **Orthonormal Orientation Basis:**
   The ellipsoid is rotated to align with the principal uncertainty axes via the basis matrix:
   $$\mathbf{R} = \begin{bmatrix} \mathbf{v}_0 & \mathbf{v}_1 & \mathbf{v}_2 \end{bmatrix}$$
   applied via Three.js `Matrix4.makeBasis(v0, v1, v2)`.
4. **Visual Structure:**
   - **Inner Shell:** Translucent tinted solid geometry (`opacity: 0.12–0.30`).
   - **Outer Cage:** High-contrast wireframe cage (`opacity: 0.40–0.85`) revealing the directional orientation of maximum geometric dilution.
   - **State-Aware Color:** Transitions from cyan (nominal) to amber (degraded) to red (critical).
5. **Error Magnification:** Prominently labeled in the HUD as `ERROR VECTOR VISUAL SCALE: [1×, 10×, 100×, 1000×]` to ensure users understand the scaled visualization of microscopic astronomical errors.

---

## 7. Fading Trajectory System (`TrajectorySystem.tsx`)

- **Chronological Vertex Alpha Fading:** Trajectory history vertices are colored using vertex alpha gradients: newest points are bright cyan (`alpha = 0.95`), fading smoothly to near-black (`alpha = 0.05`) at the oldest historical waypoint.
- **Estimated vs. True Distinction:**
  - True physical trajectory: Continuous luminous path.
  - Estimator trajectory: Subtle dashed line tracking filter convergence.
- **Quality-Tier Capacities:**
  - `LOW`: 150 points
  - `MEDIUM`: 350 points
  - `HIGH`: 600 points
  - `CINEMATIC`: 1000 points

---

## 8. Post-Processing Pipeline (`EffectsSystem.tsx`)

- **Tone Mapping:** `ACESFilmic` tone mapping preserving dynamic range from deep space shadows to solar core highlights.
- **Selective Bloom:** Evaluated via `@react-three/postprocessing` `Bloom` with luminance threshold $0.48\text{–}0.55$, smoothing $0.25\text{–}0.35$, and theme-scaled intensity.
- **Vignette:** Soft radial edge darkening ($0.35\text{–}0.65$) focusing visual attention on the central subject.
- **Chromatic Aberration:** Applied selectively in `DEGRADED` ($0.003$) and `CRITICAL` ($0.008$) states to evoke physical sensor and optical tension under system anomaly.
- **Hardware Presets:**
  - `SCIENTIFIC`: Clean, low bloom ($0.35$), no chromatic aberration, clear readouts.
  - `CINEMATIC`: Rich bloom ($0.65$), deep vignette ($0.60$), subtle film grain.
  - `MINIMAL`: Post-processing bypassed; pure WebGL rendering for low-power devices.

---

## 9. Camera Choreography & Presets (`presets.ts`)

Eight mathematically framed camera presets provide immediate cinematic compositions:
1. `EARTH_ORBIT`: Oblique framing looking past the probe toward Earth's dawn terminator.
2. `EARTH_DEPARTURE`: Chase camera behind propulsion bell looking along the hyperbolic escape vector.
3. `SPACECRAFT_HERO`: 3/4 isometric beauty shot catching sunlight on gold MLI and solar arrays.
4. `PULSAR_REVEAL`: Telephoto framing looking past spacecraft toward active millisecond pulsar.
5. `NETWORK_OVERVIEW`: Wide perspective displaying the 3D non-coplanar tetrahedral sightline network.
6. `UNCERTAINTY_CLOSE`: Close inspection focusing on the covariance ellipsoid and true probe.
7. `SOLAR_INTERFERENCE`: Low-angle silhouette against the solar glare.
8. `DESTINATION_APPROACH`: Trajectory skim toward outer solar system arrival.

All transitions utilize smooth cubic ease-in-out interpolation over calibrated durations ($1.5\text{–}3.0\text{ s}$).

---

## 10. Scientific Integrity & Boundary Specifications

1. **Simulation is Ground Truth:** The physics simulation in `simulation-runtime.ts` is the authoritative source of truth. Visual effects are approximations for pedagogical and cinematic clarity.
2. **Navigation Solver Terminology:**
   - The active navigation solver is an **Iterative Batch Weighted Least Squares** estimator with continuous **RK4 Dead Reckoning (`deadReckonStep`)** and orbital smoothing.
   - The visual UI, HUD overlays, and developer diagnostics strictly label this as `BATCH WLS + RK4 DR` or `DYNAMIC ESTIMATOR`. Fictional references to "IEKF" or "Kalman Filter" in new visual layers are strictly prohibited.
3. **Approximations Explicitly Labeled:**
   - Planetary orbits use pedagogical analytical Keplerian models instead of 500MB JPL ephemerides.
   - Pulsar horizon positions use geometric celestial sphere projection.
   - Error vectors are visually magnified by selectable factors ($1\times\text{–}1000\times$) with explicit HUD disclosure.
