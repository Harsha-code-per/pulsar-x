# PULSAR-X — Multi-Tier Validation & Testing Strategy

## 1. Quality Assurance Philosophy

In competition-grade scientific computing and mission visualization, compilation is merely a syntactic prerequisite—it does not imply correctness.

**"No feature should be considered complete merely because it compiles."**

The validation strategy for **PULSAR-X** operates across four independent, rigorous verification levels:
1. **SCIENTIFIC LEVEL:** Mathematical truth, dimensional consistency, relativistic equations, and known-answer solutions.
2. **SIMULATION LEVEL:** State consistency, fault injection resilience, deterministic reproducibility, monotonic uncertainty evolution, and filter stability.
3. **RENDERING LEVEL:** WebGL stability, shader fallbacks, camera viewports, and context lifecycle handling.
4. **APPLICATION LEVEL:** Static types, linting rules, bundle performance, and Vercel edge deployment.

---

## 2. Level 1: Scientific Validation

Scientific tests verify that mathematical models correctly implement established physics and astronomy literature.

### 2.1 Dimensional Consistency Verification Test
- **Objective:** Mathematically guarantee that every timing delay function outputs physical seconds ($\text{s}$).
- **Automated Assertions:**
  1. **Rømer Delay:** $[\mathbf{\hat{n}}_i \cdot \mathbf{r} / c] = [\text{m} / (\text{m/s})] = \text{s}$.
  2. **Einstein Delay:** $[\frac{2}{c^2} \sqrt{\mu_\odot a} \, e \sin E] = [\frac{\text{m}^2/\text{s}}{\text{m}^2/\text{s}^2}] = \text{s}$. (Automated test fails if an erroneous $\sqrt{a}$ denominator formulation is introduced).
  3. **Shapiro Delay:** $[\frac{2 \mu_\odot}{c^3}] = [\frac{\text{m}^3/\text{s}^2}{\text{m}^3/\text{s}^3}] = \text{s}$. Logarithmic argument must be dimensionless.

### 2.2 Canonical TOA Sign Convention Test
- **Objective:** Verify that the geometric Rømer delay sign, spacecraft position, and clock bias produce consistent, non-inverted arrival times.
- **Methodology (Canonical Synthetic Test):**
  1. Pulsar $\mathbf{\hat{n}}_1 = [1, 0, 0]^T$ along $+X$.
  2. Spacecraft placed at $1\text{ AU}$ along $+X$: $\mathbf{r}_{SC} = [1.495978707 \times 10^{11}, 0, 0]^T\text{ m}$.
  3. SSB wavefront time: $t_{SSB} = 1000.0\text{ s}$.
  4. Injected clock bias: $\delta t = +10.0\mu\text{s}$.
- **Pass Criteria:**
  - $\Delta t_{Rømer} = +499.0047838\dots\text{ s}$.
  - $t_{SC, true} = t_{SSB} - \Delta t_{Rømer} = 500.9952162\text{ s}$ (arrives earlier at spacecraft).
  - $t_{SC, clock} = t_{SC, true} + \delta t = 500.9952262\text{ s}$.
  - Reconstructed $t_{SSB} = t_{SC, clock} - \delta t + \Delta t_{Rømer}$ must evaluate to $1000.0\text{ s}$ within $| \Delta | < 10^{-9}\text{ s}$.

### 2.3 Known-Answer Test (KAT): Synthetic Constellation Inversion
- **Objective:** Verify that the navigation solver reconstructs true 3D position from synthetic TOA measurements without bias.
- **Methodology:**
  1. Define 4 non-coplanar synthetic pulsars along tetrahedral axes.
  2. Choose arbitrary ground truth spacecraft position:
     $$\mathbf{r}_{true} = [1.2 \times 10^{11}, \; -4.5 \times 10^{10}, \; 8.2 \times 10^9]^T\text{ meters}$$
  3. Generate exact synthetic pseudoranges:
     $$z_i = \mathbf{\hat{n}}_i \cdot \mathbf{r}_{true} + c \cdot \delta t_{clock}$$
  4. Feed $z_i$ into the navigation solver with zero initial position knowledge ($\mathbf{\hat{r}}_0 = \mathbf{0}$).
- **Pass Criteria:**
  - Estimated position $\mathbf{\hat{r}}$ converges such that:
    $$\|\mathbf{\hat{r}} - \mathbf{r}_{true}\| < 1.0\times 10^{-4}\text{ meters (Machine precision limit)}$$

### 2.4 Orbital Energy & Momentum Conservation
- **Objective:** Ensure the RK4 numerical integrator preserves mechanical invariants over unpowered orbital arcs.
- **Pass Criteria:**
  - In a two-body Keplerian orbit with zero thrust and zero SRP, specific orbital energy $\epsilon = \frac{v^2}{2} - \frac{\mu_\odot}{r}$ and angular momentum $\mathbf{h} = \mathbf{r} \times \mathbf{v}$ satisfy:
    $$\frac{|\epsilon(t) - \epsilon(0)|}{|\epsilon(0)|} < 10^{-6}\text{ over } 100,000\text{ simulation steps}$$

---

## 3. Level 2: Simulation & Filter Robustness

Simulation tests evaluate stochastic processes, outage handling, and dynamic filter convergence.

