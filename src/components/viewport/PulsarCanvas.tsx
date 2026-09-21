"use client";

/**
 * PULSAR-X: Component Domain
 * Dedicated R3F Canvas Host with WebGL Error Boundary & Clamped DPR.
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { SceneRoot } from "../../rendering/scene/SceneRoot";
import { useVisualStore } from "../../store/visual-store";
import { getQualitySettings } from "../../rendering/config/quality";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class WebGLErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: "",
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("WebGL Rendering Error:", error, errorInfo);
  }

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-950 p-8 text-white">
          <div className="max-w-md rounded border border-rose-800/60 bg-rose-950/30 p-6 text-center shadow-2xl backdrop-blur">
            <h2 className="font-mono text-xl font-bold tracking-widest text-rose-400">
              GRAPHICS SUBSYSTEM FAILURE
            </h2>
            <p className="mt-3 text-sm text-zinc-300">
              The WebGL2 hardware context could not be initialized or encountered an unrecoverable exception.
            </p>
            <div className="mt-4 rounded bg-black/60 p-2 font-mono text-xs text-rose-300 break-all">
              {this.state.errorMessage || "CONTEXT_LOST"}
            </div>
            <button
              onClick={() => this.setState({ hasError: false, errorMessage: "" })}
              className="mt-5 rounded border border-zinc-700 bg-zinc-800 px-4 py-1.5 font-mono text-xs text-white hover:bg-zinc-700"
            >
              REINITIALIZE SUBSYSTEM
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function PulsarCanvas(): React.JSX.Element {
  const qualityTier = useVisualStore((s) => s.qualityTier);
  const settings = getQualitySettings(qualityTier);

  return (
    <div className="relative h-full w-full bg-black overflow-hidden select-none">
      <WebGLErrorBoundary>
        <Canvas
          camera={{ position: [0, 50, 140], fov: 45, near: 0.5, far: 1200 }}
          dpr={[1, settings.maxDpr]}
          gl={{
            powerPreference: "high-performance",
            antialias: settings.antialias,
            depth: true,
          }}
          onCreated={({ gl }) => {
            gl.info.autoReset = false;
          }}
        >
          <SceneRoot />
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
}
