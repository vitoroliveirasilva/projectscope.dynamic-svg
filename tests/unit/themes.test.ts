import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { contrastRatio, resolveTheme } from "../../src/core/themes/resolve-theme.js";

describe("resolveTheme", () => {
  it("loads registered themes", () => {
    const theme = resolveTheme({ name: "github-light" });
    assert.equal(theme.name, "github-light");
    assert.equal(theme.colors.background, "#FFFFFF");
  });

  it("normalizes valid color overrides", () => {
    const theme = resolveTheme({
      overrides: {
        background: "ffffff",
        foreground: "111111",
        accent: "0969da",
        border: "d0d7de",
      },
    });

    assert.equal(theme.colors.background, "#FFFFFF");
    assert.equal(theme.colors.foreground, "#111111");
    assert.equal(theme.colors.accent, "#0969DA");
    assert.equal(theme.colors.border, "#D0D7DE");
  });

  it("replaces unreadable text overrides with a contrasting color", () => {
    const theme = resolveTheme({
      overrides: {
        background: "FFFFFF",
        foreground: "FEFEFE",
      },
    });

    assert.ok(contrastRatio(theme.colors.foreground, theme.colors.background) >= 4.5);
  });

  it("keeps transparent theme text readable against its reference surface", () => {
    const theme = resolveTheme({ name: "transparent" });
    assert.equal(theme.colors.background, "transparent");
    assert.ok(contrastRatio(theme.colors.foreground, theme.colors.surface) >= 4.5);
  });
});
