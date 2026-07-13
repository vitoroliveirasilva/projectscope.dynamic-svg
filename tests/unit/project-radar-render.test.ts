import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { renderProjectRadar } from "../../src/cards/project-radar/render.js";
import { selectProjectRadar } from "../../src/cards/project-radar/select.js";
import { parseProjectRadarParams } from "../../src/cards/project-radar/params.js";
import { FakeProjectProvider, repositoryFixture } from "../fixtures/project-provider.js";

const NOW = new Date("2026-07-13T12:00:00.000Z");

describe("renderProjectRadar", () => {
  it("renders an accessible and safe SVG", async () => {
    const provider = new FakeProjectProvider({
      repositories: [
        repositoryFixture({
          name: '<script onload="alert(1)">',
          fullName: "owner/unsafe",
          primaryLanguage: "TypeScript & XML",
        }),
      ],
    });
    const model = await selectProjectRadar({
      provider,
      params: parseProjectRadarParams({ username: "vitoroliveirasilva" }),
      now: NOW,
    });
    const svg = renderProjectRadar(model);

    assert.match(svg, /<svg/);
    assert.match(svg, /<title/);
    assert.match(svg, /<desc/);
    assert.match(svg, /PROJECT RADAR/);
    assert.match(svg, /&lt;script/);
    assert.doesNotMatch(svg, /<script/);
    assert.doesNotMatch(svg, /<foreignObject/);
    assert.doesNotMatch(svg, /<[^>]+\son[a-z]+=/i);
  });

  it("omits repository labels when disabled", async () => {
    const provider = new FakeProjectProvider();
    const model = await selectProjectRadar({
      provider,
      params: parseProjectRadarParams({
        username: "vitoroliveirasilva",
        labels: "false",
      }),
      now: NOW,
    });
    const svg = renderProjectRadar(model);

    assert.doesNotMatch(svg, />projectscope\.dynamic-svg<\/text>/);
    assert.match(svg, /1 projeto/);
  });
});
