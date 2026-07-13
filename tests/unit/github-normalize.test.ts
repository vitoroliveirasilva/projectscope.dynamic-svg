import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AppError } from "../../src/core/errors/app-error.js";
import {
  normalizeGitHubCommit,
  normalizeGitHubRepositories,
  normalizeGitHubRepository,
  normalizeGitHubUser,
} from "../../src/providers/github/normalize.js";

function repositoryPayload(
  overrides: Readonly<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    owner: { login: "vitoroliveirasilva" },
    name: "projectscope.dynamic-svg",
    full_name: "vitoroliveirasilva/projectscope.dynamic-svg",
    description: "Dynamic SVG cards",
    html_url: "https://github.com/vitoroliveirasilva/projectscope.dynamic-svg",
    default_branch: "dev",
    language: "TypeScript",
    fork: false,
    archived: false,
    private: false,
    pushed_at: "2026-07-13T12:00:00Z",
    updated_at: "2026-07-13T12:30:00Z",
    ...overrides,
  };
}

describe("GitHub payload normalization", () => {
  it("normalizes users and nullable names", () => {
    const user = normalizeGitHubUser({
      login: "vitoroliveirasilva",
      name: null,
      avatar_url: "https://avatars.githubusercontent.com/u/1?v=4",
      html_url: "https://github.com/vitoroliveirasilva",
    });

    assert.equal(user.login, "vitoroliveirasilva");
    assert.equal(user.name, null);
    assert.equal(user.avatarUrl, "https://avatars.githubusercontent.com/u/1?v=4");
  });

  it("normalizes repositories and dates", () => {
    const repository = normalizeGitHubRepository(repositoryPayload());

    assert.equal(repository.defaultBranch, "dev");
    assert.equal(repository.primaryLanguage, "TypeScript");
    assert.equal(repository.pushedAt?.toISOString(), "2026-07-13T12:00:00.000Z");
    assert.equal(repository.updatedAt.toISOString(), "2026-07-13T12:30:00.000Z");
  });

  it("normalizes repository collections", () => {
    const repositories = normalizeGitHubRepositories([
      repositoryPayload(),
      repositoryPayload({ name: "second", full_name: "vitoroliveirasilva/second" }),
    ]);

    assert.equal(repositories.length, 2);
    assert.equal(repositories[1]?.name, "second");
  });

  it("keeps only the first commit message line and truncates it", () => {
    const commit = normalizeGitHubCommit(
      {
        sha: "1234567890abcdef",
        html_url: "https://github.com/example/repo/commit/1234567890abcdef",
        commit: {
          message: `${"A".repeat(160)}\nLong body that must not be displayed`,
          author: { date: "2026-07-13T10:00:00Z" },
          committer: { date: "2026-07-13T10:01:00Z" },
        },
      },
      "dev",
    );

    assert.equal(commit.shortSha, "1234567");
    assert.equal(commit.branch, "dev");
    assert.equal(commit.message.length, 120);
    assert.ok(commit.message.endsWith("…"));
    assert.doesNotMatch(commit.message, /Long body/);
  });

  it("rejects malformed payloads without reflecting external content", () => {
    assert.throws(
      () => normalizeGitHubRepository(repositoryPayload({ html_url: "javascript:alert(1)" })),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.code, "PROVIDER_UNAVAILABLE");
        assert.doesNotMatch(error.publicMessage, /javascript/);
        return true;
      },
    );
  });
});
