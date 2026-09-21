"use client";

/**
 * PULSAR-X: 3D Rendering Domain
 * High-End Relativistic Millisecond Pulsar Visual System.
 *
 * Implements:
 * - Compact neutron-star core ($1.6\text{ units}$ on celestial horizon) with procedural crust lattice.
 * - Magnetic dipole axis needle oriented at ~30 deg inclination relative to rotation axis.
 * - Opposing relativistic synchrotron emission cones with narrow core and exponential radial falloff.
 * - Expanding spherical pulse wave synchronized to scientific phase Phi(t).
 * - Integration with centralized lookdev pulsarIntensity parameter.
 * - Visual rotation normalized for readability to prevent high-frequency Nyquist strobing.
 * - Pedagogical approximation: artistic visual shaders, does not physically model MHD plasma kinetics.
 */

import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { Pulsar } from "../../types/pulsar";
import { pulsarDirectionToHorizonPosition } from "../coordinates/scaling";
import { useTelemetryStore } from "../../store/telemetry-store";
import { useVisualStore } from "../../store/visual-store";
import { evaluatePulsarPhaseNormalized } from "../../simulation/pulsars/timing-model";
import { resolveVisualTheme } from "../config/lookdev";

interface PulsarNodeProps {
  readonly pulsar: Pulsar;
  readonly index: number;
}

// ----------------------------------------------------------------------------
// Custom GLSL Shaders
// ----------------------------------------------------------------------------

const neutronStarVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }
`;

const neutronStarFragmentShader = `
  uniform float uPhase;
  uniform float uActive;
  uniform float uIntensity;

  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    // Rotation around Y-axis by normalized visual phase angle
    float angle = uPhase * 6.2831853;
    float cosA = cos(angle);
    float sinA = sin(angle);
    vec3 rotPos = vec3(
      vPosition.x * cosA - vPosition.z * sinA,
      vPosition.y,
      vPosition.x * sinA + vPosition.z * cosA
    );

    // Multi-frequency crust lattice texture (domain-warped sinusoidal lattice)
    float crust1 = sin(rotPos.x * 12.0) * cos(rotPos.y * 12.0) * sin(rotPos.z * 12.0);
    float crust2 = sin(rotPos.x * 24.0 + rotPos.z * 18.0) * 0.35;
    float energyCrust = 0.5 + 0.5 * (crust1 + crust2);

    // Magnetic polar caps (exponential concentration near poles |y| -> 1)
    float polarProximity = abs(normalize(rotPos).y);
    float polarHotspot = pow(polarProximity, 6.0);

    // Relativistic neutron star palette: Deep ultra-dense indigo core with violet-white polar caps
    vec3 deepBase = vec3(0.012, 0.04, 0.16);
    vec3 crustGlow = mix(deepBase, vec3(0.05, 0.70, 0.95), energyCrust * 0.5);
    vec3 polarColor = vec3(0.90, 0.95, 1.0) * polarHotspot * 2.8;

    vec3 finalColor = (crustGlow + polarColor) * uIntensity;

    // Smooth dimming when inactive / dropped
    finalColor *= mix(0.25, 1.0, uActive);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

const beamVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;

  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }
`;

const beamFragmentShader = `
  uniform float uActive;
  uniform float uIntensity;

  varying vec3 vPosition;
  varying vec3 vNormal;

  void main() {
    // Longitudinal falloff along cone height (0.0 to 14.0)
    float distAlong = abs(vPosition.y) / 14.0;
    float falloff = 1.0 - smoothstep(0.0, 1.0, distAlong);

    // Exponential radial edge softening (narrow intense core, soft boundary)
    float radial = abs(dot(vNormal, vec3(0.0, 1.0, 0.0)));
    float coreBeam = pow(radial, 2.8) * falloff;

    // Synchrotron emission palette: Electric cyan with soft violet outer halo
    vec3 coreColor = vec3(0.1, 0.95, 1.0);
    vec3 haloColor = vec3(0.35, 0.20, 0.85);
    vec3 beamColor = mix(haloColor, coreColor, radial) * coreBeam * 1.8 * uIntensity * uActive;

    float alpha = coreBeam * 0.45 * uActive;
    gl_FragColor = vec4(beamColor, alpha);
  }
