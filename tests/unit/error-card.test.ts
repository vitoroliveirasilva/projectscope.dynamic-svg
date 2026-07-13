import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AppError, toAppError } from "../../src/core/errors/app-error.js";
import { renderErrorCard } from "../../src/core/errors/render-error-card.js";

describe("AppError", () => {
  it("uses status and retry defaults by code", () => {
    const error = new AppError({
      code: "RATE_LIMITED",
      publicMessage: "Limite temporário.",
    });

    assert.equal(error.statusCode, 429);
    assert.equal(error.retryable, true);
  });

  it("normalizes unknown errors without exposing their message", () => {
    const normalized = toAppError(new Error("secret internal detail"));
    assert.equal(normalized.code, "INTERNAL_ERROR");
    assert.equal(normalized.publicMessage, "Não foi possível gerar o card.");
    assert.doesNotMatch(normalized.publicMessage, /secret/);
  });
});

describe("renderErrorCard", () => {
  it("renders accessible and escaped SVG content", () => {
    const svg = renderErrorCard(
      new AppError({
        code: "INVALID_REQUEST",
        publicMessage: '<script onload="alert(1)">inválido</script>',
      }),
    );

    assert.match(svg, /<title/);
    assert.match(svg, /<desc/);
    assert.match(svg, /&lt;script/);
    assert.doesNotMatch(svg, /<script/);
    assert.doesNotMatch(svg, /<[^>]+\sonload=/i);
    assert.doesNotMatch(svg, /<foreignObject/);
  });

  it("supports a registered theme and bounded width", () => {
    const svg = renderErrorCard(
      new AppError({ code: "NOT_FOUND", publicMessage: "Projeto não encontrado." }),
      { theme: "github-light", width: 640 },
    );

    assert.match(svg, /width="640"/);
    assert.match(svg, /fill="#FFFFFF"/);
  });
});
