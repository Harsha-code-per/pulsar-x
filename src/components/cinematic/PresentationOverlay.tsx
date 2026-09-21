"use client";

/**
 * PULSAR-X: Component Domain
 * Presentation Overlay: Initial Mission Launch Splash and Keyboard Navigation Guide.
 */

import React, { useState, useEffect } from "react";
import { defaultCinematicDirector } from "../../cinematic/director/CinematicDirector";
import { useCinematicStore } from "../../store/cinematic-store";

export function PresentationOverlay(): React.JSX.Element {
  const [isVisible, setIsVisible] = useState(true);
  const isDirectorActive = useCinematicStore((s) => s.isDirectorActive);

  // Global hotkeys handler during cinematic presentation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or select
      if (
        document.activeElement &&
        ["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement.tagName)
      ) {
        return;
      }

      switch (e.code) {
        case "Space":
          e.preventDefault();
          if (defaultCinematicDirector.getState() === "PLAYING") {
            defaultCinematicDirector.pause();
          } else {
            defaultCinematicDirector.resume();
          }
          break;

        case "KeyR":
          e.preventDefault();
          defaultCinematicDirector.restart();
          break;

        case "Escape":
          e.preventDefault();
          defaultCinematicDirector.exit();
          break;

        case "ArrowRight":
          e.preventDefault();
          defaultCinematicDirector.nextScene();
          break;

        case "ArrowLeft":
          e.preventDefault();
          defaultCinematicDirector.previousScene();
          break;

        case "KeyM":
          e.preventDefault();
          useCinematicStore.getState().toggleMute();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isVisible || isDirectorActive) {
    return <></>;
  }

  const startMission = () => {
    setIsVisible(false);
    defaultCinematicDirector.start();
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md font-mono select-none p-6">
      <div className="w-full max-w-xl rounded border border-cyan-500/40 bg-zinc-950 p-6 shadow-[0_0_50px_rgba(0,245,255,0.15)] flex flex-col items-center text-center">
        <div className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_12px_#00f5ff] animate-ping mb-4" />

        <h1 className="text-xl md:text-2xl font-bold tracking-[0.2em] text-zinc-100 uppercase">
          PULSAR-X
        </h1>
        <p className="mt-1 text-xs text-cyan-400 tracking-widest uppercase">
          Deep Space Navigation Without GPS
        </p>

        <p className="mt-4 text-xs text-zinc-400 leading-relaxed max-w-md">
          A real-time 3D scientific documentary experience demonstrating autonomous positioning in deep space using X-ray millisecond pulsars and batch weighted least-squares estimation.
        </p>

        {/* Keyboard Navigation Cheatsheet */}
        <div className="mt-5 w-full rounded border border-zinc-800/80 bg-zinc-900/60 p-3 text-[10px] text-zinc-400 text-left grid grid-cols-2 gap-x-4 gap-y-1">
          <div><strong className="text-cyan-300">SPACE:</strong> Play / Pause</div>
          <div><strong className="text-cyan-300">R:</strong> Restart Mission</div>
          <div><strong className="text-cyan-300">ESC:</strong> Free Orbit Mode</div>
          <div><strong className="text-cyan-300">→ / ←:</strong> Next / Prev Scene</div>
          <div><strong className="text-cyan-300">M:</strong> Mute Audio Hook</div>
          <div><strong className="text-cyan-300">L:</strong> Science Lab Mode</div>
        </div>

        {/* Start Button */}
        <button
          onClick={startMission}
          className="mt-6 rounded border border-cyan-400 bg-cyan-950/80 px-8 py-3 text-xs md:text-sm font-bold tracking-[0.2em] text-cyan-300 shadow-[0_0_20px_rgba(0,245,255,0.3)] hover:bg-cyan-900 hover:text-white transition-all"
        >
          BEGIN MISSION
        </button>

        <button
          onClick={() => setIsVisible(false)}
          className="mt-3 text-[10px] text-zinc-500 hover:text-zinc-300 underline"
        >
          Skip directly to interactive 3D viewport
        </button>
      </div>
    </div>
  );
}
