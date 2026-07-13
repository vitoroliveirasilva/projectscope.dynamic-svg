import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseProjectRadarParams } from "../../src/cards/project-radar/params.js";

describe("parseProjectRadarParams", () => {
  it("uses documented defaults", () => {
    const params = parseProjectRadarParams({ username: "vitoroliveirasilva" });

    assert.equal(params.width, 640);
    assert.equal(params.limit, 6);
    assert.equal(params.labels, true);
    assert.equal(params.showLanguage, true);
    assert.equal(params.includeForks, false);
    assert.equal(params.includeArchived, false);
    assert.equal(params.sort, "activity");
    assert.equal(params.layout, "orbit");
    assert.equal(params.centerLabel, "vitoroliveirasilva");
  });

  it("normalizes supported values", () => {
    const params = parseProjectRadarParams({
      username: "vitoroliveirasilva",
      width: "900",
      limit: "12",
      labels: "false",
      show_language: "0",
      include_forks: "1",
      include_archived: "true",
      exclude: "repo-a, repo-b,repo-a",
      sort: "ACTIVITY",
      layout: "ORBIT",
      center_label: "  Vitor  ",
      locale: "en-US",
    });

    assert.equal(params.width, 900);
    assert.equal(params.limit, 12);
    assert.equal(params.labels, false);
    assert.equal(params.showLanguage, false);
    assert.equal(params.includeForks, true);
    assert.equal(params.includeArchived, true);
    assert.deepEqual(params.exclude, ["repo-a", "repo-b"]);
    assert.equal(params.centerLabel, "Vitor");
    assert.equal(params.locale, "en-US");
  });

  const invalidCases: ReadonlyArray<readonly [Record<string, string>, RegExp]> = [
    [{ username: "vitor", limit: "0" }, /limit/],
    [{ username: "vitor", limit: "13" }, /limit/],
    [{ username: "vitor", sort: "stars" }, /sort/],
    [{ username: "vitor", layout: "grid" }, /layout/],
    [{ username: "vitor", center_label: "x".repeat(33) }, /center_label/],
    [{ username: "vitor", center_label: "bad\nlabel" }, /center_label/],
  ];

  for (const [query, expected] of invalidCases) {
    it(`rejects invalid ${Object.keys(query).at(-1)}`, () => {
      assert.throws(() => parseProjectRadarParams(query), expected);
    });
  }
});
