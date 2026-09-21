"use client";

/**
 * PULSAR-X: 3D Rendering Domain
 * SceneRoot: Primary Scene Graph Orchestrator.
 *
 * Assembles the full real-time 3D universe:
 * - CelestialUniverse (Starfield, DeepSpaceBackground)
 * - SolarSystem (SunNode, EarthNode)
 * - NavigationBeacons (PulsarSystem)
 * - SpacecraftSystem (SpacecraftNode, UncertaintyEllipsoid)
 * - TrajectorySystem
 * - SignalSystem (PulsarSightlines)
 * - ReferenceSystem (Grid & AU markers)
 * - CameraRig
 * - EffectsSystem
 * - DiagnosticsCollector (Samples live draw calls & triangle counts at 1 Hz for DeveloperOverlay)
 */

import React, { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Starfield } from "../environment/Starfield";
import { DeepSpaceBackground } from "../environment/DeepSpaceBackground";
import { SunNode } from "../celestial/SunNode";
import { EarthNode } from "../celestial/EarthNode";
import { PulsarSystem } from "../pulsars/PulsarSystem";
import { SpacecraftNode } from "../spacecraft/SpacecraftNode";
import { UncertaintyEllipsoid } from "../uncertainty/UncertaintyEllipsoid";
import { TrajectorySystem } from "../trajectories/TrajectorySystem";
import { PulsarSightlines } from "../signals/PulsarSightlines";
import { DetectorFeedback } from "../signals/DetectorFeedback";
import { ReferenceSystem } from "./ReferenceSystem";
import { CameraRig } from "../cameras/CameraRig";
import { EffectsSystem } from "../postprocessing/EffectsSystem";
import { useVisualStore } from "../../store/visual-store";

function DiagnosticsCollector(): React.JSX.Element {
  const show = useVisualStore((s) => s.showDeveloperOverlay);
  const setRenderStats = useVisualStore((s) => s.setRenderStats);
  const { gl } = useThree();

  const lastTimeRef = useRef(0);
  const framesRef = useRef(0);
  const totalCallsRef = useRef(0);
  const totalTrisRef = useRef(0);

  useFrame(() => {
    // Read the total calls and triangles accumulated from the preceding frame
    totalCallsRef.current = gl.info.render.calls;
    totalTrisRef.current = gl.info.render.triangles;
    gl.info.reset();

    if (!show) return;

    framesRef.current++;
    const now = performance.now();
    if (now - lastTimeRef.current >= 1000) {
      const fps = Math.round((framesRef.current * 1000) / (now - lastTimeRef.current));
      framesRef.current = 0;
      lastTimeRef.current = now;

      setRenderStats({
        fps,
        drawCalls: totalCallsRef.current,
        triangles: totalTrisRef.current,
      });
    }
  });

  return <></>;
}

export function SceneRoot(): React.JSX.Element {
  return (
    <group name="SceneRoot">
      {/* 1. Deep Space Environment */}
      <DeepSpaceBackground />
      <Starfield />

      {/* 2. Solar System Primary Bodies */}
      <SunNode />
      <EarthNode position={[92, 0, -18]} />

      {/* 3. Astronomical Navigation Beacons */}
      <PulsarSystem />

      {/* 4. Active Sightlines and Photon Packets */}
      <PulsarSightlines />
      <DetectorFeedback />

      {/* 5. Trajectory Paths */}
      <TrajectorySystem />

      {/* 6. True Spacecraft Probe & Uncertainty Ellipsoid */}
      <SpacecraftNode />
      <UncertaintyEllipsoid />

      {/* 7. Optional Barycentric Reference Grid */}
      <ReferenceSystem />

      {/* 8. Active Camera Rig */}
      <CameraRig />

      {/* 9. Post-Processing Pipeline */}
      <EffectsSystem />

      {/* 10. Diagnostics Collector */}
      <DiagnosticsCollector />
    </group>
  );
}
