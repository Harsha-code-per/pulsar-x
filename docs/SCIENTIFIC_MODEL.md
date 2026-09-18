# PULSAR-X — Scientific Model: Deep Space X-Ray Pulsar Navigation (XPNAV)

## 1. Executive Scientific Summary

**PULSAR-X** simulates autonomous spacecraft position and velocity determination using periodic X-ray emissions from rotation-powered millisecond pulsars (MSPs). This technique, known in aerospace literature as **X-ray Pulsar Navigation (XPNAV)** and flight-demonstrated in Earth orbit by NASA's **SEXTANT** (Station Explorer for X-ray Timing and Navigation Technology) experiment aboard the ISS NICER payload in 2017, functions as a celestial GPS.

Instead of artificial satellites orbiting Earth, XPNAV uses rapidly rotating neutron stars located hundreds to thousands of light-years away. Because of their immense moment of inertia ($I \approx 10^{38}\text{ kg}\cdot\text{m}^2$) and ultra-strong magnetic fields ($B \sim 10^8 - 10^9\text{ G}$ for MSPs), these stellar remnants spin with stability rivaling terrestrial atomic clocks, emitting sweeping beams of radiation across the electromagnetic spectrum.

*Note on Provenance:* PULSAR-X is an educational and competition-grade simulation inspired by NASA SEXTANT and published aerospace literature; it does not claim official NASA certification or flight endorsement.

---

## 2. Reference Frames, Coordinates & Units

### 2.1 Coordinate System & Reference Frame
- **Primary Reference Frame:** **Barycentric Celestial Reference System (BCRS)**, aligned with the **International Celestial Reference Frame (ICRF)**.
- **Origin:** Solar System Barycenter (SSB), the center of mass of the Solar System.
- **Orientation:**
  - $X$-axis: Directed toward the Vernal Equinox ($\Upsilon$, J2000.0 epoch).
  - $Z$-axis: Directed toward the Celestial North Pole (J2000.0 epoch).
  - $Y$-axis: Completes the right-handed Cartesian triad ($Y = Z \times X$).
- **Spacecraft Local Frame:** Spacecraft-centered orbital reference frame (Radial, Transverse, Normal — RTN).

### 2.2 Time Standards & Authoritative Sign Conventions
- **Barycentric Coordinate Time (TCB / TDB):** The coordinate time coordinate of the BCRS. It serves as the master simulation clock $t_{SSB}$.
- **Spacecraft Proper Time ($t_{SC, true}$):** The true physical time experienced by the spacecraft.
- **Spacecraft Onboard Clock Time ($t_{SC, clock}$):** The time recorded by the spacecraft's local clock (subject to bias and drift):
  $$t_{SC, clock} = t_{SC, true} + \delta t_{clock}$$
- **Master Coordinate Transformation:**
  $$t_{SSB} = t_{SC, clock} - \delta t_{clock} + \Delta t_{Rømer} + \Delta t_{Einstein} + \Delta t_{Shapiro}$$
  where $\delta t_{clock}$ is the clock bias, $\Delta t_{Rømer}$ is the geometric light-travel delay to the SSB, $\Delta t_{Einstein}$ is the gravitational redshift/dilation delay, and $\Delta t_{Shapiro}$ is the gravitational path delay.

### 2.3 Physical Units (SI Standards)
All simulation structures strictly adhere to SI units unless converted for display:
- Length: meters ($\text{m}$) $[1\text{ AU} \equiv 1.495978707 \times 10^{11}\text{ m}]$
- Velocity: meters per second ($\text{m/s}$)
- Time: seconds ($\text{s}$)
- Angles: radians ($\text{rad}$)
- Pulsar Frequency: Hertz ($\text{Hz}$ or $\text{s}^{-1}$)
- Pulsar Period: seconds ($\text{s}$) or milliseconds ($\text{ms}$)
- Speed of Light: $c \equiv 299,792,458\text{ m/s}$
- Heliocentric Gravitational Parameter: $\mu_\odot = G M_\odot \approx 1.32712440018 \times 10^{20}\text{ m}^3\text{s}^{-2}$
- Solar Radius: $R_\odot \approx 6.9634 \times 10^8\text{ m}$

---

## 3. Astrometric Pulsar Model

Each navigation beacon in the pulsar catalog is parameterized by real astronomical data:

$$\text{Pulsar}_i = \left\{ \mathbf{\hat{n}}_i, \; \nu_i, \; \dot{\nu}_i, \; \Phi_{0,i}, \; t_{0,i}, \; F_{x,i}, \; W_i, \; d_i \right\}$$

