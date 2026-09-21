# PULSAR-X — Scientific Integrity & Canonical Specifications

This document is the authoritative standard for all mathematical formulas, physical constants, coordinate conventions, observation models, and scientific terminology across the **PULSAR-X** project. Every equation implemented in code, visualized in 3D, displayed in telemetry, or referenced in documentation must strictly conform to this specification.

---

## 1. Canonical Equations

### 1.1 Relativistic Time-of-Arrival (TOA) Transformation
The coordinate time of arrival at the Solar System Barycenter ($t_{SSB}$) is related to the spacecraft local clock arrival time ($t_{SC, clock}$) by:

$$t_{SSB} = t_{SC, clock} - \delta t_{clock} + \Delta t_{Rømer} + \Delta t_{Einstein} + \Delta t_{Shapiro}$$

- **Rømer Delay (Geometric Delay):**
  $$\Delta t_{Rømer} = \frac{\mathbf{\hat{n}}_i \cdot \mathbf{r}_{SC}}{c}$$
- **Einstein Delay (Gravitational Redshift & Time Dilation in Solar Potential):**
  $$\Delta t_{Einstein} = \frac{2}{c^2} \sqrt{\mu_\odot a} \, e \sin E = \frac{2}{c^2} (\mathbf{r}_{SC} \cdot \mathbf{v}_{SC})$$
  *(Dimensionally verified: $[\text{m}^2\text{s}^{-1} / \text{m}^2\text{s}^{-2}] = \text{seconds}$)*
- **Shapiro Delay (Gravitational Path Delay around the Sun):**
  $$\Delta t_{Shapiro} = -\frac{2 \mu_\odot}{c^3} \ln \left( 1 + \mathbf{\hat{n}}_i \cdot \mathbf{\hat{r}}_{SC} + \epsilon_{reg} \right)$$
  where $\mu_\odot = G M_\odot$, $\mathbf{\hat{r}}_{SC} = \mathbf{r}_{SC} / |\mathbf{r}_{SC}|$, and $\epsilon_{reg} = \frac{R_\odot^2}{2 |\mathbf{r}_{SC}|^2}$ regularizes against unphysical logarithmic divergence near the solar limb.

### 1.2 Spacecraft Predicted Arrival Time
For a pulse whose reference arrival time at the SSB origin is $t_{SSB, template}$:

$$t_{pred, SC} = t_{SSB, template} - \Delta t_{Rømer} - \Delta t_{Einstein} - \Delta t_{Shapiro} + \delta t_{clock}$$

### 1.3 Scalar Pseudorange Observable
The scalar residual observable $z_i$ comparing measured arrival time to predicted arrival time:

$$z_i = c \cdot (t_{obs, SC} - t_{pred, SC})$$

Linearized about current estimated spacecraft position $\mathbf{\hat{r}}$ and clock bias $\delta \hat{t}$:

$$z_i = \mathbf{\hat{n}}_i^T (\mathbf{r}_{true} - \mathbf{\hat{r}}) + c (\delta t_{true} - \delta \hat{t}) + v_i$$

where $v_i \sim \mathcal{N}(0, \sigma_i^2)$ is observation noise.

### 1.4 Dynamic 8-State Measurement Sensitivity Matrix ($H$)
For $m$ scalar pulsar observations, the instantaneous measurement matrix $H \in \mathbb{R}^{m \times 8}$ is:

$$H = \begin{bmatrix}
\mathbf{\hat{n}}_1^T & \mathbf{0}_{1 \times 3} & 1 & 0 \\
\mathbf{\hat{n}}_2^T & \mathbf{0}_{1 \times 3} & 1 & 0 \\
\vdots & \vdots & \vdots & \vdots \\
\mathbf{\hat{n}}_m^T & \mathbf{0}_{1 \times 3} & 1 & 0
\end{bmatrix}$$

---

## 2. Canonical Sign Conventions & Worked Example

### 2.1 Sign Convention Rules
1. **Pulsar Direction Vector ($\mathbf{\hat{n}}_i$):** Unit vector directed **from the Solar System Barycenter outward toward the pulsar**.
2. **Spacecraft Position ($\mathbf{r}_{SC}$):** Cartesian vector directed **from the Solar System Barycenter toward the spacecraft**.
3. **Line-of-Sight Displacement ($\mathbf{\hat{n}}_i \cdot \mathbf{r}_{SC}$):**
   - If $\mathbf{\hat{n}}_i \cdot \mathbf{r}_{SC} > 0$, the spacecraft is displaced toward the pulsar relative to the SSB.
   - The incoming wavefront arrives at the spacecraft **earlier** than it reaches the SSB.
   - Therefore, $\Delta t_{Rømer} > 0$, and $t_{SC, true} = t_{SSB} - \Delta t_{Rømer}$.
