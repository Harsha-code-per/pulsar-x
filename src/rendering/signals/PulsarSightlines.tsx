"use client";

/**
 * PULSAR-X: 3D Rendering Domain
 * Dynamic Pulsar Sightlines & Directional Photon Pulse Propagation.
 *
 * Implements:
 * - Line-of-sight vectors between active pulsars and spacecraft (PULSAR -> SPACECRAFT).
 * - Restrained, elegant mathematical sightlines (not giant laser beams).
 * - Compact luminous photon pulse packets traveling from pulsar to spacecraft.
 * - Pulse cadence and phase strictly synchronized with simulated pulsar rotational timing.
 * - Smooth fade-in/out on active/faulted pulsar transitions.
 * - Multi-pulse packet support per sightline scaled by quality tier.
 * - Integration with centralized lookdev signalIntensity.
 */

import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { INITIAL_PULSAR_CATALOG } from "../../simulation/pulsars/catalog";
import { pulsarDirectionToHorizonPosition } from "../coordinates/scaling";
import { useTelemetryStore } from "../../store/telemetry-store";
import { useVisualStore } from "../../store/visual-store";
import { evaluatePulsarPhaseNormalized } from "../../simulation/pulsars/timing-model";
import { getQualitySettings } from "../config/quality";
import { resolveVisualTheme } from "../config/lookdev";

export function PulsarSightlines(): React.JSX.Element {
  const linesRef = useRef<THREE.LineSegments>(null);
  const pulsesRef = useRef<THREE.Points>(null);

  const adapter = useTelemetryStore((s) => s.adapter);
  const showSightlines = useVisualStore((s) => s.showSightlines);
  const qualityTier = useVisualStore((s) => s.qualityTier);
  const visualThemeMode = useVisualStore((s) => s.visualThemeMode);
  const postprocessingPreset = useVisualStore((s) => s.postprocessingPreset);

  const qualitySettings = getQualitySettings(qualityTier);
  const particlesPerBeam = qualitySettings.signalParticlesPerBeam;

  const pulsarPositions = useMemo(() => {
    return INITIAL_PULSAR_CATALOG.map((p) => pulsarDirectionToHorizonPosition(p.directionVector));
  }, []);

  const totalLines = INITIAL_PULSAR_CATALOG.length;
  const totalPulses = totalLines * particlesPerBeam;

  useFrame(() => {
    if (!linesRef.current || !pulsesRef.current || !showSightlines) return;

    const visual = adapter.getVisualState();
    if (!visual) return;

    const theme = resolveVisualTheme(visualThemeMode, postprocessingPreset);

    const lineGeo = linesRef.current.geometry;
    const linePosAttr = lineGeo.getAttribute("position") as THREE.BufferAttribute;

    const pulseGeo = pulsesRef.current.geometry;
    const pulsePosAttr = pulseGeo.getAttribute("position") as THREE.BufferAttribute;

    const scX = visual.truePositionRender[0];
    const scY = visual.truePositionRender[1];
    const scZ = visual.truePositionRender[2];

    const simTime_s = visual.simulationTime_s;

    for (let i = 0; i < totalLines; i++) {
      const isPulsarActive = (visual.activePulsarMask & (1 << i)) !== 0;
      const pPos = pulsarPositions[i];

      if (isPulsarActive) {
        // Line segment: Pulsar to Spacecraft
        linePosAttr.setXYZ(i * 2 + 0, pPos[0], pPos[1], pPos[2]);
        linePosAttr.setXYZ(i * 2 + 1, scX, scY, scZ);

        // Normalized base phase from simulation timing model
        const basePhase = evaluatePulsarPhaseNormalized(INITIAL_PULSAR_CATALOG[i].timing, simTime_s);

        // Generate N traveling pulses along the sightline from pulsar -> spacecraft
        for (let p = 0; p < particlesPerBeam; p++) {
          const pulseIdx = i * particlesPerBeam + p;
          // Space out pulses evenly along [0, 1) line
          const offset = p / particlesPerBeam;
          const progress = (basePhase + offset) % 1.0;

          // PULSAR (0) -> SPACECRAFT (1)
          const px = pPos[0] + (scX - pPos[0]) * progress;
          const py = pPos[1] + (scY - pPos[1]) * progress;
          const pz = pPos[2] + (scZ - pPos[2]) * progress;

          pulsePosAttr.setXYZ(pulseIdx, px, py, pz);
        }
      } else {
        // Collapse line to zero length if dropped
        linePosAttr.setXYZ(i * 2 + 0, 0, 0, 0);
        linePosAttr.setXYZ(i * 2 + 1, 0, 0, 0);

        for (let p = 0; p < particlesPerBeam; p++) {
          const pulseIdx = i * particlesPerBeam + p;
          pulsePosAttr.setXYZ(pulseIdx, 0, -9999, 0); // Hide offscreen
        }
      }
    }

    linePosAttr.needsUpdate = true;
    pulsePosAttr.needsUpdate = true;

    // Modulate opacity via theme
    const lineMat = linesRef.current.material as THREE.LineBasicMaterial;
    if (lineMat) {
      lineMat.opacity = theme.signalIntensity;
    }
  });

  if (!showSightlines) return <></>;

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
          opacity={0.35}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* Traveling Photon Pulse Packets */}
      <points ref={pulsesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(totalPulses * 3), 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#ffffff"
          size={3.2}
          sizeAttenuation={false}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
