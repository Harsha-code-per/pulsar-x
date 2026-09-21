/**
 * PULSAR-X: Cinematic Domain
 * Cinematic Director: Master Singleton Orchestrator for Real-Time 3D Film Experience.
 */

import { DirectorStateMachine, type DirectorState } from "./DirectorState";
import { CinematicClock } from "./CinematicClock";
import { CinematicEventBus, defaultCinematicEventBus, type CinematicEventType } from "./CinematicEventBus";
import { CinematicTimeline } from "./CinematicTimeline";
import { CINEMATIC_SCENE_CATALOG } from "../scenes/catalog";
import type { SceneDefinition } from "../scenes/types";
import { defaultCameraController, type CameraController } from "../../rendering/cameras/CameraController";
import { useCinematicStore } from "../../store/cinematic-store";
import { useTelemetryStore } from "../../store/telemetry-store";
import { useSimulationStore } from "../../store/simulation-store";
import { useVisualStore } from "../../store/visual-store";
import { evaluateTrigger, type CinematicTriggerContext } from "../triggers/types";
import { defaultCinematicAudioEngine } from "../audio/CinematicAudioEngine";

export class CinematicDirector {
  private stateMachine = new DirectorStateMachine("IDLE");
  private clock = new CinematicClock();
  private eventBus: CinematicEventBus;
  private timeline: CinematicTimeline;
  private cameraController: CameraController;

  private currentSceneIndex = -1;
  private currentShotIndex = -1;
  private unsubscribeWorkerEvents?: () => void;
  private recentWorkerEvents: CinematicEventType[] = [];

  constructor(
    scenes: readonly SceneDefinition[] = CINEMATIC_SCENE_CATALOG,
    eventBus: CinematicEventBus = defaultCinematicEventBus,
    cameraController: CameraController = defaultCameraController
  ) {
    this.timeline = new CinematicTimeline(scenes);
    this.eventBus = eventBus;
    this.cameraController = cameraController;

    // Sync state machine with Zustand store
    this.stateMachine.subscribe((state) => {
      useCinematicStore.getState().setDirectorState(state);
    });
  }

  public getState(): DirectorState {
    return this.stateMachine.getState();
  }

  public getClock(): CinematicClock {
    return this.clock;
  }

  public getEventBus(): CinematicEventBus {
    return this.eventBus;
  }

  public getTimeline(): CinematicTimeline {
    return this.timeline;
  }

  public init(): void {
    if (this.stateMachine.getState() !== "IDLE" && this.stateMachine.getState() !== "ERROR") {
      return;
    }

    this.stateMachine.transitionTo("LOADING");

    // Listen to worker events via telemetry store
    this.listenToWorkerEvents();

    this.clock.reset();
    defaultCinematicAudioEngine.syncWithCinematicClock(this.clock);
    this.currentSceneIndex = 0;
    this.currentShotIndex = 0;

    this.stateMachine.transitionTo("READY");
  }

  private listenToWorkerEvents(): void {
    if (this.unsubscribeWorkerEvents) {
      this.unsubscribeWorkerEvents();
    }

    // Subscribe to incoming worker event messages
    const unsub = useTelemetryStore.subscribe((state) => {
      if (state.recentEvents.length > 0) {
        const latest = state.recentEvents[0];
        const eventName = latest.event as CinematicEventType;
        if (!this.recentWorkerEvents.includes(eventName)) {
          this.recentWorkerEvents.push(eventName);
          this.eventBus.emit(eventName, latest.details, latest.timestamp_s);
        }
      }
    });

    this.unsubscribeWorkerEvents = unsub;
  }

  public start(): void {
    if (this.stateMachine.getState() === "IDLE") {
      this.init();
    }

    if (this.stateMachine.canTransitionTo("PLAYING")) {
      this.stateMachine.transitionTo("PLAYING");
    }

    this.cameraController.setDirectorMode(true);
    this.clock.start();
    defaultCinematicAudioEngine.start();

    useCinematicStore.getState().setDirectorActive(true);
    useCinematicStore.getState().setPresentationMode(true);

    // Apply first scene immediately
    this.enterScene(0);
  }

  public pause(): void {
    if (this.stateMachine.canTransitionTo("PAUSED")) {
      this.stateMachine.transitionTo("PAUSED");
      this.clock.pause();
      defaultCinematicAudioEngine.pause();
    }
  }

