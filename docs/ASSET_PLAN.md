# PULSAR-X — Asset Pipeline & Resource Specifications

## 1. Asset Strategy: Procedural-First & Open Licensing

To ensure instant loading times, zero legal ambiguity, and a lightweight bundle footprint, **PULSAR-X** adheres to a strict **Procedural-First** asset philosophy:
1. **Procedural Math Over Heavy Bitmaps:** Whenever possible, visual and acoustic phenomena (starfields, pulsar jets, solar corona, engine plumes, telemetry audio) are synthesized in real time via custom shaders and Web Audio nodes.
2. **Open-Access & Public Domain Data:** All astronomical catalogs, planetary textures, and celestial coordinates are derived exclusively from verified public domain scientific institutions (NASA, JPL, ESA, ATNF).
3. **Zero Unlicensed Assets:** No copyrighted 3D models, sound libraries, or commercial fonts may enter the codebase.

---

## 2. Comprehensive Asset Inventory & Pipeline

| Asset Category | Specific Item | Source & Provenance | License | Local Storage Requirement | Fallback Approach |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Spacecraft** | Deep Space Exploration Probe 3D Model | Custom procedural geometry or public-domain NASA JPL probe model (e.g. New Horizons / Parker Solar Probe inspired) | NASA Public Domain / CC0 / Custom MIT | `< 2.5 MB` optimized GLTF/GLB in `public/models/` | Procedural geometric mesh generated with Three.js primitives (cylinders, trusses, dish, foil material) |
| **Earth** | Planetary Day/Night Map | NASA Visible Earth (Blue Marble: Next Generation) | NASA Public Domain | Single downsampled $2048 \times 1024$ WebP (`< 600 KB`) in `public/textures/` | Procedural landmass/ocean fragment shader with analytical spherical coordinates |
| **Earth** | Atmosphere & Clouds | Procedural GLSL Rayleigh / Mie scattering shader | Custom MIT | Zero bytes (GLSL code in repo) | Simple additive Fresnel rim glow |
| **Sun** | Solar Surface & Dynamic Corona | Custom procedural noise shader (3D Perlin / Simplex turbulence) | Custom MIT | Zero bytes (GLSL code in repo) | Textured emissive sphere with Three.js PointLight |
| **Stars** | Celestial Cosmic Background | Subsampled Hipparcos / Tycho-2 Star Catalog (25,000 stars with RA, Dec, Magnitude, Color) | Public Astronomical Data (ESA / NASA) | Packed `Float32Array` or compact JSON (`< 200 KB`) | Algorithmic pseudo-random uniform spherical distribution seeded by PRNG |
| **Pulsars** | Neutron Core & Accretion Disk | Custom Three.js mesh with animated emissive shader | Custom MIT | Zero bytes | Emissive sphere with glowing ring geometry |
| **Pulsars** | Relativistic Emission Beams | Custom double-cone geometry with additive volumetric GLSL shader | Custom MIT | Zero bytes | Two semi-transparent cone meshes with vertex color gradients |
| **Particle Systems** | Spacecraft RCS Thruster Plumes | Three.js `Points` with custom particle vertex shader | Custom MIT | Zero bytes | Simple sprite particle system |
| **Particle Systems** | Cosmic Dust / Micro-Meteorites | Instanced points drifting in spacecraft relative velocity vector | Custom MIT | Zero bytes | Disabled on low-spec tier |
| **Environmental** | Deep Space Nebula Glow | Procedural 3D fractional Brownian motion (fBm) shader | Custom MIT | Zero bytes | Solid deep-space gradient background (`#020408` to `#000000`) |
| **UI Typography** | Aerospace Headings & Telemetry | Geist Sans, Geist Mono, Inter (via `next/font/google`) | SIL Open Font License (OFL) | Self-hosted by Next.js font optimization pipeline | System monospace (`ui-monospace, "SF Mono", "Cascadia Code", monospace`) |
| **Audio** | Pulsar Spin Strobe Tones | Procedural Web Audio API oscillator node + periodic trigger | Custom MIT | Zero bytes | Silent mode / visual indicator only |
| **Audio** | X-Ray Photon Geiger Clicks | Procedural Web Audio API white noise buffer burst | Custom MIT | Zero bytes | Visual photon hit strobe only |
| **Audio** | Spacecraft Life Support Hum | Procedural Web Audio API filtered brownian noise | Custom MIT | Zero bytes | Disabled in low audio mode |
| **Audio** | Telemetry Lock Chimes | Procedural Web Audio API dual sine-wave synthesizer | Custom MIT | Zero bytes | Visual-only HUD lock indication |