`;

export function PulsarNode({ pulsar, index }: PulsarNodeProps): React.JSX.Element {
  const coreRef = useRef<THREE.Mesh>(null);
  const magneticGroupRef = useRef<THREE.Group>(null);
  const pulseWaveRef = useRef<THREE.Mesh>(null);
  const beamARef = useRef<THREE.Mesh>(null);
  const beamBRef = useRef<THREE.Mesh>(null);

  const position = useMemo(
    () => pulsarDirectionToHorizonPosition(pulsar.directionVector),
    [pulsar.directionVector]
  );

  const adapter = useTelemetryStore((s) => s.adapter);
  const visualThemeMode = useVisualStore((s) => s.visualThemeMode);
  const postprocessingPreset = useVisualStore((s) => s.postprocessingPreset);

  // Magnetic inclination angle ~30 degrees relative to rotational axis
  const magneticTiltRad = 0.52;

  useFrame(() => {
    const visual = adapter.getVisualState();
    const simTime_s = visual ? visual.simulationTime_s : 0;
    const isPulsarActive = visual ? (visual.activePulsarMask & (1 << index)) !== 0 : true;

    const theme = resolveVisualTheme(visualThemeMode, postprocessingPreset);

    // Authoritative rotational phase derived directly from scientific timing model
    const phase = evaluatePulsarPhaseNormalized(pulsar.timing, simTime_s);
    const rotationRad = phase * (Math.PI * 2);

    // Update core shader uniforms
    if (coreRef.current) {
      const coreMat = coreRef.current.material as THREE.ShaderMaterial;
      if (coreMat.uniforms) {
        coreMat.uniforms.uPhase.value = phase;
        coreMat.uniforms.uActive.value = isPulsarActive ? 1.0 : 0.0;
        coreMat.uniforms.uIntensity.value = theme.pulsarIntensity;
      }
    }

    if (beamARef.current) {
      const bMat = beamARef.current.material as THREE.ShaderMaterial;
      if (bMat.uniforms) {
        bMat.uniforms.uActive.value = isPulsarActive ? 1.0 : 0.0;
        bMat.uniforms.uIntensity.value = theme.pulsarIntensity;
      }
    }

    if (beamBRef.current) {
      const bMat = beamBRef.current.material as THREE.ShaderMaterial;
      if (bMat.uniforms) {
        bMat.uniforms.uActive.value = isPulsarActive ? 1.0 : 0.0;
        bMat.uniforms.uIntensity.value = theme.pulsarIntensity;
      }
    }

    // Rotate magnetic structure with simulation phase
    if (magneticGroupRef.current) {
      magneticGroupRef.current.rotation.y = rotationRad;
      magneticGroupRef.current.visible = isPulsarActive;
    }

    // Expand pulse wave in lockstep with phase
    if (pulseWaveRef.current) {
      if (isPulsarActive) {
        const waveScale = 1.8 + phase * 10.0;
        pulseWaveRef.current.scale.setScalar(waveScale);
        const waveMat = pulseWaveRef.current.material as THREE.MeshBasicMaterial;
        if (waveMat) {
          waveMat.opacity = (1.0 - phase) * 0.40 * theme.pulsarIntensity;
        }
        pulseWaveRef.current.visible = true;
      } else {
        pulseWaveRef.current.visible = false;
      }
    }
  });

  return (
    <group position={position} name={`PulsarNode_${pulsar.id}`}>
      {/* 1. NeutronStarCore (Procedural GLSL crust & polar emission) */}
      <mesh ref={coreRef} name="NeutronStarCore">
        <sphereGeometry args={[1.6, 32, 32]} />
        <shaderMaterial
          vertexShader={neutronStarVertexShader}
          fragmentShader={neutronStarFragmentShader}
          uniforms={{
            uPhase: { value: 0.0 },
            uActive: { value: 1.0 },
            uIntensity: { value: 1.0 },
          }}
        />
      </mesh>

      {/* 2. Halo (Magnetospheric Fresnel Glow) */}
      <mesh name="Halo">
        <sphereGeometry args={[2.4, 20, 20]} />
        <meshBasicMaterial
          color="#00b4d8"
          wireframe
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 3. PulseWave (Expanding Spherical Wavefront) */}
      <mesh ref={pulseWaveRef} name="PulseWave">
        <sphereGeometry args={[1.0, 16, 16]} />
        <meshBasicMaterial
          color="#00f5ff"
          transparent
          opacity={0.3}
          wireframe
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Magnetic Axis & Opposing Synchrotron Emission Cones */}
      <group ref={magneticGroupRef} rotation={[magneticTiltRad, 0, 0]}>
        {/* 4. MagneticAxis (Dipole axis needle through poles) */}
        <mesh name="MagneticAxis">
          <cylinderGeometry args={[0.035, 0.035, 18.0, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.65} />
        </mesh>

        {/* 5. EmissionBeamA (North Synchrotron Jet) */}
        <group position={[0, 7.0, 0]} name="EmissionBeamA">
          <mesh ref={beamARef} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[2.4, 14.0, 16, 1, true]} />
            <shaderMaterial
              vertexShader={beamVertexShader}
              fragmentShader={beamFragmentShader}
              uniforms={{
                uActive: { value: 1.0 },
                uIntensity: { value: 1.0 },
              }}
              transparent
              depthWrite={false}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>

        {/* 6. EmissionBeamB (South Synchrotron Jet) */}
        <group position={[0, -7.0, 0]} name="EmissionBeamB">
          <mesh ref={beamBRef}>
            <coneGeometry args={[2.4, 14.0, 16, 1, true]} />
            <shaderMaterial
              vertexShader={beamVertexShader}
              fragmentShader={beamFragmentShader}
              uniforms={{
                uActive: { value: 1.0 },
                uIntensity: { value: 1.0 },
              }}
              transparent
              depthWrite={false}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      </group>

      {/* 7. SignalLink (Beacon marker & target identifier) */}
      <group position={[0, -4.5, 0]} name="SignalLink">
        <mesh>
          <octahedronGeometry args={[0.75]} />
          <meshBasicMaterial color="#90e0ef" wireframe transparent opacity={0.7} />
        </mesh>
      </group>
    </group>
  );
}