  public resume(): void {
    if (this.stateMachine.canTransitionTo("PLAYING")) {
      this.stateMachine.transitionTo("PLAYING");
      this.clock.resume();
      defaultCinematicAudioEngine.resume();
      this.cameraController.setDirectorMode(true);
      useCinematicStore.getState().setDirectorActive(true);
    }
  }

  public restart(): void {
    this.clock.reset();
    defaultCinematicAudioEngine.restart();
    this.currentSceneIndex = -1;
    this.currentShotIndex = -1;
    this.recentWorkerEvents = [];

    if (this.stateMachine.canTransitionTo("READY")) {
      this.stateMachine.transitionTo("READY");
    }

    this.start();
  }

  public seek(targetTime_s: number): void {
    const prevState = this.stateMachine.getState();
    if (this.stateMachine.canTransitionTo("SEEKING")) {
      this.stateMachine.transitionTo("SEEKING");
    }

    this.clock.seek(targetTime_s);
    defaultCinematicAudioEngine.onSeek(targetTime_s);
    this.cameraController.cancelTransition();

    const pos = this.timeline.resolvePosition(targetTime_s);
    this.enterScene(pos.sceneIndex, false);

    if (prevState === "PLAYING" && this.stateMachine.canTransitionTo("PLAYING")) {
      this.stateMachine.transitionTo("PLAYING");
    } else if (prevState === "PAUSED" && this.stateMachine.canTransitionTo("PAUSED")) {
      this.stateMachine.transitionTo("PAUSED");
    } else if (this.stateMachine.canTransitionTo("READY")) {
      this.stateMachine.transitionTo("READY");
    }
  }

  public skipToScene(sceneIndex: number): void {
    const scenes = this.timeline.getScenes();
    if (sceneIndex < 0 || sceneIndex >= scenes.length) return;
    const startTime = this.timeline.getSceneStartTime(sceneIndex);
    this.seek(startTime);
  }

  public nextScene(): void {
    if (this.currentSceneIndex < this.timeline.getScenes().length - 1) {
      this.skipToScene(this.currentSceneIndex + 1);
    }
  }

  public previousScene(): void {
    if (this.currentSceneIndex > 0) {
      this.skipToScene(this.currentSceneIndex - 1);
    }
  }

  public setPlaybackRate(rate: number): void {
    this.clock.setPlaybackRate(rate);
    useCinematicStore.getState().setPlaybackSpeed(rate);
  }

  public exit(): void {
    this.clock.pause();
    defaultCinematicAudioEngine.stop();
    this.cameraController.setDirectorMode(false);
    useCinematicStore.getState().setDirectorActive(false);
    useCinematicStore.getState().setPresentationMode(false);

    if (this.stateMachine.canTransitionTo("IDLE")) {
      this.stateMachine.transitionTo("IDLE");
    }
  }

  public complete(): void {
    if (this.stateMachine.canTransitionTo("COMPLETED")) {
      this.stateMachine.transitionTo("COMPLETED");
      this.clock.pause();
      defaultCinematicAudioEngine.stop();
      this.eventBus.emit("CINEMATIC_COMPLETE");
    }
  }

