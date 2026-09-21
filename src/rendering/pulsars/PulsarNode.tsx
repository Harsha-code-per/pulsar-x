"use client";

/**
 * PULSAR-X: 3D Rendering Domain
 * PulsarNode: Relativistic Millisecond Pulsar Visual System.
 *
 * Implements the prompt-specified hierarchy:
 * PulsarNode
 * ├── NeutronStarCore (Procedural GLSL shader with energetic crust, rapid rotation, magnetic polar hotspots)
 * ├── MagneticAxis (Luminous magnetic dipole axis needle)
 * ├── EmissionBeamA (Opposing relativistic synchrotron emission cone)
 * ├── EmissionBeamB (Opposing relativistic synchrotron emission cone)
 * ├── PulseWave (Expanding wavefront synchronized with pulse phase)
 * ├── Halo (Magnetospheric Fresnel halo)
 * └── SignalLink (Beacon identifier marker & signal lock indicator)
 *
 * PEDAGOGICAL APPROXIMATION:
 * Pulsar crust turbulence, emission cone gradients, and magnetic halos are visual approximations
 * for real-time GPU rendering and do not attempt relativistic magnetohydrodynamics or frame dragging.
 */

import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { Pulsar } from "../../types/pulsar";
import { pulsarDirectionToHorizonPosition } from "../coordinates/scaling";
import { useTelemetryStore } from "../../store/telemetry-store";
import { evaluatePulsarPhaseNormalized } from "../../simulation/pulsars/timing-model";

interface PulsarNodeProps {
  readonly pulsar: Pulsar;
  readonly index: number;
}

// ----------------------------------------------------------------------------
// Custom GLSL Shaders for Pulsar Visual System
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
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    // Coordinate rotation around Y-axis by phase angle
    float angle = uPhase * 6.2831853;
    float cosA = cos(angle);
    float sinA = sin(angle);
    vec3 rotPos = vec3(
      vPosition.x * cosA - vPosition.z * sinA,
      vPosition.y,
      vPosition.x * sinA + vPosition.z * cosA
    );

    // High-energy compact crust texture (domain-warped sinusoidal lattice)
    float crustNoise = sin(rotPos.x * 14.0) * cos(rotPos.y * 14.0) * sin(rotPos.z * 14.0);
    float energyCrust = 0.5 + 0.5 * crustNoise;

    // Polar magnetic emission hotspots (peaks near poles |y| -> 1)
    float polarProximity = abs(normalize(rotPos).y);
    float polarHotspot = pow(polarProximity, 4.0);

    // Energetic compact palette: deep ultra-dense indigo core with blazing cyan/white magnetic poles
    vec3 deepBase = vec3(0.015, 0.05, 0.18);
    vec3 energeticSurface = mix(deepBase, vec3(0.0, 0.8, 1.0), energyCrust * 0.45);
    vec3 polarColor = vec3(0.85, 0.95, 1.0) * polarHotspot * 2.2;

    vec3 finalColor = energeticSurface + polarColor;

    // Dim if inactive / dropped
    finalColor *= mix(0.35, 1.0, uActive);

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
  varying vec3 vPosition;
  varying vec3 vNormal;

  void main() {
    // Longitudinal falloff along cone height (0.0 to 14.0)
    float distAlong = abs(vPosition.y) / 14.0;
    float falloff = 1.0 - smoothstep(0.0, 1.0, distAlong);

    // Radial edge softening
    float radial = abs(dot(vNormal, vec3(0.0, 1.0, 0.0)));
    float beamIntensity = falloff * pow(radial, 1.5);

    vec3 beamColor = vec3(0.0, 0.95, 1.0) * beamIntensity * 1.5 * uActive;
    gl_FragColor = vec4(beamColor, beamIntensity * 0.4 * uActive);
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

  // Magnetic inclination angle ~30 degrees (tilted relative to rotational axis)
  const magneticTiltRad = 0.52;

  useFrame(() => {
    const visual = adapter.getVisualState();
    const simTime_s = visual ? visual.simulationTime_s : 0;
    const isPulsarActive = visual ? (visual.activePulsarMask & (1 << index)) !== 0 : true;

    // Authoritative rotational phase derived directly from scientific timing model
    const phase = evaluatePulsarPhaseNormalized(pulsar.timing, simTime_s);
    const rotationRad = phase * (Math.PI * 2);

    // Update core shader uniforms via attached mesh material
    if (coreRef.current) {
      const coreMat = coreRef.current.material as THREE.ShaderMaterial;
      if (coreMat.uniforms) {
        coreMat.uniforms.uPhase.value = phase;
        coreMat.uniforms.uActive.value = isPulsarActive ? 1.0 : 0.0;
      }
    }

    if (beamARef.current) {
      const bMat = beamARef.current.material as THREE.ShaderMaterial;
      if (bMat.uniforms) {
        bMat.uniforms.uActive.value = isPulsarActive ? 1.0 : 0.0;
      }
    }

    if (beamBRef.current) {
      const bMat = beamBRef.current.material as THREE.ShaderMaterial;
      if (bMat.uniforms) {
        bMat.uniforms.uActive.value = isPulsarActive ? 1.0 : 0.0;
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
          waveMat.opacity = (1.0 - phase) * 0.45;
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
          opacity={0.2}
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
          <cylinderGeometry args={[0.04, 0.04, 18.0, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
        </mesh>

        {/* 5. EmissionBeamA (North Synchrotron Jet) */}
        <group position={[0, 7.0, 0]} name="EmissionBeamA">
          <mesh ref={beamARef} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[2.5, 14.0, 16, 1, true]} />
            <shaderMaterial
              vertexShader={beamVertexShader}
              fragmentShader={beamFragmentShader}
              uniforms={{
                uActive: { value: 1.0 },
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
            <coneGeometry args={[2.5, 14.0, 16, 1, true]} />
            <shaderMaterial
              vertexShader={beamVertexShader}
              fragmentShader={beamFragmentShader}
              uniforms={{
                uActive: { value: 1.0 },
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
          <octahedronGeometry args={[0.8]} />
          <meshBasicMaterial color="#90e0ef" wireframe />
        </mesh>
      </group>
    </group>
  );
}
