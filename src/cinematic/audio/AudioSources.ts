/**
 * PULSAR-X: Cinematic Domain - Audio Subsystem
 * AudioSources: Procedural Sound Synthesizers for Deep Space Navigation Presentation.
 *
 * ALL AUDIO IS PROCEDURAL INSTRUMENT SONIFICATION AND ONBOARD ACOUSTICS.
 * ZERO SOUND PROPAGATES THROUGH PHYSICAL VACUUM.
 */

import type {
  IAudioBuffer,
  IAudioBufferSourceNode,
  IAudioContext,
  IBiquadFilterNode,
  IGainNode,
  IOscillatorNode,
  PulsarSonificationConfig,
} from "./audioTypes";
import type { AudioBus } from "./AudioBus";

/**
 * Creates a reusable white noise AudioBuffer of specified duration in seconds.
 */
function createNoiseBuffer(context: IAudioContext, duration_s = 2.0): IAudioBuffer {
  const sampleRate = context.sampleRate;
  const bufferSize = Math.floor(sampleRate * duration_s);
  const buffer = context.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);

  // Deterministic noise pattern with high frequency randomness
  let seed = 0x12345678;
  for (let i = 0; i < bufferSize; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    data[i] = (seed / 4294967296) * 2 - 1;
  }

  return buffer;
}

/**
 * Procedural Ambience Generator: Subliminal deep-space electrical and instrument bed.
 */
export class DeepSpaceAmbienceSource {
  private readonly context: IAudioContext;
  private readonly destination: AudioBus;
  private noiseSource: IAudioBufferSourceNode | null = null;
  private noiseFilter: IBiquadFilterNode | null = null;
  private noiseGain: IGainNode | null = null;
  private osc1: IOscillatorNode | null = null;
  private osc2: IOscillatorNode | null = null;
  private oscGain: IGainNode | null = null;
  private isPlaying = false;

  constructor(context: IAudioContext, destination: AudioBus) {
    this.context = context;
    this.destination = destination;
  }

  public start(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;

    const now = this.context.currentTime;

    // 1. Filtered low-pass noise bed (20 - 80 Hz)
    const noiseBuffer = createNoiseBuffer(this.context, 3.0);
    this.noiseSource = this.context.createBufferSource();
    this.noiseSource.buffer = noiseBuffer;
    this.noiseSource.loop = true;

    this.noiseFilter = this.context.createBiquadFilter();
    this.noiseFilter.type = "lowpass";
    this.noiseFilter.frequency.setValueAtTime(65, now);

    this.noiseGain = this.context.createGain();
    this.noiseGain.gain.setValueAtTime(0.12, now);

    this.noiseSource.connect(this.noiseFilter);
    this.noiseFilter.connect(this.noiseGain);
    this.noiseGain.connect(this.destination.inputNode);
    this.noiseSource.start(now);

    // 2. Dual subtle sine drone at 43.6 Hz and 65.4 Hz
    this.osc1 = this.context.createOscillator();
    this.osc1.type = "sine";
    this.osc1.frequency.setValueAtTime(43.65, now); // F1

    this.osc2 = this.context.createOscillator();
    this.osc2.type = "sine";
    this.osc2.frequency.setValueAtTime(65.41, now); // C2

    this.oscGain = this.context.createGain();
    this.oscGain.gain.setValueAtTime(0.04, now);

    this.osc1.connect(this.oscGain);
    this.osc2.connect(this.oscGain);
    this.oscGain.connect(this.destination.inputNode);

    this.osc1.start(now);
    this.osc2.start(now);
  }