### 3.1 Unit Direction Vector ($\mathbf{\hat{n}}_i$)
Because pulsars are at interstellar distances ($d_i > 100\text{ pc} \approx 3 \times 10^{18}\text{ m}$), the incoming X-ray wavefronts are effectively planar across the entire Solar System. The unit direction vector directed **from the Solar System Barycenter outward toward pulsar $i$** is defined by Right Ascension ($\alpha_i$) and Declination ($\delta_i$):

$$\mathbf{\hat{n}}_i = \begin{bmatrix} \cos \delta_i \cos \alpha_i \\ \cos \delta_i \sin \alpha_i \\ \sin \delta_i \end{bmatrix}$$

Proper motion ($\boldsymbol{\mu}$) is neglected for pedagogical clarity over typical mission timescales ($< 5\text{ years}$), yielding a constant unit vector.

### 3.2 Rotational Phase Evolution
The proper rotational phase $\Phi_i(t)$ of pulsar $i$ at the Solar System Barycenter is modeled by a Taylor series expansion around reference epoch $t_{0,i}$:

$$\Phi_i(t) = \Phi_{0,i} + \nu_i (t - t_{0,i}) + \frac{1}{2} \dot{\nu}_i (t - t_{0,i})^2 + \frac{1}{6} \ddot{\nu}_i (t - t_{0,i})^3$$

- $\nu_i$: Spin frequency ($\text{Hz}$)
- $\dot{\nu}_i$: First frequency derivative ($\text{s}^{-2}$, accounting for magnetic dipole spin-down)
- $\Phi_{0,i}$: Reference pulse phase at $t_{0,i}$

### 3.3 Target Pulsar Constellation Catalog (Derived from ATNF & NICER)
| Pulsar Identifier | Type | Period $P$ (ms) | Frequency $\nu$ (Hz) | $\dot{\nu}$ ($10^{-15}\text{ s}^{-2}$) | RA $\alpha$ (deg) | Dec $\delta$ (deg) | Flux (ph/cm$^2$/s) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **PSR B1937+21** | Millisecond | 1.5578 | 641.928 | -43.3 | 294.91 | +21.58 | 0.0012 |
| **PSR B1821-24** | Millisecond | 3.0543 | 327.405 | -161.5 | 276.13 | -24.87 | 0.0008 |
| **PSR J0437-4715** | Millisecond | 5.7574 | 173.687 | -1.73 | 69.31 | -47.25 | 0.0021 |
| **PSR J0218+4232** | Millisecond | 2.3230 | 430.461 | -14.3 | 34.72 | +42.53 | 0.0006 |
| **Crab (B0531+21)**| Canonical Young | 33.392 | 29.947 | -377500 | 83.63 | +22.01 | 1.5400 |

*(Note: Crab has large flux for initial acquisition, while MSPs provide sub-microsecond timing precision for steady-state navigation).*

---

## 4. Spacecraft Dynamics & Kinematics

The spacecraft true physical state vector in the BCRS frame is:

$$\mathbf{x}(t) = \begin{bmatrix} \mathbf{r}(t) \\ \mathbf{v}(t) \end{bmatrix} \in \mathbb{R}^6$$

### 4.1 Equations of Motion
$$\frac{d\mathbf{r}}{dt} = \mathbf{v}$$
$$\frac{d\mathbf{v}}{dt} = -\frac{\mu_\odot}{|\mathbf{r}|^3} \mathbf{r} + \sum_{p} \mu_p \left( \frac{\mathbf{r}_p - \mathbf{r}}{|\mathbf{r}_p - \mathbf{r}|^3} - \frac{\mathbf{r}_p}{|\mathbf{r}_p|^3} \right) + \mathbf{a}_{thrust} + \mathbf{a}_{SRP}$$

- $\mathbf{r}_p$: Position vector of third-body planet $p$ relative to SSB (analytical Keplerian model).
- $\mathbf{a}_{thrust}$: Applied spacecraft propulsion acceleration.
- $\mathbf{a}_{SRP}$: Solar radiation pressure perturbation.

Numerical integration is performed via a **4th-Order Runge-Kutta (RK4)** integrator with fixed step $\Delta t = 0.01\text{ s}$.

---

## 5. Relativistic Time-of-Arrival (TOA) Observation Model

When a pulse wavefront from pulsar $i$ passes the spacecraft at local spacecraft clock time $t_{SC, clock}$, its arrival time at the reference Solar System Barycenter ($t_{SSB}$) is related by:

$$t_{SSB} = t_{SC, clock} - \delta t_{clock} + \Delta t_{Rømer} + \Delta t_{Einstein} + \Delta t_{Shapiro}$$

