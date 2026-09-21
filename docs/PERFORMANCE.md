# PULSAR-X — Performance & Graphics Architecture

## 1. Core Performance Principles & Hardware Targets

**PULSAR-X** is an ambitious, visually rich 3D science experience that must run smoothly across diverse hardware profiles—from integrated Intel Iris Xe / Apple M-series chips to dedicated NVIDIA RTX desktop GPUs.

To guarantee high frame rates without sacrificing scientific accuracy, the performance architecture enforces **strict decoupling between the simulation clock and the display render loop**, **zero-allocation messaging**, and **aggressive GPU instancing**.

---

## 2. Render Loop & Worker Thread Decoupling

### 2.1 The Two-Loop Architecture
Simulation computation and 3D rendering operate on two entirely distinct loops:

```
[ SIMULATION WORKER THREAD ]                   [ MAIN UI & RENDER THREAD ]
- Fixed time-step physics (dt = 10ms)          - Variable refresh rate (60 Hz / 120 Hz)
- Numerical RK4 integration                    - Three.js WebGL rendering
- TOA relativistic calculations                - GSAP camera interpolation
- IEKF 8x8 matrix recursions                   - Audio synthesis modulation
      |                                              ^
      |                                              |
      +---- Transferable ArrayBuffer (60 Hz) --------+
            [ Double-Buffered Telemetry Snapshot ]
```

1. **Simulation Loop (Worker):**
   - Runs at a fixed step $\Delta t = 0.01\text{ s}$ (100 Hz internal ticks) to guarantee numerical stability of the RK4 integrator.
   - Decoupled from monitor refresh rates. Under accelerated time (e.g. $10\times$), the worker computes multiple physics sub-steps per dispatch without blocking the browser.
2. **Display Loop (Main Thread):**
   - Driven by `requestAnimationFrame` via React Three Fiber's `useFrame`.
   - Smoothly interpolates spacecraft position and orientation between the two most recent simulation snapshots ($\mathbf{x}_{prev}$ and $\mathbf{x}_{curr}$) using cubic Hermite spline interpolation:
     $$\mathbf{r}_{render}(t) = \text{Hermite}\left(\mathbf{r}_{prev}, \mathbf{v}_{prev}, \mathbf{r}_{curr}, \mathbf{v}_{curr}, \alpha\right)$$
     where $\alpha = (t - t_{prev}) / (t_{curr} - t_{prev}) \in [0, 1]$.

---

## 3. State Update Frequency & Throttling Strategy

React reconciliation is a primary source of frame jitter in web 3D applications. We prevent state-induced jank through frequency stratification:

| Consumer Layer | Update Frequency | Data Transport Mechanism | Impact on React Lifecycle |
| :--- | :--- | :--- | :--- |
| **WebGL Transform Matrices** | 60–120 Hz (Every frame) | Direct Three.js object mutation (`mesh.position.set(...)` in `useFrame`) | **Zero React Rerenders** |
| **Shader Uniforms (Beams/Jets)** | 60–120 Hz (Every frame) | Direct uniform mutation (`material.uniforms.uTime.value = t`) | **Zero React Rerenders** |
| **Procedural Web Audio** | Continuous / Event-Driven | AudioParam automation (`gainNode.gain.setValueAtTime(...)`) | **Zero React Rerenders** |
| **High-Precision HUD Readouts** | 15–20 Hz (Throttled) | Transient Zustand subscriptions (`useStore.subscribe`) targeting direct DOM `textContent` | **Zero React Rerenders** |
| **Recharts Telemetry Curves** | 4–10 Hz (Downsampled) | Zustand state updates to bounded circular buffer ($N \le 200$ data points) | **Controlled React Rerender** |
| **Cinematic Storyline Captions** | On Scene Transition ($< 0.1\text{ Hz}$) | Standard React state (`useCinematicStore`) | Negligible |

---

## 4. GPU Instancing & Geometry Optimization

