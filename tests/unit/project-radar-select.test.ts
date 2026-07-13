import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseProjectRadarParams } from "../../src/cards/project-radar/params.js";
import { selectProjectRadar } from "../../src/cards/project-radar/select.js";
import { AppError } from "../../src/core/errors/app-error.js";
import { FakeProjectProvider, repositoryFixture } from "../fixtures/project-provider.js";

const NOW = new Date("2026-07-13T12:00:00.000Z");
const daysAgo = (days: number): Date => new Date(NOW.getTime() - days * 86_400_000);

describe("selectProjectRadar", () => {
  it("selects active repositories and forwards filters", async () => {
    const provider = new FakeProjectProvider({
      repositories: [
        repositoryFixture({ name: "old", fullName: "owner/old", pushedAt: daysAgo(40) }),
        repositoryFixture({ name: "active", fullName: "owner/active", pushedAt: daysAgo(0) }),
        repositoryFixture({ name: "unknown", fullName: "owner/unknown", pushedAt: null }),
      ],
    });
    const params = parseProjectRadarParams({
      username: "vitoroliveirasilva",
      limit: "2",
      include_forks: "true",
      include_archived: "true",
      exclude: "ignored",
    });

    const model = await selectProjectRadar({ provider, params, now: NOW });

    assert.equal(model.points.length, 2);
    assert.equal(model.points[0]?.repositoryName, "active");
    assert.deepEqual(provider.lastRepositoryQuery, {
      includeForks: true,
      includeArchived: true,
      exclude: ["ignored"],
      maximum: 1_000,
    });
  });

  it("uses locale, center label and custom width", async () => {
    const provider = new FakeProjectProvider();
    const params = parseProjectRadarParams({
      username: "vitoroliveirasilva",
      width: "900",
      locale: "en-US",
      center_label: "Vitor",
    });

    const model = await selectProjectRadar({ provider, params, now: NOW });

    assert.equal(model.width, 900);
    assert.equal(model.height, 583);
    assert.equal(model.centerLabel, "Vitor");
    assert.equal(model.footerLabel, "Activity based on the latest push");
  });

  it("returns a public no-data error when there are no eligible projects", async () => {
    const provider = new FakeProjectProvider({
      repositories: [repositoryFixture({ pushedAt: null })],
    });
    const params = parseProjectRadarParams({ username: "vitoroliveirasilva" });

    await assert.rejects(
      selectProjectRadar({ provider, params, now: NOW }),
      (error: unknown) =>
        error instanceof AppError &&
        error.code === "NO_DATA" &&
        error.publicMessage === "Nenhum projeto disponível.",
    );
  });
});
