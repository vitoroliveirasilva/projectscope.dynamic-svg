import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { MemoryCache } from "../../src/core/cache/memory-cache.js";

describe("MemoryCache", () => {
  it("returns values until their TTL expires", () => {
    let now = 1_000;
    const cache = new MemoryCache<string>({ now: () => now });

    cache.set("key", "value", 2);
    assert.equal(cache.get("key"), "value");

    now = 3_000;
    assert.equal(cache.get("key"), undefined);
    assert.equal(cache.size, 0);
  });

  it("evicts the least recently used entry at capacity", () => {
    const cache = new MemoryCache<number>({ maximumEntries: 2, now: () => 1_000 });

    cache.set("first", 1, 60);
    cache.set("second", 2, 60);
    assert.equal(cache.get("first"), 1);
    cache.set("third", 3, 60);

    assert.equal(cache.get("second"), undefined);
    assert.equal(cache.get("first"), 1);
    assert.equal(cache.get("third"), 3);
  });

  it("supports explicit removal and clearing", () => {
    const cache = new MemoryCache<number>();
    cache.set("one", 1, 60);
    cache.set("two", 2, 60);

    assert.equal(cache.delete("one"), true);
    cache.clear();
    assert.equal(cache.size, 0);
  });
});
