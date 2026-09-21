"use client";

/**
 * PULSAR-X: 3D Rendering Domain
 * High-Precision Aerospace Deep-Space Probe Representation.
 *
 * Implements:
 * - Material separation: Gold MLI, silver thermal foil, matte titanium, photovoltaic silicon.
 * - SEXTANT-style X-ray timing collimator with photon sensor arrival feedback.
 * - Subsystem telemetry indicators (COMM, PROP, XTI, NAV).
 * - State-driven propulsion visuals via ThrusterPlume (zero arbitrary always-on glow).
 * - Smooth velocity-aligned attitude orientation.
 * - Magnified error vector and estimated position reticle.
 */

import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useTelemetryStore } from "../../store/telemetry-store";
import { useVisualStore } from "../../store/visual-store";
import { ThrusterPlume, type PropulsionMode } from "./ThrusterPlume";

interface SpacecraftNodeProps {
  readonly propulsionMode?: PropulsionMode;
  readonly throttle?: number;
}

export function SpacecraftNode({
  propulsionMode = "OFF",
  throttle = 0.0,
}: SpacecraftNodeProps): React.JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const estMarkerRef = useRef<THREE.Group>(null);
  const navLedRef = useRef<THREE.MeshBasicMaterial>(null);
  const xtiLedRef = useRef<THREE.MeshBasicMaterial>(null);

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

    // 2. Subsystem LED status updates
    if (navLedRef.current) {
      const isLocked = visual.status === "LOCKED";
      const isDegraded = visual.status === "DEGRADED" || visual.status === "SINGULAR_GEOMETRY";
      navLedRef.current.color.set(isLocked ? "#00f5ff" : isDegraded ? "#ffb703" : "#ff3366");
    }

    if (xtiLedRef.current) {
      // Subtle sensor pulse based on photon accumulation
      const pulse = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 12.0);
      xtiLedRef.current.opacity = 0.4 + 0.6 * pulse;
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
        {/* 1. MainBody: Octagonal gold MLI bus */}
        <group name="MainBody">
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.5, 0.55, 0.9, 8]} />
            <meshStandardMaterial
              color="#d4af37" // Aerospace gold MLI thermal foil
              roughness={0.28}
              metalness={0.88}
              envMapIntensity={1.2}
            />
          </mesh>
          {/* Equipment bay top deck: Matte titanium / silver MLI */}
          <mesh position={[0, 0.46, 0]}>
            <cylinderGeometry args={[0.48, 0.48, 0.05, 8]} />
            <meshStandardMaterial color="#c0c5ce" roughness={0.4} metalness={0.7} />
          </mesh>
          {/* Lower propulsion deck */}
          <mesh position={[0, -0.46, 0]}>
            <cylinderGeometry args={[0.52, 0.52, 0.04, 8]} />
            <meshStandardMaterial color="#2b303a" roughness={0.6} metalness={0.5} />
          </mesh>
        </group>

        {/* 2. Solar Arrays: Photovoltaic silicon cells with structural booms */}
        <group name="SolarPanels">
          {/* Left Solar Wing */}
          <group position={[-1.35, 0, 0]}>
            <mesh>
              <boxGeometry args={[1.5, 0.02, 0.65]} />
              <meshStandardMaterial
                color="#0c2340" // Deep space photovoltaic blue
                roughness={0.15}
                metalness={0.75}
              />
            </mesh>
            {/* Grid line metallic busbars */}
            <mesh position={[0, 0.012, 0]}>
              <planeGeometry args={[1.48, 0.63]} />
              <meshBasicMaterial color="#1e3a8a" wireframe transparent opacity={0.3} />
            </mesh>
            {/* Articulation boom gimbal */}
            <mesh position={[0.82, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.035, 0.035, 0.28]} />
              <meshStandardMaterial color="#718096" metalness={0.85} roughness={0.3} />
            </mesh>
          </group>

          {/* Right Solar Wing */}
          <group position={[1.35, 0, 0]}>
            <mesh>
              <boxGeometry args={[1.5, 0.02, 0.65]} />
              <meshStandardMaterial
                color="#0c2340"
                roughness={0.15}
                metalness={0.75}
              />
            </mesh>
            <mesh position={[0, 0.012, 0]}>
              <planeGeometry args={[1.48, 0.63]} />
              <meshBasicMaterial color="#1e3a8a" wireframe transparent opacity={0.3} />
            </mesh>
            <mesh position={[-0.82, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.035, 0.035, 0.28]} />
              <meshStandardMaterial color="#718096" metalness={0.85} roughness={0.3} />
            </mesh>
          </group>
        </group>

        {/* 3. HighGainAntenna: Parabolic telemetry dish */}
        <group position={[0, 0.55, 0.22]} rotation={[-0.35, 0, 0]} name="HighGainAntenna">
          <mesh>
            <cylinderGeometry args={[0.48, 0.06, 0.16, 24]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.35} metalness={0.65} />
          </mesh>
          {/* Subreflector & feedhorn strut */}
          <mesh position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.04, 0.02, 0.14, 8]} />
            <meshStandardMaterial color="#4a5568" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>

        {/* 4. XRayDetector: SEXTANT-style X-ray timing collimator */}
        <group position={[0, 0.52, -0.22]} name="XRayDetector">
          <mesh>
            <cylinderGeometry args={[0.24, 0.26, 0.30, 16]} />
            <meshStandardMaterial color="#1a202c" roughness={0.5} metalness={0.6} />
          </mesh>
          {/* Collimator baffle aperture grid */}
          <mesh position={[0, 0.16, 0]}>
            <circleGeometry args={[0.22, 16]} />
            <meshBasicMaterial color="#00f5ff" wireframe transparent opacity={0.8} />
          </mesh>
        </group>

        {/* 5. Thruster Engine Nozzle */}
        <group position={[0, -0.52, 0]} rotation={[Math.PI, 0, 0]} name="Thrusters">
          <mesh>
            <coneGeometry args={[0.24, 0.38, 16]} />
            <meshStandardMaterial color="#2d3748" roughness={0.3} metalness={0.92} />
          </mesh>
        </group>

        {/* 6. Subsystem Telemetry Indicator LEDs (Visually subtle) */}
        <group position={[0.42, 0.1, 0.25]} name="SubsystemLEDs">
          {/* NAV Status LED */}
          <mesh position={[0, 0.12, 0]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshBasicMaterial ref={navLedRef} color="#00f5ff" />
          </mesh>
          {/* XTI Sensor Pulse LED */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshBasicMaterial ref={xtiLedRef} color="#00f5ff" transparent />
          </mesh>
          {/* COMM Link LED */}
          <mesh position={[0, -0.12, 0]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshBasicMaterial color="#10b981" />
          </mesh>
        </group>

        {/* 7. State-Driven Propulsion Plume (Zero arbitrary always-on glow) */}
        <ThrusterPlume mode={propulsionMode} throttle={throttle} />
      </group>

      {/* =================================================================== */}
      {/* ESTIMATED POSITION MARKER (Amber Reticle with Magnification)       */}
      {/* =================================================================== */}
      <group ref={estMarkerRef} name="EstimatedPositionMarker">
        <mesh>
          <sphereGeometry args={[0.28, 16, 16]} />
          <meshBasicMaterial color="#ffb703" wireframe transparent opacity={0.65} />
        </mesh>
        <mesh>
          <octahedronGeometry args={[0.16]} />
          <meshBasicMaterial color="#ffb703" />
        </mesh>
      </group>

      {/* Dynamic connecting line for error vector */}
      <primitive object={errorLine} />
    </>
  );
}
