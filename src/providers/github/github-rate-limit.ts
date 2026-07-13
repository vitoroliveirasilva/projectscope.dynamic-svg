export interface GitHubRateLimit {
  readonly limit?: number;
  readonly remaining?: number;
  readonly resetAt?: Date;
  readonly retryAfterSeconds?: number;
}

function parseNonNegativeInteger(value: string | null): number | undefined {
  if (value === null || !/^\d+$/.test(value.trim())) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

export function parseGitHubRateLimit(headers: Headers): GitHubRateLimit {
  const limit = parseNonNegativeInteger(headers.get("x-ratelimit-limit"));
  const remaining = parseNonNegativeInteger(headers.get("x-ratelimit-remaining"));
  const resetSeconds = parseNonNegativeInteger(headers.get("x-ratelimit-reset"));
  const retryAfterSeconds = parseNonNegativeInteger(headers.get("retry-after"));

  return {
    ...(limit === undefined ? {} : { limit }),
    ...(remaining === undefined ? {} : { remaining }),
    ...(resetSeconds === undefined ? {} : { resetAt: new Date(resetSeconds * 1000) }),
    ...(retryAfterSeconds === undefined ? {} : { retryAfterSeconds }),
  };
}

export function isGitHubRateLimited(status: number, headers: Headers): boolean {
  if (status === 429) {
    return true;
  }

  if (status !== 403) {
    return false;
  }

  const rateLimit = parseGitHubRateLimit(headers);
  return rateLimit.remaining === 0 || rateLimit.retryAfterSeconds !== undefined;
}
