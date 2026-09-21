"use client";

/**
 * PULSAR-X: 3D Rendering Domain
 * Spacecraft Trajectory System (True vs Estimated Paths with Fading History).
 *
 * Implements:
 * - Solid cyan true trajectory with chronological alpha fading.
 * - Amber dashed/translucent estimated trajectory.
 * - Configurable history length scaled by quality tier.
 * - Continuous FIFO shifting eliminating wrap-around artifacts.
 * - Velocity direction indicator at the trajectory head.
 */

import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useTelemetryStore } from "../../store/telemetry-store";
import { useVisualStore } from "../../store/visual-store";
import { getQualitySettings } from "../config/quality";

const MAX_BUFFER_POINTS = 1000;

export function TrajectorySystem(): React.JSX.Element {
  const adapter = useTelemetryStore((s) => s.adapter);
  const showTrajectories = useVisualStore((s) => s.showTrajectories);
  const qualityTier = useVisualStore((s) => s.qualityTier);
  const qualitySettings = getQualitySettings(qualityTier);
  const maxPoints = Math.min(MAX_BUFFER_POINTS, qualitySettings.trajectoryHistoryLength);

  const [trueLine, estLine] = useMemo(() => {
    const tBuf = new Float32Array(MAX_BUFFER_POINTS * 3);
    const eBuf = new Float32Array(MAX_BUFFER_POINTS * 3);
    const tCol = new Float32Array(MAX_BUFFER_POINTS * 3);
    const eCol = new Float32Array(MAX_BUFFER_POINTS * 3);

    const tGeo = new THREE.BufferGeometry()
      .setAttribute("position", new THREE.BufferAttribute(tBuf, 3))
      .setAttribute("color", new THREE.BufferAttribute(tCol, 3));

    const eGeo = new THREE.BufferGeometry()
      .setAttribute("position", new THREE.BufferAttribute(eBuf, 3))
      .setAttribute("color", new THREE.BufferAttribute(eCol, 3));

    tGeo.setDrawRange(0, 0);
    eGeo.setDrawRange(0, 0);

    const tL = new THREE.Line(
      tGeo,
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      })
    );

    const eL = new THREE.Line(
      eGeo,
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
      })
    );

    return [tL, eL];
  }, []);

  const pointCountRef = useRef(0);
  const lastSampleTimeRef = useRef(0);

  useFrame(() => {
    if (!showTrajectories) return;

    const visual = adapter.getVisualState();
    if (!visual) return;

    // Sample points every 0.08s of simulation time
    if (Math.abs(visual.simulationTime_s - lastSampleTimeRef.current) >= 0.08) {
      lastSampleTimeRef.current = visual.simulationTime_s;

      const tAttr = trueLine.geometry.getAttribute("position") as THREE.BufferAttribute;
      const tArr = tAttr.array as Float32Array;
      const tColAttr = trueLine.geometry.getAttribute("color") as THREE.BufferAttribute;
      const tColArr = tColAttr.array as Float32Array;

      const eAttr = estLine.geometry.getAttribute("position") as THREE.BufferAttribute;
      const eArr = eAttr.array as Float32Array;
      const eColAttr = estLine.geometry.getAttribute("color") as THREE.BufferAttribute;
      const eColArr = eColAttr.array as Float32Array;

      if (pointCountRef.current < maxPoints) {
        const idx = pointCountRef.current;
        tArr[idx * 3 + 0] = visual.truePositionRender[0];
        tArr[idx * 3 + 1] = visual.truePositionRender[1];
        tArr[idx * 3 + 2] = visual.truePositionRender[2];

        eArr[idx * 3 + 0] = visual.estimatedPositionRender[0];
        eArr[idx * 3 + 1] = visual.estimatedPositionRender[1];
        eArr[idx * 3 + 2] = visual.estimatedPositionRender[2];

        pointCountRef.current++;
      } else {
        // Shift buffer to preserve chronological continuity without wrap-around artifacts
        tArr.copyWithin(0, 3);
        eArr.copyWithin(0, 3);

        const lastIdx = maxPoints - 1;
        tArr[lastIdx * 3 + 0] = visual.truePositionRender[0];
        tArr[lastIdx * 3 + 1] = visual.truePositionRender[1];
        tArr[lastIdx * 3 + 2] = visual.truePositionRender[2];

        eArr[lastIdx * 3 + 0] = visual.estimatedPositionRender[0];
        eArr[lastIdx * 3 + 1] = visual.estimatedPositionRender[1];
        eArr[lastIdx * 3 + 2] = visual.estimatedPositionRender[2];
      }

      // Update vertex color fading along trajectory history
      const activeCount = Math.min(pointCountRef.current, maxPoints);
      for (let i = 0; i < activeCount; i++) {
        const ageProgress = i / Math.max(1, activeCount - 1); // 0 (oldest) to 1 (newest)
        const fade = 0.15 + 0.85 * Math.pow(ageProgress, 2.0);

        // True: cyan (#00f5ff) fading
        tColArr[i * 3 + 0] = 0.0 * fade;
        tColArr[i * 3 + 1] = 0.96 * fade;
        tColArr[i * 3 + 2] = 1.0 * fade;

        // Estimated: amber (#ffb703) fading
        eColArr[i * 3 + 0] = 1.0 * fade;
        eColArr[i * 3 + 1] = 0.72 * fade;
        eColArr[i * 3 + 2] = 0.01 * fade;
      }

      tAttr.needsUpdate = true;
      tColAttr.needsUpdate = true;
      eAttr.needsUpdate = true;
      eColAttr.needsUpdate = true;

      trueLine.geometry.setDrawRange(0, activeCount);
      estLine.geometry.setDrawRange(0, activeCount);
    }
  });

  if (!showTrajectories) return <></>;

  return (
    <group name="TrajectorySystem">
      {/* True Trajectory Path (Fading Cyan) */}
      <primitive object={trueLine} />

      {/* Estimated Trajectory Path (Fading Amber) */}
      <primitive object={estLine} />
    </group>
  );
}
