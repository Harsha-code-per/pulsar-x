/**
 * PULSAR-X: Cinematic Domain
 * Master Scene Catalog: Ordered sequence of all 18 narrative scenes.
 */

import type { SceneDefinition } from "./types";
import { scene01Earth } from "./scene01-earth";
import { scene02Departure } from "./scene02-departure";
import { scene03EarthRecedes } from "./scene03-earth-recedes";
import { scene04DeepSpace } from "./scene04-deep-space";
import { scene05GpsLost } from "./scene05-gps-lost";
import { scene06GroundLinkLost } from "./scene06-ground-link-lost";
import { scene07Search } from "./scene07-search";
import { scene08FirstPulsar } from "./scene08-first-pulsar";
import { scene09PulsarNetwork } from "./scene09-pulsar-network";
import { scene10Observation } from "./scene10-observation";
import { scene11Uncertainty } from "./scene11-uncertainty";
import { scene12Convergence } from "./scene12-convergence";
import { scene13PositionLock } from "./scene13-position-lock";
import { scene14SignalFailure } from "./scene14-signal-failure";
import { scene15Degradation } from "./scene15-degradation";
import { scene16Recovery } from "./scene16-recovery";
import { scene17Destination } from "./scene17-destination";
import { scene18FinalReveal } from "./scene18-final-reveal";

export const CINEMATIC_SCENE_CATALOG: readonly SceneDefinition[] = [
  scene01Earth,
  scene02Departure,
  scene03EarthRecedes,
  scene04DeepSpace,
  scene05GpsLost,
  scene06GroundLinkLost,
  scene07Search,
  scene08FirstPulsar,
  scene09PulsarNetwork,
  scene10Observation,
  scene11Uncertainty,
  scene12Convergence,
  scene13PositionLock,
  scene14SignalFailure,
  scene15Degradation,
  scene16Recovery,
  scene17Destination,
  scene18FinalReveal,
];

export function getSceneById(id: number): SceneDefinition | undefined {
  return CINEMATIC_SCENE_CATALOG.find((s) => s.id === id);
}

export function getSceneByKey(key: string): SceneDefinition | undefined {
  return CINEMATIC_SCENE_CATALOG.find((s) => s.key === key);
}