  private enterScene(sceneIndex: number, executeActions = true): void {
    const scenes = this.timeline.getScenes();
    if (sceneIndex < 0 || sceneIndex >= scenes.length) return;

    // Exit previous scene
    if (this.currentSceneIndex >= 0 && this.currentSceneIndex < scenes.length) {
      const prev = scenes[this.currentSceneIndex];
      prev.onExit?.({
        sceneIndex: this.currentSceneIndex,
        playhead_s: this.clock.getPlayhead(),
        telemetry: useTelemetryStore.getState().latestFrame,
      });
      this.eventBus.emit("SCENE_EXITED", { sceneId: prev.id, sceneKey: prev.key });
    }

    this.currentSceneIndex = sceneIndex;
    const scene = scenes[sceneIndex];
    defaultCinematicAudioEngine.setScene(scene.id);

    // Update visual theme in visual store
    useVisualStore.getState().setVisualThemeMode(scene.visualTheme);

    // Apply initial camera preset
    const telemetry = useTelemetryStore.getState().latestFrame;
    const adapter = useTelemetryStore.getState().adapter;
    const visual = adapter.getVisualState();
    const sc = visual?.truePositionRender ?? [100, 0, 0];
    const est = visual?.estimatedPositionRender ?? [100, 0, 0];

    if (scene.shots.length > 0) {
      this.currentShotIndex = 0;
      this.cameraController.applyShot(scene.shots[0], {
        spacecraftPosRender: sc,
        estimatedPosRender: est,
        velocityRender: [0, 0, 0],
        earthPosRender: [92, 0, -18],
        activePulsarId: null,
      });
    } else {
      this.cameraController.applyPreset(scene.cameraPreset, {
        spacecraftPosRender: sc,
        estimatedPosRender: est,
        velocityRender: [0, 0, 0],
        earthPosRender: [92, 0, -18],
        activePulsarId: null,
      });
    }

    // Execute simulation actions if defined and enabled
    if (executeActions && scene.simulationActions) {
      const client = useSimulationStore.getState().client;
      const setPlaybackMultiplier = useSimulationStore.getState().setPlayback;
      scene.simulationActions({ client, setPlaybackMultiplier }).catch((err) => {
        console.error(`[CinematicDirector] Error executing simulation actions in scene ${scene.key}:`, err);
      });
    }

    // Call onEnter
    scene.onEnter?.({
      sceneIndex,
      playhead_s: this.clock.getPlayhead(),
      telemetry,
    });

    this.eventBus.emit("SCENE_ENTERED", { sceneId: scene.id, sceneKey: scene.key });

    // Update cinematic store
    useCinematicStore.getState().setActiveSceneIndex(sceneIndex);
    useCinematicStore.getState().setActiveShotIndex(0);
    useCinematicStore.getState().setCaptions(scene.hud.captions);
    useCinematicStore.getState().setAlert(scene.hud.alert ?? null);
  }

  /**
   * Main per-frame update loop called from rendering frame.
   */
  public update(delta_s: number): void {
    if (this.stateMachine.getState() !== "PLAYING") {
      return;
    }

    this.clock.tick(delta_s);
    const playhead_s = this.clock.getPlayhead();
    const totalDuration_s = this.timeline.getTotalDuration();
    defaultCinematicAudioEngine.update(delta_s, playhead_s);

    // Check completion
    if (playhead_s >= totalDuration_s) {
      this.complete();
      return;
    }

    const pos = this.timeline.resolvePosition(playhead_s);

    // Scene transition check
    if (pos.sceneIndex !== this.currentSceneIndex) {
      this.enterScene(pos.sceneIndex);
    } else if (pos.shotIndex !== this.currentShotIndex && pos.shot) {
      this.currentShotIndex = pos.shotIndex;
      useCinematicStore.getState().setActiveShotIndex(pos.shotIndex);

      const adapter = useTelemetryStore.getState().adapter;
      const visual = adapter.getVisualState();
      const sc = visual?.truePositionRender ?? [100, 0, 0];
      const est = visual?.estimatedPositionRender ?? [100, 0, 0];

      this.cameraController.applyShot(pos.shot, {
        spacecraftPosRender: sc,
        estimatedPosRender: est,
        velocityRender: [0, 0, 0],
        earthPosRender: [92, 0, -18],
        activePulsarId: null,
      });
    }

    // Evaluate scene triggers
    const currentScene = pos.scene;
    const telemetry = useTelemetryStore.getState().latestFrame;
    const triggerContext: CinematicTriggerContext = {
      playhead_s,
      sceneElapsed_s: pos.intraSceneTime_s,
      telemetry,
      activeEvents: this.recentWorkerEvents,
    };

    // Sort triggers by priority descending
    const sortedTriggers = [...currentScene.triggers].sort((a, b) => b.priority - a.priority);
    for (const trigger of sortedTriggers) {
      if (evaluateTrigger(trigger, triggerContext)) {
        if (trigger.id.endsWith("_complete")) {
          // Advance to next scene
          if (pos.sceneIndex < this.timeline.getScenes().length - 1) {
            this.skipToScene(pos.sceneIndex + 1);
          } else {
            this.complete();
          }
          break;
        }
      }
    }

    // Synchronize playhead state with store
    useCinematicStore.getState().setPlayhead(playhead_s, totalDuration_s);
  }

  public dispose(): void {
    if (this.unsubscribeWorkerEvents) {
      this.unsubscribeWorkerEvents();
    }
    this.clock.reset();
    this.eventBus.clear();
  }
}

/** Global singleton director instance */
export const defaultCinematicDirector = new CinematicDirector();
