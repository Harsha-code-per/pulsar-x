/**
 * PULSAR-X: Cinematic Domain - Audio Subsystem
 * CinematicAudioEngine: Master Orchestrator for Real-Time Procedural Cinematic Audio.
 *
 * ALL AUDIO IS PROCEDURAL INSTRUMENT SONIFICATION AND ONBOARD ACOUSTICS.
 * NO SOUND PROPAGATES THROUGH PHYSICAL VACUUM.
 */

import { AudioMixer } from "./AudioMixer";
import { AudioClock } from "./AudioClock";
import {
  DeepSpaceAmbienceSource,
  AvionicsHumSource,
  MainEngineBurnSource,
  RcsBurstSource,
  PulsarSonificationSystem,
  PhotonBatchClicker,
  NavigationComputeSonifier,
  AlertToneGenerator,
  CinematicClimaxGenerator,
} from "./AudioSources";
import { AudioEventRouter } from "./AudioEventRouter";
import { getSceneAudioProfile } from "./AudioProfiles";
import { useAudioStore } from "./AudioState";
import { defaultCinematicEventBus, type CinematicEventBus } from "../director/CinematicEventBus";
import type { CinematicClock } from "../director/CinematicClock";
import type { AudioEngineConfig, AudioContextStatus, IAudioContext } from "./audioTypes";

export class CinematicAudioEngine {
  private context: IAudioContext | null = null;
  private mixer: AudioMixer | null = null;
  private clock = new AudioClock();
  private eventRouter: AudioEventRouter | null = null;

  // Procedural sources
  private ambienceSource: DeepSpaceAmbienceSource | null = null;
  private avionicsSource: AvionicsHumSource | null = null;
  private mainEngineSource: MainEngineBurnSource | null = null;
  private rcsSource: RcsBurstSource | null = null;
  private pulsarSystem: PulsarSonificationSystem | null = null;
  private photonClicker: PhotonBatchClicker | null = null;
  private navCompute: NavigationComputeSonifier | null = null;
  private alertTone: AlertToneGenerator | null = null;
  private climaxGenerator: CinematicClimaxGenerator | null = null;

  private isUnlocked = false;
  private isRunning = false;
  private currentSceneId = 1;
  private eventBus: CinematicEventBus;
  private customContextFactory?: () => IAudioContext;

  constructor(config: AudioEngineConfig = {}, eventBus: CinematicEventBus = defaultCinematicEventBus) {
    this.eventBus = eventBus;
    this.customContextFactory = config.customContextFactory;

    if (config.initialVolume !== undefined) {
      useAudioStore.getState().setMasterVolume(config.initialVolume);
    }
    if (config.isMuted !== undefined) {
      useAudioStore.getState().setMuted(config.isMuted);
    }
  }

  /**
   * Canonical user-gesture unlock handler. Must be invoked from a user click
   * (e.g. "BEGIN MISSION" button or play control).
   */
  public async unlock(): Promise<boolean> {
    if (this.isUnlocked && this.context?.state === "running") {
      return true;
    }

    try {
      if (!this.context) {
        this.initGraph();
      }

      if (this.context && this.context.state === "suspended") {
        await this.context.resume();
      }

      this.isUnlocked = true;
      useAudioStore.getState().setUnlocked(true);
      useAudioStore.getState().setContextState(this.context ? (this.context.state as AudioContextStatus) : "running");

      // Start foundational ambience
      this.ambienceSource?.start();
      this.avionicsSource?.start();

      return true;
    } catch (err) {
      console.warn("[CinematicAudioEngine] Audio unlock failed (may require user interaction):", err);
      return false;
    }
  }

  public initGraph(): void {
    if (this.context) return;

    if (this.customContextFactory) {
      this.context = this.customContextFactory();
    } else if (typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.context = new AudioCtx() as unknown as IAudioContext;
      }
    }

    if (!this.context) {
      return;
    }

    const initialVol = useAudioStore.getState().masterVolume;
    const initialMute = useAudioStore.getState().isMuted;

    // 1. Initialize Mixer
    this.mixer = new AudioMixer(this.context, initialVol, initialMute);

    // 2. Initialize Sources
    const ambienceBus = this.mixer.getBus("AMBIENCE");
    const spacecraftBus = this.mixer.getBus("SPACECRAFT");
    const pulsarBus = this.mixer.getBus("PULSAR");
    const telemetryBus = this.mixer.getBus("TELEMETRY");
    const alertBus = this.mixer.getBus("ALERT");
    const cinematicBus = this.mixer.getBus("CINEMATIC");

    this.ambienceSource = new DeepSpaceAmbienceSource(this.context, ambienceBus);
    this.avionicsSource = new AvionicsHumSource(this.context, spacecraftBus);
    this.mainEngineSource = new MainEngineBurnSource(this.context, spacecraftBus);
    this.rcsSource = new RcsBurstSource(this.context, spacecraftBus);
    this.pulsarSystem = new PulsarSonificationSystem(this.context, pulsarBus);
    this.photonClicker = new PhotonBatchClicker(this.context, telemetryBus);
    this.navCompute = new NavigationComputeSonifier(this.context, telemetryBus);
    this.alertTone = new AlertToneGenerator(this.context, alertBus);
    this.climaxGenerator = new CinematicClimaxGenerator(this.context, cinematicBus);

