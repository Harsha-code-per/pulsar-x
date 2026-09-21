"use client";

/**
 * PULSAR-X: 3D Rendering Domain
 * Scientific Reference Grid & Barycentric Coordinate System.
 *
 * Provides astronomical distance markers (1 AU, 1.5 AU) and BCRS axes for developer inspection.
 */

import React, { useMemo } from "react";
import { useVisualStore } from "../../store/visual-store";

export function ReferenceSystem(): React.JSX.Element {
  const showGrid = useVisualStore((s) => s.showReferenceGrid);

  const ring1Au = useMemo(() => {
    const pts = new Float32Array(128 * 3);
    for (let i = 0; i < 128; i++) {
      const th = (i / 128) * Math.PI * 2;
      pts[i * 3 + 0] = Math.cos(th) * 100.0;
      pts[i * 3 + 1] = 0;
      pts[i * 3 + 2] = Math.sin(th) * 100.0;
    }
    return pts;
  }, []);

  const ring1_5Au = useMemo(() => {
    const pts = new Float32Array(128 * 3);
    for (let i = 0; i < 128; i++) {
      const th = (i / 128) * Math.PI * 2;
      pts[i * 3 + 0] = Math.cos(th) * 152.4; // Mars orbit distance ~1.524 AU
      pts[i * 3 + 1] = 0;
      pts[i * 3 + 2] = Math.sin(th) * 152.4;
    }
    return pts;
  }, []);

  if (!showGrid) return <></>;

  return (
    <group name="ReferenceSystem">
      {/* Barycentric Origin Axis Lines */}
      <axesHelper args={[20]} />

      {/* 1.0 AU Range Ring (Earth Distance) */}
      <lineLoop>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[ring1Au, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#3a506b" transparent opacity={0.4} />
      </lineLoop>

      {/* 1.524 AU Range Ring (Mars Distance) */}
      <lineLoop>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[ring1_5Au, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#3a506b" transparent opacity={0.25} />
      </lineLoop>

      {/* Ecliptic Reference Plane Grid */}
      <gridHelper args={[300, 30, "#1c2541", "#0b132b"]} position={[0, -0.05, 0]} />
    </group>
  );
}
