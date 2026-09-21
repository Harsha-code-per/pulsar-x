"use client";

/**
 * PULSAR-X: 3D Rendering Domain
 * High-End Procedural Earth with Cinematic Orbital Photography Look.
 *
 * Implements:
 * - Rayleigh-inspired atmospheric rim with subtle Fresnel falloff.
 * - Soft day/night terminator with twilight Rayleigh scatter.
 * - Specular ocean sun-glint on sun-facing hemisphere.
 * - Restrained, non-gamey night-side continental city lights.
 * - Concentric rotating cloud layer with independent atmospheric drift.
 * - Physically plausible sun direction vector derived from Sun at (0, 0, 0).
 * - Integration with centralized lookdev atmosphericIntensity.
 */

import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useVisualStore } from "../../store/visual-store";
import { resolveVisualTheme } from "../config/lookdev";

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
  uniform float uAtmosphericIntensity;
  uniform vec3 uSunPosition;

  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  void main() {
    // True direction from Earth to Sun at (0, 0, 0)
    vec3 lightDir = normalize(uSunPosition - vWorldPos);
    vec3 viewDir = normalize(cameraPosition - vWorldPos);

    float NdotL = dot(vNormal, lightDir);
    float NdotV = max(0.0, dot(vNormal, viewDir));

    // Smooth day/night terminator with soft twilight band
    float sunDay = smoothstep(-0.08, 0.20, NdotL);
    float twilight = smoothstep(-0.15, 0.05, NdotL) * (1.0 - smoothstep(0.0, 0.22, NdotL));

    // Multi-frequency procedural continental landmass mask
    float c1 = sin(vUv.x * 14.0) * cos(vUv.y * 10.0);
    float c2 = sin(vUv.x * 28.0 + vUv.y * 18.0) * 0.45;
    float c3 = cos(vUv.x * 56.0 - vUv.y * 36.0) * 0.20;
    float landNoise = c1 + c2 + c3;

    // Polar ice caps (high latitude)
    bool isPolar = abs(vUv.y - 0.5) > 0.41;
    bool isLand = (landNoise > 0.12 && abs(vUv.y - 0.5) < 0.41) || isPolar;

    // Base color palettes: Deep indigo ocean, varied earthen continents, bright polar ice
    vec3 deepOcean = vec3(0.02, 0.07, 0.22);
    vec3 shallowOcean = vec3(0.03, 0.12, 0.28);
    vec3 oceanColor = mix(deepOcean, shallowOcean, clamp(landNoise * 0.5 + 0.5, 0.0, 1.0));

    vec3 temperateLand = vec3(0.09, 0.16, 0.10);
    vec3 aridLand = vec3(0.18, 0.15, 0.10);
    vec3 landColor = mix(temperateLand, aridLand, clamp(landNoise, 0.0, 1.0));
    if (isPolar) landColor = vec3(0.85, 0.88, 0.92); // Ice caps

    // Specular ocean sun-glint
    vec3 halfVec = normalize(lightDir + viewDir);
    float specAngle = max(0.0, dot(vNormal, halfVec));
    float oceanSpecular = (!isLand) ? pow(specAngle, 45.0) * 0.65 * max(0.0, NdotL) : 0.0;

    vec3 daySurface = (isLand ? landColor : oceanColor) + vec3(1.0, 0.95, 0.85) * oceanSpecular;

    // Night side: Restrained, non-gamey city light clusters on continents
    float cityNoise = sin(vUv.x * 90.0) * sin(vUv.y * 90.0) * cos(vUv.x * 45.0 + vUv.y * 30.0);
    float cityMask = smoothstep(0.42, 0.70, cityNoise) * (isLand && !isPolar ? 1.0 : 0.0);
    vec3 nightCityLights = vec3(0.38, 0.24, 0.08) * cityMask * (1.0 - sunDay);

    // Composite surface with twilight Rayleigh scatter (warm reddish glow along terminator)
    vec3 twilightColor = vec3(0.35, 0.15, 0.05) * twilight * (isLand ? 0.6 : 1.0);
    vec3 surfaceColor = mix(nightCityLights, daySurface, sunDay) + twilightColor;

    // Rayleigh-inspired atmospheric rim scattering (delicate blue Fresnel limb)
    float rim = 1.0 - NdotV;
    float atmosLimb = pow(rim, 3.8) * max(0.0, NdotL + 0.25) * uAtmosphericIntensity;
    vec3 atmosColor = vec3(0.18, 0.52, 0.95) * atmosLimb * 1.3;

    gl_FragColor = vec4(surfaceColor + atmosColor, 1.0);
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
  uniform vec3 uSunPosition;

  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  void main() {
    vec3 lightDir = normalize(uSunPosition - vWorldPos);
    float NdotL = dot(vNormal, lightDir);

    // Multi-octave swirling cloud noise
    float swirl1 = sin(vUv.x * 20.0 + vUv.y * 8.0) * cos(vUv.y * 16.0);
    float swirl2 = sin(vUv.x * 40.0 - vUv.y * 28.0) * 0.45;
    float swirl3 = cos(vUv.x * 80.0 + vUv.y * 50.0) * 0.25;
    float cloudDensity = smoothstep(0.32, 0.72, swirl1 + swirl2 + swirl3);

    // Day illumination vs night shadow
    float sunDay = smoothstep(-0.05, 0.25, NdotL);
    vec3 cloudColor = mix(vec3(0.02, 0.03, 0.05), vec3(0.95, 0.98, 1.0), sunDay);
    float cloudAlpha = cloudDensity * 0.42 * (0.25 + 0.75 * sunDay);

    gl_FragColor = vec4(cloudColor, cloudAlpha);
  }
`;

export function EarthNode({ position = [92, 0, -18] }: { position?: [number, number, number] }): React.JSX.Element {
  const meshRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const earthMatRef = useRef<THREE.ShaderMaterial>(null);

  const visualThemeMode = useVisualStore((s) => s.visualThemeMode);
  const postprocessingPreset = useVisualStore((s) => s.postprocessingPreset);

  const earthMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: earthVertexShader,
      fragmentShader: earthFragmentShader,
      uniforms: {
        uAtmosphericIntensity: { value: 1.0 },
        uSunPosition: { value: new THREE.Vector3(0, 0, 0) },
      },
    });
  }, []);

  const cloudMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: cloudVertexShader,
      fragmentShader: cloudFragmentShader,
      uniforms: {
        uSunPosition: { value: new THREE.Vector3(0, 0, 0) },
      },
      transparent: true,
      depthWrite: false,
    });
  }, []);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.04; // Earth axial rotation
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.055; // Independent atmospheric cloud drift
    }
    if (earthMatRef.current) {
      const theme = resolveVisualTheme(visualThemeMode, postprocessingPreset);
      earthMatRef.current.uniforms.uAtmosphericIntensity.value = theme.atmosphericIntensity;
    }
  });

  return (
    <group position={position} name="EarthNode">
      {/* 1. Planetary Globe */}
      <mesh ref={meshRef} material={earthMaterial} name="EarthGlobe">
        <sphereGeometry args={[2.2, 64, 64]} />
      </mesh>

      {/* 2. Concentric Atmospheric Cloud Layer */}
      <mesh ref={cloudsRef} material={cloudMaterial} name="EarthClouds">
        <sphereGeometry args={[2.235, 64, 64]} />
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
                  pts[i * 3 + 0] = Math.cos(th) * 93.74 - position[0];
                  pts[i * 3 + 1] = 0;
                  pts[i * 3 + 2] = Math.sin(th) * 93.74 - position[2];
                }
                return pts;
              }, [position]),
              3,
            ]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#1f334d" transparent opacity={0.35} />
      </lineLoop>
    </group>
  );
}