4. **Clock Bias ($\delta t_{clock}$):**
   - Defined such that $t_{SC, clock} = t_{SC, true} + \delta t_{clock}$.
   - A positive bias ($\delta t_{clock} > 0$) means the spacecraft clock runs **ahead** of true proper time.

### 2.2 Worked Synthetic Numerical Example
- **Pulsar Direction:** $\mathbf{\hat{n}}_1 = [1, 0, 0]^T$ (pulsar located along $+X$).
- **Spacecraft Position:** $\mathbf{r}_{SC} = [1.495978707 \times 10^{11}, \; 0, \; 0]^T\text{ m}$ ($1.0\text{ AU}$ along $+X$).
- **Speed of Light:** $c = 299,792,458\text{ m/s}$.
- **Rømer Delay:**
  $$\Delta t_{Rømer} = \frac{\mathbf{\hat{n}}_1 \cdot \mathbf{r}_{SC}}{c} = \frac{1.495978707 \times 10^{11}\text{ m}}{299,792,458\text{ m/s}} = +499.0047838\dots\text{ seconds}$$
- **Event:** A pulse wavefront reaches the SSB origin at coordinate time $t_{SSB} = 1000.0000000\text{ s}$.
- **Spacecraft True Arrival Time:**
  $$t_{SC, true} = t_{SSB} - \Delta t_{Rømer} = 1000.0000000 - 499.0047838 = 500.9952162\text{ s}$$
- **Spacecraft Clock Readout with $+10\mu\text{s}$ Clock Bias:**
  $$t_{SC, clock} = 500.9952162\text{ s} + 0.0000100\text{ s} = 500.9952262\text{ s}$$
- **Reconstruction at Barycenter:**
  $$t_{SSB} = t_{SC, clock} - \delta t_{clock} + \Delta t_{Rømer} = 500.9952262 - 0.0000100 + 499.0047838 = 1000.0000000\text{ s}$$
  *(Consistency verified to sub-nanosecond precision)*.

---

## 3. Unit Rules & Dimensional Rigor

Every variable and function interface must strictly encode its physical units:
- Distances: meters ($\text{m}$), e.g. `r_sc_m`, `semiMajorAxis_m`
- Velocities: meters per second ($\text{m/s}$), e.g. `v_sc_mps`
- Time: seconds ($\text{s}$), e.g. `toa_s`, `dt_roemer_s`
- Clock Bias: seconds ($\text{s}$), e.g. `clockBias_s`
- Clock Drift: unitless ($\text{s/s}$), e.g. `clockDrift_rate`
- Angles: radians ($\text{rad}$), e.g. `phase_rad`, `eccentricAnomaly_rad`

### Dimensional Audit of Einstein Delay
The previous expression $\frac{2 \mu_\odot}{c^2 \sqrt{a (1 - e^2)}} e \sin E$ had units:
$$\frac{[\mu_\odot]}{[c^2] [\sqrt{a}]} = \frac{\text{m}^3\text{s}^{-2}}{\text{m}^2\text{s}^{-2} \cdot \text{m}^{1/2}} = \text{m}^{1/2} \neq \text{seconds}$$
The canonical expression $\frac{2}{c^2} \sqrt{\mu_\odot a} \, e \sin E$ has units:
$$\frac{[\sqrt{\mu_\odot a}]}{[c^2]} = \frac{\sqrt{\text{m}^3\text{s}^{-2} \cdot \text{m}}}{\text{m}^2\text{s}^{-2}} = \frac{\text{m}^2\text{s}^{-1}}{\text{m}^2\text{s}^{-2}} = \text{seconds}$$
*Dimensional integrity confirmed.*

---

## 4. Observability: Instantaneous vs Dynamic Filtering

