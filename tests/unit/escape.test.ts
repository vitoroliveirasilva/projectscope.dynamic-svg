import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { escapeXml, sanitizeXmlText } from "../../src/core/render/escape.js";

describe("escapeXml", () => {
  it("escapes XML special characters", () => {
    assert.equal(
      escapeXml(`<tag attribute="value">Tom & Jerry's</tag>`),
      "&lt;tag attribute=&quot;value&quot;&gt;Tom &amp; Jerry&apos;s&lt;/tag&gt;",
    );
  });

  it("removes invalid XML control characters", () => {
    assert.equal(sanitizeXmlText("valid\u0000text\u000Bvalue"), "validtextvalue");
  });

  it("keeps regular Unicode content", () => {
    assert.equal(escapeXml("Projetos dinâmicos • ação"), "Projetos dinâmicos • ação");
  });
});
