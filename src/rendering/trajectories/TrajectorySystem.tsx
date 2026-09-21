"use client";

/**
 * PULSAR-X: 3D Rendering Domain
 * Real Spacecraft Trajectory Trails (True vs Estimated Paths).
 *
 * Samples actual physical telemetry from the worker into bounded ring-buffer line geometries.
 * Uses FIFO buffer shifting when full to ensure continuous, seamless chronological rendering
 * with zero wrap-around loop artifacts.
 */

import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useTelemetryStore } from "../../store/telemetry-store";
import { useVisualStore } from "../../store/visual-store";

const MAX_TRAJECTORY_POINTS = 500;

export function TrajectorySystem(): React.JSX.Element {
  const adapter = useTelemetryStore((s) => s.adapter);
  const showTrajectories = useVisualStore((s) => s.showTrajectories);

  const [trueLine, estLine] = useMemo(() => {
    const tBuf = new Float32Array(MAX_TRAJECTORY_POINTS * 3);
    const eBuf = new Float32Array(MAX_TRAJECTORY_POINTS * 3);

    const tGeo = new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(tBuf, 3));
    const eGeo = new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(eBuf, 3));
    tGeo.setDrawRange(0, 0);
    eGeo.setDrawRange(0, 0);

    const tL = new THREE.Line(tGeo, new THREE.LineBasicMaterial({ color: "#00f5ff", transparent: true, opacity: 0.65 }));
    const eL = new THREE.Line(eGeo, new THREE.LineBasicMaterial({ color: "#ffb703", transparent: true, opacity: 0.4 }));
    return [tL, eL];
  }, []);

  const pointCountRef = useRef(0);
  const lastSampleTimeRef = useRef(0);

  useFrame(() => {
    if (!showTrajectories) return;

    const visual = adapter.getVisualState();
    if (!visual) return;

    // Sample points every 0.1s of simulation time to avoid over-sampling
    if (Math.abs(visual.simulationTime_s - lastSampleTimeRef.current) >= 0.1) {
      lastSampleTimeRef.current = visual.simulationTime_s;

      const tAttr = trueLine.geometry.getAttribute("position") as THREE.BufferAttribute;
      const tArr = tAttr.array as Float32Array;
      const eAttr = estLine.geometry.getAttribute("position") as THREE.BufferAttribute;
      const eArr = eAttr.array as Float32Array;

      if (pointCountRef.current < MAX_TRAJECTORY_POINTS) {
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
        const lastIdx = MAX_TRAJECTORY_POINTS - 1;
        tArr[lastIdx * 3 + 0] = visual.truePositionRender[0];
        tArr[lastIdx * 3 + 1] = visual.truePositionRender[1];
        tArr[lastIdx * 3 + 2] = visual.truePositionRender[2];
        eArr[lastIdx * 3 + 0] = visual.estimatedPositionRender[0];
        eArr[lastIdx * 3 + 1] = visual.estimatedPositionRender[1];
        eArr[lastIdx * 3 + 2] = visual.estimatedPositionRender[2];
      }

      tAttr.needsUpdate = true;
      eAttr.needsUpdate = true;

      const activeCount = Math.min(pointCountRef.current, MAX_TRAJECTORY_POINTS);
      trueLine.geometry.setDrawRange(0, activeCount);
      estLine.geometry.setDrawRange(0, activeCount);
    }
  });

  if (!showTrajectories) return <></>;

  return (
    <group name="TrajectorySystem">
      {/* True Trajectory Path (Solid Cyan) */}
      <primitive object={trueLine} />

      {/* Estimated Trajectory Path (Amber Translucent) */}
      <primitive object={estLine} />
    </group>
  );
}