```
                           Pulsar Emission Wavefront
                                / / / / / /
                               / / / / / / (propagating along -n_i)
                              v v v v v v
                         . - ~ ~ ~ - .
                     . '               ' .
                   /                       \
                  |       (Sun)             |
                   \                       /
                     . '               ' .
                         ' - ~ ~ ~ - '
                                  |
                                  | Shapiro Path Curvature: - (2 mu_Sun / c^3) ln(...)
                                  v
                               [Spacecraft] r_SC
                                     \
                                      \  Rømer Delay: (n_i · r_SC) / c
                                       \
                                        v
                                    + (SSB Origin)
```

### 5.1 Geometric Rømer Delay ($\Delta t_{Rømer}$)
The classical geometric light-travel time from the spacecraft position $\mathbf{r}_{SC}$ to the Solar System Barycenter projected along the line of sight:

$$\Delta t_{Rømer} = \frac{\mathbf{\hat{n}}_i \cdot \mathbf{r}_{SC}(t)}{c}$$

**Sign Verification:**
- When $\mathbf{\hat{n}}_i \cdot \mathbf{r}_{SC} > 0$, the spacecraft is closer to the pulsar than the SSB is.
- The pulse strikes the spacecraft **before** it reaches the SSB.
- Hence, $t_{SC, true} = t_{SSB} - \Delta t_{Rømer} \implies t_{SSB} = t_{SC, true} + \Delta t_{Rømer}$.
- For a craft at $1\text{ AU}$ along the line of sight:
  $$\Delta t_{Rømer} = \frac{1.495978707 \times 10^{11}\text{ m}}{299,792,458\text{ m/s}} \approx +499.00478\text{ seconds}$$

### 5.2 Relativistic Einstein Delay ($\Delta t_{Einstein}$)
Accounts for gravitational redshift and special relativistic time dilation of the spacecraft clock in the Solar System gravitational potential. The canonical analytical periodic formulation (Moyer 1971, Standish 1998) for a heliocentric orbit is:

$$\Delta t_{Einstein} = \frac{2}{c^2} \sqrt{\mu_\odot a} \, e \sin E = \frac{2}{c^2} (\mathbf{r}_{SC} \cdot \mathbf{v}_{SC})$$

- **Dimensional Verification:**
  $$\left[ \frac{\sqrt{\mu_\odot a}}{c^2} \right] = \frac{\sqrt{\text{m}^3\text{s}^{-2} \cdot \text{m}}}{\text{m}^2\text{s}^{-2}} = \frac{\text{m}^2\text{s}^{-1}}{\text{m}^2\text{s}^{-2}} = \text{seconds}$$
- **Physical Scale:** For Earth orbit ($a = 1\text{ AU}, e = 0.0167$), this term produces an amplitude of $\approx 1.66\text{ ms} \sin E$.
*(Pedagogical Note: The previously drafted formula with $\sqrt{a(1-e^2)}$ in the denominator has been eliminated due to dimensional invalidity).*

### 5.3 Relativistic Shapiro Delay ($\Delta t_{Shapiro}$)
The general relativistic gravitational path delay caused by the curvature of spacetime around the Sun for an incoming interstellar signal:

$$\Delta t_{Shapiro} = -\frac{2 \mu_\odot}{c^3} \ln \left( 1 + \mathbf{\hat{n}}_i \cdot \mathbf{\hat{r}}_{SC} + \frac{R_\odot^2}{2 |\mathbf{r}_{SC}|^2} \right)$$

where $\mathbf{\hat{r}}_{SC} = \mathbf{r}_{SC} / |\mathbf{r}_{SC}|$.
- **Scale Factor:** $\frac{2 \mu_\odot}{c^3} \approx 9.852 \times 10^{-6}\text{ s} \approx 9.85\mu\text{s}$.
- **Regularization & Occultation:** The term $\frac{R_\odot^2}{2 |\mathbf{r}_{SC}|^2}$ prevents logarithmic singularity as the line of sight grazes the Sun ($\mathbf{\hat{n}}_i \cdot \mathbf{\hat{r}}_{SC} \to -1$). If the ray passes within the solar physical radius ($b < R_\odot$), solar coronal X-ray noise occults the beacon, and the observation is dropped.

---

## 6. Observation Process & Photon Accumulation Mechanics

Because individual X-ray photons are sparse, single pulses cannot be detected instantaneously.

