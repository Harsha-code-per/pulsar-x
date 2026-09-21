"use client";

/**
 * PULSAR-X: Component Domain
 * Cinematic HUD: Widescreen Presentation, Layered Captions, Alerts, and Classified Telemetry.
 */

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { useCinematicStore } from "../../store/cinematic-store";
import { useTelemetryStore } from "../../store/telemetry-store";
import { defaultCinematicDirector } from "../../cinematic/director/CinematicDirector";
import { CINEMATIC_SCENE_CATALOG } from "../../cinematic/scenes/catalog";
import { useAudioStore } from "../../cinematic/audio/AudioState";
import { defaultCinematicAudioEngine } from "../../cinematic/audio/CinematicAudioEngine";

export function CinematicHUD(): React.JSX.Element {
  const isDirectorActive = useCinematicStore((s) => s.isDirectorActive);
  const isPresentationMode = useCinematicStore((s) => s.isPresentationMode);
  const activeSceneIndex = useCinematicStore((s) => s.activeSceneIndex);
  const activeCaptions = useCinematicStore((s) => s.activeCaptions);
  const activeAlert = useCinematicStore((s) => s.activeAlert);
  const timelineProgress = useCinematicStore((s) => s.timelineProgress);
  const playhead_s = useCinematicStore((s) => s.playhead_s);

  const isAudioMuted = useAudioStore((s) => s.isMuted);
  const isAudioUnlocked = useAudioStore((s) => s.unlocked);

  const latestFrame = useTelemetryStore((s) => s.latestFrame);
  const currentScene = CINEMATIC_SCENE_CATALOG[activeSceneIndex] ?? CINEMATIC_SCENE_CATALOG[0];

  if (!isDirectorActive && !isPresentationMode) {
    return <></>;
  }

  const isFinalScene = currentScene.id === 18;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex flex-col justify-between overflow-hidden font-mono select-none">
      {/* Cinematic 2.39:1 Letterbox Bars (Visual Framing) */}
      <div className="h-7 w-full bg-black/90 border-b border-zinc-900/60 shadow-lg" />
      <div className="h-7 w-full bg-black/90 border-t border-zinc-900/60 shadow-lg" />

      {/* Top Header Bar */}
      <header className="pointer-events-auto absolute top-9 inset-x-8 flex items-center justify-between">
        {/* Left: Mission Identity & Scene Index */}
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f5ff]" />
          <div className="flex flex-col">
            <span className="text-[11px] font-bold tracking-widest text-zinc-100">
              PULSAR-X <span className="text-zinc-500 font-normal">| DEEP SPACE XNAV</span>
            </span>
            <span className="text-[9px] text-cyan-400 font-semibold tracking-wider">
              {currentScene.hud.title} — {currentScene.name.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Center: Timeline Progress Bar */}
        <div className="hidden md:flex flex-col items-center w-64">
          <div className="w-full h-1 bg-zinc-900 rounded overflow-hidden border border-zinc-800">
            <div
              className="h-full bg-cyan-400 transition-all duration-300 shadow-[0_0_6px_#00f5ff]"
              style={{ width: `${(timelineProgress * 100).toFixed(1)}%` }}
            />
          </div>
          <span className="text-[9px] text-zinc-500 mt-0.5">
            T+{playhead_s.toFixed(1)}s ({(timelineProgress * 100).toFixed(0)}%)
          </span>
        </div>

        {/* Right: Operational Badges */}
        <div className="flex items-center gap-2 text-[10px]">
          <button
            onClick={() => defaultCinematicAudioEngine.toggleMute()}
            className={`rounded border px-2 py-0.5 transition-colors ${
              isAudioMuted
                ? "border-amber-500/80 bg-amber-950/80 text-amber-300 font-bold"
                : isAudioUnlocked
                ? "border-cyan-500/50 bg-cyan-950/60 text-cyan-300"
                : "border-zinc-800 bg-zinc-950/80 text-zinc-400"
            }`}
            title="Toggle Audio Mute [M]"
          >
            AUDIO: <strong>{isAudioMuted ? "MUTED [M]" : isAudioUnlocked ? "PROCEDURAL" : "STANDBY"}</strong>
          </button>
          <span className="rounded border border-zinc-800 bg-zinc-950/80 px-2 py-0.5 text-zinc-300">
            SOLVER: <strong className="text-cyan-400 font-bold">BATCH WLS + RK4 DR</strong>
          </span>
          <button
            onClick={() => defaultCinematicDirector.exit()}
            className="rounded border border-zinc-800 bg-zinc-900/80 px-2 py-0.5 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            EXIT CINEMATIC [ESC]
          </button>
        </div>
      </header>

      {/* Central Dramatic Alerts */}
      <div className="absolute inset-x-0 top-1/3 flex justify-center px-4">
        <AnimatePresence>
          {activeAlert && (
            <motion.div
              key={activeAlert}
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.3 }}
              className={`rounded border px-5 py-2.5 shadow-2xl backdrop-blur-md flex items-center gap-3 ${
                activeAlert.includes("CRITICAL") || activeAlert.includes("LOST") || activeAlert.includes("WARNING")
                  ? "border-amber-500/60 bg-black/90 text-amber-300 shadow-[0_0_20px_rgba(255,183,3,0.3)]"
                  : "border-cyan-500/60 bg-black/90 text-cyan-300 shadow-[0_0_20px_rgba(0,245,255,0.3)]"
              }`}
            >
              <div
                className={`h-2.5 w-2.5 rounded-full animate-ping ${
                  activeAlert.includes("CRITICAL") || activeAlert.includes("LOST") || activeAlert.includes("WARNING")
                    ? "bg-amber-400"
                    : "bg-cyan-400"
                }`}
              />
              <span className="text-xs md:text-sm font-bold tracking-widest uppercase">
                {activeAlert}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Final Reveal Climax Card (Scene 18) */}
      <AnimatePresence>
        {isFinalScene && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, delay: 2.0 }}
            className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-50 text-center px-6"
          >
            <h2 className="text-2xl md:text-4xl font-bold tracking-[0.25em] text-zinc-100 uppercase">
              The Stars Can Be The GPS
            </h2>
            <p className="mt-4 text-sm md:text-base text-cyan-300 font-light tracking-widest max-w-xl">
              PULSAR-X — DEEP SPACE NAVIGATION WITHOUT GPS
            </p>
            <p className="mt-2 text-xs text-zinc-400 max-w-md">
              Autonomous celestial positioning using millisecond X-ray pulsars and batch least-squares orbital estimation.
            </p>

            <div className="mt-8 flex gap-4 text-xs font-bold tracking-wider">
              <button
                onClick={() => defaultCinematicDirector.restart()}
                className="rounded border border-cyan-500 bg-cyan-950/80 px-5 py-2.5 text-cyan-300 hover:bg-cyan-900 transition-colors"
              >
                REPLAY MISSION [R]
              </button>
              <button
                onClick={() => defaultCinematicDirector.exit()}
                className="rounded border border-zinc-700 bg-zinc-900/80 px-5 py-2.5 text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                FREE ORBIT EXPLORATION [ESC]
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lower Third: Narrative Captions & Live Classified Telemetry */}
      <footer className="pointer-events-auto absolute bottom-9 inset-x-8 flex flex-col gap-2.5">
        {/* Classified Telemetry Badges Strip */}
        {currentScene.hud.badges && currentScene.hud.badges.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-[10px]">
            {currentScene.hud.badges.map((b, idx) => (
              <div
                key={idx}
                className="rounded border border-zinc-800/80 bg-black/75 px-2.5 py-1 backdrop-blur-md flex items-center gap-1.5 shadow-md"
              >
                <span className="text-zinc-500 font-semibold">{b.label}:</span>
                <span className="text-zinc-200 font-bold">{b.getValue(latestFrame)}</span>
                <span className="text-[8px] text-zinc-500 rounded bg-zinc-900 px-1 py-0.2 border border-zinc-800">
                  [{b.classification}]
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Narrative Captions Box */}
        <div className="rounded border border-zinc-800/90 bg-zinc-950/85 p-3.5 shadow-2xl backdrop-blur-md max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeSceneIndex}-${activeCaptions.join("")}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-1 text-xs md:text-sm text-zinc-200 leading-relaxed font-light"
            >
              {activeCaptions.map((cap, i) => (
                <p key={i} className={i === 0 ? "font-normal text-zinc-100" : "text-zinc-400 text-xs"}>
                  {cap}
                </p>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </footer>
    </div>
  );
}
