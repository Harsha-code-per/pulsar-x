/**
 * PULSAR-X: Cinematic Domain Tests
 * Lightweight Mock Web Audio API Implementation for Headless Node.js Unit Testing.
 */

import type {
  IAudioBuffer,
  IAudioBufferSourceNode,
  IAudioContext,
  IAudioNode,
  IAudioParam,
  IBiquadFilterNode,
  IDynamicsCompressorNode,
  IGainNode,
  IOscillatorNode,
  IStereoPannerNode,
} from "../../../src/cinematic/audio/audioTypes";

export class MockAudioParam implements IAudioParam {
  public value: number;

  constructor(initialValue = 0) {
    this.value = initialValue;
  }

  public setValueAtTime(value: number): IAudioParam {
    this.value = value;
    return this;
  }

  public linearRampToValueAtTime(value: number): IAudioParam {
    this.value = value;
    return this;
  }

  public exponentialRampToValueAtTime(value: number): IAudioParam {
    this.value = value;
    return this;
  }

  public setTargetAtTime(target: number): IAudioParam {
    this.value = target;
    return this;
  }

  public cancelScheduledValues(): IAudioParam {
    return this;
  }
}

export class MockAudioNode implements IAudioNode {
  public connectedTo: (IAudioNode | IAudioParam)[] = [];

  public connect(destination: IAudioNode | IAudioParam): IAudioNode {
    this.connectedTo.push(destination);
    return destination as IAudioNode;
  }

  public disconnect(): void {
    this.connectedTo = [];
  }
}

export class MockGainNode extends MockAudioNode implements IGainNode {
  public readonly gain: MockAudioParam = new MockAudioParam(1.0);
}

export class MockOscillatorNode extends MockAudioNode implements IOscillatorNode {
  public type: OscillatorType = "sine";
  public readonly frequency: MockAudioParam = new MockAudioParam(440);
  public readonly detune: MockAudioParam = new MockAudioParam(0);
  public isStarted = false;
  public isStopped = false;
  public onended: (() => void) | null = null;

  public start(): void {
    this.isStarted = true;
  }

  public stop(): void {
    this.isStopped = true;
    if (this.onended) {
      this.onended();
    }
  }
}

export class MockBiquadFilterNode extends MockAudioNode implements IBiquadFilterNode {
  public type: BiquadFilterType = "lowpass";
  public readonly frequency: MockAudioParam = new MockAudioParam(350);
  public readonly Q: MockAudioParam = new MockAudioParam(1);
  public readonly gain: MockAudioParam = new MockAudioParam(0);
}

export class MockStereoPannerNode extends MockAudioNode implements IStereoPannerNode {
  public readonly pan: MockAudioParam = new MockAudioParam(0);
}

export class MockDynamicsCompressorNode extends MockAudioNode implements IDynamicsCompressorNode {
  public readonly threshold: MockAudioParam = new MockAudioParam(-24);
  public readonly knee: MockAudioParam = new MockAudioParam(30);
  public readonly ratio: MockAudioParam = new MockAudioParam(12);
  public readonly attack: MockAudioParam = new MockAudioParam(0.003);
  public readonly release: MockAudioParam = new MockAudioParam(0.25);
}

export class MockAudioBuffer implements IAudioBuffer {
  public readonly sampleRate: number;
  public readonly length: number;
  public readonly duration: number;
  public readonly numberOfChannels: number;
  private channelData: Float32Array[];

  constructor(numberOfChannels: number, length: number, sampleRate: number) {
    this.numberOfChannels = numberOfChannels;
    this.length = length;
    this.sampleRate = sampleRate;
    this.duration = length / sampleRate;
    this.channelData = Array.from({ length: numberOfChannels }, () => new Float32Array(length));
  }

  public getChannelData(channel: number): Float32Array {
    return this.channelData[channel] ?? new Float32Array(this.length);
  }

  public copyFromChannel(destination: Float32Array, channelNumber: number): void {
    const data = this.getChannelData(channelNumber);
    destination.set(data);
  }

  public copyToChannel(source: Float32Array, channelNumber: number): void {
    const data = this.getChannelData(channelNumber);
    data.set(source);
  }
}

export class MockAudioBufferSourceNode extends MockAudioNode implements IAudioBufferSourceNode {
  public buffer: IAudioBuffer | null = null;
  public readonly playbackRate: MockAudioParam = new MockAudioParam(1.0);
  public loop = false;
  public loopStart = 0;
  public loopEnd = 0;
  public isStarted = false;
  public isStopped = false;
  public onended: (() => void) | null = null;

  public start(): void {
    this.isStarted = true;
  }

  public stop(): void {
    this.isStopped = true;
    if (this.onended) {
      this.onended();
    }
  }
}

export class MockAudioContext implements IAudioContext {
  public state: AudioContextState = "suspended";
  public currentTime = 0.0;
  public sampleRate = 48000;
  public readonly destination: MockAudioNode = new MockAudioNode();

  public createGain(): IGainNode {
    return new MockGainNode();
  }

  public createOscillator(): IOscillatorNode {
    return new MockOscillatorNode();
  }

  public createBiquadFilter(): IBiquadFilterNode {
    return new MockBiquadFilterNode();
  }

  public createStereoPanner(): IStereoPannerNode {
    return new MockStereoPannerNode();
  }

  public createDynamicsCompressor(): IDynamicsCompressorNode {
    return new MockDynamicsCompressorNode();
  }

  public createBufferSource(): IAudioBufferSourceNode {
    return new MockAudioBufferSourceNode();
  }

  public createBuffer(numberOfChannels: number, length: number, sampleRate: number): IAudioBuffer {
    return new MockAudioBuffer(numberOfChannels, length, sampleRate);
  }

  public async resume(): Promise<void> {
    this.state = "running";
  }

  public async suspend(): Promise<void> {
    this.state = "suspended";
  }

  public async close(): Promise<void> {
    this.state = "closed";
  }
}
