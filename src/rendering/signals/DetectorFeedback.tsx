"use client";

/**
 * PULSAR-X: 3D Rendering Domain
 * Lightweight X-ray Collimator Photon Arrival Feedback.
 *
 * Implements:
 * - Localized aperture flashes upon photon arrival events.
 * - Sensor response synchronization with incoming pulsar sightline pulses.
 * - Zero DOM allocations; uses GPU-instanced/reusable Three.js mesh.
 */

import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useTelemetryStore } from "../../store/telemetry-store";

export function DetectorFeedback(): React.JSX.Element {
  const flashRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const adapter = useTelemetryStore((s) => s.adapter);
  const lastPhotonCount = useRef(0);
  const flashIntensity = useRef(0.0);

  useFrame((_, delta) => {
    const visual = adapter.getVisualState();
    if (!visual) return;

    // Detect new photon accumulation events
    if (visual.photonCount > lastPhotonCount.current) {
      lastPhotonCount.current = visual.photonCount;
      flashIntensity.current = 1.0;
    }

    // Decay flash intensity quickly (~120 ms)
    if (flashIntensity.current > 0.01) {
      flashIntensity.current = Math.max(0.0, flashIntensity.current - delta * 7.5);
    }

    if (flashRef.current && ringRef.current) {
      const pos = visual.truePositionRender;
      // Position relative to spacecraft X-ray collimator aperture
      flashRef.current.position.set(pos[0], pos[1] + 0.52, pos[2] - 0.22);
      ringRef.current.position.copy(flashRef.current.position);

      const fMat = flashRef.current.material as THREE.MeshBasicMaterial;
      const rMat = ringRef.current.material as THREE.MeshBasicMaterial;

      fMat.opacity = flashIntensity.current * 0.85;
      rMat.opacity = flashIntensity.current * 0.60;

      const scale = 1.0 + (1.0 - flashIntensity.current) * 0.8;
      ringRef.current.scale.set(scale, scale, scale);

      const isVisible = flashIntensity.current > 0.02;
      flashRef.current.visible = isVisible;
      ringRef.current.visible = isVisible;
    }
  });

  return (
    <group name="DetectorFeedback">
      {/* Central Aperture Flash Disc */}
      <mesh ref={flashRef} visible={false}>
        <circleGeometry args={[0.18, 16]} />
        <meshBasicMaterial
          color="#00f5ff"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Expanding Sensor Ring */}
      <mesh ref={ringRef} visible={false}>
        <ringGeometry args={[0.16, 0.22, 16]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
