import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AppError } from "../../src/core/errors/app-error.js";
import { parseNowBuildingParams } from "../../src/cards/now-building/params.js";

describe("parseNowBuildingParams", () => {
  it("applies documented defaults", () => {
    const params = parseNowBuildingParams({ username: "vitoroliveirasilva" });

    assert.equal(params.width, 600);
    assert.equal(params.theme, "github-dark");
    assert.equal(params.locale, "pt-BR");
    assert.equal(params.showDescription, true);
    assert.equal(params.showCommit, true);
    assert.equal(params.showLanguage, true);
    assert.equal(params.showBranch, true);
    assert.equal(params.showUpdated, true);
    assert.equal(params.compact, false);
    assert.deepEqual(params.exclude, []);
  });

  it("hides the description by default in compact mode", () => {
    const params = parseNowBuildingParams({
      username: "vitoroliveirasilva",
      compact: "true",
    });

    assert.equal(params.compact, true);
    assert.equal(params.showDescription, false);
  });

  it("allows description override in compact mode", () => {
    const params = parseNowBuildingParams({
      username: "vitoroliveirasilva",
      compact: "true",
      show_description: "true",
    });

    assert.equal(params.showDescription, true);
  });

  it("normalizes specific parameters", () => {
    const params = parseNowBuildingParams({
      username: "vitoroliveirasilva",
      repository: "projectscope.dynamic-svg",
      branch: " feat/card ",
      exclude: "repo-a, repo-b,repo-a",
      include_forks: "1",
      include_archived: "true",
      width: "800",
    });

    assert.equal(params.repository, "projectscope.dynamic-svg");
    assert.equal(params.branch, "feat/card");
    assert.deepEqual(params.exclude, ["repo-a", "repo-b"]);
    assert.equal(params.includeForks, true);
    assert.equal(params.includeArchived, true);
    assert.equal(params.width, 800);
  });

  const invalidCases: ReadonlyArray<readonly [Readonly<Record<string, string>>, RegExp]> = [
    [{ username: "vitoroliveirasilva", repository: "owner/repo" }, /Repositório/],
    [{ username: "vitoroliveirasilva", repository: "repo<script>" }, /Repositório/],
    [{ username: "vitoroliveirasilva", branch: "bad\nbranch" }, /Branch/],
    [{ username: "vitoroliveirasilva", width: "1200" }, /width/],
    [{ username: "vitoroliveirasilva", include_forks: "yes" }, /include_forks/],
  ];

  for (const [query, expected] of invalidCases) {
    it(`rejects invalid input matching ${expected}`, () => {
      assert.throws(
        () => parseNowBuildingParams(query),
        (error: unknown) => error instanceof AppError && expected.test(error.publicMessage),
      );
    });
  }
});
