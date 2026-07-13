import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  deriveRadarHeight,
  layoutRadar,
  resolveOrbitCount,
} from "../../src/cards/project-radar/layout.js";
import type { RadarProject } from "../../src/cards/project-radar/model.js";

function projects(count: number): RadarProject[] {
  return Array.from({ length: count }, (_, index) => ({
    name: `repository-${index + 1}`,
    fullName: `owner/repository-${index + 1}`,
    language: index % 2 === 0 ? "TypeScript" : "Python",
    activityLevel: ((index % 5) + 1) as RadarProject["activityLevel"],
    pushedAt: new Date(`2026-07-${String(13 - index).padStart(2, "0")}T12:00:00.000Z`),
    updatedAt: new Date(`2026-07-${String(13 - index).padStart(2, "0")}T12:00:00.000Z`),
  }));
}

describe("project radar layout", () => {
  it("derives bounded heights and orbit counts", () => {
    assert.equal(deriveRadarHeight(640), 420);
    assert.equal(deriveRadarHeight(420), 320);
    assert.equal(deriveRadarHeight(1200), 720);
    assert.equal(resolveOrbitCount(4), 1);
    assert.equal(resolveOrbitCount(5), 2);
    assert.equal(resolveOrbitCount(9), 3);
  });

  it("produces deterministic positions inside the canvas", () => {
    const options = {
      projects: projects(12),
      width: 760,
      height: 495,
      labels: true,
      showLanguage: true,
    } as const;
    const first = layoutRadar(options);
    const second = layoutRadar(options);

    assert.deepEqual(first, second);
    assert.equal(first.points.length, 12);
    assert.equal(first.orbitRadii.length, 3);

    for (const point of first.points) {
      assert.ok(point.x >= 0 && point.x <= options.width);
      assert.ok(point.y >= 0 && point.y <= options.height);
      assert.ok(point.radius >= 4 && point.radius <= 8);
    }
  });

  it("keeps points and suppresses labels when labels are disabled", () => {
    const result = layoutRadar({
      projects: projects(6),
      width: 640,
      height: 420,
      labels: false,
      showLanguage: true,
    });

    assert.equal(result.points.length, 6);
    assert.ok(result.points.every((point) => !point.showLabel));
    assert.ok(result.points.every((point) => !point.showLanguage));
  });
});
