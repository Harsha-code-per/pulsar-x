"use client";

/**
 * PULSAR-X: 3D Rendering Domain
 * Sun Node: Central Solar Body, Omnidirectional Sunlight, and Procedural Corona.
 *
 * Layered visual treatment:
 * - Inner core with solar limb darkening shader
 * - Procedural dynamic corona glow with gentle rotation
 * - Primary radial light sources (PointLight + DirectionalLight) illuminating the solar system
 *
 * PEDAGOGICAL APPROXIMATION:
 * The corona and limb darkening are visual approximations for GPU rendering
 * and do not model full solar plasma dynamics or magnetohydrodynamics.
 */

import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

const sunCoreVertexShader = `
  varying vec3 vNormal;
  varying vec3 vWorldPos;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const sunCoreFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vWorldPos;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float NdotV = max(0.0, dot(vNormal, viewDir));

    // Solar limb darkening approximation: I(mu) = I0 * (1 - u*(1 - mu))
    float limb = 0.35 + 0.65 * pow(NdotV, 0.45);

    // Warm brilliant solar core palette
    vec3 centerColor = vec3(1.0, 0.98, 0.88);
    vec3 edgeColor = vec3(1.0, 0.65, 0.20);
    vec3 coreColor = mix(edgeColor, centerColor, limb);

    gl_FragColor = vec4(coreColor, 1.0);
  }
`;

const coronaVertexShader = `
  varying vec3 vNormal;
  varying vec3 vWorldPos;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const coronaFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vWorldPos;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float rim = 1.0 - max(0.0, dot(vNormal, viewDir));
    float alpha = pow(rim, 3.2) * 0.85;

    // Solar golden-amber corona
    vec3 coronaColor = vec3(1.0, 0.82, 0.42);
    gl_FragColor = vec4(coronaColor, alpha);
  }
`;

export function SunNode(): React.JSX.Element {
  const coronaRef = useRef<THREE.Mesh>(null);

  const coreMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: sunCoreVertexShader,
      fragmentShader: sunCoreFragmentShader,
    });
  }, []);

  const coronaMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: coronaVertexShader,
      fragmentShader: coronaFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    });
  }, []);

  useFrame((_, delta) => {
    if (coronaRef.current) {
      coronaRef.current.rotation.z += delta * 0.02;
    }
  });

  return (
    <group position={[0, 0, 0]} name="SunNode">
      {/* 1. Central Solar Core (Limb-darkened procedural sphere) */}
      <mesh material={coreMaterial} name="SunCore">
        <sphereGeometry args={[4.5, 48, 48]} />
      </mesh>

      {/* 2. Procedural Solar Corona (Expanding atmospheric halo) */}
      <mesh ref={coronaRef} material={coronaMaterial} name="SunCorona">
        <sphereGeometry args={[7.2, 36, 36]} />
      </mesh>

      {/* 3. Radial Solar Point Light (Illuminates solar system radially outward from Sun) */}
      <pointLight
        position={[0, 0, 0]}
        intensity={2.8}
        distance={1000}
        decay={0}
        color="#fff8eb"
      />

      {/* 4. Directional Light Source for high-contrast shadows & key lighting */}
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.2}
        color="#fffdf5"
      />
      <ambientLight intensity={0.35} color="#55667e" />
    </group>
  );
}
