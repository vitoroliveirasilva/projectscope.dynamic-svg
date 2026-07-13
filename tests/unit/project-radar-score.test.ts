import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  compareRepositoriesByActivity,
  resolveActivityLevel,
} from "../../src/cards/project-radar/score.js";
import { repositoryFixture } from "../fixtures/project-provider.js";

const NOW = new Date("2026-07-13T12:00:00.000Z");
const daysAgo = (days: number): Date => new Date(NOW.getTime() - days * 86_400_000);

describe("project radar activity score", () => {
  it("maps activity to levels", () => {
    assert.equal(resolveActivityLevel(null, NOW), 0);
    assert.equal(resolveActivityLevel(daysAgo(0), NOW), 5);
    assert.equal(resolveActivityLevel(daysAgo(1), NOW), 5);
    assert.equal(resolveActivityLevel(daysAgo(2), NOW), 4);
    assert.equal(resolveActivityLevel(daysAgo(7), NOW), 4);
    assert.equal(resolveActivityLevel(daysAgo(8), NOW), 3);
    assert.equal(resolveActivityLevel(daysAgo(30), NOW), 3);
    assert.equal(resolveActivityLevel(daysAgo(31), NOW), 2);
    assert.equal(resolveActivityLevel(daysAgo(90), NOW), 2);
    assert.equal(resolveActivityLevel(daysAgo(91), NOW), 1);
  });

  it("orders by activity, push, update and name", () => {
    const repositories = [
      repositoryFixture({ name: "zeta", fullName: "owner/zeta", pushedAt: daysAgo(8) }),
      repositoryFixture({ name: "beta", fullName: "owner/beta", pushedAt: daysAgo(1) }),
      repositoryFixture({ name: "alpha", fullName: "owner/alpha", pushedAt: daysAgo(1) }),
    ];

    repositories.sort((first, second) => compareRepositoriesByActivity(first, second, NOW));

    assert.deepEqual(
      repositories.map((repository) => repository.name),
      ["alpha", "beta", "zeta"],
    );
  });
});