  public stop(): void {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    try {
      this.noiseSource?.stop();
      this.noiseSource?.disconnect();
      this.noiseFilter?.disconnect();
      this.noiseGain?.disconnect();

      this.osc1?.stop();
      this.osc1?.disconnect();
      this.osc2?.stop();
      this.osc2?.disconnect();
      this.oscGain?.disconnect();
    } catch {
      // Ignore disconnect errors
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

/**
 * Spacecraft Avionics Hum: 120 Hz power transformer hum + 400 Hz electrical carrier.
 */
export class AvionicsHumSource {
  private readonly context: IAudioContext;
  private readonly destination: AudioBus;
  private osc120: IOscillatorNode | null = null;
  private osc400: IOscillatorNode | null = null;
  private masterGain: IGainNode | null = null;
  private isPlaying = false;

  constructor(context: IAudioContext, destination: AudioBus) {
    this.context = context;
    this.destination = destination;
  }

  public start(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    const now = this.context.currentTime;

    this.osc120 = this.context.createOscillator();
    this.osc120.type = "sine";
    this.osc120.frequency.setValueAtTime(120, now);

    this.osc400 = this.context.createOscillator();
    this.osc400.type = "sine";
    this.osc400.frequency.setValueAtTime(400, now);

    this.masterGain = this.context.createGain();
    this.masterGain.gain.setValueAtTime(0.05, now);

    this.osc120.connect(this.masterGain);
    this.osc400.connect(this.masterGain);
    this.masterGain.connect(this.destination.inputNode);

    this.osc120.start(now);
    this.osc400.start(now);
  }

  public stop(): void {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    try {
      this.osc120?.stop();
      this.osc120?.disconnect();
      this.osc400?.stop();
      this.osc400?.disconnect();
      this.masterGain?.disconnect();
    } catch {
      // Ignore disconnect errors
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

/**
 * Main Engine / TLI Burn Source: Controlled procedural broadband thruster roar.
 */
export class MainEngineBurnSource {
  private readonly context: IAudioContext;
  private readonly destination: AudioBus;
  private noiseSource: IAudioBufferSourceNode | null = null;
  private filter1: IBiquadFilterNode | null = null;
  private filter2: IBiquadFilterNode | null = null;
  private subOsc: IOscillatorNode | null = null;
  private gainNode: IGainNode | null = null;
  private isRunning = false;

  constructor(context: IAudioContext, destination: AudioBus) {
    this.context = context;
    this.destination = destination;
  }

  public triggerBurn(duration_s = 8.0): void {
    this.stop();
    this.isRunning = true;
    const now = this.context.currentTime;

    // Noise buffer
    const buffer = createNoiseBuffer(this.context, 2.0);
    this.noiseSource = this.context.createBufferSource();
    this.noiseSource.buffer = buffer;
    this.noiseSource.loop = true;

    // Dual bandpass filters for engine resonance
    this.filter1 = this.context.createBiquadFilter();
    this.filter1.type = "bandpass";
    this.filter1.frequency.setValueAtTime(140, now);
    this.filter1.Q.setValueAtTime(1.5, now);

    this.filter2 = this.context.createBiquadFilter();
    this.filter2.type = "lowpass";
    this.filter2.frequency.setValueAtTime(320, now);

    // Sub rumble oscillator
    this.subOsc = this.context.createOscillator();
    this.subOsc.type = "triangle";
    this.subOsc.frequency.setValueAtTime(55, now);

    this.gainNode = this.context.createGain();
    this.gainNode.gain.setValueAtTime(0.001, now);
    // Smooth 1.5s attack ramp
    this.gainNode.gain.exponentialRampToValueAtTime(0.35, now + 1.5);
    // Sustain until burn completion, then 2.0s decay
    const sustainEnd = Math.max(now + 1.5, now + duration_s - 2.0);
    this.gainNode.gain.setValueAtTime(0.35, sustainEnd);
    this.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration_s);

    this.noiseSource.connect(this.filter1);
    this.filter1.connect(this.filter2);
    this.filter2.connect(this.gainNode);

    const subGain = this.context.createGain();
    subGain.gain.setValueAtTime(0.15, now);
    this.subOsc.connect(subGain);
    subGain.connect(this.gainNode);

    this.gainNode.connect(this.destination.inputNode);

    this.noiseSource.start(now);
    this.subOsc.start(now);

    this.noiseSource.stop(now + duration_s);
    this.subOsc.stop(now + duration_s);
    this.noiseSource.onended = () => {
      this.isRunning = false;
    };
  }

  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    try {
      this.noiseSource?.stop();
      this.noiseSource?.disconnect();
      this.subOsc?.stop();
      this.subOsc?.disconnect();
      this.gainNode?.disconnect();
    } catch {
      // Ignore
    }
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }
}

/**
 * RCS Thruster Burst: Subtle 80ms bandpassed burst for attitude adjustments.
 */
export class RcsBurstSource {
  private readonly context: IAudioContext;
  private readonly destination: AudioBus;

  constructor(context: IAudioContext, destination: AudioBus) {
    this.context = context;
    this.destination = destination;
  }

  public triggerBurst(): void {
    const now = this.context.currentTime;
    const duration = 0.08;

    const buffer = createNoiseBuffer(this.context, duration);
    const source = this.context.createBufferSource();
    source.buffer = buffer;

    const filter = this.context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.setValueAtTime(2.0, now);

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.destination.inputNode);

    source.start(now);
    source.stop(now + duration);
  }
}

/**
 * Catalog of procedural sonification presets for navigation millisecond pulsars.
 */
export const PULSAR_SONIFICATION_PRESETS: Record<string, PulsarSonificationConfig> = {
  "PSR_B1937+21": {
    pulsarId: "PSR_B1937+21",
    baseFrequency_hz: 641.928,
    formants: [1500, 3000],
    pulseWidth_s: 0.003,
    stereoPan: -0.35,
    clickGain: 0.28,
    subharmonicDivisor: 64, // Maps 641.9 Hz to ~10.03 Hz rhythmic pulses
  },
  "PSR_B1821-24": {
    pulsarId: "PSR_B1821-24",
    baseFrequency_hz: 327.406,
    formants: [850, 1700],
    pulseWidth_s: 0.004,
    stereoPan: 0.35,
    clickGain: 0.24,
    subharmonicDivisor: 32, // Maps 327.4 Hz to ~10.23 Hz rhythmic pulses
  },
  "PSR_J0437-4715": {
    pulsarId: "PSR_J0437-4715",
    baseFrequency_hz: 173.688,
    formants: [450, 900],
    pulseWidth_s: 0.006,
    stereoPan: -0.65,
    clickGain: 0.22,
    subharmonicDivisor: 16, // Maps 173.7 Hz to ~10.85 Hz rhythmic pulses
  },
  "PSR_J0218+4232": {
    pulsarId: "PSR_J0218+4232",
    baseFrequency_hz: 430.461,
    formants: [600, 1200],
    pulseWidth_s: 0.004,
    stereoPan: 0.65,
    clickGain: 0.20,
    subharmonicDivisor: 40, // Maps 430.5 Hz to ~10.76 Hz rhythmic pulses
  },
  "PSR_B0531+21": {
    pulsarId: "PSR_B0531+21",
    baseFrequency_hz: 29.947,
    formants: [240, 480],
    pulseWidth_s: 0.012,
    stereoPan: 0.0,
    clickGain: 0.30,
    subharmonicDivisor: 1, // Directly rhythmic at 29.9 Hz
  },
};

/**
 * Pulsar Sonification Synthesizer: Rhythmic transient pulse generator derived from simulated phase/timing.
 */
export class PulsarSonificationSystem {
  private readonly context: IAudioContext;
  private readonly destination: AudioBus;
  private activePulsarIds: Set<string> = new Set();
  private lastPulseTimes: Map<string, number> = new Map();
  private isEnabled = true;

  constructor(context: IAudioContext, destination: AudioBus) {
    this.context = context;
    this.destination = destination;
  }

  public setActivePulsars(pulsarIds: readonly string[]): void {
    this.activePulsarIds = new Set(pulsarIds);
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Called per-frame to emit sonified timing pulses based on active pulsars and playhead.
   */
  public update(playhead_s: number, playbackRate = 1.0): void {
    if (!this.isEnabled || this.activePulsarIds.size === 0) return;

    // Rate-limit pulse density at high playback rates to preserve clarity
    const effectiveRate = Math.min(2.0, playbackRate);

    for (const pulsarId of this.activePulsarIds) {
      const config = PULSAR_SONIFICATION_PRESETS[pulsarId];
      if (!config) continue;

      // Calculate effective pulse period in playhead seconds
      const pulseInterval_s = config.subharmonicDivisor / config.baseFrequency_hz / effectiveRate;
      const lastTime = this.lastPulseTimes.get(pulsarId) ?? -1;

      if (lastTime < 0 || playhead_s - lastTime >= pulseInterval_s) {
        this.emitPulse(config);
        this.lastPulseTimes.set(pulsarId, playhead_s);
      }
    }
  }

  public emitPulse(config: PulsarSonificationConfig): void {
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(config.formants[0], now);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(100, config.formants[0] * 0.5),
      now + config.pulseWidth_s
    );

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(config.clickGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + config.pulseWidth_s);

    osc.connect(gain);
    gain.connect(this.destination.inputNode);

    osc.start(now);
    osc.stop(now + config.pulseWidth_s);
  }

  public reset(): void {
    this.lastPulseTimes.clear();
    this.activePulsarIds.clear();
  }
}

/**
 * Photon Batch Clicker: Aggregates high-frequency photon arrivals into clustered micro-transients.
 */
export class PhotonBatchClicker {
  private readonly context: IAudioContext;
  private readonly destination: AudioBus;
  private lastBatchTime_s = 0.0;
  private pendingPhotonCount = 0;
  private readonly batchWindow_s = 0.035; // 35ms aggregation window

  constructor(context: IAudioContext, destination: AudioBus) {
    this.context = context;
    this.destination = destination;
  }

  public registerPhotonDetections(count: number, playhead_s: number): void {
    this.pendingPhotonCount += count;

    if (playhead_s - this.lastBatchTime_s >= this.batchWindow_s && this.pendingPhotonCount > 0) {
      this.emitCluster(this.pendingPhotonCount);
      this.pendingPhotonCount = 0;
      this.lastBatchTime_s = playhead_s;
    }
  }

  private emitCluster(count: number): void {
    const now = this.context.currentTime;
    const duration = 0.012; // 12ms crisp micro-click

    const osc = this.context.createOscillator();
    osc.type = "sine";
    // Slight pitch randomization for organic realism
    const freq = 2400 + Math.random() * 400;
    osc.frequency.setValueAtTime(freq, now);

    const gain = this.context.createGain();
    const scaledGain = Math.min(0.25, 0.08 + Math.log10(count + 1) * 0.06);
    gain.gain.setValueAtTime(scaledGain, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.destination.inputNode);

    osc.start(now);
    osc.stop(now + duration);
  }

  public reset(): void {
    this.pendingPhotonCount = 0;
    this.lastBatchTime_s = 0.0;
  }
}

/**
 * Navigation Computation Sound: Soft blip representing batch WLS solution steps.
 */
export class NavigationComputeSonifier {
  private readonly context: IAudioContext;
  private readonly destination: AudioBus;

  constructor(context: IAudioContext, destination: AudioBus) {
    this.context = context;
    this.destination = destination;
  }

  public triggerIterationBlip(iteration: number): void {
    const now = this.context.currentTime;
    const duration = 0.025;

    const osc = this.context.createOscillator();
    osc.type = "sine";
    const startFreq = 750 + iteration * 80;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(350, now + duration);

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.destination.inputNode);

    osc.start(now);
    osc.stop(now + duration);
  }
}

/**
 * Dramatic Alert Generator: GNSS loss alarm, solar flare interference, navigation lock.
 */
export class AlertToneGenerator {
  private readonly context: IAudioContext;
  private readonly destination: AudioBus;
  private activeAlarmOsc: IOscillatorNode | null = null;
  private activeAlarmGain: IGainNode | null = null;

  constructor(context: IAudioContext, destination: AudioBus) {
    this.context = context;
    this.destination = destination;
  }

  public triggerGnssLossAlert(): void {
    this.stopActiveAlarm();
    const now = this.context.currentTime;
    const duration = 1.4;

    const osc1 = this.context.createOscillator();
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(580, now);

    const osc2 = this.context.createOscillator();
    osc2.type = "sawtooth";
    osc2.frequency.setValueAtTime(615, now); // Dissonant minor second beat

    const filter = this.context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1400, now);

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.2, now);
    // Two pulses
    gain.gain.setValueAtTime(0.2, now + 0.3);
    gain.gain.setValueAtTime(0.0, now + 0.4);
    gain.gain.setValueAtTime(0.2, now + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.destination.inputNode);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);

