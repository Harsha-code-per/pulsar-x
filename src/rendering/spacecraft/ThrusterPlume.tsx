"use client";

/**
 * PULSAR-X: 3D Rendering Domain
 * State-Driven Spacecraft Propulsion Visual Effects.
 *
 * Implements:
 * - MAIN BURN: High-energy collimated bipropellant exhaust plume with inner core.
 * - RCS: Discrete reaction-control gas puff bursts on attitude maneuvers.
 * - ION / LOW-THRUST: Delicate, luminous electric-cyan ion engine glow.
 * - OFF: Zero plume / zero glow when propulsion is idle.
 * - Never displays arbitrary always-on engine glow.
 */

import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export type PropulsionMode = "OFF" | "ION" | "RCS" | "MAIN_BURN";

interface ThrusterPlumeProps {
  readonly mode?: PropulsionMode;
  readonly throttle?: number; // [0, 1]
}

const ionPlumeVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;

  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }
`;

const ionPlumeFragmentShader = `
  uniform float uTime;
  uniform float uThrottle;

  varying vec3 vPosition;
  varying vec3 vNormal;

  void main() {
    // Lengthwise falloff along cone
    float dist = abs(vPosition.y) / 0.8;
    float falloff = 1.0 - smoothstep(0.0, 1.0, dist);

    // High frequency electric shimmer
    float shimmer = 0.85 + 0.15 * sin(uTime * 35.0 + vPosition.y * 20.0);

    // Delicate electric-cyan ion coloration
    vec3 coreColor = vec3(0.1, 0.85, 1.0);
    vec3 outerColor = vec3(0.02, 0.35, 0.8);
    vec3 color = mix(outerColor, coreColor, falloff) * shimmer * uThrottle;

    float alpha = falloff * 0.65 * uThrottle;
    gl_FragColor = vec4(color, alpha);
  }
`;

const mainBurnFragmentShader = `
  uniform float uTime;
  uniform float uThrottle;

  varying vec3 vPosition;
  varying vec3 vNormal;

  void main() {
    float dist = abs(vPosition.y) / 1.5;
    float falloff = 1.0 - smoothstep(0.0, 1.0, dist);

    // Energetic turbulent plume noise
    float turb = sin(uTime * 45.0 + vPosition.y * 30.0) * cos(uTime * 30.0 + vPosition.x * 20.0);
    float pulse = 0.9 + 0.1 * turb;

    // Hot white-blue core transitioning to amber-orange boundary
    vec3 core = vec3(0.9, 0.95, 1.0);
    vec3 boundary = vec3(1.0, 0.55, 0.1);
    vec3 color = mix(boundary, core, pow(falloff, 2.0)) * pulse * uThrottle * 2.0;

    float alpha = falloff * 0.85 * uThrottle;
    gl_FragColor = vec4(color, alpha);
  }
`;

export function ThrusterPlume({ mode = "OFF", throttle = 1.0 }: ThrusterPlumeProps): React.JSX.Element {
  const ionMatRef = useRef<THREE.ShaderMaterial>(null);
  const mainMatRef = useRef<THREE.ShaderMaterial>(null);
  const rcsGroupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ionMatRef.current) {
      ionMatRef.current.uniforms.uTime.value = t;
      ionMatRef.current.uniforms.uThrottle.value = throttle;
    }
    if (mainMatRef.current) {
      mainMatRef.current.uniforms.uTime.value = t;
      mainMatRef.current.uniforms.uThrottle.value = throttle;
    }
    if (rcsGroupRef.current && mode === "RCS") {
      // Discrete micro-burst flickering
      const burst = Math.sin(t * 18.0) > 0.3 ? 1.0 : 0.0;
      rcsGroupRef.current.visible = burst > 0;
    }
  });

  if (mode === "OFF" || throttle <= 0.001) {
    return <></>;
  }

  return (
    <group position={[0, -0.65, 0]} rotation={[Math.PI, 0, 0]} name="ThrusterPlumes">
      {/* 1. ION / LOW-THRUST PLUME */}
      {mode === "ION" && (
        <mesh>
          <coneGeometry args={[0.18, 0.8, 16, 1, true]} />
          <shaderMaterial
            ref={ionMatRef}
            vertexShader={ionPlumeVertexShader}
            fragmentShader={ionPlumeFragmentShader}
            uniforms={{
              uTime: { value: 0 },
              uThrottle: { value: throttle },
            }}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 2. MAIN BURN PLUME */}
      {mode === "MAIN_BURN" && (
        <mesh>
          <coneGeometry args={[0.32, 1.5, 20, 1, true]} />
          <shaderMaterial
            ref={mainMatRef}
            vertexShader={ionPlumeVertexShader}
            fragmentShader={mainBurnFragmentShader}
            uniforms={{
              uTime: { value: 0 },
              uThrottle: { value: throttle },
            }}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 3. RCS LATERAL JETS */}
      {mode === "RCS" && (
        <group ref={rcsGroupRef} name="RCSJets">
          {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, idx) => (
            <mesh
              key={idx}
              position={[Math.cos(angle) * 0.45, 0.2, Math.sin(angle) * 0.45]}
              rotation={[0, angle, Math.PI / 2]}
            >
              <coneGeometry args={[0.06, 0.25, 8, 1, true]} />
              <meshBasicMaterial
                color="#e0f2fe"
                transparent
                opacity={0.7}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}