1. **Scalar Observation Nature:** Each pulsar TOA observation is a **single scalar measurement**. It provides one 1D geometric projection along the line-of-sight unit vector $\mathbf{\hat{n}}_i$.
2. **Instantaneous Subspace:** At any instantaneous moment, the measurement matrix $H$ has zero sensitivity to velocity ($\frac{\partial z}{\partial \mathbf{v}} = \mathbf{0}_{1 \times 3}$) and clock drift ($\frac{\partial z}{\partial \dot{\delta} t} = 0$).
   - For $m = 4$ pulsars, $\text{rank}(H) \le 4$.
   - **Four pulsars CANNOT instantaneously determine the 8-state vector.**
3. **Dynamic Observability via Filtering:**
   Velocity and clock drift are observable **only across a time series of measurements** combined with the spacecraft orbital dynamics model:
   $$\mathbf{x}_{k} = \mathbf{f}(\mathbf{x}_{k-1}, \Delta t)$$
   The Kalman filter state transition matrix $\Phi(t_k, t_{k-1})$ couples velocity into subsequent position displacements ($\mathbf{r}_k \approx \mathbf{r}_{k-1} + \mathbf{v}_{k-1} \Delta t$). As the spacecraft moves, the line-of-sight geometry changes, allowing the filter to estimate velocity and clock drift over multiple observation epochs.

---

## 5. Geometry Metrics: PDOP vs GDOP

We strictly distinguish two separate geometric condition metrics:

### 5.1 Position-Only Geometry Metric ($\text{PDOP}_{pos}$)
Used when clock bias is assumed known or calibrated independently:
$$G = \begin{bmatrix} \mathbf{\hat{n}}_1^T \\ \vdots \\ \mathbf{\hat{n}}_m^T \end{bmatrix} \in \mathbb{R}^{m \times 3}$$
$$\text{PDOP}_{pos} = \sqrt{\text{Tr}\left( (G^T G)^{-1} \right)}$$
- Requires $m \ge 3$ non-coplanar pulsars.
- Measures purely spatial geometric dilution of precision.

### 5.2 Position + Clock-Bias Geometry Metric ($\text{GDOP}$)
Used for instantaneous snapshot pseudo-ranging with an unknown receiver clock bias:
$$H_{geom} = \begin{bmatrix}
\mathbf{\hat{n}}_1^T & 1 \\
\vdots & \vdots \\
\mathbf{\hat{n}}_m^T & 1
\end{bmatrix} \in \mathbb{R}^{m \times 4}$$
$$Q_{geom} = (H_{geom}^T H_{geom})^{-1} \in \mathbb{R}^{4 \times 4}$$
$$\text{GDOP} = \sqrt{\text{Tr}(Q_{geom})}$$
$$\text{PDOP} = \sqrt{Q_{11} + Q_{22} + Q_{33}}, \quad \text{TDOP} = \sqrt{Q_{44}}, \quad \text{GDOP} = \sqrt{\text{PDOP}^2 + \text{TDOP}^2}$$
- Requires $m \ge 4$ non-coplanar pulsars.
- **Rule:** Never hard-code GDOP values in simulation code. All geometry metrics must be computed directly from the active pulsar direction vectors $\mathbf{\hat{n}}_i$.

---

## 6. Pulsar Count & Failure Logic

The statement *"< 3 pulsars always causes complete navigation divergence"* is physically incorrect and replaced by:

1. **Instantaneous Snapshot Solvability:**
   - $m \ge 4$ non-coplanar: Instantaneous snapshot position + clock solvable.
   - $m = 3$ non-coplanar: Instantaneous snapshot position solvable only if clock bias is known; otherwise instantaneous geometry matrix is rank-deficient.
   - $m < 3$: Instantaneous snapshot position unsolvable.
2. **Dynamic Filter Behavior During Outages:**
   - When active pulsar count drops below 4 (or below 3), the Iterated Extended Kalman Filter **does not immediately crash or produce `NaN`**.
   - Instead, the filter relies on its orbital process model (dead reckoning) and whatever line-of-sight constraints remain.
   - **Physical Effect:** Covariance uncertainty grows along the unconstrained directions:
     - Clock bias uncertainty grows linearly according to clock drift variance.
     - Position uncertainty along the missing observation axes grows according to orbital integration uncertainty.
   - The simulation flags a degraded state (`NAV_STATUS_DEGRADED`) when covariance exceeds mission thresholds, rather than fabricating an artificial crash.

---

## 7. Real NASA SEXTANT Facts vs PULSAR-X Pedagogical Simulation

