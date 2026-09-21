"use client";

/**
 * PULSAR-X: Component Domain
 * Aerospace-Style Viewport Controls & Simulation Interaction HUD.
 */

import React, { useState } from "react";
import { useVisualStore, CameraMode, UncertaintyMode, ErrorMagnification } from "../../store/visual-store";
import { useSimulationStore } from "../../store/simulation-store";
import { useTelemetryStore } from "../../store/telemetry-store";
import type { RenderQualityTier } from "../../rendering/config/quality";

export function ViewportControls(): React.JSX.Element {
  const cameraMode = useVisualStore((s) => s.cameraMode);
  const setCameraMode = useVisualStore((s) => s.setCameraMode);

  const qualityTier = useVisualStore((s) => s.qualityTier);
  const setQualityTier = useVisualStore((s) => s.setQualityTier);

  const uncertaintyMode = useVisualStore((s) => s.uncertaintyMode);
  const setUncertaintyMode = useVisualStore((s) => s.setUncertaintyMode);

  const errorMag = useVisualStore((s) => s.errorMagnification);
  const setErrorMag = useVisualStore((s) => s.setErrorMagnification);

  const showGrid = useVisualStore((s) => s.showReferenceGrid);
  const toggleGrid = useVisualStore((s) => s.toggleReferenceGrid);

  const showOverlay = useVisualStore((s) => s.showDeveloperOverlay);
  const toggleOverlay = useVisualStore((s) => s.toggleDeveloperOverlay);

  const lifecycleState = useSimulationStore((s) => s.lifecycleState);
  const playbackMultiplier = useSimulationStore((s) => s.playbackMultiplier);
  const start = useSimulationStore((s) => s.start);
  const pause = useSimulationStore((s) => s.pause);
  const resume = useSimulationStore((s) => s.resume);
  const step = useSimulationStore((s) => s.step);
  const setPlayback = useSimulationStore((s) => s.setPlayback);
  const reset = useSimulationStore((s) => s.reset);
  const injectFault = useSimulationStore((s) => s.injectFault);

  const latestFrame = useTelemetryStore((s) => s.latestFrame);
  const navStatus = latestFrame?.navigationStatus ?? "DISCONNECTED";

  const [showFaultsMenu, setShowFaultsMenu] = useState(false);

  const isRunning = lifecycleState === "RUNNING";

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex flex-col justify-between p-4 select-none">
      {/* Top Header Bar */}
      <header className="pointer-events-auto flex items-center justify-between rounded border border-zinc-800/80 bg-zinc-950/80 px-4 py-2.5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f5ff]" />
          <h1 className="font-mono text-sm font-bold tracking-widest text-zinc-100">
            PULSAR-X <span className="text-zinc-500 font-normal">| DEEP SPACE XNAV 3D</span>
          </h1>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="text-zinc-400">NAVIGATION:</span>
          <span
            className={`rounded px-2 py-0.5 font-bold tracking-wider ${
              navStatus === "LOCKED"
                ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/60"
                : navStatus === "DEGRADED"
                ? "bg-amber-950/80 text-amber-400 border border-amber-800/60"
                : "bg-cyan-950/80 text-cyan-400 border border-cyan-800/60"
            }`}
          >
            {navStatus}
          </span>
          <button
            onClick={toggleOverlay}
            className={`rounded border px-2.5 py-1 text-[11px] transition-colors ${
              showOverlay
                ? "border-cyan-500 bg-cyan-950/60 text-cyan-300"
                : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            DIAGNOSTICS
          </button>
        </div>
      </header>

      {/* Right Controls Panel: Camera, Quality, Uncertainty, Scale */}
      <aside className="pointer-events-auto absolute top-16 right-4 flex w-60 flex-col gap-3 font-mono text-xs">
        {/* Camera Modes */}
        <div className="rounded border border-zinc-800/80 bg-zinc-950/80 p-3 shadow-xl backdrop-blur-md">
          <span className="text-[10px] font-bold tracking-wider text-zinc-400">CAMERA RIG</span>
          <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px]">
            {(
              [
                ["FREE", "FREE ORBIT"],
                ["SPACECRAFT_FOLLOW", "SPACECRAFT"],
                ["SYSTEM_OVERVIEW", "SOLAR SYSTEM"],
                ["GEOMETRY_OVERVIEW", "GEOMETRY 4D"],
              ] as [CameraMode, string][]
            ).map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => setCameraMode(mode)}
                className={`rounded border py-1 px-1.5 text-center transition-colors ${
                  cameraMode === mode
                    ? "border-cyan-500 bg-cyan-950/80 text-cyan-300 font-bold"
                    : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Uncertainty Mode */}
        <div className="rounded border border-zinc-800/80 bg-zinc-950/80 p-3 shadow-xl backdrop-blur-md">
          <span className="text-[10px] font-bold tracking-wider text-zinc-400">COVARIANCE ELLIPSOID</span>
          <div className="mt-2 grid grid-cols-4 gap-1 text-[10px]">
            {(["NONE", "1SIGMA", "2SIGMA", "3SIGMA"] as UncertaintyMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setUncertaintyMode(m)}
                className={`rounded border py-1 text-center transition-colors ${
                  uncertaintyMode === m
                    ? "border-cyan-500 bg-cyan-950/80 text-cyan-300 font-bold"
                    : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                {m === "NONE" ? "OFF" : m.replace("SIGMA", "σ")}
              </button>
            ))}
          </div>
        </div>

        {/* Error Vector Magnification */}
        <div className="rounded border border-zinc-800/80 bg-zinc-950/80 p-3 shadow-xl backdrop-blur-md">
          <div className="flex justify-between items-center text-[10px]">
            <span className="font-bold tracking-wider text-zinc-400">ERROR MAGNIFIER</span>
            <span className="text-amber-400 font-bold">{errorMag}×</span>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1 text-[10px]">
            {([1, 10, 100, 1000] as ErrorMagnification[]).map((mag) => (
              <button
                key={mag}
                onClick={() => setErrorMag(mag)}
                className={`rounded border py-1 text-center transition-colors ${
                  errorMag === mag
                    ? "border-amber-500 bg-amber-950/80 text-amber-300 font-bold"
                    : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                {mag}×
              </button>
            ))}
          </div>
        </div>

        {/* Quality Tier & Reference Grid */}
        <div className="rounded border border-zinc-800/80 bg-zinc-950/80 p-3 shadow-xl backdrop-blur-md">
          <span className="text-[10px] font-bold tracking-wider text-zinc-400">RENDER QUALITY</span>
          <div className="mt-2 grid grid-cols-4 gap-1 text-[10px]">
            {(["LOW", "MEDIUM", "HIGH", "CINEMATIC"] as RenderQualityTier[]).map((t) => (
              <button
                key={t}
                onClick={() => setQualityTier(t)}
                className={`rounded border py-1 text-center transition-colors ${
                  qualityTier === t
                    ? "border-cyan-500 bg-cyan-950/80 text-cyan-300 font-bold"
                    : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                {t === "MEDIUM" ? "MED" : t === "CINEMATIC" ? "CINE" : t}
              </button>
            ))}
          </div>

          <div className="mt-2.5 border-t border-zinc-800/60 pt-2 flex items-center justify-between text-[10px]">
            <span className="text-zinc-400">REFERENCE GRID:</span>
            <button
              onClick={toggleGrid}
              className={`rounded border px-2 py-0.5 ${
                showGrid ? "border-cyan-500 text-cyan-300 bg-cyan-950/50" : "border-zinc-800 text-zinc-500"
              }`}
            >
              {showGrid ? "ON" : "OFF"}
            </button>
          </div>
        </div>
      </aside>

      {/* Bottom Controls Bar: Simulation Execution & Fault Injection */}
      <footer className="pointer-events-auto flex items-center justify-between rounded border border-zinc-800/80 bg-zinc-950/80 px-4 py-2.5 shadow-2xl backdrop-blur-md font-mono text-xs">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          {isRunning ? (
            <button
              onClick={pause}
              className="rounded border border-amber-600 bg-amber-950/60 px-3 py-1 text-amber-300 hover:bg-amber-900/60"
            >
              PAUSE
            </button>
          ) : (
            <button
              onClick={() => (lifecycleState === "PAUSED" ? resume() : start())}
              className="rounded border border-emerald-600 bg-emerald-950/60 px-3 py-1 text-emerald-300 hover:bg-emerald-900/60"
            >
              PLAY
            </button>
          )}

          <button
            onClick={() => step(1)}
            className="rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-zinc-300 hover:bg-zinc-800"
          >
            STEP (1)
          </button>
          <button
            onClick={() => step(10)}
            className="rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-zinc-300 hover:bg-zinc-800"
          >
            STEP (10)
          </button>
          <button
            onClick={reset}
            className="rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-zinc-400 hover:text-zinc-200"
          >
            RESET
          </button>

          {/* Time Multipliers */}
          <div className="ml-3 flex items-center gap-1 border-l border-zinc-800 pl-3 text-[10px]">
            <span className="text-zinc-500 mr-1">TIME:</span>
            {[0.5, 1.0, 5.0, 10.0, 50.0].map((rate) => (
              <button
                key={rate}
                onClick={() => setPlayback(rate)}
                className={`rounded border px-1.5 py-0.5 ${
                  playbackMultiplier === rate
                    ? "border-cyan-500 bg-cyan-950 text-cyan-300 font-bold"
                    : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                {rate}×
              </button>
            ))}
          </div>
        </div>

        {/* Fault Injection Hub */}
        <div className="relative flex items-center gap-2">
          <button
            onClick={() => setShowFaultsMenu(!showFaultsMenu)}
            className={`rounded border px-3 py-1 transition-colors ${
              showFaultsMenu
                ? "border-rose-500 bg-rose-950/80 text-rose-300"
                : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            FAULT INJECTION HUB
          </button>

          {showFaultsMenu && (
            <div className="absolute bottom-10 right-0 w-64 rounded border border-rose-800/80 bg-black/95 p-3 shadow-2xl backdrop-blur-md text-[11px] flex flex-col gap-1.5">
              <span className="font-bold text-rose-400 border-b border-rose-900/50 pb-1">
                INJECT SCIENTIFIC FAULT
              </span>
              <button
                onClick={() => {
                  injectFault({ type: "PULSAR_DROPOUT", pulsarId: "PSR_B1937+21" });
                  setShowFaultsMenu(false);
                }}
                className="rounded border border-zinc-800 bg-zinc-900/80 p-1.5 text-left text-zinc-300 hover:bg-rose-950/50 hover:text-rose-300"
              >
                DROPOUT: PSR B1937+21
              </button>
              <button
                onClick={() => {
                  injectFault({ type: "TIMING_NOISE_SPIKE", multiplier: 8.0 });
                  setShowFaultsMenu(false);
                }}
                className="rounded border border-zinc-800 bg-zinc-900/80 p-1.5 text-left text-zinc-300 hover:bg-rose-950/50 hover:text-rose-300"
              >
                TIMING NOISE SPIKE (8×)
              </button>
              <button
                onClick={() => {
                  injectFault({ type: "CLOCK_DRIFT", addedDrift_rate: 1e-6 });
                  setShowFaultsMenu(false);
                }}
                className="rounded border border-zinc-800 bg-zinc-900/80 p-1.5 text-left text-zinc-300 hover:bg-rose-950/50 hover:text-rose-300"
              >
                CLOCK DRIFT ANOMALY
              </button>
              <button
                onClick={() => {
                  injectFault({ type: "CLEAR_FAULT" });
                  setShowFaultsMenu(false);
                }}
                className="mt-1 rounded border border-emerald-800 bg-emerald-950/80 p-1.5 text-center font-bold text-emerald-300 hover:bg-emerald-900"
              >
                CLEAR ALL FAULTS
              </button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
