"use client";

/**
 * PULSAR-X: Component Domain
 * Developer-Only Cinematic Director Control Panel.
 */

import React, { useState } from "react";
import { useCinematicStore } from "../../store/cinematic-store";
import { defaultCinematicDirector } from "../../cinematic/director/CinematicDirector";
import { CINEMATIC_SCENE_CATALOG } from "../../cinematic/scenes/catalog";
import { useAudioStore } from "../../cinematic/audio/AudioState";
import { defaultCinematicAudioEngine } from "../../cinematic/audio/CinematicAudioEngine";

export function DirectorControls(): React.JSX.Element {
  const directorState = useCinematicStore((s) => s.directorState);
  const activeSceneIndex = useCinematicStore((s) => s.activeSceneIndex);
  const playhead_s = useCinematicStore((s) => s.playhead_s);
  const totalDuration_s = useCinematicStore((s) => s.totalDuration_s);
  const playbackSpeed = useCinematicStore((s) => s.playbackSpeed);
  const isDirectorActive = useCinematicStore((s) => s.isDirectorActive);

  const isMuted = useAudioStore((s) => s.isMuted);
  const masterVolume = useAudioStore((s) => s.masterVolume);
  const isUnlocked = useAudioStore((s) => s.unlocked);

  const [isOpen, setIsOpen] = useState(false);

  const isPlaying = directorState === "PLAYING";

  return (
    <div className="pointer-events-auto fixed bottom-3 left-4 z-50 font-mono text-[11px] select-none">
      {/* Toggle Pill Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded border border-cyan-500/40 bg-black/85 px-3 py-1.5 text-cyan-300 shadow-xl backdrop-blur-md hover:border-cyan-400 transition-colors flex items-center gap-2"
      >
        <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
        <span className="font-bold tracking-wider">DIRECTOR CONSOLE</span>
        <span className="text-[9px] text-zinc-500">[{directorState}]</span>
      </button>

      {/* Expanded Control Deck */}
      {isOpen && (
        <div className="mt-2 w-[480px] rounded border border-zinc-800 bg-zinc-950/95 p-3.5 shadow-2xl backdrop-blur-md flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="font-bold text-cyan-400 tracking-wider">CINEMATIC DIRECTOR CONTROLS</span>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-zinc-500">MODE:</span>
              <button
                onClick={() => {
                  if (!isDirectorActive) {
                    defaultCinematicDirector.start();
                  } else {
                    defaultCinematicDirector.exit();
                  }
                }}
                className={`rounded border px-2 py-0.5 ${
                  isDirectorActive
                    ? "border-cyan-500 bg-cyan-950/80 text-cyan-300 font-bold"
                    : "border-zinc-800 bg-zinc-900 text-zinc-400"
                }`}
              >
                {isDirectorActive ? "CINEMATIC ON" : "INTERACTIVE VIEW"}
              </button>
            </div>
          </div>

          {/* Transport Controls */}
          <div className="flex items-center gap-2">
            {isPlaying ? (
              <button
                onClick={() => defaultCinematicDirector.pause()}
                className="rounded border border-amber-600 bg-amber-950/70 px-3 py-1 font-bold text-amber-300 hover:bg-amber-900/80"
              >
                PAUSE [SPACE]
              </button>
            ) : (
              <button
                onClick={() => defaultCinematicDirector.resume()}
                className="rounded border border-emerald-600 bg-emerald-950/70 px-3 py-1 font-bold text-emerald-300 hover:bg-emerald-900/80"
              >
                PLAY [SPACE]
              </button>
            )}

            <button
              onClick={() => defaultCinematicDirector.restart()}
              className="rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-zinc-300 hover:bg-zinc-800"
            >
              RESTART [R]
            </button>
            <button
              onClick={() => defaultCinematicDirector.previousScene()}
              className="rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-zinc-300 hover:bg-zinc-800"
            >
              PREV [←]
            </button>
            <button
              onClick={() => defaultCinematicDirector.nextScene()}
              className="rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-zinc-300 hover:bg-zinc-800"
            >
              NEXT [→]
            </button>

            {/* Speed Multipliers */}
            <div className="ml-auto flex items-center gap-1 border-l border-zinc-800 pl-2 text-[10px]">
              {[0.5, 1.0, 2.0, 5.0].map((rate) => (
                <button
                  key={rate}
                  onClick={() => defaultCinematicDirector.setPlaybackRate(rate)}
                  className={`rounded border px-1.5 py-0.5 ${
                    playbackSpeed === rate
                      ? "border-cyan-500 bg-cyan-950 text-cyan-300 font-bold"
                      : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  {rate}×
                </button>
              ))}
            </div>
          </div>

          {/* Timeline Scrubber */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[10px] text-zinc-400">
              <span>TIMELINE SCRUB</span>
              <span>
                {playhead_s.toFixed(1)}s / {totalDuration_s.toFixed(1)}s
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={totalDuration_s > 0 ? totalDuration_s : 100}
              step={0.1}
              value={playhead_s}
              onChange={(e) => defaultCinematicDirector.seek(parseFloat(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded bg-zinc-800 accent-cyan-400"
            />
          </div>

          {/* Scene Selector Dropdown */}
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-zinc-500">SCENE:</span>
            <select
              value={activeSceneIndex}
              onChange={(e) => defaultCinematicDirector.skipToScene(parseInt(e.target.value, 10))}
              className="flex-1 rounded border border-zinc-800 bg-zinc-900/90 px-2 py-1 text-zinc-200 focus:border-cyan-500 focus:outline-none"
            >
              {CINEMATIC_SCENE_CATALOG.map((s, idx) => (
                <option key={s.id} value={idx}>
                  {String(s.id).padStart(2, "0")} — {s.name} ({s.duration_s}s)
                </option>
              ))}
            </select>
          </div>

          {/* Procedural Audio Controls */}
          <div className="flex items-center justify-between border-t border-zinc-800/80 pt-2 text-[10px]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => defaultCinematicAudioEngine.toggleMute()}
                className={`rounded border px-2 py-0.5 font-bold transition-colors ${
                  isMuted
                    ? "border-amber-500/70 bg-amber-950/80 text-amber-300"
                    : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                {isMuted ? "UNMUTE [M]" : "MUTE [M]"}
              </button>
              <span className="text-[9px] text-zinc-500">
                STATUS:{" "}
                <strong className={isMuted ? "text-amber-400" : isUnlocked ? "text-cyan-400" : "text-zinc-400"}>
                  {isMuted ? "MUTED" : isUnlocked ? "ONLINE" : "STANDBY"}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-zinc-500">VOL:</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : masterVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (isMuted && val > 0) {
                    defaultCinematicAudioEngine.setMute(false);
                  }
                  defaultCinematicAudioEngine.setVolume(val);
                }}
                className="h-1.5 w-20 cursor-pointer appearance-none rounded bg-zinc-800 accent-cyan-400"
              />
              <span className="w-7 text-right text-zinc-400">
                {(masterVolume * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
