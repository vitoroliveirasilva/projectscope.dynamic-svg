import type { Cache } from "../../core/cache/cache.js";
import { AppError } from "../../core/errors/app-error.js";
import type {
  CommitSummary,
  ProjectProvider,
  RepositoryQuery,
  RepositorySummary,
  UserSummary,
} from "../project-provider.js";
import { githubCacheKeys } from "./cache-keys.js";
import type { GitHubClientContract } from "./github-types.js";
import {
  normalizeGitHubCommit,
  normalizeGitHubRepositories,
  normalizeGitHubRepository,
  normalizeGitHubUser,
} from "./normalize.js";
import { hasNextGitHubPage } from "./pagination.js";

interface GitHubCacheTtl {
  readonly user: number;
  readonly repositories: number;
  readonly repository: number;
  readonly commit: number;
}

interface GitHubProviderOptions {
  readonly client: GitHubClientContract;
  readonly cache?: Cache<GitHubCacheEntry>;
  readonly cacheTtl?: Partial<GitHubCacheTtl>;
  readonly maximumPages?: number;
}

type GitHubCacheEntry =
  | { readonly type: "user"; readonly value: UserSummary }
  | { readonly type: "repositories"; readonly value: readonly RepositorySummary[] }
  | { readonly type: "repository"; readonly value: RepositorySummary }
  | { readonly type: "commit"; readonly value: CommitSummary | null };

const DEFAULT_CACHE_TTL: GitHubCacheTtl = {
  user: 3_600,
  repositories: 300,
  repository: 600,
  commit: 120,
};
const DEFAULT_MAXIMUM_PAGES = 10;
const REPOSITORIES_PER_PAGE = 100;
const MAXIMUM_REPOSITORIES = 1_000;

function assertPositiveInteger(value: number, name: string, maximum: number): number {
  if (!Number.isInteger(value) || value < 1 || value > maximum) {
    throw new Error(`${name} must be an integer between 1 and ${maximum}.`);
  }

  return value;
}

function pathSegment(value: string, name: string): string {
  const normalized = value.trim();

  if (!normalized || normalized.includes("/") || normalized.length > 255) {
    throw new AppError({
      code: "INVALID_REQUEST",
      publicMessage: `${name} possui um formato inválido.`,
    });
  }

  return encodeURIComponent(normalized);
}

function sortRepositories(
  repositories: readonly RepositorySummary[],
): readonly RepositorySummary[] {
  return [...repositories].sort((left, right) => {
    const pushedDifference = (right.pushedAt?.getTime() ?? 0) - (left.pushedAt?.getTime() ?? 0);
    if (pushedDifference !== 0) return pushedDifference;

    const updatedDifference = right.updatedAt.getTime() - left.updatedAt.getTime();
    if (updatedDifference !== 0) return updatedDifference;

    return left.fullName.localeCompare(right.fullName, "en");
  });
}

function filterRepositories(
  repositories: readonly RepositorySummary[],
  {
    includeForks = false,
    includeArchived = false,
    exclude = [],
    maximum = MAXIMUM_REPOSITORIES,
  }: RepositoryQuery,
): readonly RepositorySummary[] {
  assertPositiveInteger(maximum, "maximum", MAXIMUM_REPOSITORIES);
  const excluded = new Set(exclude.map((item) => item.trim().toLowerCase()).filter(Boolean));

  return sortRepositories(repositories)
    .filter((repository) => includeForks || !repository.isFork)
    .filter((repository) => includeArchived || !repository.isArchived)
    .filter(
      (repository) =>
        !excluded.has(repository.name.toLowerCase()) &&
        !excluded.has(repository.fullName.toLowerCase()),
    )
    .slice(0, maximum);
}

function rethrowNotFound(error: unknown, publicMessage: string): never {
  if (error instanceof AppError && error.code === "NOT_FOUND") {
    throw new AppError({
      code: "NOT_FOUND",
      publicMessage,
      cause: error,
    });
  }

  throw error;
}

export class GitHubProvider implements ProjectProvider {
  readonly #client: GitHubClientContract;
  readonly #cache: Cache<GitHubCacheEntry> | undefined;
  readonly #cacheTtl: GitHubCacheTtl;
  readonly #maximumPages: number;

  constructor({
    client,
    cache,
    cacheTtl = {},
    maximumPages = DEFAULT_MAXIMUM_PAGES,
  }: GitHubProviderOptions) {
    this.#client = client;
    this.#cache = cache;
    this.#maximumPages = assertPositiveInteger(maximumPages, "maximumPages", 100);
    this.#cacheTtl = {
      user: cacheTtl.user ?? DEFAULT_CACHE_TTL.user,
      repositories: cacheTtl.repositories ?? DEFAULT_CACHE_TTL.repositories,
      repository: cacheTtl.repository ?? DEFAULT_CACHE_TTL.repository,
      commit: cacheTtl.commit ?? DEFAULT_CACHE_TTL.commit,
    };