    this.activeAlarmOsc = osc1;
    this.activeAlarmGain = gain;
  }

  public triggerNavigationLockTone(): void {
    const now = this.context.currentTime;
    const duration = 1.8;

    // Harmonic triad: 220 Hz (A3), 330 Hz (E4), 440 Hz (A4)
    const freqs = [220, 330, 440];
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    gain.connect(this.destination.inputNode);

    for (const freq of freqs) {
      const osc = this.context.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + duration);
    }
  }

  public triggerSolarInterferenceSwell(duration_s = 6.0): void {
    const now = this.context.currentTime;
    const buffer = createNoiseBuffer(this.context, 2.0);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1800, now);
    filter.Q.setValueAtTime(3.0, now);

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 1.5);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration_s);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.destination.inputNode);

    source.start(now);
    source.stop(now + duration_s);
  }

  public stopActiveAlarm(): void {
    try {
      this.activeAlarmOsc?.stop();
      this.activeAlarmOsc?.disconnect();
      this.activeAlarmGain?.disconnect();
    } catch {
      // Ignore
    }
    this.activeAlarmOsc = null;
    this.activeAlarmGain = null;
  }
}

/**
 * Cinematic Climax Source: Multi-octave harmonic wash for Scene 18 final reveal.
 */
export class CinematicClimaxGenerator {
  private readonly context: IAudioContext;
  private readonly destination: AudioBus;

  constructor(context: IAudioContext, destination: AudioBus) {
    this.context = context;
    this.destination = destination;
  }

  public triggerCosmicReveal(duration_s = 10.0): void {
    const now = this.context.currentTime;
    // Multi-octave harmonic series: 110, 220, 330, 440, 660, 880 Hz
    const freqs = [110, 220, 330, 440, 660, 880];

    const masterGain = this.context.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(0.28, now + 3.0);
    masterGain.gain.setValueAtTime(0.28, now + duration_s - 3.0);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration_s);
    masterGain.connect(this.destination.inputNode);

    for (const freq of freqs) {
      const osc = this.context.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      osc.connect(masterGain);
      osc.start(now);
      osc.stop(now + duration_s);
    }
  }
}
