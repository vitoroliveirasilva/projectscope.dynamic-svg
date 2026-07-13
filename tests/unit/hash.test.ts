import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { stableHash } from "../../src/shared/hash.js";

describe("stableHash", () => {
  it("returns deterministic unsigned values", () => {
    const first = stableHash("vitoroliveirasilva/projectscope.dynamic-svg");
    const second = stableHash("vitoroliveirasilva/projectscope.dynamic-svg");

    assert.equal(first, second);
    assert.ok(first >= 0);
    assert.ok(first <= 0xffffffff);
  });

  it("distinguishes different repository names", () => {
    assert.notEqual(stableHash("owner/repo-a"), stableHash("owner/repo-b"));
  });
});
