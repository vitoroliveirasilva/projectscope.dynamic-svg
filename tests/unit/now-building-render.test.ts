import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveTheme } from "../../src/core/themes/resolve-theme.js";
import { renderNowBuilding } from "../../src/cards/now-building/render.js";
import type { NowBuildingViewModel } from "../../src/cards/now-building/model.js";

function model(overrides: Partial<NowBuildingViewModel> = {}): NowBuildingViewModel {
  return {
    width: 600,
    height: 210,
    hideBorder: false,
    compact: false,
    locale: "pt-BR",
    theme: resolveTheme(),
    username: "vitoroliveirasilva",
    repositoryName: "projectscope.dynamic-svg",
    description: "SVGs dinâmicos para projetos e atividade.",
    commitMessage: "feat: adiciona card now building",
    metadata: ["TypeScript", "dev"],
    activityState: "active",
    activityLabel: "Atividade agora",
    updatedLabel: "há 10 minutos",
    degraded: false,
    ...overrides,
  };
}

describe("renderNowBuilding", () => {
  it("renders an accessible and safe SVG", () => {
    const svg = renderNowBuilding(model());

    assert.match(svg, /<svg/);
    assert.match(svg, /<title/);
    assert.match(svg, /<desc/);
    assert.match(svg, /NOW BUILDING/);
    assert.match(svg, /projectscope\.dynamic-svg/);
    assert.doesNotMatch(svg, /<script/i);
    assert.doesNotMatch(svg, /<foreignObject/i);
    assert.doesNotMatch(svg, /\son[a-z]+=/i);
  });

  it("escapes untrusted text", () => {
    const svg = renderNowBuilding(
      model({
        repositoryName: '<script onload="alert(1)">',
        description: "A & B < C",
      }),
    );

    assert.doesNotMatch(svg, /<script/i);
    assert.match(svg, /&lt;script onload=&quot;alert\(1\)&quot;&gt;/);
    assert.match(svg, /A &amp; B &lt; C/);
  });

  it("uses compact dimensions and omits the description", () => {
    const { description: _description, ...compactModel } = model({ compact: true, height: 170 });
    const svg = renderNowBuilding(compactModel);

    assert.match(svg, /height="170"/);
    assert.doesNotMatch(svg, /SVGs dinâmicos/);
  });

  it("removes the border when requested", () => {
    const svg = renderNowBuilding(model({ hideBorder: true }));
    assert.doesNotMatch(svg, /stroke="#30363D"/);
  });

  it("truncates long visual content", () => {
    const longName = "a".repeat(300);
    const svg = renderNowBuilding(model({ repositoryName: longName }));

    assert.match(svg, /…/);
    assert.doesNotMatch(svg, new RegExp(longName));
  });
});
