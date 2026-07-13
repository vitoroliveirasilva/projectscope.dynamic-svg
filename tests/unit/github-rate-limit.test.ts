import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isGitHubRateLimited,
  parseGitHubRateLimit,
} from "../../src/providers/github/github-rate-limit.js";
import { hasNextGitHubPage } from "../../src/providers/github/pagination.js";

describe("GitHub response metadata", () => {
  it("parses rate-limit headers", () => {
    const headers = new Headers({
      "x-ratelimit-limit": "5000",
      "x-ratelimit-remaining": "0",
      "x-ratelimit-reset": "1783944000",
      "retry-after": "60",
    });
    const rateLimit = parseGitHubRateLimit(headers);

    assert.equal(rateLimit.limit, 5000);
    assert.equal(rateLimit.remaining, 0);
    assert.equal(rateLimit.retryAfterSeconds, 60);
    assert.equal(rateLimit.resetAt?.getTime(), 1_783_944_000_000);
    assert.equal(isGitHubRateLimited(403, headers), true);
  });

  it("distinguishes forbidden responses from rate limiting", () => {
    assert.equal(isGitHubRateLimited(403, new Headers()), false);
    assert.equal(isGitHubRateLimited(429, new Headers()), true);
  });

  it("detects a next pagination relation", () => {
    const link =
      '<https://api.github.com/users/example/repos?page=2>; rel="next", <https://api.github.com/users/example/repos?page=4>; rel="last"';

    assert.equal(hasNextGitHubPage(link), true);
    assert.equal(hasNextGitHubPage('<https://api.github.com?page=1>; rel="prev"'), false);
    assert.equal(hasNextGitHubPage(null), false);
  });
});
