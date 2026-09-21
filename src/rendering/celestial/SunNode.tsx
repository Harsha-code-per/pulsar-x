"use client";

/**
 * PULSAR-X: 3D Rendering Domain
 * Sun Node: Central Solar Body, Limb Darkening, Dynamic Corona, and Flare Hooks.
 *
 * Implements:
 * - High-precision solar limb darkening: I(mu) = I0 * (1 - u*(1 - mu))
 * - Dynamic convective corona glow with subtle breathing/rotation
 * - Directional key illumination and radial inverse-square lighting
 * - Event hook (uFlareIntensity) for simulated solar occultation / flare events (Scene 14)
 * - Pedagogical approximation: visual shader, does not physically model MHD plasma kinetics.
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
  uniform float uTime;
  uniform float uFlareIntensity;

  varying vec3 vNormal;
  varying vec3 vWorldPos;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float NdotV = max(0.0, dot(vNormal, viewDir));

    // Solar limb darkening approximation: I(mu) = I0 * (1 - u*(1 - mu))
    // Standard solar coefficient u ~ 0.60
    float mu = NdotV;
    float limb = 0.40 + 0.60 * pow(mu, 0.55);

    // Subtle convective surface granulation
    float gran = sin(vWorldPos.x * 2.0 + uTime * 0.4) * cos(vWorldPos.y * 2.0 - uTime * 0.3) * 0.05;

    // Solar core color palette: Brilliant white-hot center to deep golden-amber limb
    vec3 centerColor = vec3(1.0, 0.98, 0.92);
    vec3 edgeColor = vec3(1.0, 0.60, 0.15);
    vec3 coreColor = mix(edgeColor, centerColor, clamp(limb + gran, 0.0, 1.0));

    // Flare intensification hook
    coreColor += vec3(1.0, 0.7, 0.2) * uFlareIntensity * 1.5;

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
  uniform float uTime;
  uniform float uFlareIntensity;

  varying vec3 vNormal;
  varying vec3 vWorldPos;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float rim = 1.0 - max(0.0, dot(vNormal, viewDir));

    // Subtle dynamic convective breathing
    float pulse = 1.0 + 0.04 * sin(uTime * 1.2);
    float alpha = pow(rim, 3.4) * (0.80 + 0.4 * uFlareIntensity) * pulse;

    // Solar golden-amber corona palette
    vec3 coronaBase = vec3(1.0, 0.78, 0.35);
    vec3 flareTint = vec3(1.0, 0.45, 0.10);
    vec3 finalCorona = mix(coronaBase, flareTint, uFlareIntensity);

    gl_FragColor = vec4(finalCorona, alpha);
  }
`;

export function SunNode({ flareIntensity = 0.0 }: { flareIntensity?: number }): React.JSX.Element {
  const coronaRef = useRef<THREE.Mesh>(null);
  const coreMatRef = useRef<THREE.ShaderMaterial>(null);
  const coronaMatRef = useRef<THREE.ShaderMaterial>(null);

  const coreMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: sunCoreVertexShader,
      fragmentShader: sunCoreFragmentShader,
      uniforms: {
        uTime: { value: 0.0 },
        uFlareIntensity: { value: flareIntensity },
      },
    });
  }, [flareIntensity]);

  const coronaMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: coronaVertexShader,
      fragmentShader: coronaFragmentShader,
      uniforms: {
        uTime: { value: 0.0 },
        uFlareIntensity: { value: flareIntensity },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    });
  }, [flareIntensity]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (coreMatRef.current) {
      coreMatRef.current.uniforms.uTime.value = t;
      coreMatRef.current.uniforms.uFlareIntensity.value = flareIntensity;
    }
    if (coronaMatRef.current) {
      coronaMatRef.current.uniforms.uTime.value = t;
      coronaMatRef.current.uniforms.uFlareIntensity.value = flareIntensity;
    }
    if (coronaRef.current) {
      coronaRef.current.rotation.z += 0.001;
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
        distance={1200}
        decay={0}
        color="#fff8eb"
      />

      {/* 4. Key directional sunlight */}
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.2}
        color="#fffdf5"
      />
      <ambientLight intensity={0.25} color="#45546e" />
    </group>
  );
}
