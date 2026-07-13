import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatRelativeDate, resolveActivityState } from "../../src/shared/date-time.js";

const NOW = new Date("2026-07-13T12:00:00.000Z");

describe("date-time helpers", () => {
  it("resolves all activity thresholds", () => {
    assert.equal(resolveActivityState(new Date("2026-07-13T11:30:00.000Z"), NOW), "active");
    assert.equal(resolveActivityState(new Date("2026-07-13T10:00:00.000Z"), NOW), "recent");
    assert.equal(resolveActivityState(new Date("2026-07-10T12:00:00.000Z"), NOW), "warm");
    assert.equal(resolveActivityState(new Date("2026-06-20T12:00:00.000Z"), NOW), "quiet");
    assert.equal(resolveActivityState(new Date("2026-05-01T12:00:00.000Z"), NOW), "idle");
  });

  it("formats relative dates in both locales", () => {
    const date = new Date("2026-07-13T10:00:00.000Z");
    assert.equal(formatRelativeDate(date, NOW, "pt-BR"), "há 2 horas");
    assert.equal(formatRelativeDate(date, NOW, "en-US"), "2 hours ago");
  });

  it("uses an absolute date for older activity", () => {
    const date = new Date("2026-05-01T12:00:00.000Z");
    assert.match(formatRelativeDate(date, NOW, "pt-BR"), /2026/);
  });
});
