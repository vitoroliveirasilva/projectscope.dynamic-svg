import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { AppConfig } from "../../src/config/app-config.js";
import { createGitHubProvider } from "../../src/providers/github/create-github-provider.js";
import type { FetchLike } from "../../src/providers/github/github-types.js";

describe("createGitHubProvider", () => {
  it("composes the client, configuration and shared cache", async () => {
    const requestedUrls: string[] = [];
    const fetchImplementation: FetchLike = (input) => {
      requestedUrls.push(input.toString());
      return Promise.resolve(
        new Response(
          JSON.stringify({
            login: "factory-user",
            name: null,
            avatar_url: "https://avatars.githubusercontent.com/u/2?v=4",
            html_url: "https://github.com/factory-user",
          }),
          { status: 200 },
        ),
      );
    };
    const config: AppConfig = {
      githubToken: "token",
      githubApiBaseUrl: "https://api.github.com",
      cacheTtlSeconds: 45,
      cardCacheControl: "no-store",
      logLevel: "info",
      environment: "test",
    };
    const provider = createGitHubProvider(config, {
      fetchImplementation,
      timeoutMilliseconds: 500,
    });

    const user = await provider.getUser("factory-user");
    const cachedUser = await provider.getUser("factory-user");

    assert.equal(user.login, "factory-user");
    assert.equal(cachedUser.login, user.login);
    assert.deepEqual(requestedUrls, ["https://api.github.com/users/factory-user"]);
  });
});
