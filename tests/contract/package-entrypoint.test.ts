import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DEFAULT_THEME_NAME,
  THEME_NAMES,
  contrastRatio,
  createSvgDocument,
  escapeXml,
  estimateTextWidth,
  resolveTheme,
  sanitizeXmlText,
  truncateSvgText,
  type ThemeName,
} from "../../packages/svg-core/src/index.js";

describe("@vitoroliveirasilva/projectscope-svg-core", () => {
  it("exposes the stable rendering API", () => {
    const svg = createSvgDocument({
      width: 320,
      height: 120,
      title: "Package & contract",
      description: "Safe <SVG>",
      trustedContent: '<rect width="320" height="120"/>',
    });

    assert.match(svg, /Package &amp; contract/);
    assert.match(svg, /Safe &lt;SVG&gt;/);
    assert.equal(
      escapeXml('<script>alert("x")</script>'),
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
    );
    assert.equal(sanitizeXmlText("safe\u0000text"), "safetext");
    assert.ok(estimateTextWidth("ProjectScope", 16) > 0);
    assert.match(truncateSvgText("ProjectScope Dynamic SVG", 60, 16), /…$/);
  });

  it("exposes themes and contrast helpers", () => {
    const themeName: ThemeName = DEFAULT_THEME_NAME;
    const theme = resolveTheme({ name: themeName });

    assert.equal(theme.name, "github-dark");
    assert.ok(THEME_NAMES.includes(themeName));
    assert.ok(contrastRatio(theme.colors.foreground, theme.colors.background) >= 4.5);
  });
});
