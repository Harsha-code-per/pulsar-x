"use client";

/**
 * PULSAR-X: 3D Rendering Domain
 * Procedural Astronomically Plausible Starfield (25,000 Stars).
 *
 * Uses GPU BufferGeometry with custom vertex attributes:
 * - Milky Way inclination tilt ~63 degrees relative to the ecliptic plane.
 * - Higher density along the galactic disk with exponential scale height falloff.
 * - Star temperatures (B/A blue-white, F/G white, K/M orange-red).
 * - Apparent magnitude size distribution.
 * - Deterministic Mulberry32 generation.
 */

import React, { useMemo } from "react";
import * as THREE from "three";
import { SeededPRNG } from "../../simulation/random/prng";
import { useVisualStore } from "../../store/visual-store";
import { getQualitySettings } from "../config/quality";

export function Starfield(): React.JSX.Element {
  const qualityTier = useVisualStore((s) => s.qualityTier);
  const settings = getQualitySettings(qualityTier);
  const count = settings.starCount;

  const { positions, colors, sizes } = useMemo(() => {
    const prng = new SeededPRNG(421937); // Fixed seed for reproducible skybox

    const posArray = new Float32Array(count * 3);
    const colArray = new Float32Array(count * 3);
    const sizeArray = new Float32Array(count);

    // Galactic coordinate rotation matrix: Galactic plane tilted ~63 deg to ecliptic
    const tiltRad = (63.0 * Math.PI) / 180.0;
    const cosT = Math.cos(tiltRad);
    const sinT = Math.sin(tiltRad);

    const radius = 450.0; // Distance of the starfield sphere

    for (let i = 0; i < count; i++) {
      // 65% of stars concentrated near the galactic plane
      const inDisk = prng.nextFloat() < 0.65;

      let b_rad: number; // Galactic latitude
      if (inDisk) {
        // Laplace/exponential distribution along galactic latitude (narrow band)
        const sign = prng.nextFloat() > 0.5 ? 1 : -1;
        b_rad = sign * (-Math.log(Math.max(1e-5, prng.nextFloat())) * 0.12);
        b_rad = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, b_rad));
      } else {
        // Uniform isotropic background stars
        b_rad = Math.asin(prng.nextFloat() * 2.0 - 1.0);
      }

      const l_rad = prng.nextFloat() * 2.0 * Math.PI; // Galactic longitude

      // Spherical coordinates in galactic frame
      const xG = radius * Math.cos(b_rad) * Math.cos(l_rad);
      const yG = radius * Math.cos(b_rad) * Math.sin(l_rad);
      const zG = radius * Math.sin(b_rad);

      // Rotate from galactic to ecliptic frame around X-axis
      const x = xG;
      const y = yG * cosT - zG * sinT;
      const z = yG * sinT + zG * cosT;

      posArray[i * 3 + 0] = x;
      posArray[i * 3 + 1] = y;
      posArray[i * 3 + 2] = z;

      // Color temperature variation
      const tempRoll = prng.nextFloat();
      let r = 1.0, g = 1.0, b = 1.0;
      if (tempRoll < 0.25) {
        // Hot O/B/A stars: blue-white
        r = 0.82; g = 0.88; b = 1.0;
      } else if (tempRoll < 0.70) {
        // Moderate F/G stars: pure white / subtle warm white
        r = 0.98; g = 0.98; b = 0.95;
      } else if (tempRoll < 0.90) {
        // Cool K stars: subtle golden amber
        r = 1.0; g = 0.85; b = 0.70;
      } else {
        // Cool M stars: faint reddish-orange
        r = 1.0; g = 0.68; b = 0.55;
      }

      // Magnitude brightness variation
      const brightness = 0.4 + 0.6 * Math.pow(prng.nextFloat(), 3.0);
      colArray[i * 3 + 0] = r * brightness;
      colArray[i * 3 + 1] = g * brightness;
      colArray[i * 3 + 2] = b * brightness;

      // Point size (apparent magnitude)
      sizeArray[i] = 1.0 + 2.5 * Math.pow(prng.nextFloat(), 4.0);
    }

    return {
      positions: posArray,
      colors: colArray,
      sizes: sizeArray,
    };
  }, [count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={1.2}
        vertexColors
        sizeAttenuation={false}
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