### 6.1 Photon Rate & Simulation Time Scaling
To ensure physical and visual consistency:
1. **Source Flux ($F_{x, i}$):** e.g., $0.0012\text{ photons/cm}^2\text{/s}$ for PSR B1937+21.
2. **Detector Effective Area ($A_{det}$):** $2,000\text{ cm}^2$ (SEXTANT-class collimator array).
3. **True Physical Arrival Rate:**
   $$R_{phys} = F_{x, i} \cdot A_{det} = 0.0012 \times 2,000 = 2.4\text{ photons/second}$$
4. **Simulation Acceleration Factor ($\kappa$):** $\kappa = 50\times$ in standard simulation mode.
5. **Effective Simulation Count:**
   $$N_{photons} = R_{phys} \cdot \kappa \cdot T_{obs}$$
   For $T_{obs} = 12\text{ seconds}$ at $\kappa = 50$, $N_{photons} \approx 1,440\text{ photons}$.
   *(This resolves the previous discrepancy where 1,420 photons appeared from a 0.05 ph/s process in a few seconds).*

### 6.2 Epoch Folding & Phase Measurement
1. Incoming photon arrival times $\{t_k\}_{k=1}^N$ are folded into phase bins $\phi_k = \text{frac}(\Phi_i(t_k)) \in [0, 1)$.
2. The folded profile $H(\phi)$ is cross-correlated with template profile $P_{template}(\phi)$ to extract phase offset $\Delta \phi_i$.
3. The measured time of arrival is:
   $$t_{obs, i} = t_{pred, i} + \frac{\Delta \phi_i}{\nu_i}$$

---

## 7. Navigation Solver: Observability & The Iterated Extended Kalman Filter

### 7.1 Augmented State Vector
$$\mathbf{x} = \begin{bmatrix} \mathbf{r} \\ \mathbf{v} \\ c \delta t_{clock} \\ c \dot{\delta} t_{clock} \end{bmatrix} \in \mathbb{R}^8$$

### 7.2 Scalar Measurement Observable & Instantaneous Rank
Each pulsar observation yields a **single scalar pseudorange**:

$$z_i = c \cdot (t_{obs, i} - t_{pred, i}) = \mathbf{\hat{n}}_i^T (\mathbf{r}_{true} - \mathbf{\hat{r}}) + c (\delta t_{true} - \delta \hat{t}) + v_i$$

The instantaneous measurement matrix $H \in \mathbb{R}^{m \times 8}$ is:

$$H = \begin{bmatrix}
\mathbf{\hat{n}}_1^T & \mathbf{0}_{1 \times 3} & 1 & 0 \\
\mathbf{\hat{n}}_2^T & \mathbf{0}_{1 \times 3} & 1 & 0 \\
\vdots & \vdots & \vdots & \vdots \\
\mathbf{\hat{n}}_m^T & \mathbf{0}_{1 \times 3} & 1 & 0
\end{bmatrix}$$

> [!IMPORTANT]
> **Observability Clarification:**
> The instantaneous row of $H$ has zero sensitivity to velocity ($\mathbf{0}_{1 \times 3}$) and clock drift ($0$).
> For $m = 4$ pulsars, $\text{rank}(H) \le 4$.
> **Four scalar measurements DO NOT instantaneously solve the 8-state vector.**
> Instead, velocity $\mathbf{v}$ and clock drift $\dot{\delta} t$ are estimated **dynamically over time** through the orbital state transition matrix $\Phi_k$ in the Kalman filter:
> $$\mathbf{r}(t + \Delta t) \approx \mathbf{r}(t) + \mathbf{v}(t) \Delta t$$
> As the spacecraft moves along its trajectory, changes in position over multiple observation epochs reveal velocity and clock drift.

### 7.3 IEKF Recursion
1. **Time Update (Propagation):**
   $$\mathbf{\hat{x}}_{k|k-1} = \mathbf{f}(\mathbf{\hat{x}}_{k-1|k-1}, \Delta t)$$
   $$P_{k|k-1} = \Phi_k P_{k-1|k-1} \Phi_k^T + Q_k$$
2. **Measurement Update (Iterated EKF):**
   Iterate $\mathbf{\hat{x}}_j$ to convergence:
   $$K_j = P_{k|k-1} H_j^T (H_j P_{k|k-1} H_j^T + R_k)^{-1}$$
   $$\mathbf{\hat{x}}_{j+1} = \mathbf{\hat{x}}_{k|k-1} + K_j (\mathbf{z}_k - \mathbf{h}(\mathbf{\hat{x}}_j) - H_j(\mathbf{\hat{x}}_{k|k-1} - \mathbf{\hat{x}}_j))$$
   Upon convergence:
   $$P_{k|k} = (I - K H) P_{k|k-1} (I - K H)^T + K R_k K^T$$

---

