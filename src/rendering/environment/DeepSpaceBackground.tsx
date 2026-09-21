"use client";

/**
 * PULSAR-X: 3D Rendering Domain
 * Subtle Procedural Deep-Space Background.
 *
 * Restrained cosmic ambient dust with zero saturated gaming-style gradients.
 * Uses an inverted large sphere with custom smooth procedural dust shader.
 */

import React, { useMemo } from "react";
import * as THREE from "three";

const backgroundVertexShader = `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const backgroundFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 dir = normalize(vWorldPosition);

    // Galactic plane projection: inclined 63 degrees
    float cosT = 0.45399;
    float sinT = 0.89100;
    float galY = dir.y * cosT - dir.z * sinT;
    float diskFactor = exp(-abs(galY) * 4.0);

    // Extremely subtle deep indigo / slate / charcoal tones
    vec3 spaceBase = vec3(0.003, 0.004, 0.007);
    vec3 galacticDust = vec3(0.012, 0.015, 0.024) * diskFactor;

    vec3 finalColor = spaceBase + galacticDust;
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export function DeepSpaceBackground(): React.JSX.Element {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: backgroundVertexShader,
      fragmentShader: backgroundFragmentShader,
      side: THREE.BackSide,
      depthWrite: false,
    });
  }, []);

  return (
    <mesh material={material}>
      <sphereGeometry args={[480, 32, 32]} />
    </mesh>
  );
}
