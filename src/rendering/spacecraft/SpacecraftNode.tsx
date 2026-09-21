"use client";

/**
 * PULSAR-X: 3D Rendering Domain
 * High-Quality Precision Deep-Space Probe Spacecraft Representation.
 *
 * Implements the prompt-specified hierarchy:
 * SpacecraftRoot
 * ├── MainBody (Octagonal multi-layer insulation bus & equipment deck)
 * ├── SolarPanels (Dual articulating photovoltaic solar wings)
 * ├── HighGainAntenna (Parabolic dish with subreflector/feedhorn)
 * ├── XRayDetector (SEXTANT-style X-ray collimator & timing detector)
 * ├── Thrusters (RCS thruster quads and ion propulsion nozzle)
 * ├── NavigationMarker (True position cyan locator)
 * └── Effects (Ion engine exhaust plume glow & velocity vector)
 */

import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useTelemetryStore } from "../../store/telemetry-store";
import { useVisualStore } from "../../store/visual-store";

export function SpacecraftNode(): React.JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const estMarkerRef = useRef<THREE.Group>(null);
  const thrusterPlumeRef = useRef<THREE.Mesh>(null);

  const errorLine = useMemo(() => {
    return new THREE.Line(
      new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3)),
      new THREE.LineDashedMaterial({ color: "#ffb703", dashSize: 0.2, gapSize: 0.1, transparent: true, opacity: 0.8 })
    );
  }, []);

  const adapter = useTelemetryStore((s) => s.adapter);
  const errorMagnification = useVisualStore((s) => s.errorMagnification);

  useFrame((state) => {
    const visual = adapter.getVisualState();
    if (!visual) return;

    // 1. Update true spacecraft position & attitude
    if (groupRef.current) {
      groupRef.current.position.set(
        visual.truePositionRender[0],
        visual.truePositionRender[1],
        visual.truePositionRender[2]
      );

      // Orient spacecraft toward velocity vector
      const vx = visual.velocityRender[0];
      const vy = visual.velocityRender[1];
      const vz = visual.velocityRender[2];
      const vNorm = Math.hypot(vx, vy, vz);
      if (vNorm > 1e-6) {
        const forward = new THREE.Vector3(vx / vNorm, vy / vNorm, vz / vNorm);
        const up = new THREE.Vector3(0, 1, 0);
        const matrix = new THREE.Matrix4().lookAt(
          new THREE.Vector3(0, 0, 0),
          forward,
          up
        );
        groupRef.current.quaternion.setFromRotationMatrix(matrix);
      }
    }

    // 2. Pulse thruster exhaust plume
    if (thrusterPlumeRef.current) {
      const pulse = 0.8 + 0.2 * Math.sin(state.clock.elapsedTime * 8.0);
      thrusterPlumeRef.current.scale.set(1.0, pulse, 1.0);
    }

    // 3. Update estimated position marker with visual error magnification
    if (estMarkerRef.current) {
      const dx = (visual.estimatedPositionRender[0] - visual.truePositionRender[0]) * errorMagnification;
      const dy = (visual.estimatedPositionRender[1] - visual.truePositionRender[1]) * errorMagnification;
      const dz = (visual.estimatedPositionRender[2] - visual.truePositionRender[2]) * errorMagnification;

      estMarkerRef.current.position.set(
        visual.truePositionRender[0] + dx,
        visual.truePositionRender[1] + dy,
        visual.truePositionRender[2] + dz
      );
    }

    // 4. Update error vector connecting line
    if (groupRef.current && estMarkerRef.current) {
      const geo = errorLine.geometry;
      const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;
      if (posAttr) {
        posAttr.setXYZ(0, groupRef.current.position.x, groupRef.current.position.y, groupRef.current.position.z);
        posAttr.setXYZ(1, estMarkerRef.current.position.x, estMarkerRef.current.position.y, estMarkerRef.current.position.z);
        posAttr.needsUpdate = true;
      }
    }
  });

  return (
    <>
      {/* =================================================================== */}
      {/* TRUE SPACECRAFT ROOT                                                */}
      {/* =================================================================== */}
      <group ref={groupRef} name="SpacecraftRoot">
        {/* 1. MainBody */}
        <group name="MainBody">
          {/* Octagonal gold multi-layer insulation (MLI) bus */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.5, 0.55, 0.9, 8]} />
            <meshStandardMaterial
              color="#c29c54"
              roughness={0.35}
              metalness={0.85}
            />
          </mesh>
          {/* Equipment bay top deck */}
          <mesh position={[0, 0.46, 0]}>
            <cylinderGeometry args={[0.48, 0.48, 0.05, 8]} />
            <meshStandardMaterial color="#2a303c" roughness={0.5} metalness={0.4} />
          </mesh>
        </group>

        {/* 2. SolarPanels */}
        <group name="SolarPanels">
          {/* Left Solar Wing */}
          <group position={[-1.3, 0, 0]}>
            <mesh>
              <boxGeometry args={[1.5, 0.02, 0.6]} />
              <meshStandardMaterial
                color="#0d2448"
                roughness={0.2}
                metalness={0.7}
              />
            </mesh>
            <mesh position={[0.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.03, 0.03, 0.3]} />
              <meshStandardMaterial color="#666" metalness={0.8} />
            </mesh>
          </group>
          {/* Right Solar Wing */}
          <group position={[1.3, 0, 0]}>
            <mesh>
              <boxGeometry args={[1.5, 0.02, 0.6]} />
              <meshStandardMaterial
                color="#0d2448"
                roughness={0.2}
                metalness={0.7}
              />
            </mesh>
            <mesh position={[-0.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.03, 0.03, 0.3]} />
              <meshStandardMaterial color="#666" metalness={0.8} />
            </mesh>
          </group>
        </group>

        {/* 3. HighGainAntenna */}
        <group position={[0, 0.55, 0.2]} rotation={[-0.4, 0, 0]} name="HighGainAntenna">
          <mesh>
            <cylinderGeometry args={[0.45, 0.05, 0.15, 24]} />
            <meshStandardMaterial color="#dedede" roughness={0.4} metalness={0.6} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.04, 0.02, 0.12, 8]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        </group>

        {/* 4. XRayDetector (SEXTANT X-ray timing collimator) */}
        <group position={[0, 0.52, -0.2]} name="XRayDetector">
          <mesh>
            <cylinderGeometry args={[0.22, 0.24, 0.28, 16]} />
            <meshStandardMaterial color="#1a1c22" roughness={0.6} metalness={0.5} />
          </mesh>
          <mesh position={[0, 0.15, 0]}>
            <circleGeometry args={[0.2, 16]} />
            <meshBasicMaterial color="#00e5ff" wireframe />
          </mesh>
        </group>

        {/* 5. Thrusters */}
        <group position={[0, -0.52, 0]} rotation={[Math.PI, 0, 0]} name="Thrusters">
          <mesh>
            <coneGeometry args={[0.22, 0.35, 16]} />
            <meshStandardMaterial color="#383838" roughness={0.3} metalness={0.9} />
          </mesh>
        </group>

        {/* 6. NavigationMarker */}
        <group position={[0, 0, 0]} name="NavigationMarker">
          <mesh>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshBasicMaterial color="#00f2ff" />
          </mesh>
        </group>

        {/* 7. Effects (Ion Engine Exhaust Plume Glow) */}
        <group position={[0, -0.75, 0]} rotation={[Math.PI, 0, 0]} name="Effects">
          <mesh ref={thrusterPlumeRef}>
            <coneGeometry args={[0.16, 0.5, 12, 1, true]} />
            <meshBasicMaterial
              color="#00d2ff"
              transparent
              opacity={0.55}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
      </group>

      {/* =================================================================== */}
      {/* ESTIMATED POSITION MARKER (Amber Reticle with Magnification)       */}
      {/* =================================================================== */}
      <group ref={estMarkerRef} name="EstimatedPositionMarker">
        <mesh>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshBasicMaterial color="#ffb703" wireframe transparent opacity={0.6} />
        </mesh>
        <mesh>
          <octahedronGeometry args={[0.18]} />
          <meshBasicMaterial color="#ffb703" />
        </mesh>
      </group>

      {/* Dynamic connecting line for error vector */}
      <primitive object={errorLine} />
    </>
  );
}
