/**
 * PULSAR-X: Cinematic Domain - Audio Subsystem
 * AudioBus: Logical mixing bus with gain, mute, pan, and smooth parameter ramps.
 */

import type {
  AudioBusType,
  IAudioContext,
  IAudioNode,
  IGainNode,
  IStereoPannerNode,
} from "./audioTypes";

export class AudioBus {
  public readonly type: AudioBusType;
  private readonly context: IAudioContext;
  private readonly gainNode: IGainNode;
  private readonly pannerNode?: IStereoPannerNode;
  private currentGain = 1.0;
  private targetGain = 1.0;
  private isMuted = false;

  constructor(type: AudioBusType, context: IAudioContext, enablePanner = false) {
    this.type = type;
    this.context = context;
    this.gainNode = context.createGain();

    if (enablePanner && typeof context.createStereoPanner === "function") {
      this.pannerNode = context.createStereoPanner();
      this.gainNode.connect(this.pannerNode);
    }
  }

  public get inputNode(): IAudioNode {
    return this.gainNode;
  }

  public get outputNode(): IAudioNode {
    return this.pannerNode ? this.pannerNode : this.gainNode;
  }

  public connect(destination: IAudioNode): void {
    this.outputNode.connect(destination);
  }

  public setGain(value: number, rampDuration_s = 0.05): void {
    const clamped = Math.max(0, Math.min(2.0, value));
    this.targetGain = clamped;

    if (this.isMuted) {
      return;
    }

    this.currentGain = clamped;
    const now = this.context.currentTime;
    try {
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
      if (rampDuration_s > 0) {
        this.gainNode.gain.linearRampToValueAtTime(clamped, now + rampDuration_s);
      } else {
        this.gainNode.gain.setValueAtTime(clamped, now);
      }
    } catch {
      this.gainNode.gain.value = clamped;
    }
  }

  public getGain(): number {
    return this.currentGain;
  }

  public getEffectiveGain(): number {
    return this.gainNode.gain.value;
  }

  public setPan(panValue: number): void {
    if (!this.pannerNode) return;
    const clamped = Math.max(-1.0, Math.min(1.0, panValue));
    const now = this.context.currentTime;
    try {
      this.pannerNode.pan.cancelScheduledValues(now);
      this.pannerNode.pan.setValueAtTime(clamped, now);
    } catch {
      this.pannerNode.pan.value = clamped;
    }
  }

  public mute(rampDuration_s = 0.05): void {
    if (this.isMuted) return;
    this.isMuted = true;
    const now = this.context.currentTime;
    try {
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
      this.gainNode.gain.linearRampToValueAtTime(0.0, now + rampDuration_s);
    } catch {
      this.gainNode.gain.value = 0.0;
    }
  }

  public unmute(rampDuration_s = 0.05): void {
    if (!this.isMuted) return;
    this.isMuted = false;
    const now = this.context.currentTime;
    try {
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setValueAtTime(0.0, now);
      this.gainNode.gain.linearRampToValueAtTime(this.targetGain, now + rampDuration_s);
      this.currentGain = this.targetGain;
    } catch {
      this.gainNode.gain.value = this.targetGain;
      this.currentGain = this.targetGain;
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }
}
