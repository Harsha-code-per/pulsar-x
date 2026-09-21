"use client";

/**
 * PULSAR-X: Deep Space Navigation Without GPS
 * Real-Time 3D Scientific Visualization Orchestrator.
 */

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { useSimulationStore } from "../src/store/simulation-store";
import { useVisualStore } from "../src/store/visual-store";
import { ViewportControls } from "../src/components/hud/ViewportControls";
import { DeveloperOverlay } from "../src/components/hud/DeveloperOverlay";
import { CinematicHUD } from "../src/components/cinematic/CinematicHUD";
import { DirectorControls } from "../src/components/cinematic/DirectorControls";
import { PresentationOverlay } from "../src/components/cinematic/PresentationOverlay";
import { useCinematicStore } from "../src/store/cinematic-store";

// Dynamically import Three.js Canvas to avoid any SSR canvas/context initialization issues
const PulsarCanvas = dynamic(
  () => import("../src/components/viewport/PulsarCanvas").then((mod) => mod.PulsarCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-black font-mono text-xs text-cyan-400">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 animate-ping rounded-full bg-cyan-400" />
          <span className="tracking-widest">INITIALIZING ASTRONOMICAL 3D WORLD...</span>
        </div>
      </div>
    ),
  }
);

export default function Home(): React.JSX.Element {
  const setupClient = useSimulationStore((s) => s.setupClient);
  const isInitialized = useSimulationStore((s) => s.isInitialized);
  const start = useSimulationStore((s) => s.start);
  const setPrefersReducedMotion = useVisualStore((s) => s.setPrefersReducedMotion);
  const isDirectorActive = useCinematicStore((s) => s.isDirectorActive);

  useEffect(() => {
    // Accessibility: Detect prefers-reduced-motion media query
    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, [setPrefersReducedMotion]);

  useEffect(() => {
    // Automatically initialize worker client on mount and start baseline simulation
    if (!isInitialized) {
      setupClient().then(() => {
        start();
      });
    }
  }, [isInitialized, setupClient, start]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black font-sans">
      {/* Real-time 3D Viewport */}
      <PulsarCanvas />

      {/* Cinematic HUD Layer (when Director is active) */}
      <CinematicHUD />

      {/* Interactive Controls & Navigation Status (hidden during cinematic playback) */}
      {!isDirectorActive && <ViewportControls />}

      {/* Developer Diagnostics Overlay */}
      <DeveloperOverlay />

      {/* Developer Cinematic Director Console */}
      <DirectorControls />

      {/* Presentation Entry Splash & Guide */}
      <PresentationOverlay />
    </main>
  );
}