### 4.1 Starfield Background (25,000+ Stars)
- **Anti-Pattern:** 25,000 separate `THREE.Mesh` objects or nested React components ($25,000$ draw calls $\implies < 2\text{ FPS}$).
- **Architecture:** Single `THREE.InstancedMesh` with a simple unit sphere or custom quad geometry.
- **Custom Attributes:**
  - `instanceMatrix` ($4\times 4$ transform matrix): Positions stars uniformly across a celestial sphere of radius $R = 100,000$.
  - `aColor` (`vec3`): Star spectral class (O, B, A, F, G, K, M) mapped to realistic Planck blackbody temperatures.
  - `aMagnitude` (`float`): Apparent stellar magnitude modulating point size.
  - `aTwinkleOffset` (`float`): Phase offset for subtle atmospheric/detector scintillation in the vertex shader.
- **Total Draw Calls:** **1**.

### 4.2 Pulsar Network Beams
- All active line-of-sight vectors between pulsars, spacecraft, and the solar barycenter are batched into a single dynamic `THREE.LineSegments` geometry using an interleaved `Float32BufferAttribute`.
- Updated via `bufferAttribute.needsUpdate = true` with zero object re-allocations.

---

## 5. Shader Strategy & Precision Management

### 5.1 Custom GLSL Shaders
Custom shaders are reserved for visually complex astronomical phenomena that cannot be rendered with standard PBR materials:
1. **Relativistic Pulsar Jet Shader:**
   - Additive blending cone geometry.
   - Ray-marched synchrotron emission falloff.
   - Modulated by instantaneous beam rotation angle:
     $$I(\theta) = I_0 \cos^{2n}\left( \frac{\theta - \theta_{beam}}{2} \right)$$
2. **Atmospheric Limb Scattering Shader (Earth):**
   - Single-pass Rayleigh and Mie scattering approximation.
   - Soft rim illumination based on view vector and Sun direction.
3. **Spacecraft Uncertainty Ellipsoid Shader:**
   - Dynamic wireframe Fresnel shader.
   - Color shifts smoothly between cyan (locked, low error), amber (warning), and red (diverging).

### 5.2 Shader Hygiene Rules
- All custom GLSL shaders must specify `precision highp float;`.
- Avoid dynamic loop bounds: inner loops must use constant loop counts known at compile time.
- Avoid branching (`if/else`) inside inner fragment shader loops; utilize GLSL `mix`, `step`, and `clamp` intrinsics.

---

## 6. Texture & Asset Strategy

- **Procedural First:** Star skybox, pulsar accretion disk noise, and planetary atmospheric clouds are generated procedurally using 2D/3D simplex noise to minimize asset download size.
- **Power-of-Two (POT) Textures:** Any external image textures (e.g. NASA Blue Marble Earth maps) must be formatted in power-of-two dimensions ($2048\times 1024$ or $1024\times 512$) to enable full mipmapping and texture compression.
- **Lazy Loading:** High-resolution planetary textures are loaded asynchronously via Drei's `useTexture.preload()` only when transitioning from Deep Space to planetary approach scenes.

---

## 7. Post-Processing Pipeline & Budget

Post-processing adds immense cinematic realism but represents the largest GPU fill-rate cost.

### 7.1 Consolidation of Passes
Using `@react-three/postprocessing`, we combine multiple effect passes into a single composite fullscreen quad to minimize render target blits:
- `Bloom` (Selective luminescence for pulsar beams and engine glow)
- `Vignette` (Edge darkening for cinematic focus)
- `ChromaticAberration` (Modulated by navigation error)
- `SMAA` or `FXAA` (Subpixel morphological anti-aliasing)

### 7.2 Post-Processing Quality Budget
| Effect | Low Tier | Medium Tier | High Tier | Cinematic Tier |
| :--- | :--- | :--- | :--- | :--- |
| **Bloom** | Disabled | Downsampled $1/4$ Res | Downsampled $1/2$ Res | Full Res Mipmapped |
| **Anti-Aliasing** | None | FXAA | SMAA | SMAA + Subpixel |
| **Chromatic Aberration** | Disabled | Static | Dynamic Error-Driven | Dynamic + Lens Glare |
| **Depth of Field** | Disabled | Disabled | Disabled | Bokeh Blur (Cinematic Mode only) |

