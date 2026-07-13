import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createSvgResponse } from "../../src/core/http/card-response.js";

describe("createSvgResponse", () => {
  it("adds cache, content type and security headers", () => {
    const response = createSvgResponse("<svg/>", {
      headers: {
        "X-ProjectScope-Card": "test-card",
        "X-Content-Type-Options": "unsafe-override",
      },
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.headers?.["Content-Type"], "image/svg+xml; charset=utf-8");
    assert.equal(response.headers?.["X-Content-Type-Options"], "nosniff");
    assert.equal(response.headers?.["Access-Control-Allow-Origin"], "*");
    assert.equal(response.headers?.["Cross-Origin-Resource-Policy"], "cross-origin");
    assert.equal(response.headers?.["Referrer-Policy"], "no-referrer");
    assert.match(String(response.headers?.["Content-Security-Policy"] ?? ""), /default-src 'none'/);
    assert.equal(response.headers?.["X-ProjectScope-Card"], "test-card");
    assert.equal(response.body, "<svg/>");
  });

  it("omits the body for HEAD responses", () => {
    const response = createSvgResponse("<svg/>", { omitBody: true });
    assert.equal(response.body, "");
  });
});