---

## 3. Detailed Specifications by Asset Domain

### 3.1 Spacecraft 3D Geometry
- **Design Inspiration:** Scientific exploration craft featuring prominent X-ray timing collimators (inspired by the NICER XTI module), large high-gain communications dish, hydrazine RCS thruster blocks, and multilayer insulation (MLI) gold/silver blankets.
- **Optimization Budget:**
  - Vertices: $< 40,000$.
  - Triangles: $< 60,000$.
  - Textures: Single PBR texture set ($1024 \times 1024$ or $2048 \times 2048$) containing BaseColor, Roughness/Metalness/Occlusion (packed ORM map), and Normal map.
  - Draco Compression: Optional Draco mesh compression enabled for fast delivery.
- **Dynamic Articulations:**
  - X-ray collimator gimbals must have separate node transforms to allow dynamic tracking toward active pulsars during attitude changes.
  - High-gain antenna dish must be an independent child node to permit tracking toward Earth.

### 3.2 Earth & Celestial Body Assets
- **NASA Blue Marble Imagery:** Sourced directly from [NASA Visible Earth](https://visibleearth.nasa.gov/).
  - Selected layer: Topography and Bathymetry (Blue Marble: Next Generation).
  - Format: Converted from lossless PNG to compressed WebP at quality 85, formatted to power-of-two ($2048 \times 1024$).
  - Attribution: *Image courtesy of NASA's Earth Observatory*.

### 3.3 Astronomical Star Catalog
- Rather than a generic random starfield, star positions in PULSAR-X reflect genuine astronomical sky coordinates.
- **Preprocessing Pipeline:**
  1. Extract stars with apparent visual magnitude $V \le 6.5$ (visible to the naked eye, $\approx 9,000$ stars) plus deeper guide stars up to 25,000 total.
  2. Convert spherical coordinates $(\alpha, \delta)$ to Cartesian unit vectors $[x, y, z]$.
  3. Map B-V color index to normalized RGB values based on stellar temperature.
  4. Pack into a compact binary Float32Array (`stars.bin`) or lightweight JSON chunk, loaded on startup.

### 3.4 Procedural Audio Synthesis Engine
All auditory cues are generated natively in the browser without loading external MP3 or WAV files:
1. **Pulsar Spin Synthesizer:**
   - Base generator: Sawtooth oscillator tuned to the exact rotation frequency of the active pulsar (e.g. $642\text{ Hz}$ for PSR B1937+21).
   - Envelope: Exponential decay gain envelope with duration $\tau = 0.05 \times P_{pulsar}$.
   - Spatialization: Panned stereo according to the pulsar's angular offset from the spacecraft camera forward vector.
2. **Photon Arrival Geiger:**
   - Inhomogeneous Poisson generator: Triggers short ($3\text{ ms}$) micro-bursts of shaped white noise.
   - Frequency of bursts scales dynamically with simulated X-ray photon flux.
3. **Spacecraft Atmosphere / Hull Drone:**
   - 4-pole resonant low-pass filter operating on continuous brown noise.
   - Resonant cutoff modulated slowly by simulated spacecraft electrical bus power.

---

## 4. Asset Licensing & Attribution Matrix

| Source / Entity | Assets Utilized | License Type | Commercial Use Permitted | Attribution Requirement |
| :--- | :--- | :--- | :--- | :--- |
| **NASA / JPL-Caltech** | Planetary textures, orbital concepts, SEXTANT flight data | Public Domain (US Gov) | Yes | Required in `CREDITS.md` and app about dialog |
| **ESA Hipparcos / Tycho** | Celestial star catalog positions | Public Domain / Open Data | Yes | Required in `CREDITS.md` |
| **ATNF Pulsar Catalogue** | Pulsar spin periods, coordinates, flux data | CSIRO Open Access | Yes | Required in scientific documentation |
| **Google Fonts** | Geist, Geist Mono, Inter | SIL Open Font License 1.1 | Yes | Distributed with license metadata |
| **Internal Synthesis** | Procedural shaders, audio engine, spacecraft geometry | MIT License | Yes | Standard copyright notice |
