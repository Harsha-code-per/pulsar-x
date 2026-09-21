"use client";

/**
 * PULSAR-X: 3D Rendering Domain
 * PulsarSystem: Manages all astronomical pulsar navigation beacons.
 */

import React from "react";
import { INITIAL_PULSAR_CATALOG } from "../../simulation/pulsars/catalog";
import { PulsarNode } from "./PulsarNode";

export function PulsarSystem(): React.JSX.Element {
  return (
    <group name="PulsarSystem">
      {INITIAL_PULSAR_CATALOG.map((pulsar, idx) => (
        <PulsarNode key={pulsar.id} pulsar={pulsar} index={idx} />
      ))}
    </group>
  );
}
