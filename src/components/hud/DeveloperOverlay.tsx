"use client";

/**
 * PULSAR-X: Component Domain
 * Developer Diagnostics & Telemetry HUD Overlay.
 *
 * Strictly displays the prompt-specified developer metrics:
 * - FPS (live render frame rate)
 * - Draw Calls (live WebGL draw calls)
 * - Triangles (live rendered triangle primitives)
 * - Active Pulsars (tracking bitmask)
 * - Particle Count (procedural starfield star count)
 * - Simulation Time (authoritative coordinate time t_sim)
 * - Telemetry Rate (incoming worker packet cadence in Hz)
 * - Position Error (physical error in km)
 * - GDOP (4D geometric dilution of precision)
 * - Navigation State (filter operational status)
 */

import React from "react";
import { useTelemetryStore } from "../../store/telemetry-store";
import { useVisualStore } from "../../store/visual-store";
import { useSimulationStore } from "../../store/simulation-store";
import { getQualitySettings } from "../../rendering/config/quality";

export function DeveloperOverlay(): React.JSX.Element {
  const show = useVisualStore((s) => s.showDeveloperOverlay);
  const visualThemeMode = useVisualStore((s) => s.visualThemeMode);
  const postprocessingPreset = useVisualStore((s) => s.postprocessingPreset);
  const qualityTier = useVisualStore((s) => s.qualityTier);
  const errorMag = useVisualStore((s) => s.errorMagnification);
  const cameraMode = useVisualStore((s) => s.cameraMode);
  const renderStats = useVisualStore((s) => s.renderStats);

  const latestFrame = useTelemetryStore((s) => s.latestFrame);
  const telemetryRateHz = useTelemetryStore((s) => s.telemetryRateHz);
  const lifecycleState = useSimulationStore((s) => s.lifecycleState);

  if (!show) return <></>;

  const settings = getQualitySettings(qualityTier);
  const posErrKm = latestFrame ? (latestFrame.positionError_m / 1000).toFixed(2) : "--";
  const simTime = latestFrame ? latestFrame.simulationTime_s.toFixed(2) : "0.00";
  const gdop = latestFrame ? (Number.isFinite(latestFrame.gdop) ? latestFrame.gdop.toFixed(2) : "SINGULAR") : "--";
  const pdop = latestFrame ? (Number.isFinite(latestFrame.pdop) ? latestFrame.pdop.toFixed(2) : "SINGULAR") : "--";
  const status = latestFrame ? latestFrame.navigationStatus : "DISCONNECTED";
  const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2).toFixed(1) : "1.0";

  return (
    <div className="pointer-events-none absolute top-4 left-4 z-50 flex flex-col gap-2 font-mono text-[11px] text-zinc-300 select-none">
      <div className="rounded border border-cyan-500/30 bg-black/85 p-3.5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1.5 text-cyan-400 font-semibold tracking-wider">
          <span>PULSAR-X CORE DIAGNOSTICS</span>
          <span className="rounded bg-cyan-950/80 px-1.5 py-0.5 text-[9px] text-cyan-300">
            {lifecycleState}
          </span>
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-x-5 gap-y-1">
          {/* 1. FPS */}
          <span className="text-zinc-500">FPS:</span>
          <span className="text-emerald-400 font-bold text-right">{renderStats.fps} FPS</span>

          {/* 2. Draw Calls */}
          <span className="text-zinc-500">DRAW CALLS:</span>
          <span className="text-right text-cyan-300 font-semibold">{renderStats.drawCalls}</span>

          {/* 3. Triangles */}
          <span className="text-zinc-500">TRIANGLES:</span>
          <span className="text-right text-zinc-200">{renderStats.triangles.toLocaleString()}</span>

          {/* 4. Active Pulsars */}
          <span className="text-zinc-500">ACTIVE PULSARS:</span>
          <span className="text-right font-semibold text-cyan-300">
            {latestFrame ? `${latestFrame.activePulsarMask.toString(2).padStart(5, "0")} (mask)` : "-----"}
          </span>

          {/* 5. Particle Count */}
          <span className="text-zinc-500">PARTICLE COUNT:</span>
          <span className="text-right text-zinc-200">{settings.starCount.toLocaleString()} stars</span>

          {/* 6. Simulation Time */}
          <span className="text-zinc-500">SIMULATION TIME:</span>
          <span className="text-right text-zinc-200">{simTime} s</span>

          {/* 7. Telemetry Rate */}
          <span className="text-zinc-500">TELEMETRY RATE:</span>
          <span className="text-right text-zinc-200">{telemetryRateHz} Hz</span>

          {/* 8. Position Error */}
          <span className="text-zinc-500">POSITION ERROR:</span>
          <span className="text-right text-amber-300 font-semibold">{posErrKm} km</span>

          {/* 9. GDOP */}
          <span className="text-zinc-500">4D GDOP (PDOP):</span>
          <span className="text-right text-zinc-200">{gdop} ({pdop})</span>

          {/* 10. Navigation State */}
          <span className="text-zinc-500">NAV STATE:</span>
          <span className="text-right font-bold text-cyan-400">{status}</span>

          {/* 11. Navigation Solver */}
          <span className="text-zinc-500">NAV SOLVER:</span>
          <span className="text-right text-zinc-300">BATCH WLS + RK4 DR</span>

          {/* 12. Visual State & Postprocessing */}
          <span className="text-zinc-500">VISUAL THEME:</span>
          <span className="text-right text-cyan-300">{visualThemeMode}</span>

          <span className="text-zinc-500">POSTPROCESSING:</span>
          <span className="text-right text-zinc-300">{postprocessingPreset}</span>

          <span className="text-zinc-500">SHADERS / DPR:</span>
          <span className="text-right text-zinc-300">{settings.shaderComplexity} / {dpr}×</span>

          {/* Additional auxiliary operational metrics */}
          <span className="text-zinc-500">PHOTON COUNT:</span>
          <span className="text-right text-zinc-200">{latestFrame?.photonCount.toLocaleString() ?? 0}</span>

          <span className="text-zinc-500">ERROR MAGNIFIER:</span>
          <span className="text-right text-amber-400">{errorMag}× (Visual Scale)</span>

          <span className="text-zinc-500">CAMERA MODE:</span>
          <span className="text-right text-zinc-200">{cameraMode}</span>

          <span className="text-zinc-500">QUALITY TIER:</span>
          <span className="text-right text-zinc-200">{qualityTier}</span>
        </div>
      </div>
    </div>
  );
}
