import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { MemoryCache } from "../../src/core/cache/memory-cache.js";
import { AppError } from "../../src/core/errors/app-error.js";
import {
  GitHubProvider,
  type GitHubCacheEntry,
} from "../../src/providers/github/github-provider.js";
import type {
  GitHubClientContract,
  GitHubRequestOptions,
  GitHubResponse,
} from "../../src/providers/github/github-types.js";

function repositoryPayload(index: number, overrides: Readonly<Record<string, unknown>> = {}) {
  const name = `repo-${index}`;
  return {
    owner: { login: "vitoroliveirasilva" },
    name,
    full_name: `vitoroliveirasilva/${name}`,
    description: `Repository ${index}`,
    html_url: `https://github.com/vitoroliveirasilva/${name}`,
    default_branch: "dev",
    language: "TypeScript",
    fork: false,
    archived: false,
    private: false,
    pushed_at: new Date(Date.UTC(2026, 6, 13, 12, 0, 0) - index * 60_000).toISOString(),
    updated_at: "2026-07-13T12:30:00Z",
    ...overrides,
  };
}

class RouteClient implements GitHubClientContract {
  readonly requests: Array<{ path: string; options: GitHubRequestOptions }> = [];
  readonly #route: (
    path: string,
    options: GitHubRequestOptions,
  ) => GitHubResponse<unknown> | Promise<GitHubResponse<unknown>>;

  constructor(
    route: (
      path: string,
      options: GitHubRequestOptions,
    ) => GitHubResponse<unknown> | Promise<GitHubResponse<unknown>>,
  ) {
    this.#route = route;
  }

  async get<TData>(
    path: string,
    options: GitHubRequestOptions = {},
  ): Promise<GitHubResponse<TData>> {
    this.requests.push({ path, options });
    return (await this.#route(path, options)) as GitHubResponse<TData>;
  }
}

function response(
  data: unknown,
  headers: Readonly<Record<string, string>> = {},
): GitHubResponse<unknown> {
  return { data, headers: new Headers(headers), status: 200 };
}

describe("GitHubProvider", () => {
  it("paginates, deduplicates, filters, sorts and caches repository lists", async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => repositoryPayload(index + 1));
    const secondPage = [
      repositoryPayload(101),
      repositoryPayload(1),
      repositoryPayload(102, { fork: true }),
      repositoryPayload(103, { archived: true }),
    ];
    const client = new RouteClient((_path, options) => {
      const page = options.query?.page;
      return page === 1
        ? response(firstPage, {
            link: '<https://api.github.com/users/example/repos?page=2>; rel="next"',
          })
        : response(secondPage);
    });
    const cache = new MemoryCache<GitHubCacheEntry>();
    const provider = new GitHubProvider({ client, cache });

    const repositories = await provider.listRepositories("vitoroliveirasilva", {
      exclude: ["repo-2"],
      maximum: 3,
    });
    const cachedRepositories = await provider.listRepositories("vitoroliveirasilva", {
      maximum: 2,
    });

    assert.deepEqual(
      repositories.map((repository) => repository.name),
      ["repo-1", "repo-3", "repo-4"],
    );
    assert.deepEqual(
      cachedRepositories.map((repository) => repository.name),
      ["repo-1", "repo-2"],
    );
    assert.equal(client.requests.length, 2);
    assert.equal(client.requests[0]?.options.query?.per_page, 100);
    assert.equal(cache.size, 1);
  });

  it("loads and caches a user and repository", async () => {
    const client = new RouteClient((path) => {
      if (path.startsWith("/users/")) {
        return response({
          login: "vitoroliveirasilva",
          name: "Vitor Oliveira Silva",
          avatar_url: "https://avatars.githubusercontent.com/u/1?v=4",
          html_url: "https://github.com/vitoroliveirasilva",
        });
      }

      return response(repositoryPayload(1));
    });
    const provider = new GitHubProvider({
      client,
      cache: new MemoryCache<GitHubCacheEntry>(),
    });

    const user = await provider.getUser("vitoroliveirasilva");
    const cachedUser = await provider.getUser("VITOROLIVEIRASILVA");
    const repository = await provider.getRepository("vitoroliveirasilva", "repo-1");
    const cachedRepository = await provider.getRepository("VITOROLIVEIRASILVA", "REPO-1");

    assert.equal(user.name, "Vitor Oliveira Silva");
    assert.equal(cachedUser.login, user.login);
    assert.equal(repository.name, "repo-1");
    assert.equal(cachedRepository.fullName, repository.fullName);
    assert.equal(client.requests.length, 2);
  });

  it("loads the latest commit and caches empty repositories", async () => {
    let empty = false;
    const client = new RouteClient(() =>
      response(
        empty
          ? []
          : [
              {
                sha: "1234567890abcdef",
                html_url: "https://github.com/example/repo/commit/1234567890abcdef",
                commit: {
                  message: "feat: add provider\n\nDetails",
                  author: { date: "2026-07-13T10:00:00Z" },
                  committer: { date: "2026-07-13T10:01:00Z" },
                },
              },
            ],
      ),
    );
    const provider = new GitHubProvider({
      client,
      cache: new MemoryCache<GitHubCacheEntry>(),
    });
    const repository = {
      owner: "example",
      name: "repo",
      fullName: "example/repo",
      description: null,
      url: "https://github.com/example/repo",
      defaultBranch: "dev",
      primaryLanguage: null,
      isFork: false,
      isArchived: false,
      isPrivate: false,
      pushedAt: null,
      updatedAt: new Date("2026-07-13T10:00:00Z"),
    } as const;

    const commit = await provider.getLatestCommit(repository);
    const cachedCommit = await provider.getLatestCommit(repository);
    empty = true;
    const noCommit = await provider.getLatestCommit(repository, "empty");
    const cachedNoCommit = await provider.getLatestCommit(repository, "empty");

    assert.equal(commit?.message, "feat: add provider");
    assert.equal(cachedCommit?.sha, commit?.sha);
    assert.equal(noCommit, null);
    assert.equal(cachedNoCommit, null);
    assert.equal(client.requests.length, 2);
  });

  it("translates missing resources without exposing provider messages", async () => {
    const client = new RouteClient(() => {
      throw new AppError({
        code: "NOT_FOUND",
        publicMessage: "raw provider message",
      });
    });
    const provider = new GitHubProvider({ client });

    await assert.rejects(provider.getUser("missing"), (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.code, "NOT_FOUND");
      assert.equal(error.publicMessage, "Usuário não encontrado no GitHub.");
      return true;
    });
  });

  it("rejects invalid path segments and limits before sending requests", async () => {
    const client = new RouteClient(() => response([]));
    const provider = new GitHubProvider({ client });

    await assert.rejects(provider.getRepository("owner/name", "repo"), (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.code, "INVALID_REQUEST");
      return true;
    });
    await assert.rejects(
      provider.listRepositories("owner", { maximum: 0 }),
      /maximum must be an integer/,
    );
    assert.equal(client.requests.length, 0);
  });
});