| Attribute | Real NASA SEXTANT Experiment (Flight Facts) | PULSAR-X Simulation Model |
| :--- | :--- | :--- |
| **Platform** | ISS (International Space Station) low-Earth orbit aboard NICER payload | Deep space interplanetary cruise / Jovian transfer |
| **Flight Demonstration** | November 2017: First autonomous on-orbit pulsar navigation demonstration | Educational / competition browser simulation inspired by SEXTANT |
| **Achieved Accuracy** | $< 10\text{ km}$ requirement; achieved $\approx 5\text{ km}$ RMS over a 2-day tracking arc | Scenario target: $\approx 1.8\text{ km}$ steady-state lock (simulated) |
| **Detector Hardware** | 52 active silicon drift detectors (XTI) with $\approx 1,800\text{ cm}^2$ effective area | Parametric simulated collimator ($A_{det} = 2,000\text{ cm}^2$) |
| **Observation Cadence** | Sequential pointing (targets one pulsar at a time for hours; multi-day batch) | Simplified simultaneous multi-beacon reception (pedagogical) |
| **Ephemeris Standard** | Full JPL DE421 / DE430 numerical planetary ephemeris | Analytical Keplerian planetary model (Sun, Earth, Jupiter) |

---

## 8. Photon Accumulation & Time Scaling Consistency

To prevent physical inconsistencies, the simulation explicitly separates:
1. **Physical Source Flux ($F_{x, i}$):** e.g., $0.0012\text{ photons/cm}^2\text{/s}$ for PSR B1937+21.
2. **Detector Effective Area ($A_{det}$):** $2,000\text{ cm}^2$.
3. **Physical Photon Arrival Rate:**
   $$R_{physical} = F_{x, i} \cdot A_{det} = 0.0012 \times 2,000 = 2.4\text{ photons/second}$$
4. **Simulation Time Acceleration Factor ($\kappa$):** e.g., $\kappa = 50\times$.
5. **Effective Simulation Rate:**
   $$R_{effective} = R_{physical} \cdot \kappa = 120\text{ photons/simulated-second}$$
6. **Simulated Observation Accumulation:**
   In an observation window of $T_{obs} = 12\text{ seconds}$ at $\kappa = 50$, total photons accumulated:
   $$N_{photons} = R_{effective} \cdot T_{obs} \approx 1,440\text{ photons}$$
*Rule: Never present a low physical rate (e.g. 0.05 ph/s) yielding thousands of photons in a few wall-clock seconds without explicitly citing detector area and time acceleration.*

---

## 9. Visual Approximations vs Physical Simulation

| Feature | Physical Simulation (Ground Truth) | Visual Representation (Approximation) |
| :--- | :--- | :--- |
| **Pulsar Spin** | True rotational frequency $\nu$ and derivative $\dot{\nu}$ drive phase $\Phi(t)$ | Visual beam rotation speed capped or normalized for visual clarity |
| **Emission Beams** | Collimated X-ray synchrotron emission cone geometry | Additive volumetric GLSL shader with stylized falloff and glow |
| **Accretion Disk / Core** | Gravitational point mass, radius $R \approx 10\text{ km}$, $B \sim 10^8\text{ G}$ | Stylized emissive 3D sphere with artistic procedural surface noise |
| **Photon Detection** | Inhomogeneous Poisson random process generating discrete timestamps | Geiger audio clicks and sensor pixel flashes triggered by Poisson events |
| **General Relativity** | First-order post-Newtonian Rømer, Einstein, and Shapiro delays | Stylized lens flares, bloom, and chromatic aberration |

*Rule: Never claim that visual shaders simulate "frame dragging" or "magnetohydrodynamic plasma physics." Shaders are artistic visual approximations.*

---

## 10. Prohibited Claims & Integrity Boundaries

1. **No Claims of NASA Certification:** PULSAR-X is an educational and competition project *inspired by* NASA SEXTANT and published aerospace literature; it is not certified, validated, or endorsed by NASA or JPL.
2. **No Fictional Physics:** Do not invent non-existent relativistic delay effects or fictional propulsion physics.
3. **No Hard-Coded Telemetry:** Telemetry readouts in HUD and Science Lab must always reflect computed values from the simulation engine.
4. **No Fabricated Performance Claims:** Never report estimated or synthetic benchmark frame rates as empirical facts.
