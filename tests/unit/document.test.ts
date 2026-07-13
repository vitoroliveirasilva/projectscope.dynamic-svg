import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createSvgDocument } from "../../src/core/render/document.js";

describe("createSvgDocument", () => {
  it("creates an accessible SVG document", () => {
    const svg = createSvgDocument({
      width: 600,
      height: 200,
      title: "Title & status",
      description: "Description <safe>",
      trustedContent: '<rect width="10" height="10"/>',
    });

    assert.match(svg, /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.match(svg, /viewBox="0 0 600 200"/);
    assert.match(svg, /aria-labelledby="card-title card-description"/);
    assert.match(svg, /<title id="card-title">Title &amp; status<\/title>/);
    assert.match(svg, /<desc id="card-description">Description &lt;safe&gt;<\/desc>/);
    assert.doesNotMatch(svg, /<script/);
  });

  for (const width of [0, -1, 4097, 1.5, Number.NaN]) {
    it(`rejects invalid width ${String(width)}`, () => {
      assert.throws(
        () =>
          createSvgDocument({
            width,
            height: 200,
            title: "Title",
            description: "Description",
            trustedContent: "",
          }),
        /width must be an integer/,
      );
    });
  }
});