### 3.1 Deterministic PRNG Seed Replay
- **Objective:** Verify bit-for-bit repeatability of stochastic simulation runs.
- **Pass Criteria:**
  - Execute two independent simulation runs with seed `S = 42819` for 5,000 steps including Poisson photon arrivals and clock drift.
  - Final telemetry outputs ($\mathbf{r}_{SC}, \mathbf{\hat{r}}, P, \text{GDOP}$) must match identically:
    $$\max \left| \text{run}_1[k] - \text{run}_2[k] \right| == 0.0$$

### 3.2 Monotonic Uncertainty Growth During Measurement Outages
- **Objective:** Confirm filter stability and physical fidelity during complete or partial signal outages.
- **Methodology:**
  1. Establish steady-state lock with 4 active pulsars.
  2. Disconnect all observations ($m = 0$, complete blackout) for a 1,000-second simulated interval.
- **Pass Criteria:**
  - The trace of the position error covariance matrix $P_{pos}$ must **increase monotonically**:
    $$\text{Tr}(P_{pos}(t_2)) > \text{Tr}(P_{pos}(t_1)) \quad \forall \; t_2 > t_1$$
  - Filter must not produce `NaN` or infinite values.
  - Clock bias uncertainty must grow at the rate governed by clock drift variance $Q_{clock}$.

### 3.3 Uncertainty Reduction After Measurement Recovery
- **Objective:** Verify re-convergence upon signal restoration.
- **Methodology:** Re-enable 4 non-coplanar pulsars following an outage.
- **Pass Criteria:**
  - The trace of $P_{pos}$ must **decrease monotonically** over subsequent measurement updates:
    $$\text{Tr}(P_{pos}(t + \Delta t)) < \text{Tr}(P_{pos}(t))$$
  - The filter must re-converge to steady-state accuracy within $\le 15$ measurement cycles.

### 3.4 Geometry Degradation & Condition Number Test
- **Objective:** Verify GDOP calculation and filter behavior under poor geometry.
- **Scenarios:**
  1. **Coplanar Pulsars:** Feed 4 pulsars lying in the ecliptic plane ($Z = 0$).
     - *Expectation:* Position uncertainty along the orthogonal $Z$-axis remains unconstrained; condition number of $(H_{geom}^T H_{geom}) > 10^6$; system raises `DEGRADED_GEOMETRY` alert without crashing.
  2. **Additional Observations:** Increase active pulsars from $m = 4 \to m = 6$.
     - *Expectation:* GDOP decreases; covariance volume $\det(P_{pos})$ strictly contracts.
  3. **Missing Observations ($m = 3$):**
     - *Expectation:* Instantaneous snapshot solver detects rank deficiency; dynamic Kalman filter continues running on partial constraints with increasing covariance along unobserved subspace.

---

## 4. Level 3: Rendering & WebGL Stability

Rendering tests verify that the visual presentation functions reliably across diverse browsers and display hardware.

### 4.1 Cross-Browser WebGL Engine Verification
- **Target Environments:**
  - Chromium (Google Chrome, Microsoft Edge, Brave)
  - Gecko (Mozilla Firefox)
  - WebKit (Safari on macOS and iOS)
- **Checks:**
  - WebGL 2.0 context acquisition without warnings.
  - Precision consistency: Verify fragment shaders execute without black artifacts on mobile Mali/Adreno GPUs.

### 4.2 WebGL Context Loss & Recovery
- **Objective:** Ensure application survives GPU driver resets or device sleep events.
- **Simulation Method:** Trigger via WebGL debug extension:
  ```javascript
  const ext = gl.getExtension('WEBGL_lose_context');
  ext.loseContext();
  setTimeout(() => ext.restoreContext(), 1000);
  ```
- **Pass Criteria:**
  - The UI gracefully switches to a recovery screen.
  - Upon context restoration, geometries, textures, materials, and post-processing passes are re-compiled automatically.
  - Simulation state resumes without losing historical telemetry.

### 4.3 Viewport Resize & Multi-Monitor Transitions
- **Checks:**
  - Instantaneous canvas resize when toggling sidebar or resizing window.
  - Moving browser between standard 1080p display ($\text{DPR} = 1$) and Retina 4K display ($\text{DPR} = 2$).
  - Aspect ratio changes ($16:9$, $21:9$ ultrawide, $9:16$ portrait mobile). Camera FOV and projection matrices adjust without distortion.

---

## 5. Level 4: Application & Build Integrity

Application tests verify code cleanliness, type safety, and production build viability.

### 5.1 Static Type Analysis
- **Command:** `npx tsc --noEmit`
- **Pass Criteria:** Exit code `0`. Zero type errors, zero implicit `any` assignments, zero unhandled union cases.

### 5.2 Lint & Formatting Standards
- **Command:** `npm run lint`
- **Pass Criteria:** Exit code `0`. Adherence to Next.js and ESLint core web vitals rules. Zero unreferenced variables.

### 5.3 Production Compilation & Bundle Budget
- **Command:** `npm run build`
- **Pass Criteria:**
  - Turbopack compilation completes without errors or deprecation warnings.
  - All static pages prerender cleanly (`○ (Static)`).
  - Initial JavaScript bundle size $< 350\text{ KB}$ (gzipped) for initial page load.

### 5.4 Automated Continuous Verification Pipeline (Pre-Commit & CI)
Every pull request or milestone commit must execute:
```powershell
# 1. Type verification
npx tsc --noEmit

# 2. Lint verification
npm run lint

# 3. Production build
npm run build
```
Any failure in this pipeline blocks progression to subsequent development phases.
