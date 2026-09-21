"use client";

/**
 * PULSAR-X: 3D Rendering Domain
 * Multi-Layered Astronomical Starfield with Magnitude Distribution & Subtle Parallax.
 *
 * Implements:
 * - 3-tier depth architecture: Foreground guide stars, mid galactic disk, far cosmic background.
 * - Apparent astronomical magnitude curve (I ~ 2.512^-m).
 * - Spectral temperature classification (O/B blue-white, A/F white, G yellow-white, K amber, M red).
 * - Circular Airy-disk point antialiasing in custom GLSL shader (no square pixel artifacts).
 * - Subtle camera-relative parallax communicating immense cosmic depth without artificial camera shake.
 * - Integration with centralized lookdev starBrightness parameter.
 * - Strictly deterministic Mulberry32 generation; zero per-frame React allocations.
 */

import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { SeededPRNG } from "../../simulation/random/prng";
import { useVisualStore } from "../../store/visual-store";
import { getQualitySettings } from "../config/quality";
import { resolveVisualTheme } from "../config/lookdev";

const starVertexShader = `
  attribute float aSize;
  attribute float aBrightness;
  attribute float aLayer;
  attribute vec3 aColor;

  uniform float uStarBrightness;
  uniform float uDpr;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;
    vAlpha = aBrightness * uStarBrightness;

    // Subtle camera-relative parallax: foreground stars shift slightly relative to distant backdrop
    // Parallax coefficient is strictly bounded (0.008 for foreground, 0 for far background)
    vec3 parallaxOffset = cameraPosition * (aLayer * 0.008);
    vec4 worldPos = modelMatrix * vec4(position + parallaxOffset, 1.0);
    vec4 mvPosition = viewMatrix * worldPos;

    // Distance attenuation with clamp for comfortable point sizing across resolutions
    float pointSize = aSize * uDpr * (380.0 / -mvPosition.z);
    gl_PointSize = clamp(pointSize, 1.2 * uDpr, 5.5 * uDpr);

    gl_Position = projectionMatrix * mvPosition;
  }
`;

const starFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Soft circular Airy-disk point rendering
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    // Smooth Gaussian-like radial intensity falloff
    float core = smoothstep(0.5, 0.05, dist);
    float halo = exp(-dist * 5.0) * 0.4;
    float intensity = (core + halo) * vAlpha;

    gl_FragColor = vec4(vColor, intensity);
  }
`;

export function Starfield(): React.JSX.Element {
  const pointsRef = useRef<THREE.Points>(null);
  const shaderMatRef = useRef<THREE.ShaderMaterial>(null);

  const qualityTier = useVisualStore((s) => s.qualityTier);
  const visualThemeMode = useVisualStore((s) => s.visualThemeMode);
  const postprocessingPreset = useVisualStore((s) => s.postprocessingPreset);
  const settings = getQualitySettings(qualityTier);
  const count = settings.starCount;

  const { viewport } = useThree();
  const dpr = Math.min(viewport.dpr, 2.0);

  const { positions, colors, sizes, brightnesses, layers } = useMemo(() => {
    const prng = new SeededPRNG(421937); // Deterministic PRNG seed for bit-for-bit reproducible starfield

    const posArray = new Float32Array(count * 3);
    const colArray = new Float32Array(count * 3);
    const sizeArray = new Float32Array(count);
    const brightArray = new Float32Array(count);
    const layerArray = new Float32Array(count);

    // Galactic coordinate rotation: Galactic plane tilted ~63 deg relative to ecliptic
    const tiltRad = (63.0 * Math.PI) / 180.0;
    const cosT = Math.cos(tiltRad);
    const sinT = Math.sin(tiltRad);

    for (let i = 0; i < count; i++) {
      const roll = prng.nextFloat();

      let radius: number;
      let layerVal: number;
      let b_rad: number;

      if (roll < 0.10) {
        // 1. Foreground Guide Stars (10%): r in [280, 360], noticeable parallax, brighter
        radius = 280.0 + prng.nextFloat() * 80.0;
        layerVal = 1.0;
        b_rad = Math.asin(prng.nextFloat() * 2.0 - 1.0);
      } else if (roll < 0.75) {
        // 2. Mid Galactic Disk Stars (65%): r in [360, 460], concentrated along galactic equator
        radius = 360.0 + prng.nextFloat() * 100.0;
        layerVal = 0.4;
        const sign = prng.nextFloat() > 0.5 ? 1 : -1;
        b_rad = sign * (-Math.log(Math.max(1e-5, prng.nextFloat())) * 0.11);
        b_rad = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, b_rad));
      } else {
        // 3. Far Deep Cosmic Background (25%): r in [460, 540], isotropic, faint, zero parallax
        radius = 460.0 + prng.nextFloat() * 80.0;
        layerVal = 0.0;
        b_rad = Math.asin(prng.nextFloat() * 2.0 - 1.0);
      }

      const l_rad = prng.nextFloat() * 2.0 * Math.PI;

      // Spherical coordinates in galactic frame
      const xG = radius * Math.cos(b_rad) * Math.cos(l_rad);
      const yG = radius * Math.cos(b_rad) * Math.sin(l_rad);
      const zG = radius * Math.sin(b_rad);

      // Rotate from galactic to ecliptic frame around X-axis
      posArray[i * 3 + 0] = xG;
      posArray[i * 3 + 1] = yG * cosT - zG * sinT;
      posArray[i * 3 + 2] = yG * sinT + zG * cosT;

      // Harvard spectral classification color temperature palette
      const tempRoll = prng.nextFloat();
      let r = 1.0, g = 1.0, b = 1.0;
      if (tempRoll < 0.20) {
        // Class O / B: Blue-white (~20,000 K)
        r = 0.78; g = 0.85; b = 1.0;
      } else if (tempRoll < 0.65) {
        // Class A / F: Pure white (~8,000 K)
        r = 0.96; g = 0.97; b = 1.0;
      } else if (tempRoll < 0.88) {
        // Class G / K: Solar yellow / amber (~5,000 K)
        r = 1.0; g = 0.88; b = 0.72;
      } else {
        // Class M: Red dwarf (~3,200 K)
        r = 1.0; g = 0.62; b = 0.48;
      }

      colArray[i * 3 + 0] = r;
      colArray[i * 3 + 1] = g;
      colArray[i * 3 + 2] = b;

      // Apparent astronomical magnitude curve: Faint stars dominate numerically
      const magRandom = Math.pow(prng.nextFloat(), 3.2);
      brightArray[i] = 0.35 + 0.65 * magRandom;
      sizeArray[i] = 1.0 + 3.0 * magRandom;
      layerArray[i] = layerVal;
    }

    return {
      positions: posArray,
      colors: colArray,
      sizes: sizeArray,
      brightnesses: brightArray,
      layers: layerArray,
    };
  }, [count]);

  useFrame(() => {
    if (shaderMatRef.current) {
      const theme = resolveVisualTheme(visualThemeMode, postprocessingPreset);
      shaderMatRef.current.uniforms.uStarBrightness.value = theme.starBrightness;
      shaderMatRef.current.uniforms.uDpr.value = dpr;
    }
  });

  return (
    <points ref={pointsRef} name="Starfield">
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aBrightness" args={[brightnesses, 1]} />
        <bufferAttribute attach="attributes-aLayer" args={[layers, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={shaderMatRef}
        vertexShader={starVertexShader}
        fragmentShader={starFragmentShader}
        uniforms={{
          uStarBrightness: { value: 1.0 },
          uDpr: { value: dpr },
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
