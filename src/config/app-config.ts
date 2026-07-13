export type AppEnvironment = "development" | "test" | "production";
export type LogLevel = "debug" | "info" | "warn" | "error";

export interface AppConfig {
  readonly githubToken?: string;
  readonly githubApiBaseUrl: string;
  readonly cacheTtlSeconds: number;
  readonly cardCacheControl: string;
  readonly logLevel: LogLevel;
  readonly environment: AppEnvironment;
}

const DEFAULT_GITHUB_API_BASE_URL = "https://api.github.com";
const DEFAULT_CACHE_TTL_SECONDS = 300;
const DEFAULT_CARD_CACHE_CONTROL = "public, max-age=60, s-maxage=300, stale-while-revalidate=600";
const DEFAULT_LOG_LEVEL: LogLevel = "info";
const DEFAULT_ENVIRONMENT: AppEnvironment = "development";
const MAX_CACHE_TTL_SECONDS = 86_400;
const MAX_HEADER_LENGTH = 512;

const LOG_LEVELS = new Set<LogLevel>(["debug", "info", "warn", "error"]);
const ENVIRONMENTS = new Set<AppEnvironment>(["development", "test", "production"]);

function optionalTrimmed(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  if (!normalized) {
    return undefined;
  }

  return normalized;
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
  variableName: string,
): number {
  const normalized = optionalTrimmed(value);

  if (normalized === undefined) {
    return fallback;
  }

  if (!/^\d+$/.test(normalized)) {
    throw new Error(`${variableName} must be a positive integer.`);
  }

  const parsed = Number.parseInt(normalized, 10);

  if (parsed < 1 || parsed > MAX_CACHE_TTL_SECONDS) {
    throw new Error(`${variableName} must be between 1 and ${MAX_CACHE_TTL_SECONDS}.`);
  }

  return parsed;
}

function parseApiBaseUrl(value: string | undefined): string {
  const normalized = optionalTrimmed(value) ?? DEFAULT_GITHUB_API_BASE_URL;
  let url: URL;

  try {
    url = new URL(normalized);
  } catch {
    throw new Error("GITHUB_API_BASE_URL must be a valid URL.");
  }

  const isLocalHttp =
    url.protocol === "http:" && ["localhost", "127.0.0.1", "::1"].includes(url.hostname);

  if (url.protocol !== "https:" && !isLocalHttp) {
    throw new Error("GITHUB_API_BASE_URL must use HTTPS, except for local development.");
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new Error(
      "GITHUB_API_BASE_URL cannot contain credentials, query parameters or fragments.",
    );
  }

  return url.toString().replace(/\/$/, "");
}

function parseHeaderValue(value: string | undefined): string {
  const normalized = optionalTrimmed(value) ?? DEFAULT_CARD_CACHE_CONTROL;

  if (normalized.length > MAX_HEADER_LENGTH || /[\r\n]/.test(normalized)) {
    throw new Error("CARD_CACHE_CONTROL contains an invalid header value.");
  }

  return normalized;
}

function parseLogLevel(value: string | undefined): LogLevel {
  const normalized = optionalTrimmed(value)?.toLowerCase() ?? DEFAULT_LOG_LEVEL;

  if (!LOG_LEVELS.has(normalized as LogLevel)) {
    throw new Error("LOG_LEVEL must be debug, info, warn or error.");
  }

  return normalized as LogLevel;
}

function parseEnvironment(value: string | undefined): AppEnvironment {
  const normalized = optionalTrimmed(value)?.toLowerCase() ?? DEFAULT_ENVIRONMENT;

  if (!ENVIRONMENTS.has(normalized as AppEnvironment)) {
    throw new Error("NODE_ENV must be development, test or production.");
  }

  return normalized as AppEnvironment;
}

export function loadAppConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  const githubToken = optionalTrimmed(environment.GITHUB_TOKEN);

  return {
    ...(githubToken === undefined ? {} : { githubToken }),
    githubApiBaseUrl: parseApiBaseUrl(environment.GITHUB_API_BASE_URL),
    cacheTtlSeconds: parsePositiveInteger(
      environment.CACHE_TTL_SECONDS,
      DEFAULT_CACHE_TTL_SECONDS,
      "CACHE_TTL_SECONDS",
    ),
    cardCacheControl: parseHeaderValue(environment.CARD_CACHE_CONTROL),
    logLevel: parseLogLevel(environment.LOG_LEVEL),
    environment: parseEnvironment(environment.NODE_ENV),
  };
}
