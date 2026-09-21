"use client";

/**
 * PULSAR-X: 3D Rendering Domain
 * High-Quality Procedural Earth with Day/Night Terminator, Atmospheric Rim & Cloud Layer.
 *
 * Fully self-contained procedural WebGL shaders (zero external runtime URLs).
 * Supports close spacecraft inspection, medium framing, and distant solar-system overview.
 */

import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

const earthVertexShader = `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vUv = uv;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const earthFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  void main() {
    // Light vector pointing from Earth to Sun at (0,0,0)
    vec3 lightDir = normalize(-vWorldPos);
    float NdotL = dot(vNormal, lightDir);

    // Smooth day/night terminator
    float sunIntensity = smoothstep(-0.15, 0.25, NdotL);

    // Continental landmass vs deep ocean procedural mask
    float continentNoise = sin(vUv.x * 16.0) * cos(vUv.y * 12.0) + sin(vUv.x * 32.0 + vUv.y * 24.0) * 0.4;
    bool isLand = continentNoise > 0.15 && abs(vUv.y - 0.5) < 0.42;

    vec3 oceanColor = vec3(0.04, 0.12, 0.32);
    vec3 landColor = vec3(0.12, 0.22, 0.14);
    vec3 dayColor = isLand ? landColor : oceanColor;

    // Night side: warm golden city lights on continents
    vec3 nightLights = isLand ? vec3(0.35, 0.25, 0.08) * (1.0 - sunIntensity) : vec3(0.005, 0.008, 0.015);

    vec3 surfaceColor = mix(nightLights, dayColor, sunIntensity);

    // Rayleigh-inspired atmospheric rim scattering (Fresnel glow)
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float rim = 1.0 - max(0.0, dot(vNormal, viewDir));
    float atmosAlpha = pow(rim, 3.2) * max(0.0, NdotL + 0.35);
    vec3 atmosColor = vec3(0.25, 0.60, 1.0);

    vec3 finalColor = surfaceColor + atmosColor * atmosAlpha;
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

const cloudVertexShader = `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vUv = uv;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const cloudFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  void main() {
    vec3 lightDir = normalize(-vWorldPos);
    float NdotL = max(0.0, dot(vNormal, lightDir));

    // Multi-frequency cloud swirl noise
    float swirl = sin(vUv.x * 24.0 + vUv.y * 8.0) * cos(vUv.y * 18.0);
    float swirl2 = sin(vUv.x * 48.0 - vUv.y * 32.0) * 0.5;
    float cloudDensity = smoothstep(0.35, 0.75, swirl + swirl2);

    // Clouds illuminated by Sun on day side, dark on night side
    vec3 cloudColor = vec3(0.95, 0.98, 1.0) * (0.2 + 0.8 * NdotL);
    float cloudAlpha = cloudDensity * 0.45 * (0.3 + 0.7 * NdotL);

    gl_FragColor = vec4(cloudColor, cloudAlpha);
  }
`;

export function EarthNode({ position = [100, 0, 0] }: { position?: [number, number, number] }): React.JSX.Element {
  const meshRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);

  const earthMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: earthVertexShader,
      fragmentShader: earthFragmentShader,
    });
  }, []);

  const cloudMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: cloudVertexShader,
      fragmentShader: cloudFragmentShader,
      transparent: true,
      depthWrite: false,
    });
  }, []);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.05; // Earth axial rotation
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.065; // Independent atmospheric cloud drift
    }
  });

  return (
    <group position={position} name="EarthNode">
      {/* 1. Planetary Globe */}
      <mesh ref={meshRef} material={earthMaterial} name="EarthGlobe">
        <sphereGeometry args={[2.2, 48, 48]} />
      </mesh>

      {/* 2. Concentric Atmospheric Cloud Layer */}
      <mesh ref={cloudsRef} material={cloudMaterial} name="EarthClouds">
        <sphereGeometry args={[2.24, 48, 48]} />
      </mesh>

      {/* Orbit guide ring around Sun */}
      <lineLoop name="EarthOrbitGuide">
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[
              useMemo(() => {
                const pts = new Float32Array(128 * 3);
                for (let i = 0; i < 128; i++) {
                  const th = (i / 128) * Math.PI * 2;
                  pts[i * 3 + 0] = Math.cos(th) * 100.0 - position[0];
                  pts[i * 3 + 1] = 0;
                  pts[i * 3 + 2] = Math.sin(th) * 100.0 - position[2];
                }
                return pts;
              }, [position]),
              3,
            ]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#2d4263" transparent opacity={0.35} />
      </lineLoop>
    </group>
  );
}
