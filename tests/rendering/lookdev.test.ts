/**
 * PULSAR-X: Rendering Domain Tests
 * Unit tests for Look-Development themes, postprocessing presets, and transitions.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  LOOKDEV_THEMES,
  POSTPROCESSING_PRESETS,
  resolveVisualTheme,
  mapNavigationStatusToVisualMode,
  lerpVisualThemes,
  VisualThemeMode,
  PostprocessingPreset,
} from "../../src/rendering/config/lookdev";
import type { NavigationStatus } from "../../src/types/navigation";

describe("Look-Development Theme System", () => {
  it("defines all five lookdev theme modes with valid physical and optical values", () => {
    const modes: VisualThemeMode[] = ["NOMINAL", "LOCKED", "DEGRADED", "CRITICAL", "CINEMATIC"];
    for (const mode of modes) {
      const theme = LOOKDEV_THEMES[mode];
      assert.ok(theme, `Theme for mode ${mode} must exist`);
      assert.equal(theme.mode, mode);
      assert.ok(theme.exposure > 0, "Exposure must be positive");
      assert.ok(theme.bloomThreshold >= 0 && theme.bloomThreshold <= 1.0, "Bloom threshold must be in [0, 1]");
      assert.ok(theme.bloomIntensity >= 0, "Bloom intensity must be non-negative");
      assert.ok(theme.vignetteDarkness >= 0 && theme.vignetteDarkness <= 1.0, "Vignette darkness in [0, 1]");
      assert.ok(theme.chromaticAberration >= 0, "Chromatic aberration must be non-negative");
      assert.ok(theme.hudAccentColor.startsWith("#"), "HUD accent color must be hex");
    }
  });

  it("applies postprocessing preset overrides correctly", () => {
    const presets: PostprocessingPreset[] = ["SCIENTIFIC", "CINEMATIC", "MINIMAL"];
    for (const preset of presets) {
      const resolved = resolveVisualTheme("NOMINAL", preset);
      assert.ok(resolved, `Resolved theme for preset ${preset} must exist`);
      if (preset === "MINIMAL") {
        assert.equal(resolved.bloomIntensity, 0.0);
        assert.equal(resolved.vignetteDarkness, 0.0);
        assert.equal(resolved.chromaticAberration, 0.0);
      } else if (preset === "SCIENTIFIC") {
        assert.equal(resolved.bloomIntensity, POSTPROCESSING_PRESETS.SCIENTIFIC.bloomIntensity);
        assert.equal(resolved.chromaticAberration, 0.0);
      }
    }
  });

  it("maps simulation NavigationStatus to correct VisualThemeMode", () => {
    const statusMap: Record<NavigationStatus, VisualThemeMode> = {
      LOCKED: "LOCKED",
      CONVERGING: "NOMINAL",
      UNINITIALIZED: "NOMINAL",
      DEGRADED: "DEGRADED",
      SINGULAR_GEOMETRY: "DEGRADED",
      BLACKOUT: "CRITICAL",
    };

    for (const [status, expectedMode] of Object.entries(statusMap)) {
      const mode = mapNavigationStatusToVisualMode(status as NavigationStatus);
      assert.equal(mode, expectedMode, `Status ${status} should map to ${expectedMode}`);
    }
  });

  it("smoothly interpolates between themes via lerpVisualThemes", () => {
    const nominal = LOOKDEV_THEMES.NOMINAL;
    const critical = LOOKDEV_THEMES.CRITICAL;

    const t0 = lerpVisualThemes(nominal, critical, 0.0);
    assert.equal(t0.mode, "NOMINAL");
    assert.equal(t0.exposure, nominal.exposure);
    assert.equal(t0.chromaticAberration, nominal.chromaticAberration);

    const t1 = lerpVisualThemes(nominal, critical, 1.0);
    assert.equal(t1.mode, "CRITICAL");
    assert.equal(t1.exposure, critical.exposure);
    assert.equal(t1.chromaticAberration, critical.chromaticAberration);

    const tMid = lerpVisualThemes(nominal, critical, 0.5);
    assert.ok(tMid.exposure > Math.min(nominal.exposure, critical.exposure));
    assert.ok(tMid.exposure < Math.max(nominal.exposure, critical.exposure));
    assert.equal(
      tMid.chromaticAberration,
      nominal.chromaticAberration + (critical.chromaticAberration - nominal.chromaticAberration) * 0.5
    );
  });
});