    // 3. Initialize Event Router
    this.eventRouter = new AudioEventRouter(this.eventBus, {
      mainEngine: this.mainEngineSource,
      rcs: this.rcsSource,
      pulsarSystem: this.pulsarSystem,
      photonClicker: this.photonClicker,
      navCompute: this.navCompute,
      alertTone: this.alertTone,
      climax: this.climaxGenerator,
    });

    // 4. Apply Initial Scene Profile
    this.setScene(this.currentSceneId);
  }

  public syncWithCinematicClock(clock: CinematicClock): void {
    this.clock.syncWithCinematicClock(clock);
  }

  public setScene(sceneId: number): void {
    this.currentSceneId = sceneId;
    useAudioStore.getState().setActiveSceneId(sceneId);

    const profile = getSceneAudioProfile(sceneId);
    if (this.mixer) {
      this.mixer.applyProfileGains(profile);
      useAudioStore.getState().setBusGain("AMBIENCE", profile.ambienceGain);
      useAudioStore.getState().setBusGain("SPACECRAFT", profile.spacecraftGain);
      useAudioStore.getState().setBusGain("PULSAR", profile.pulsarGain);
      useAudioStore.getState().setBusGain("TELEMETRY", profile.telemetryGain);
      useAudioStore.getState().setBusGain("ALERT", profile.alertGain);
      useAudioStore.getState().setBusGain("CINEMATIC", profile.cinematicGain);
    }

    // Configure pulsar visibility for scene
    if (this.pulsarSystem) {
      if (sceneId >= 8 && sceneId < 14) {
        this.pulsarSystem.setActivePulsars(["PSR_B1937+21", "PSR_B1821-24", "PSR_J0437-4715"]);
      } else if (sceneId >= 14 && sceneId < 16) {
        // Solar interference: primary lost
        this.pulsarSystem.setActivePulsars(["PSR_B1821-24", "PSR_J0437-4715"]);
      } else if (sceneId >= 16) {
        // Recovery with backup beacon
        this.pulsarSystem.setActivePulsars(["PSR_B1821-24", "PSR_J0437-4715", "PSR_J0218+4232"]);
      } else {
        this.pulsarSystem.setActivePulsars([]);
      }
    }
  }

  /**
   * Per-frame update loop called from CinematicDirector.update().
   */
  public update(delta_s: number, playhead_s?: number): void {
    if (!this.isUnlocked || !this.isRunning) {
      return;
    }

    const currentPlayhead = playhead_s ?? this.clock.getPlayhead();
    const rate = this.clock.getPlaybackRate();

    // Update rhythmic pulsar sonification
    this.pulsarSystem?.update(currentPlayhead, rate);
  }

  public start(): void {
    this.isRunning = true;
    this.clock.onResume();
    if (!this.isUnlocked) {
      this.unlock().catch(() => {});
    }
  }

  public pause(): void {
    this.isRunning = false;
    this.clock.onPause();
    this.stopAllOneShots();
  }

  public resume(): void {
    this.isRunning = true;
    this.clock.onResume();
    if (!this.isUnlocked) {
      this.unlock().catch(() => {});
    }
  }

  public restart(): void {
    this.stopAllOneShots();
    this.setScene(1);
    this.start();
  }

  public onSeek(targetTime_s: number): void {
    this.stopAllOneShots();
    this.clock.onSeek(targetTime_s);
  }

  public stopAllOneShots(): void {
    this.mainEngineSource?.stop();
    this.alertTone?.stopActiveAlarm();
    this.photonClicker?.reset();
    this.eventRouter?.reset();
  }

  public stop(): void {
    this.isRunning = false;
    this.stopAllOneShots();
    this.ambienceSource?.stop();
    this.avionicsSource?.stop();
  }

  public setVolume(volume: number): void {
    useAudioStore.getState().setMasterVolume(volume);
    this.mixer?.setMasterVolume(volume);
  }

  public setMute(muted: boolean): void {
    useAudioStore.getState().setMuted(muted);
    this.mixer?.setMute(muted);
  }

  public toggleMute(): boolean {
    const isMuted = useAudioStore.getState().isMuted;
    this.setMute(!isMuted);
    return !isMuted;
  }

  public getIsUnlocked(): boolean {
    return this.isUnlocked;
  }

  public getContext(): IAudioContext | null {
    return this.context;
  }

  public getMixer(): AudioMixer | null {
    return this.mixer;
  }

  public getClock(): AudioClock {
    return this.clock;
  }

  public dispose(): void {
    this.stop();
    this.eventRouter?.dispose();
    this.mixer?.dispose();
    this.clock.clear();
    try {
      this.context?.close();
    } catch {
      // Ignore
    }
    this.context = null;
    this.mixer = null;
    this.eventRouter = null;
    this.isUnlocked = false;
  }
}

/** Global singleton audio engine instance */
export const defaultCinematicAudioEngine = new CinematicAudioEngine();
