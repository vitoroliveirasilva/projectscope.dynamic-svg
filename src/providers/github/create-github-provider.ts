import { MemoryCache } from "../../core/cache/memory-cache.js";
import type { AppConfig } from "../../config/app-config.js";
import { GitHubClient } from "./github-client.js";
import { GitHubProvider, type GitHubCacheEntry } from "./github-provider.js";
import type { FetchLike } from "./github-types.js";

interface CreateGitHubProviderOptions {
  readonly fetchImplementation?: FetchLike;
  readonly timeoutMilliseconds?: number;
}

const sharedCache = new MemoryCache<GitHubCacheEntry>({ maximumEntries: 250 });

export function createGitHubProvider(
  config: AppConfig,
  options: CreateGitHubProviderOptions = {},
): GitHubProvider {
  const client = new GitHubClient({
    baseUrl: config.githubApiBaseUrl,
    ...(config.githubToken === undefined ? {} : { token: config.githubToken }),
    ...(options.fetchImplementation === undefined
      ? {}
      : { fetchImplementation: options.fetchImplementation }),
    ...(options.timeoutMilliseconds === undefined
      ? {}
      : { timeoutMilliseconds: options.timeoutMilliseconds }),
  });

  return new GitHubProvider({
    client,
    cache: sharedCache,
    cacheTtl: { repositories: config.cacheTtlSeconds },
  });
}
