/**
 * PULSAR-X: Cinematic Domain - Audio Subsystem
 * AudioClock: Synchronizes Audio Presentation with CinematicClock and Handles Seek Invalidation.
 */

import type { CinematicClock } from "../director/CinematicClock";

export type AudioSeekListener = (targetTime_s: number) => void;

export class AudioClock {
  private cinematicClock: CinematicClock | null = null;
  private seekListeners: Set<AudioSeekListener> = new Set();
  private lastKnownPlayhead_s = 0.0;
  private playbackRate = 1.0;
  private isRunning = false;

  public syncWithCinematicClock(clock: CinematicClock): void {
    this.cinematicClock = clock;
    this.playbackRate = clock.getPlaybackRate();
    this.isRunning = clock.getIsRunning();
    this.lastKnownPlayhead_s = clock.getPlayhead();
  }

  public getPlayhead(): number {
    if (this.cinematicClock) {
      this.lastKnownPlayhead_s = this.cinematicClock.getPlayhead();
      return this.lastKnownPlayhead_s;
    }
    return this.lastKnownPlayhead_s;
  }

  public getPlaybackRate(): number {
    if (this.cinematicClock) {
      this.playbackRate = this.cinematicClock.getPlaybackRate();
      return this.playbackRate;
    }
    return this.playbackRate;
  }

  public getIsRunning(): boolean {
    if (this.cinematicClock) {
      this.isRunning = this.cinematicClock.getIsRunning();
      return this.isRunning;
    }
    return this.isRunning;
  }

  public onSeek(targetTime_s: number): void {
    this.lastKnownPlayhead_s = Math.max(0, targetTime_s);
    for (const listener of this.seekListeners) {
      try {
        listener(this.lastKnownPlayhead_s);
      } catch (err) {
        console.error("[AudioClock] Error in seek listener:", err);
      }
    }
  }

  public onPlaybackRateChange(rate: number): void {
    this.playbackRate = Math.max(0.1, Math.min(10.0, rate));
  }

  public onPause(): void {
    this.isRunning = false;
  }

  public onResume(): void {
    this.isRunning = true;
  }

  public addSeekListener(listener: AudioSeekListener): () => void {
    this.seekListeners.add(listener);
    return () => {
      this.seekListeners.delete(listener);
    };
  }

  public clear(): void {
    this.seekListeners.clear();
    this.cinematicClock = null;
  }
}
