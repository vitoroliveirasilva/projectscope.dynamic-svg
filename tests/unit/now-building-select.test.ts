import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AppError } from "../../src/core/errors/app-error.js";
import { parseNowBuildingParams } from "../../src/cards/now-building/params.js";
import { selectNowBuilding } from "../../src/cards/now-building/select.js";
import {
  commitFixture,
  FakeProjectProvider,
  repositoryFixture,
} from "../fixtures/project-provider.js";

const NOW = new Date("2026-07-13T13:00:00.000Z");

function params(query: Readonly<Record<string, string>> = {}) {
  return parseNowBuildingParams({ username: "vitoroliveirasilva", ...query });
}

describe("selectNowBuilding", () => {
  it("selects the first eligible repository returned by the provider", async () => {
    const newest = repositoryFixture({ name: "newest", fullName: "user/newest" });
    const provider = new FakeProjectProvider({ repositories: [newest] });

    const model = await selectNowBuilding({ provider, params: params(), now: NOW });

    assert.equal(model.repositoryName, "newest");
    assert.deepEqual(provider.lastRepositoryQuery, {
      includeForks: false,
      includeArchived: false,
      exclude: [],
      maximum: 1_000,
    });
  });

  it("ignores repositories without push activity in automatic mode", async () => {
    const provider = new FakeProjectProvider({
      repositories: [
        repositoryFixture({ name: "empty", fullName: "user/empty", pushedAt: null }),
        repositoryFixture({ name: "active", fullName: "user/active" }),
      ],
    });

    const model = await selectNowBuilding({ provider, params: params(), now: NOW });
    assert.equal(model.repositoryName, "active");
  });

  it("uses an explicit repository", async () => {
    const provider = new FakeProjectProvider({
      repository: repositoryFixture({ name: "explicit", fullName: "user/explicit" }),
    });

    const model = await selectNowBuilding({
      provider,
      params: params({ repository: "explicit" }),
      now: NOW,
    });

    assert.equal(model.repositoryName, "explicit");
  });

  it("rejects an explicit fork when forks are disabled", async () => {
    const provider = new FakeProjectProvider({
      repository: repositoryFixture({ isFork: true }),
    });

    await assert.rejects(
      selectNowBuilding({
        provider,
        params: params({ repository: "projectscope.dynamic-svg" }),
        now: NOW,
      }),
      (error: unknown) => error instanceof AppError && error.code === "NO_DATA",
    );
  });

  it("falls back to the default branch when an explicit branch is not found", async () => {
    const provider = new FakeProjectProvider({
      commitByBranch: {
        "feature/missing": new AppError({
          code: "NOT_FOUND",
          publicMessage: "Branch não encontrada.",
        }),
        dev: commitFixture({ branch: "dev" }),
      },
    });

    const model = await selectNowBuilding({
      provider,
      params: params({ branch: "feature/missing" }),
      now: NOW,
    });

    assert.deepEqual(provider.latestCommitBranches, ["feature/missing", "dev"]);
    assert.deepEqual(model.metadata, ["TypeScript", "dev"]);
    assert.equal(model.degraded, true);
  });

  it("marks the card as degraded when no commit is available", async () => {
    const provider = new FakeProjectProvider({ commit: null });
    const model = await selectNowBuilding({ provider, params: params(), now: NOW });

    assert.equal(model.commitMessage, undefined);
    assert.equal(model.degraded, true);
  });

  it("builds localized activity and relative labels", async () => {
    const provider = new FakeProjectProvider({
      repository: repositoryFixture({ pushedAt: new Date("2026-07-10T13:00:00.000Z") }),
      repositories: [repositoryFixture({ pushedAt: new Date("2026-07-10T13:00:00.000Z") })],
    });

    const model = await selectNowBuilding({
      provider,
      params: params({ locale: "en-US" }),
      now: NOW,
    });

    assert.equal(model.activityState, "warm");
    assert.equal(model.activityLabel, "Active this week");
    assert.equal(model.updatedLabel, "3 days ago");
  });

  it("throws NO_DATA when no repository has activity", async () => {
    const provider = new FakeProjectProvider({
      repositories: [repositoryFixture({ pushedAt: null })],
    });

    await assert.rejects(
      selectNowBuilding({ provider, params: params(), now: NOW }),
      (error: unknown) => error instanceof AppError && error.code === "NO_DATA",
    );
  });
});
