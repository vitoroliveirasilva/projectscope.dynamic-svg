import { AppError } from "../../core/errors/app-error.js";
import { isGitHubRateLimited, parseGitHubRateLimit } from "./github-rate-limit.js";
import type {
  FetchLike,
  GitHubClientContract,
  GitHubRequestOptions,
  GitHubResponse,
} from "./github-types.js";

interface GitHubClientOptions {
  readonly baseUrl?: string;
  readonly token?: string;
  readonly timeoutMilliseconds?: number;
  readonly fetchImplementation?: FetchLike;
  readonly userAgent?: string;
}

const DEFAULT_BASE_URL = "https://api.github.com";
const DEFAULT_TIMEOUT_MILLISECONDS = 8_000;
const DEFAULT_USER_AGENT = "projectscope.dynamic-svg";
const GITHUB_API_VERSION = "2022-11-28";

function providerUnavailable(publicMessage: string, cause?: unknown): AppError {
  return new AppError({
    code: "PROVIDER_UNAVAILABLE",
    publicMessage,
    ...(cause === undefined ? {} : { cause }),
  });
}

function validateBaseUrl(value: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch (error) {
    throw new Error("baseUrl must be a valid URL.", { cause: error });
  }

  const isLocalHttp =
    url.protocol === "http:" && ["localhost", "127.0.0.1", "::1"].includes(url.hostname);

  if (url.protocol !== "https:" && !isLocalHttp) {
    throw new Error("baseUrl must use HTTPS, except for local development.");
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new Error("baseUrl cannot contain credentials, query parameters or fragments.");
  }

  return url.toString().replace(/\/$/, "");
}

function validateTimeout(value: number): number {
  if (!Number.isInteger(value) || value < 100 || value > 60_000) {
    throw new Error("timeoutMilliseconds must be an integer between 100 and 60000.");
  }

  return value;
}

function createUrl(baseUrl: string, path: string, query: GitHubRequestOptions["query"]): URL {
  if (!path.startsWith("/")) {
    throw new Error("GitHub request paths must start with a slash.");
  }

  const url = new URL(path, `${baseUrl}/`);
  const expectedOrigin = new URL(baseUrl).origin;

  if (url.origin !== expectedOrigin) {
    throw new Error("GitHub request path cannot change the configured origin.");
  }

  for (const [name, rawValue] of Object.entries(query ?? {})) {
    if (rawValue !== undefined) {
      url.searchParams.set(name, String(rawValue));
    }
  }

  return url;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    throw providerUnavailable("O GitHub retornou uma resposta inválida.", error);
  }
}

function responseError(response: Response): AppError {
  if (isGitHubRateLimited(response.status, response.headers)) {
    return new AppError({
      code: "RATE_LIMITED",
      publicMessage: "O limite temporário de consultas ao GitHub foi atingido.",
      cause: parseGitHubRateLimit(response.headers),
    });
  }

  if (response.status === 404) {
    return new AppError({
      code: "NOT_FOUND",
      publicMessage: "O recurso solicitado não foi encontrado no GitHub.",
    });
  }

  if (response.status === 409) {
    return new AppError({
      code: "NO_DATA",
      publicMessage: "O recurso ainda não possui dados disponíveis.",
    });
  }

  if (response.status === 401) {
    return providerUnavailable("Não foi possível autenticar a consulta ao GitHub.");
  }

  if (response.status >= 500) {
    return providerUnavailable("O GitHub está temporariamente indisponível.");
  }

  return providerUnavailable("Não foi possível consultar o GitHub.");
}

export class GitHubClient implements GitHubClientContract {
  readonly #baseUrl: string;
  readonly #token?: string;
  readonly #timeoutMilliseconds: number;
  readonly #fetch: FetchLike;
  readonly #userAgent: string;

  constructor({
    baseUrl = DEFAULT_BASE_URL,
    token,
    timeoutMilliseconds = DEFAULT_TIMEOUT_MILLISECONDS,
    fetchImplementation = globalThis.fetch,
    userAgent = DEFAULT_USER_AGENT,
  }: GitHubClientOptions = {}) {
    this.#baseUrl = validateBaseUrl(baseUrl);
    this.#timeoutMilliseconds = validateTimeout(timeoutMilliseconds);
    this.#fetch = fetchImplementation;
    this.#userAgent = userAgent.trim() || DEFAULT_USER_AGENT;

    const normalizedToken = token?.trim();
    if (normalizedToken) {
      this.#token = normalizedToken;
    }
  }

  async get<TData>(
    path: string,
    { query }: GitHubRequestOptions = {},
  ): Promise<GitHubResponse<TData>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.#timeoutMilliseconds);

    try {
      const response = await this.#fetch(createUrl(this.#baseUrl, path, query), {
        method: "GET",
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": this.#userAgent,
          "X-GitHub-Api-Version": GITHUB_API_VERSION,
          ...(this.#token === undefined ? {} : { Authorization: `Bearer ${this.#token}` }),
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw responseError(response);
      }

      return {
        data: (await readJson(response)) as TData,
        headers: response.headers,
        status: response.status,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (controller.signal.aborted) {
        throw providerUnavailable("A consulta ao GitHub excedeu o tempo limite.", error);
      }

      throw providerUnavailable("Não foi possível conectar ao GitHub.", error);
    } finally {
      clearTimeout(timeout);
    }
  }
}
