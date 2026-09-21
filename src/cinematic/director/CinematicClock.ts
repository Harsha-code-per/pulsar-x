/**
 * PULSAR-X: Cinematic Domain
 * Cinematic Clock: Decouples Wall Clock, Simulation Clock, and Cinematic Playhead.
 */

export interface ClockSnapshot {
  readonly wallClock_ms: number;
  readonly playhead_s: number;
  readonly playbackRate: number;
  readonly isRunning: boolean;
}

export class CinematicClock {
  private playhead_s = 0.0;
  private playbackRate = 1.0;
  private isRunning = false;
  private lastWallTime_ms = 0.0;

  constructor() {
    this.lastWallTime_ms = typeof performance !== "undefined" ? performance.now() : Date.now();
  }

  public start(): void {
    this.isRunning = true;
    this.lastWallTime_ms = typeof performance !== "undefined" ? performance.now() : Date.now();
  }

  public pause(): void {
    this.isRunning = false;
  }

  public resume(): void {
    this.isRunning = true;
    this.lastWallTime_ms = typeof performance !== "undefined" ? performance.now() : Date.now();
  }

  public reset(): void {
    this.playhead_s = 0.0;
    this.isRunning = false;
    this.lastWallTime_ms = typeof performance !== "undefined" ? performance.now() : Date.now();
  }

  public seek(targetTime_s: number): void {
    this.playhead_s = Math.max(0, targetTime_s);
    this.lastWallTime_ms = typeof performance !== "undefined" ? performance.now() : Date.now();
  }

  public setPlaybackRate(rate: number): void {
    this.playbackRate = Math.max(0.1, Math.min(10.0, rate));
  }

  public getPlaybackRate(): number {
    return this.playbackRate;
  }

  public getPlayhead(): number {
    return this.playhead_s;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Advances the clock by delta wall-clock time or explicit delta.
   * Returns elapsed playhead seconds.
   */
  public tick(explicitDelta_s?: number): number {
    if (!this.isRunning) {
      return 0.0;
    }

    let delta_s: number;
    if (explicitDelta_s !== undefined) {
      delta_s = explicitDelta_s;
    } else {
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      delta_s = Math.max(0, (now - this.lastWallTime_ms) / 1000.0);
      this.lastWallTime_ms = now;
    }

    // Clamp delta to prevent massive jumps when tab is backgrounded
    const clampedDelta = Math.min(0.25, delta_s);
    const scaledDelta = clampedDelta * this.playbackRate;
    this.playhead_s += scaledDelta;

    return scaledDelta;
  }

  public getSnapshot(): ClockSnapshot {
    return {
      wallClock_ms: typeof performance !== "undefined" ? performance.now() : Date.now(),
      playhead_s: this.playhead_s,
      playbackRate: this.playbackRate,
      isRunning: this.isRunning,
    };
  }
}
