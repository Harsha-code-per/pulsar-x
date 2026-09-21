/**
 * PULSAR-X: Cinematic Domain Tests
 * Unit tests for AudioEventRouter, event-to-sound mappings, and duplicate suppression.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AudioEventRouter } from "../../../src/cinematic/audio/AudioEventRouter";
import { CinematicEventBus } from "../../../src/cinematic/director/CinematicEventBus";
import { MockAudioContext } from "./audio-mocks";
import { AudioMixer } from "../../../src/cinematic/audio/AudioMixer";
import {
  AlertToneGenerator,
  CinematicClimaxGenerator,
  MainEngineBurnSource,
  NavigationComputeSonifier,
  PhotonBatchClicker,
  PulsarSonificationSystem,
  RcsBurstSource,
} from "../../../src/cinematic/audio/AudioSources";

describe("AudioEventRouter & Event-to-Sound Mapping", () => {
  it("routes GNSS_LOST and NAVIGATION_LOCKED events without throwing", () => {
    const ctx = new MockAudioContext();
    const mixer = new AudioMixer(ctx);
    const eventBus = new CinematicEventBus();

    const sources = {
      mainEngine: new MainEngineBurnSource(ctx, mixer.getBus("SPACECRAFT")),
      rcs: new RcsBurstSource(ctx, mixer.getBus("SPACECRAFT")),
      pulsarSystem: new PulsarSonificationSystem(ctx, mixer.getBus("PULSAR")),
      photonClicker: new PhotonBatchClicker(ctx, mixer.getBus("TELEMETRY")),
      navCompute: new NavigationComputeSonifier(ctx, mixer.getBus("TELEMETRY")),
      alertTone: new AlertToneGenerator(ctx, mixer.getBus("ALERT")),
      climax: new CinematicClimaxGenerator(ctx, mixer.getBus("CINEMATIC")),
    };

    const router = new AudioEventRouter(eventBus, sources);

    // Emit events
    eventBus.emit("GNSS_LOST", { snr_db: 11.2 });
    eventBus.emit("NAVIGATION_LOCKED", { positionError_m: 1420 });

    assert.ok(true, "Events dispatched cleanly");
    router.dispose();
    mixer.dispose();
  });

  it("suppresses rapid duplicate event triggers within debounce window", () => {
    const ctx = new MockAudioContext();
    const mixer = new AudioMixer(ctx);
    const eventBus = new CinematicEventBus();

    let triggerCount = 0;
    const alertMock = {
      triggerGnssLossAlert: () => {
        triggerCount++;
      },
      triggerNavigationLockTone: () => {},
      triggerSolarInterferenceSwell: () => {},
      stopActiveAlarm: () => {},
    } as unknown as AlertToneGenerator;

    const sources = {
      mainEngine: new MainEngineBurnSource(ctx, mixer.getBus("SPACECRAFT")),
      rcs: new RcsBurstSource(ctx, mixer.getBus("SPACECRAFT")),
      pulsarSystem: new PulsarSonificationSystem(ctx, mixer.getBus("PULSAR")),
      photonClicker: new PhotonBatchClicker(ctx, mixer.getBus("TELEMETRY")),
      navCompute: new NavigationComputeSonifier(ctx, mixer.getBus("TELEMETRY")),
      alertTone: alertMock,
      climax: new CinematicClimaxGenerator(ctx, mixer.getBus("CINEMATIC")),
    };

    const router = new AudioEventRouter(eventBus, sources);

    // Emit three rapid GNSS_LOST events
    eventBus.emit("GNSS_LOST");
    eventBus.emit("GNSS_LOST");
    eventBus.emit("GNSS_LOST");

    // Only the first should have been dispatched due to duplicate suppression
    assert.equal(triggerCount, 1);

    router.dispose();
    mixer.dispose();
  });

  it("routes PULSAR_ACQUIRED and updates active pulsars", () => {
    const ctx = new MockAudioContext();
    const mixer = new AudioMixer(ctx);
    const eventBus = new CinematicEventBus();

    let acquiredPulsar: string | null = null;
    const pulsarMock = {
      setActivePulsars: (ids: readonly string[]) => {
        acquiredPulsar = ids[0] ?? null;
      },
      update: () => {},
      reset: () => {},
      setEnabled: () => {},
    } as unknown as PulsarSonificationSystem;

    const sources = {
      mainEngine: new MainEngineBurnSource(ctx, mixer.getBus("SPACECRAFT")),
      rcs: new RcsBurstSource(ctx, mixer.getBus("SPACECRAFT")),
      pulsarSystem: pulsarMock,
      photonClicker: new PhotonBatchClicker(ctx, mixer.getBus("TELEMETRY")),
      navCompute: new NavigationComputeSonifier(ctx, mixer.getBus("TELEMETRY")),
      alertTone: new AlertToneGenerator(ctx, mixer.getBus("ALERT")),
      climax: new CinematicClimaxGenerator(ctx, mixer.getBus("CINEMATIC")),
    };

    const router = new AudioEventRouter(eventBus, sources);

    eventBus.emit("PULSAR_ACQUIRED", { pulsarId: "PSR_B1937+21" });
    assert.equal(acquiredPulsar, "PSR_B1937+21");

    router.dispose();
    mixer.dispose();
  });
});
