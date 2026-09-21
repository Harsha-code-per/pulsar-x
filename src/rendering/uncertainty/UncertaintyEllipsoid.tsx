"use client";

/**
 * PULSAR-X: 3D Rendering Domain
 * Covariance-Derived Uncertainty Ellipsoid.
 *
 * Implements:
 * - Real 3D geometric error ellipsoid transformed from navigation covariance P.
 * - Scaled by principal semi-axes lengths (sigma1, sigma2, sigma3).
 * - Full 3D orientation derived from Jacobi eigenvectors rotation matrix.
 * - Subtle visual differentiation across 1-sigma, 2-sigma, and 3-sigma modes.
 * - State-aware color treatment and opacity driven by centralized lookdev.
 * - Visual magnification support with prominent scale labeling.
 */

import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useTelemetryStore } from "../../store/telemetry-store";
import { useVisualStore } from "../../store/visual-store";
import { scaleUncertaintyAxesToRender } from "../coordinates/scaling";
import { resolveVisualTheme } from "../config/lookdev";

export function UncertaintyEllipsoid(): React.JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);

  const adapter = useTelemetryStore((s) => s.adapter);
  const uncertaintyMode = useVisualStore((s) => s.uncertaintyMode);
  const errorMagnification = useVisualStore((s) => s.errorMagnification);
  const visualThemeMode = useVisualStore((s) => s.visualThemeMode);
  const postprocessingPreset = useVisualStore((s) => s.postprocessingPreset);

  useFrame(() => {
    if (uncertaintyMode === "NONE" || !groupRef.current || !meshRef.current || !wireRef.current) return;

    const visual = adapter.getVisualState();
    if (!visual) return;

    const theme = resolveVisualTheme(visualThemeMode, postprocessingPreset);

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
    groupRef.current.position.set(
      visual.estimatedPositionRender[0],
      visual.estimatedPositionRender[1],
      visual.estimatedPositionRender[2]
    );

    // Orient along principal eigenvectors if provided
    if (visual.eigenvectors) {
      const [e0, e1, e2] = visual.eigenvectors;
      const rotMat = new THREE.Matrix4().makeBasis(
        new THREE.Vector3(e0.x, e0.y, e0.z),
        new THREE.Vector3(e1.x, e1.y, e1.z),
        new THREE.Vector3(e2.x, e2.y, e2.z)
      );
      groupRef.current.quaternion.setFromRotationMatrix(rotMat);
    }

    meshRef.current.scale.set(sx, sy, sz);
    wireRef.current.scale.set(sx, sy, sz);

    // Color based on navigation status and centralized lookdev
    const isLocked = visual.status === "LOCKED";
    const isDegraded = visual.status === "DEGRADED" || visual.status === "SINGULAR_GEOMETRY";
    const colorHex = isLocked ? "#00f5ff" : isDegraded ? "#ffb703" : "#ff3366";

    // Visual differentiation across sigma levels
    const sigmaShellMultiplier =
      uncertaintyMode === "1SIGMA" ? 1.4 : uncertaintyMode === "2SIGMA" ? 1.0 : 0.8;
    const sigmaWireMultiplier =
      uncertaintyMode === "1SIGMA" ? 0.7 : uncertaintyMode === "2SIGMA" ? 1.0 : 1.3;

    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    const wireMat = wireRef.current.material as THREE.MeshBasicMaterial;
    if (mat && wireMat) {
      mat.color.set(colorHex);
      mat.opacity = theme.uncertaintyShellOpacity * sigmaShellMultiplier;
      wireMat.color.set(colorHex);
      wireMat.opacity = theme.uncertaintyWireOpacity * sigmaWireMultiplier;
    }
  });

  if (uncertaintyMode === "NONE") return <></>;

  return (
    <group ref={groupRef} name="UncertaintyEllipsoidGroup">
      {/* Translucent Solid Inner Shell */}
      <mesh ref={meshRef} name="UncertaintyShell">
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#00f5ff"
          transparent
          opacity={0.15}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Outer Wireframe Cage */}
      <mesh ref={wireRef} name="UncertaintyWireframe">
        <sphereGeometry args={[1, 20, 20]} />
        <meshBasicMaterial
          color="#00f5ff"
          wireframe
          transparent
          opacity={0.50}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