## 8. Geometry Metrics: Distinguishing PDOP and GDOP

We rigorously distinguish two separate geometry metrics:

### 8.1 Position-Only Geometry Metric ($\text{PDOP}_{pos}$)
When clock bias is known or calibrated independently, spatial dilution of precision depends only on the pulsar line-of-sight unit vectors:

$$G = \begin{bmatrix} \mathbf{\hat{n}}_1^T \\ \vdots \\ \mathbf{\hat{n}}_m^T \end{bmatrix} \in \mathbb{R}^{m \times 3}, \quad \text{PDOP}_{pos} = \sqrt{\text{Tr}\left( (G^T G)^{-1} \right)}$$

Requires $m \ge 3$ non-coplanar pulsars.

### 8.2 Position + Clock-Bias Geometry Metric ($\text{GDOP}$)
For instantaneous 4D spacetime snapshot estimation:

$$H_{geom} = \begin{bmatrix}
\mathbf{\hat{n}}_1^T & 1 \\
\vdots & \vdots \\
\mathbf{\hat{n}}_m^T & 1
\end{bmatrix} \in \mathbb{R}^{m \times 4}, \quad Q_{geom} = (H_{geom}^T H_{geom})^{-1} \in \mathbb{R}^{4 \times 4}$$

$$\text{GDOP} = \sqrt{\text{Tr}(Q_{geom})}, \quad \text{PDOP} = \sqrt{Q_{11} + Q_{22} + Q_{33}}, \quad \text{TDOP} = \sqrt{Q_{44}}$$

Requires $m \ge 4$ non-coplanar pulsars.
*Rule: The simulation engine computes GDOP dynamically from the active pulsar direction vectors. Values are never hard-coded.*

---

## 9. Failure Logic & Degraded Constellation Dynamics

The simplistic statement *"< 3 pulsars causes complete divergence"* is replaced by physically accurate dynamics:

1. **Instantaneous Snapshot Solvability:**
   - $m \ge 4$ non-coplanar: Instantaneous position and clock bias are uniquely solvable.
   - $m = 3$ non-coplanar: Instantaneous position solvable only if clock bias is known; otherwise $(H_{geom}^T H_{geom})$ is singular.
   - $m < 3$: Instantaneous snapshot unsolvable.
2. **Dynamic Kalman Filter Behavior with Fewer Measurements:**
   - When active pulsars drop to 2, 1, or 0, the Kalman filter **does not immediately crash or produce `NaN`**.
   - The filter continues propagating state via its orbital dynamics model (dead reckoning).
   - **Covariance Evolution:**
     - Along observed line-of-sight vectors, uncertainty remains constrained.
     - Along unobserved axes, covariance grows monotonically with orbital uncertainty and clock drift.
   - The system transitions through operational states:
     - `LOCKED`: $m \ge 4$ non-coplanar, covariance within operational tolerance.
     - `DEGRADED`: $1 \le m < 4$, filter operating on partial constraints; dead-reckoning drift accumulating.
     - `BLACKOUT`: $m = 0$, pure dead reckoning; uncertainty expanding at unconstrained rates.

---

## 10. Pedagogical Approximations vs NASA Flight Reality

| Reality (NASA SEXTANT / NICER) | PULSAR-X Pedagogical Approximation | Technical Justification |
| :--- | :--- | :--- |
| Full relativistic DE440 numerical ephemeris | Keplerian 3-body analytical planetary positions (Sun, Earth, Jupiter) | Eliminates multi-megabyte ephemeris downloads; error $< 100\text{ m}$. |
| Sequential single-target pointing over days | Simultaneous multi-beacon observation (pedagogical) | Enables real-time browser demonstration of celestial triangulation. |
| Inhomogeneous dispersion measure variations | Constant mean $\text{DM}_i$ for each pulsar | Minimal DM variations over short timescales; preserves determinism. |
| Fixed direction vectors $\mathbf{\hat{n}}_i$ | Fixed direction vectors $\mathbf{\hat{n}}_i$ | Angular parallax $< 1\text{ mas/yr}$ at interstellar distances ($> 100\text{ pc}$). |
| Hours of photon accumulation | Accelerated photon accumulation rate ($\kappa = 50\times$) | Allows users to witness filter convergence in 30 seconds rather than hours. |

### Visual Approximations vs Physical Simulation
- **Physically Modeled:** Relativistic TOA delays, pulse phase evolution, Poisson photon arrival statistics, IEKF state and covariance propagation, dynamic GDOP.
- **Visually Approximated:** Additive volumetric relativistic jet cones, stylized accretion disk glow, procedural solar corona turbulence, lens flares, and cockpit reflections.