    for (const [name, value] of Object.entries(this.#cacheTtl)) {
      assertPositiveInteger(value, `cacheTtl.${name}`, 86_400);
    }
  }

  async getUser(username: string): Promise<UserSummary> {
    const key = githubCacheKeys.user(username);
    const cached = this.#cache?.get(key);
    if (cached?.type === "user") return cached.value;

    try {
      const response = await this.#client.get<unknown>(
        `/users/${pathSegment(username, "Usuário")}`,
      );
      const user = normalizeGitHubUser(response.data);
      this.#cache?.set(key, { type: "user", value: user }, this.#cacheTtl.user);
      return user;
    } catch (error) {
      return rethrowNotFound(error, "Usuário não encontrado no GitHub.");
    }
  }

  async listRepositories(
    username: string,
    options: RepositoryQuery = {},
  ): Promise<readonly RepositorySummary[]> {
    if (options.maximum !== undefined) {
      assertPositiveInteger(options.maximum, "maximum", MAXIMUM_REPOSITORIES);
    }

    const key = githubCacheKeys.repositories(username);
    const cached = this.#cache?.get(key);

    if (cached?.type === "repositories") {
      return filterRepositories(cached.value, options);
    }

    const repositories: RepositorySummary[] = [];
    const seen = new Set<string>();

    try {
      for (let page = 1; page <= this.#maximumPages; page += 1) {
        const response = await this.#client.get<unknown>(
          `/users/${pathSegment(username, "Usuário")}/repos`,
          {
            query: {
              type: "owner",
              sort: "pushed",
              direction: "desc",
              per_page: REPOSITORIES_PER_PAGE,
              page,
            },
          },
        );
        const normalized = normalizeGitHubRepositories(response.data);

        for (const repository of normalized) {
          const identity = repository.fullName.toLowerCase();
          if (!seen.has(identity)) {
            repositories.push(repository);
            seen.add(identity);
          }
        }

        if (
          normalized.length < REPOSITORIES_PER_PAGE ||
          !hasNextGitHubPage(response.headers.get("link"))
        ) {
          break;
        }
      }
    } catch (error) {
      return rethrowNotFound(error, "Usuário não encontrado no GitHub.");
    }

    const stableRepositories = sortRepositories(repositories);
    this.#cache?.set(
      key,
      { type: "repositories", value: stableRepositories },
      this.#cacheTtl.repositories,
    );
    return filterRepositories(stableRepositories, options);
  }

  async getRepository(username: string, repository: string): Promise<RepositorySummary> {
    const key = githubCacheKeys.repository(username, repository);
    const cached = this.#cache?.get(key);
    if (cached?.type === "repository") return cached.value;

    try {
      const response = await this.#client.get<unknown>(
        `/repos/${pathSegment(username, "Usuário")}/${pathSegment(repository, "Repositório")}`,
      );
      const normalized = normalizeGitHubRepository(response.data);
      this.#cache?.set(key, { type: "repository", value: normalized }, this.#cacheTtl.repository);
      return normalized;
    } catch (error) {
      return rethrowNotFound(error, "Projeto não encontrado no GitHub.");
    }
  }

  async getLatestCommit(
    repository: RepositorySummary,
    branch = repository.defaultBranch,
  ): Promise<CommitSummary | null> {
    const normalizedBranch = branch.trim();
    if (!normalizedBranch || normalizedBranch.length > 255) {
      throw new AppError({
        code: "INVALID_REQUEST",
        publicMessage: "Branch possui um formato inválido.",
      });
    }

    const key = githubCacheKeys.commit(repository.owner, repository.name, normalizedBranch);
    const cached = this.#cache?.get(key);
    if (cached?.type === "commit") return cached.value;

    try {
      const response = await this.#client.get<unknown>(
        `/repos/${pathSegment(repository.owner, "Usuário")}/${pathSegment(repository.name, "Repositório")}/commits`,
        { query: { sha: normalizedBranch, per_page: 1 } },
      );

      if (!Array.isArray(response.data)) {
        throw new AppError({
          code: "PROVIDER_UNAVAILABLE",
          publicMessage: "O GitHub retornou dados em um formato inesperado.",
        });
      }

      const commit =
        response.data.length === 0
          ? null
          : normalizeGitHubCommit(response.data[0], normalizedBranch);
      this.#cache?.set(key, { type: "commit", value: commit }, this.#cacheTtl.commit);
      return commit;
    } catch (error) {
      if (error instanceof AppError && error.code === "NO_DATA") {
        this.#cache?.set(key, { type: "commit", value: null }, this.#cacheTtl.commit);
        return null;
      }

      return rethrowNotFound(error, "Branch ou projeto não encontrado no GitHub.");
    }
  }
}

export type { GitHubCacheEntry, GitHubCacheTtl };
