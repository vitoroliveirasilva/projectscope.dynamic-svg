import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { estimateTextWidth, truncateSvgText } from "../../src/core/render/text.js";

describe("SVG text helpers", () => {
  it("estimates wide characters as larger than narrow characters", () => {
    assert.ok(estimateTextWidth("MMMM", 14) > estimateTextWidth("iiii", 14));
  });

  it("preserves text that fits", () => {
    assert.equal(truncateSvgText("ProjectScope", 500, 14), "ProjectScope");
  });

  it("truncates text with an ellipsis", () => {
    assert.equal(truncateSvgText("ProjectScope Dynamic SVG", 60, 14).endsWith("…"), true);
  });
});
