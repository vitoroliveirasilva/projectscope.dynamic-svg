import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { loadAppConfig } from "../../src/config/app-config.js";

describe("loadAppConfig", () => {
  it("uses safe defaults", () => {
    const config = loadAppConfig({});

    assert.deepEqual(config, {
      githubApiBaseUrl: "https://api.github.com",
      cacheTtlSeconds: 300,
      cardCacheControl: "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
      logLevel: "info",
      environment: "development",
    });
  });

  it("normalizes configured values", () => {
    const config = loadAppConfig({
      GITHUB_TOKEN: "  token-value  ",
      GITHUB_API_BASE_URL: "https://github.example.com/api/v3/",
      CACHE_TTL_SECONDS: "600",
      CARD_CACHE_CONTROL: "public, max-age=30",
      LOG_LEVEL: "DEBUG",
      NODE_ENV: "test",
    });

    assert.deepEqual(config, {
      githubToken: "token-value",
      githubApiBaseUrl: "https://github.example.com/api/v3",
      cacheTtlSeconds: 600,
      cardCacheControl: "public, max-age=30",
      logLevel: "debug",
      environment: "test",
    });
  });

  const invalidCases: ReadonlyArray<readonly [NodeJS.ProcessEnv, string]> = [
    [{ CACHE_TTL_SECONDS: "0" }, "CACHE_TTL_SECONDS"],
    [{ CACHE_TTL_SECONDS: "five" }, "CACHE_TTL_SECONDS"],
    [{ GITHUB_API_BASE_URL: "http://example.com" }, "GITHUB_API_BASE_URL"],
    [{ CARD_CACHE_CONTROL: "public\nX-Test: injected" }, "CARD_CACHE_CONTROL"],
    [{ LOG_LEVEL: "trace" }, "LOG_LEVEL"],
    [{ NODE_ENV: "staging" }, "NODE_ENV"],
  ];

  for (const [environment, expectedMessage] of invalidCases) {
    it(`rejects invalid ${expectedMessage} configuration`, () => {
      assert.throws(() => loadAppConfig(environment), new RegExp(expectedMessage));
    });
  }
});
