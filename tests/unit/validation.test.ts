import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AppError } from "../../src/core/errors/app-error.js";
import { parseCommonCardParams } from "../../src/core/validation/common-params.js";
import {
  parseBoolean,
  parseHexColor,
  parseInteger,
  parseList,
} from "../../src/core/validation/primitives.js";

describe("validation primitives", () => {
  it("parses supported boolean representations", () => {
    assert.equal(parseBoolean("true", false, "enabled"), true);
    assert.equal(parseBoolean("1", false, "enabled"), true);
    assert.equal(parseBoolean("FALSE", true, "enabled"), false);
    assert.equal(parseBoolean("0", true, "enabled"), false);
  });

  it("rejects invalid booleans as public request errors", () => {
    assert.throws(
      () => parseBoolean("yes", false, "enabled"),
      (error) => error instanceof AppError && error.code === "INVALID_REQUEST",
    );
  });

  it("parses bounded integers", () => {
    assert.equal(
      parseInteger("640", { name: "width", minimum: 320, maximum: 1200, fallback: 600 }),
      640,
    );
    assert.equal(
      parseInteger(undefined, { name: "width", minimum: 320, maximum: 1200, fallback: 600 }),
      600,
    );
  });

  it("normalizes hexadecimal colors", () => {
    assert.equal(parseHexColor("#0d1117", "background"), "0D1117");
    assert.throws(() => parseHexColor("red", "background"), AppError);
  });

  it("deduplicates lists while preserving order", () => {
    assert.deepEqual(parseList("alpha, beta,alpha,,gamma", { name: "exclude" }), [
      "alpha",
      "beta",
      "gamma",
    ]);
  });
});

describe("parseCommonCardParams", () => {
  it("applies defaults and maps shared parameters", () => {
    assert.deepEqual(
      parseCommonCardParams(
        {
          username: "vitoroliveirasilva",
          hide_border: "1",
          accent: "3776ab",
        },
        { defaultWidth: 600 },
      ),
      {
        username: "vitoroliveirasilva",
        theme: "github-dark",
        locale: "pt-BR",
        width: 600,
        hideBorder: true,
        colors: { accent: "3776AB" },
      },
    );
  });

  it("falls back to the default theme when the name is unknown", () => {
    const params = parseCommonCardParams(
      { username: "vitoroliveirasilva", theme: "unknown" },
      { defaultWidth: 600 },
    );

    assert.equal(params.theme, "github-dark");
  });

  it("rejects malformed GitHub usernames", () => {
    assert.throws(
      () => parseCommonCardParams({ username: "invalid_user" }, { defaultWidth: 600 }),
      AppError,
    );
  });

  it("rejects widths outside the card contract", () => {
    assert.throws(
      () =>
        parseCommonCardParams(
          { username: "vitoroliveirasilva", width: "200" },
          { defaultWidth: 600 },
        ),
      AppError,
    );
  });
});