---

## 8. Quality Tiers & Automatic Fallback

The user can select a target tier, or the system can automatically downgrade if sustained frame drops occur:

### 8.1 Tier Definitions
1. **LOW:**
   - Target: Mobile devices, integrated GPUs (Intel UHD / Iris Xe).
   - Pixel Ratio: Clamped to `1.0`.
   - Post-Processing: Completely disabled.
   - Starfield: 5,000 stars.
   - Shadows: Disabled.
2. **MEDIUM:**
   - Target: Mid-range laptops, Apple M1/M2 baseline, GTX 1650.
   - Pixel Ratio: Clamped to `1.5`.
   - Post-Processing: Selective Bloom + FXAA.
   - Starfield: 15,000 stars.
   - Shadows: Soft shadows on spacecraft hull.
3. **HIGH (Default Desktop):**
   - Target: Discrete gaming GPUs (RTX 3060+, Radeon 6600+).
   - Pixel Ratio: Clamped to `Math.min(window.devicePixelRatio, 2.0)`.
   - Post-Processing: Full Bloom + SMAA + Chromatic Aberration + Film Grain.
   - Starfield: 30,000 stars.
   - Shadows: High-resolution cascaded shadow maps.
4. **CINEMATIC:**
   - Target: Enthusiast workstations (RTX 4080+, Apple M-Max/Ultra).
   - Pixel Ratio: Native 4K (`2.0`).
   - Post-Processing: Full suite + Bokeh Depth of Field + Anamorphic Flare.
   - Starfield: 50,000 stars.

### 8.2 Automatic Dynamic Degradation (Adaptive Resolution)
If the rendering engine detects that frame times exceed $20\text{ ms}$ ($< 50\text{ FPS}$) for more than 60 consecutive frames:
1. Dynamically scale canvas rendering resolution down ($100\% \to 85\% \to 70\%$).
2. If frame drops persist, disable Bloom and switch to Medium tier.
3. Notify user via subtle HUD diagnostic icon: `"RENDER QUALITY ADAPTED"`.

---

## 9. Memory Management & WebGL Context Lifecycle

- **Explicit Disposal:** R3F handles component unmounting, but three.js geometries, materials, textures, and render targets must be explicitly disposed of:
  ```typescript
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
      texture.dispose();
    };
  }, []);
  ```
- **Context Loss Handling:** The canvas listens for `webglcontextlost` and `webglcontextrestored`:
  - On loss: Pause simulation worker, suspend audio context, display diagnostic message.
  - On restore: Re-compile shaders, re-bind textures, restore camera matrix, resume worker.

---

## 10. Development Diagnostics & Metrics (What We Will Measure)

In accordance with project engineering rules, we do NOT invent benchmark numbers. Instead, we define the exact quantitative metrics that will be empirically measured and monitored during development:

1. **Rendering Performance:**
   - Instantaneous FPS (Frames Per Second).
   - Frame Time Variance (ms per frame, 99th percentile frame times).
   - WebGL Draw Call Count (`gl.renderer.info.render.calls`).
   - WebGL Triangle / Vertex Count (`gl.renderer.info.render.triangles`).
   - Active WebGL Textures and Geometries in GPU VRAM.
2. **Worker & Compute Performance:**
   - Physics Step Execution Duration (microseconds per RK4 integration step).
   - Kalman Filter Recursion Duration (microseconds per IEKF matrix inversion).
   - Worker $\to$ Main Thread Round-Trip Telemetry Latency (ms).
   - ArrayBuffer Transfer Overhead (ms).
3. **Application & Memory Health:**
   - Chrome DevTools JS Heap Allocated Memory (MB).
   - Garbage Collection Pauses (frequency and duration of V8 GC events).
   - React Component Render Counts (ensuring HUD components do not rerender on 60 Hz ticks).
