"use client";

/**
 * PULSAR-X: 3D Rendering Domain
 * Dynamic Pulsar Sightlines & Signal Pulse Propagation.
 *
 * Renders line-of-sight vectors between active pulsars and the spacecraft.
 * Modulated directly by worker telemetry active pulsar mask and fault states.
 * Photon packet positions along each sightline are derived from the scientific rotational phase.
 */

import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { INITIAL_PULSAR_CATALOG } from "../../simulation/pulsars/catalog";
import { pulsarDirectionToHorizonPosition } from "../coordinates/scaling";
import { useTelemetryStore } from "../../store/telemetry-store";
import { useVisualStore } from "../../store/visual-store";
import { evaluatePulsarPhaseNormalized } from "../../simulation/pulsars/timing-model";

export function PulsarSightlines(): React.JSX.Element {
  const linesRef = useRef<THREE.LineSegments>(null);
  const pulsesRef = useRef<THREE.Points>(null);

  const adapter = useTelemetryStore((s) => s.adapter);
  const showSightlines = useVisualStore((s) => s.showSightlines);

  const pulsarPositions = React.useMemo(() => {
    return INITIAL_PULSAR_CATALOG.map((p) => pulsarDirectionToHorizonPosition(p.directionVector));
  }, []);

  useFrame(() => {
    if (!linesRef.current || !pulsesRef.current || !showSightlines) return;

    const visual = adapter.getVisualState();
    if (!visual) return;

    const lineGeo = linesRef.current.geometry;
    const linePosAttr = lineGeo.getAttribute("position") as THREE.BufferAttribute;

    const pulseGeo = pulsesRef.current.geometry;
    const pulsePosAttr = pulseGeo.getAttribute("position") as THREE.BufferAttribute;

    const scX = visual.truePositionRender[0];
    const scY = visual.truePositionRender[1];
    const scZ = visual.truePositionRender[2];

    const simTime_s = visual.simulationTime_s;

    for (let i = 0; i < INITIAL_PULSAR_CATALOG.length; i++) {
      const isPulsarActive = (visual.activePulsarMask & (1 << i)) !== 0;
      const pPos = pulsarPositions[i];

      if (isPulsarActive) {
        // Line segment from pulsar to spacecraft
        linePosAttr.setXYZ(i * 2 + 0, pPos[0], pPos[1], pPos[2]);
        linePosAttr.setXYZ(i * 2 + 1, scX, scY, scZ);

        // Moving pulse packet along line strictly derived from scientific rotational phase
        const pulseProgress = evaluatePulsarPhaseNormalized(INITIAL_PULSAR_CATALOG[i].timing, simTime_s);
        const pulseX = pPos[0] + (scX - pPos[0]) * pulseProgress;
        const pulseY = pPos[1] + (scY - pPos[1]) * pulseProgress;
        const pulseZ = pPos[2] + (scZ - pPos[2]) * pulseProgress;
        pulsePosAttr.setXYZ(i, pulseX, pulseY, pulseZ);
      } else {
        // Collapse to zero length if inactive / dropped
        linePosAttr.setXYZ(i * 2 + 0, 0, 0, 0);
        linePosAttr.setXYZ(i * 2 + 1, 0, 0, 0);
        pulsePosAttr.setXYZ(i, 0, -9999, 0); // Hide offscreen
      }
    }

    linePosAttr.needsUpdate = true;
    pulsePosAttr.needsUpdate = true;
  });

  if (!showSightlines) return <></>;

  const totalLines = INITIAL_PULSAR_CATALOG.length;

  return (
    <group name="PulsarSightlines">
      {/* Active Sightline Rays */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(totalLines * 2 * 3), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#00f5ff"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* Travelling Photon Pulse Packets */}
      <points ref={pulsesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(totalLines * 3), 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#ffffff"
          size={3.5}
          sizeAttenuation={false}
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
