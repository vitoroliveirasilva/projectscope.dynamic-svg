import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AppError } from "../../src/core/errors/app-error.js";
import { GitHubClient } from "../../src/providers/github/github-client.js";
import type { FetchLike } from "../../src/providers/github/github-types.js";

describe("GitHubClient", () => {
  it("sends versioned authenticated requests with normalized query parameters", async () => {
    let requestedUrl = "";
    let requestedInit: RequestInit | undefined;
    const fetchImplementation: FetchLike = (input, init) => {
      requestedUrl = input.toString();
      requestedInit = init;
      return Promise.resolve(
        new Response(JSON.stringify({ login: "vitoroliveirasilva" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    };
    const client = new GitHubClient({
      token: " secret-token ",
      fetchImplementation,
      timeoutMilliseconds: 500,
    });

    const response = await client.get<{ login: string }>("/users/vitoroliveirasilva", {
      query: { per_page: 100, page: 2, ignored: undefined },
    });
    const headers = new Headers(requestedInit?.headers);

    assert.equal(response.data.login, "vitoroliveirasilva");
    assert.equal(
      requestedUrl,
      "https://api.github.com/users/vitoroliveirasilva?per_page=100&page=2",
    );
    assert.equal(headers.get("authorization"), "Bearer secret-token");
    assert.equal(headers.get("accept"), "application/vnd.github+json");
    assert.equal(headers.get("x-github-api-version"), "2022-11-28");
    assert.equal(requestedInit?.method, "GET");
  });

  const errorCases: ReadonlyArray<
    readonly [number, Readonly<Record<string, string>>, AppError["code"]]
  > = [
    [404, {}, "NOT_FOUND"],
    [409, {}, "NO_DATA"],
    [429, {}, "RATE_LIMITED"],
    [403, { "x-ratelimit-remaining": "0" }, "RATE_LIMITED"],
    [500, {}, "PROVIDER_UNAVAILABLE"],
  ];

  for (const [status, headers, expectedCode] of errorCases) {
    it(`maps HTTP ${status} to ${expectedCode}`, async () => {
      const client = new GitHubClient({
        fetchImplementation: () =>
          Promise.resolve(
            new Response(JSON.stringify({ message: "external detail" }), { status, headers }),
          ),
      });

      await assert.rejects(client.get("/test"), (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.code, expectedCode);
        assert.doesNotMatch(error.publicMessage, /external detail/);
        return true;
      });
    });
  }

  it("rejects malformed successful JSON", async () => {
    const client = new GitHubClient({
      fetchImplementation: () => Promise.resolve(new Response("not-json", { status: 200 })),
    });

    await assert.rejects(client.get("/test"), (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.code, "PROVIDER_UNAVAILABLE");
      return true;
    });
  });

  it("aborts requests that exceed the configured timeout", async () => {
    const fetchImplementation: FetchLike = (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    const client = new GitHubClient({ fetchImplementation, timeoutMilliseconds: 100 });

    await assert.rejects(client.get("/slow"), (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.code, "PROVIDER_UNAVAILABLE");
      assert.match(error.publicMessage, /tempo limite/);
      return true;
    });
  });
});
