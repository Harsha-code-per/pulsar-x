"use client";

/**
 * PULSAR-X: 3D Rendering Domain
 * CameraRig: Coordinates Multi-Mode Cameras with Smooth Dual-Vector Lerping (Position & LookAt).
 * Integrates with CameraController abstraction for future Cinematic Director.
 */

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useVisualStore } from "../../store/visual-store";
import { useTelemetryStore } from "../../store/telemetry-store";
import { INITIAL_PULSAR_CATALOG } from "../../simulation/pulsars/catalog";
import { pulsarDirectionToHorizonPosition } from "../coordinates/scaling";
import { defaultCameraController } from "./CameraController";
import { defaultCinematicDirector } from "../../cinematic/director/CinematicDirector";

export function CameraRig(): React.JSX.Element {
  const cameraMode = useVisualStore((s) => s.cameraMode);
  const activePulsarId = useVisualStore((s) => s.activeFocusPulsarId);
  const prefersReducedMotion = useVisualStore((s) => s.prefersReducedMotion);
  const adapter = useTelemetryStore((s) => s.adapter);

  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();

  // Smooth dual-vector state tracking to prevent instantaneous lookAt snapping & matrix singularities
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const desiredTarget = useRef(new THREE.Vector3(0, 0, 0));
  const desiredPos = useRef(new THREE.Vector3(0, 50, 140));

  useEffect(() => {
    if (cameraMode === "FREE") {
      defaultCameraController.enableUserControl();
      if (controlsRef.current) {
        controlsRef.current.target.copy(currentLookAt.current);
        controlsRef.current.update();
      }
    } else {
      defaultCameraController.disableUserControl();
    }
  }, [cameraMode]);

  useFrame((_, delta) => {
    // Advance cinematic director if playing
    defaultCinematicDirector.update(delta);

    // If director is active or an explicit scripted transition is in progress, delegate to controller
    if (defaultCameraController.isDirectorControlled() || defaultCameraController.isTransitioning()) {
      defaultCameraController.update(delta, camera, controlsRef.current);
      return;
    }

    const visual = adapter.getVisualState();
    const scPos = visual ? visual.truePositionRender : [100, 0, 0];

    // Determine target and desired position based on mode
    switch (cameraMode) {
      case "SPACECRAFT_FOLLOW": {
        desiredTarget.current.set(scPos[0], scPos[1], scPos[2]);
        // Angle camera to catch sunlight reflecting off the gold MLI bus and solar arrays
        desiredPos.current.set(scPos[0] - 5.5, scPos[1] + 2.5, scPos[2] + 4.5);
        break;
      }

      case "PULSAR_FOCUS": {
        const pulsar = INITIAL_PULSAR_CATALOG.find((p) => p.id === activePulsarId) ?? INITIAL_PULSAR_CATALOG[0];
        const pPos = pulsarDirectionToHorizonPosition(pulsar.directionVector);
        desiredTarget.current.set(pPos[0], pPos[1], pPos[2]);
        desiredPos.current.set(scPos[0] + 3.0, scPos[1] + 2.0, scPos[2] + 4.0);
        break;
      }

      case "SYSTEM_OVERVIEW": {
        desiredTarget.current.set(0, 0, 0);
        // Off-axis high angle overview of Sun, Earth, and solar system
        desiredPos.current.set(25.0, 120.0, 160.0);
        break;
      }

      case "GEOMETRY_OVERVIEW": {
        desiredTarget.current.set(scPos[0], scPos[1], scPos[2]);
        desiredPos.current.set(scPos[0] + 30.0, scPos[1] + 20.0, scPos[2] + 45.0);
        break;
      }

      case "FREE":
      default:
        // Free mode is driven directly by OrbitControls
        defaultCameraController.setPosition(camera.position.x, camera.position.y, camera.position.z);
        if (controlsRef.current) {
          defaultCameraController.setTarget(
            controlsRef.current.target.x,
            controlsRef.current.target.y,
            controlsRef.current.target.z
          );
        }
        return;
    }

    // Smoothly interpolate camera position and lookAt target simultaneously
    const baseSpeed = prefersReducedMotion ? 1.5 : 3.0;
    const factor = Math.min(1.0, delta * baseSpeed);
    camera.position.lerp(desiredPos.current, factor);
    currentLookAt.current.lerp(desiredTarget.current, factor);
    camera.lookAt(currentLookAt.current);

    defaultCameraController.setPosition(camera.position.x, camera.position.y, camera.position.z);
    defaultCameraController.setTarget(
      currentLookAt.current.x,
      currentLookAt.current.y,
      currentLookAt.current.z
    );

    if (controlsRef.current) {
      controlsRef.current.target.copy(currentLookAt.current);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={cameraMode === "FREE" && defaultCameraController.canUserControl()}
      enableDamping
      dampingFactor={0.05}
      maxDistance={400}
      minDistance={1.5}
    />
  );
}
