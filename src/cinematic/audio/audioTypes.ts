/**
 * PULSAR-X: Cinematic Domain - Audio Subsystem
 * Audio Types and Mockable Web Audio Interfaces.
 *
 * All audio is presentation-only instrument sonification and onboard spacecraft
 * acoustics; no sound propagates through physical vacuum.
 */

export type AudioBusType =
  | "MASTER"
  | "AMBIENCE"
  | "SPACECRAFT"
  | "PULSAR"
  | "TELEMETRY"
  | "ALERT"
  | "CINEMATIC";

export type AudioContextStatus =
  | "uninitialized"
  | "suspended"
  | "running"
  | "closed";

/**
 * Minimal mockable Web Audio API interfaces to allow headless unit testing
 * in Node.js environments while seamlessly accepting native browser Web Audio nodes.
 */
export interface IAudioParam {
  value: number;
  setValueAtTime(value: number, startTime: number): IAudioParam;
  linearRampToValueAtTime(value: number, endTime: number): IAudioParam;
  exponentialRampToValueAtTime(value: number, endTime: number): IAudioParam;
  setTargetAtTime(target: number, startTime: number, timeConstant: number): IAudioParam;
  cancelScheduledValues(cancelTime: number): IAudioParam;
}

export interface IAudioNode {
  connect(destination: IAudioNode | IAudioParam): IAudioNode;
  disconnect(destination?: IAudioNode | IAudioParam): void;
}

export interface IGainNode extends IAudioNode {
  readonly gain: IAudioParam;
}

export interface IOscillatorNode extends IAudioNode {
  type: OscillatorType;
  readonly frequency: IAudioParam;
  readonly detune: IAudioParam;
  start(when?: number): void;
  stop(when?: number): void;
  onended?: (() => void) | null;
}

export interface IBiquadFilterNode extends IAudioNode {
  type: BiquadFilterType;
  readonly frequency: IAudioParam;
  readonly Q: IAudioParam;
  readonly gain: IAudioParam;
}

export interface IStereoPannerNode extends IAudioNode {
  readonly pan: IAudioParam;
}

export interface IDynamicsCompressorNode extends IAudioNode {
  readonly threshold: IAudioParam;
  readonly knee: IAudioParam;
  readonly ratio: IAudioParam;
  readonly attack: IAudioParam;
  readonly release: IAudioParam;
}

export interface IAudioBufferSourceNode extends IAudioNode {
  buffer: IAudioBuffer | null;
  playbackRate: IAudioParam;
  loop: boolean;
  loopStart: number;
  loopEnd: number;
  start(when?: number, offset?: number, duration?: number): void;
  stop(when?: number): void;
  onended?: (() => void) | null;
}

export interface IAudioBuffer {
  readonly sampleRate: number;
  readonly length: number;
  readonly duration: number;
  readonly numberOfChannels: number;
  getChannelData(channel: number): Float32Array;
  copyFromChannel(destination: Float32Array, channelNumber: number, bufferOffset?: number): void;
  copyToChannel(source: Float32Array, channelNumber: number, bufferOffset?: number): void;
}

export interface IAudioContext {
  readonly state: AudioContextState;
  readonly currentTime: number;
  readonly sampleRate: number;
  readonly destination: IAudioNode;
  createGain(): IGainNode;
  createOscillator(): IOscillatorNode;
  createBiquadFilter(): IBiquadFilterNode;
  createStereoPanner?(): IStereoPannerNode;
  createDynamicsCompressor(): IDynamicsCompressorNode;
  createBufferSource(): IAudioBufferSourceNode;
  createBuffer(numberOfChannels: number, length: number, sampleRate: number): IAudioBuffer;
  resume(): Promise<void>;
  suspend(): Promise<void>;
  close(): Promise<void>;
}

/**
 * Scene-aware audio configuration profile.
 */
export interface SceneAudioProfile {
  readonly sceneId: number;
  readonly sceneKey: string;
  readonly ambienceGain: number;
  readonly spacecraftGain: number;
  readonly pulsarGain: number;
  readonly telemetryGain: number;
  readonly alertGain: number;
  readonly cinematicGain: number;
  readonly activeSources: readonly string[];
  readonly fadeInDuration_s: number;
  readonly fadeOutDuration_s: number;
}

/**
 * Pulsar sonification parameter configuration.
 */
export interface PulsarSonificationConfig {
  readonly pulsarId: string;
  readonly baseFrequency_hz: number;
  readonly formants: readonly number[];
  readonly pulseWidth_s: number;
  readonly stereoPan: number;
  readonly clickGain: number;
  readonly subharmonicDivisor: number;
}

/**
 * Audio Engine configuration options.
 */
export interface AudioEngineConfig {
  readonly initialVolume?: number;
  readonly isMuted?: boolean;
  readonly customContextFactory?: () => IAudioContext;
}

/**
 * Reactive audio state snapshot for HUD and UI telemetry.
 */
export interface AudioStateSnapshot {
  readonly unlocked: boolean;
  readonly contextState: AudioContextStatus;
  readonly isMuted: boolean;
  readonly masterVolume: number;
  readonly busGains: Record<AudioBusType, number>;
  readonly activeSourcesCount: number;
  readonly activeSceneId: number;
}
