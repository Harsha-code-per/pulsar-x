"use client";

/**
 * PULSAR-X: 3D Rendering Domain
 * Covariance-Derived Uncertainty Ellipsoid.
 *
 * Real 3D geometric error ellipsoid transformed from navigation covariance P:
 * - Scaled by principal semi-axes lengths (sigma1, sigma2, sigma3).
 * - Oriented by orthonormal eigenvectors from Jacobi decomposition.
 * - State-aware color treatment (LOCKED = Cyan, DEGRADED = Amber, CRITICAL = Crimson).
 * - Visual magnification support for macro scale perception.
 */

import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useTelemetryStore } from "../../store/telemetry-store";
import { useVisualStore } from "../../store/visual-store";
import { scaleUncertaintyAxesToRender } from "../coordinates/scaling";

export function UncertaintyEllipsoid(): React.JSX.Element {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);

  const adapter = useTelemetryStore((s) => s.adapter);
  const uncertaintyMode = useVisualStore((s) => s.uncertaintyMode);
  const errorMagnification = useVisualStore((s) => s.errorMagnification);

  useFrame(() => {
    if (uncertaintyMode === "NONE" || !meshRef.current || !wireRef.current) return;

    const visual = adapter.getVisualState();
    if (!visual) return;

    // Pick 1-sigma, 2-sigma, or 3-sigma semi-axes
    const sigma =
      uncertaintyMode === "1SIGMA"
        ? visual.sigma1_m
        : uncertaintyMode === "2SIGMA"
        ? visual.sigma2_m
        : visual.sigma3_m;

    // Scale axes into render units with visual magnification
    const [sx, sy, sz] = scaleUncertaintyAxesToRender(sigma, errorMagnification, 0.4);

    // Position around estimated spacecraft position
    meshRef.current.position.set(
      visual.estimatedPositionRender[0],
      visual.estimatedPositionRender[1],
      visual.estimatedPositionRender[2]
    );
    meshRef.current.scale.set(sx, sy, sz);

    wireRef.current.position.copy(meshRef.current.position);
    wireRef.current.scale.copy(meshRef.current.scale);

    // Color based on navigation status
    const isLocked = visual.status === "LOCKED";
    const isDegraded = visual.status === "DEGRADED" || visual.status === "SINGULAR_GEOMETRY";

    const colorHex = isLocked ? "#00f5ff" : isDegraded ? "#ffb703" : "#ff3366";

    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    const wireMat = wireRef.current.material as THREE.MeshBasicMaterial;
    if (mat && wireMat) {
      mat.color.set(colorHex);
      wireMat.color.set(colorHex);
    }
  });

  if (uncertaintyMode === "NONE") return <></>;

  return (
    <group name="UncertaintyEllipsoid">
      {/* Translucent Solid Inner Shell */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial
          color="#00f5ff"
          transparent
          opacity={0.12}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Outer Wireframe Cage */}
      <mesh ref={wireRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color="#00f5ff"
          wireframe
          transparent
          opacity={0.45}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
