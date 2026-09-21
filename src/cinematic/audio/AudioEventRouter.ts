/**
 * PULSAR-X: Cinematic Domain - Audio Subsystem
 * AudioEventRouter: Subscribes to CinematicEventBus and Dispatches Procedural Audio Triggers.
 */

import type { CinematicEvent, CinematicEventBus, CinematicEventType } from "../director/CinematicEventBus";
import type {
  AlertToneGenerator,
  CinematicClimaxGenerator,
  MainEngineBurnSource,
  NavigationComputeSonifier,
  PhotonBatchClicker,
  PulsarSonificationSystem,
  RcsBurstSource,
} from "./AudioSources";

export interface AudioRouterSources {
  mainEngine: MainEngineBurnSource;
  rcs: RcsBurstSource;
  pulsarSystem: PulsarSonificationSystem;
  photonClicker: PhotonBatchClicker;
  navCompute: NavigationComputeSonifier;
  alertTone: AlertToneGenerator;
  climax: CinematicClimaxGenerator;
}

export class AudioEventRouter {
  private readonly eventBus: CinematicEventBus;
  private readonly sources: AudioRouterSources;
  private unsubs: (() => void)[] = [];
  private recentHandledEvents: Map<CinematicEventType, number> = new Map();
  private duplicateSuppressionWindow_s = 0.5; // 500ms debounce for duplicate event triggers

  constructor(eventBus: CinematicEventBus, sources: AudioRouterSources) {
    this.eventBus = eventBus;
    this.sources = sources;
    this.setupListeners();
  }

  private setupListeners(): void {
    const eventTypes: readonly CinematicEventType[] = [
      "SIMULATION_READY",
      "GNSS_DEGRADED",
      "GNSS_LOST",
      "GROUND_LINK_LOST",
      "PULSAR_ACQUIRED",
      "PULSAR_LOST",
      "OBSERVATION_AVAILABLE",
      "NAVIGATION_DEGRADED",
      "NAVIGATION_RECOVERED",
      "NAVIGATION_LOCKED",
      "SOLAR_OCCULTATION",
      "MISSION_ARRIVAL",
      "CINEMATIC_COMPLETE",
      "SCENE_ENTERED",
      "SCENE_EXITED",
    ];

    for (const type of eventTypes) {
      const unsub = this.eventBus.on(type, (event) => this.handleEvent(event));
      this.unsubs.push(unsub);
    }
  }

  public handleEvent(event: CinematicEvent): void {
    const now = typeof performance !== "undefined" ? performance.now() / 1000 : Date.now() / 1000;
    const lastTime = this.recentHandledEvents.get(event.type) ?? -1;

    // Suppress rapid duplicate events (except observation/photons which can stream)
    if (event.type !== "OBSERVATION_AVAILABLE" && lastTime >= 0 && now - lastTime < this.duplicateSuppressionWindow_s) {
      return;
    }
    this.recentHandledEvents.set(event.type, now);

    switch (event.type) {
      case "GNSS_LOST":
      case "GNSS_DEGRADED":
        this.sources.alertTone.triggerGnssLossAlert();
        break;

      case "GROUND_LINK_LOST":
        this.sources.alertTone.triggerGnssLossAlert();
        break;

      case "PULSAR_ACQUIRED": {
        const payload = event.payload as { pulsarId?: string } | undefined;
        if (payload?.pulsarId) {
          this.sources.pulsarSystem.setActivePulsars([payload.pulsarId]);
        }
        break;
      }

      case "PULSAR_LOST":
        this.sources.alertTone.triggerSolarInterferenceSwell(4.0);
        break;

      case "OBSERVATION_AVAILABLE": {
        const payload = event.payload as { photonCount?: number; playhead_s?: number } | undefined;
        const count = payload?.photonCount ?? 1;
        const playhead = payload?.playhead_s ?? now;
        this.sources.photonClicker.registerPhotonDetections(count, playhead);
        break;
      }

      case "NAVIGATION_LOCKED":
        this.sources.alertTone.triggerNavigationLockTone();
        break;

      case "NAVIGATION_DEGRADED":
        this.sources.alertTone.triggerSolarInterferenceSwell(3.0);
        break;

      case "NAVIGATION_RECOVERED":
        this.sources.alertTone.triggerNavigationLockTone();
        break;

      case "SOLAR_OCCULTATION":
        this.sources.alertTone.triggerSolarInterferenceSwell(6.0);
        break;

      case "CINEMATIC_COMPLETE":
        this.sources.climax.triggerCosmicReveal(10.0);
        break;

      case "SCENE_ENTERED": {
        const payload = event.payload as { sceneId?: number } | undefined;
        if (payload?.sceneId === 2) {
          // Scene 02: TLI burn
          this.sources.mainEngine.triggerBurn(8.0);
        } else if (payload?.sceneId === 18) {
          // Scene 18: Cosmic climax
          this.sources.climax.triggerCosmicReveal(12.0);
        }
        break;
      }

      default:
        break;
    }
  }

  public reset(): void {
    this.recentHandledEvents.clear();
  }

  public dispose(): void {
    for (const unsub of this.unsubs) {
      unsub();
    }
    this.unsubs = [];
    this.recentHandledEvents.clear();
  }
}
