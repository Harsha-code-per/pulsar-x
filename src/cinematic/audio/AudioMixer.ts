/**
 * PULSAR-X: Cinematic Domain - Audio Subsystem
 * AudioMixer: Hierarchical Bus Mixing, Master Soft-Knee Limiting, and Gain Orchestration.
 */

import { AudioBus } from "./AudioBus";
import type {
  AudioBusType,
  IAudioContext,
  IDynamicsCompressorNode,
  SceneAudioProfile,
} from "./audioTypes";

export class AudioMixer {
  private readonly context: IAudioContext;
  private readonly buses: Map<AudioBusType, AudioBus> = new Map();
  private readonly limiterNode: IDynamicsCompressorNode;
  private masterVolume = 0.8;
  private isMasterMuted = false;

  constructor(context: IAudioContext, initialVolume = 0.8, isMuted = false) {
    this.context = context;
    this.masterVolume = Math.max(0, Math.min(1.0, initialVolume));
    this.isMasterMuted = isMuted;

    // 1. Create DynamicsCompressorNode as master safety limiter to prevent clipping
    this.limiterNode = context.createDynamicsCompressor();
    try {
      this.limiterNode.threshold.value = -24; // dB
      this.limiterNode.knee.value = 30; // soft knee
      this.limiterNode.ratio.value = 12; // strong limiting ratio
      this.limiterNode.attack.value = 0.003; // 3 ms fast attack
      this.limiterNode.release.value = 0.25; // 250 ms smooth release
    } catch {
      // Fallback if mocked or unsupported
    }

    // Connect Limiter to destination
    this.limiterNode.connect(context.destination);

    // 2. Initialize Master Bus
    const masterBus = new AudioBus("MASTER", context, false);
    masterBus.connect(this.limiterNode);
    masterBus.setGain(this.masterVolume, 0);
    this.buses.set("MASTER", masterBus);

    // 3. Initialize Logical Sub-Buses and route to Master Bus
    const subBusTypes: readonly AudioBusType[] = [
      "AMBIENCE",
      "SPACECRAFT",
      "PULSAR",
      "TELEMETRY",
      "ALERT",
      "CINEMATIC",
    ];

    for (const type of subBusTypes) {
      const bus = new AudioBus(type, context, type === "PULSAR" || type === "CINEMATIC");
      bus.connect(masterBus.inputNode);
      this.buses.set(type, bus);
    }

    if (this.isMasterMuted) {
      masterBus.mute(0);
    }
  }

  public getBus(type: AudioBusType): AudioBus {
    const bus = this.buses.get(type);
    if (!bus) {
      throw new Error(`[AudioMixer] Bus not found: ${type}`);
    }
    return bus;
  }

  public setMasterVolume(volume: number, rampDuration_s = 0.05): void {
    const clamped = Math.max(0, Math.min(1.0, volume));
    this.masterVolume = clamped;
    if (!this.isMasterMuted) {
      this.getBus("MASTER").setGain(clamped, rampDuration_s);
    }
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public setMute(muted: boolean, rampDuration_s = 0.05): void {
    this.isMasterMuted = muted;
    const masterBus = this.getBus("MASTER");
    if (muted) {
      masterBus.mute(rampDuration_s);
    } else {
      masterBus.unmute(rampDuration_s);
    }
  }

  public getIsMuted(): boolean {
    return this.isMasterMuted;
  }

  public toggleMute(rampDuration_s = 0.05): boolean {
    this.setMute(!this.isMasterMuted, rampDuration_s);
    return this.isMasterMuted;
  }

  public applyProfileGains(profile: SceneAudioProfile, duration_s?: number): void {
    const duration = duration_s ?? profile.fadeInDuration_s ?? 0.5;
    this.getBus("AMBIENCE").setGain(profile.ambienceGain, duration);
    this.getBus("SPACECRAFT").setGain(profile.spacecraftGain, duration);
    this.getBus("PULSAR").setGain(profile.pulsarGain, duration);
    this.getBus("TELEMETRY").setGain(profile.telemetryGain, duration);
    this.getBus("ALERT").setGain(profile.alertGain, duration);
    this.getBus("CINEMATIC").setGain(profile.cinematicGain, duration);
  }

  public getBusGains(): Record<AudioBusType, number> {
    const result: Partial<Record<AudioBusType, number>> = {};
    for (const [type, bus] of this.buses.entries()) {
      result[type] = bus.getGain();
    }
    return result as Record<AudioBusType, number>;
  }

  public dispose(): void {
    try {
      this.limiterNode.disconnect();
    } catch {
      // Ignore disconnect errors during disposal
    }
  }
}
