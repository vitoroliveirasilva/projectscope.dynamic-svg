import { AppError } from "../../core/errors/app-error.js";
import type { CommitSummary, RepositorySummary, UserSummary } from "../project-provider.js";

const LIMITS = {
  login: 100,
  name: 160,
  repositoryName: 100,
  fullName: 240,
  description: 160,
  branch: 255,
  language: 32,
  commitSha: 64,
  commitMessage: 120,
} as const;

function invalidPayload(field: string): never {
  throw new AppError({
    code: "PROVIDER_UNAVAILABLE",
    publicMessage: "O GitHub retornou dados em um formato inesperado.",
    cause: new Error(`Invalid GitHub payload field: ${field}`),
  });
}

function record(value: unknown, field: string): Readonly<Record<string, unknown>> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return invalidPayload(field);
  }

  return value as Readonly<Record<string, unknown>>;
}

function truncate(value: string, maximumLength: number): string {
  if (value.length <= maximumLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maximumLength - 1)).trimEnd()}…`;
}

function requiredString(
  source: Readonly<Record<string, unknown>>,
  key: string,
  maximumLength: number,
): string {
  const value = source[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    return invalidPayload(key);
  }

  return truncate(value.trim(), maximumLength);
}

function nullableString(
  source: Readonly<Record<string, unknown>>,
  key: string,
  maximumLength: number,
): string | null {
  const value = source[key];

  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return invalidPayload(key);
  }

  const normalized = value.trim();
  return normalized ? truncate(normalized, maximumLength) : null;
}

function requiredBoolean(source: Readonly<Record<string, unknown>>, key: string): boolean {
  const value = source[key];

  if (typeof value !== "boolean") {
    return invalidPayload(key);
  }

  return value;
}

function nullableDate(source: Readonly<Record<string, unknown>>, key: string): Date | null {
  const value = source[key];

  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return invalidPayload(key);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return invalidPayload(key);
  }

  return date;
}

function requiredDate(source: Readonly<Record<string, unknown>>, key: string): Date {
  return nullableDate(source, key) ?? invalidPayload(key);
}

function normalizeUrl(value: string, field: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return invalidPayload(field);
  }

  const isLocalHttp =
    url.protocol === "http:" && ["localhost", "127.0.0.1", "::1"].includes(url.hostname);

  if ((url.protocol !== "https:" && !isLocalHttp) || url.username || url.password) {
    return invalidPayload(field);
  }

  return url.toString();
}

function requiredUrl(source: Readonly<Record<string, unknown>>, key: string): string {
  return normalizeUrl(requiredString(source, key, 2048), key);
}

function normalizeCommitMessage(value: string): string {
  const firstLine = value.split(/\r?\n/, 1)[0] ?? "";
  const normalized = firstLine.replace(/\s+/g, " ").trim();
  return normalized ? truncate(normalized, LIMITS.commitMessage) : "Commit sem mensagem";
}

export function normalizeGitHubUser(value: unknown): UserSummary {
  const source = record(value, "user");

  return {
    login: requiredString(source, "login", LIMITS.login),
    name: nullableString(source, "name", LIMITS.name),
    avatarUrl: requiredUrl(source, "avatar_url"),
    url: requiredUrl(source, "html_url"),
  };
}

export function normalizeGitHubRepository(value: unknown): RepositorySummary {
  const source = record(value, "repository");
  const owner = record(source.owner, "owner");

  return {
    owner: requiredString(owner, "login", LIMITS.login),
    name: requiredString(source, "name", LIMITS.repositoryName),
    fullName: requiredString(source, "full_name", LIMITS.fullName),
    description: nullableString(source, "description", LIMITS.description),
    url: requiredUrl(source, "html_url"),
    defaultBranch: requiredString(source, "default_branch", LIMITS.branch),
    primaryLanguage: nullableString(source, "language", LIMITS.language),
    isFork: requiredBoolean(source, "fork"),
    isArchived: requiredBoolean(source, "archived"),
    isPrivate: requiredBoolean(source, "private"),
    pushedAt: nullableDate(source, "pushed_at"),
    updatedAt: requiredDate(source, "updated_at"),
  };
}

export function normalizeGitHubRepositories(value: unknown): readonly RepositorySummary[] {
  if (!Array.isArray(value)) {
    return invalidPayload("repositories");
  }

  return value.map(normalizeGitHubRepository);
}

export function normalizeGitHubCommit(value: unknown, branch: string): CommitSummary {
  const source = record(value, "commit");
  const commit = record(source.commit, "commit.commit");
  const author = record(commit.author, "commit.author");
  const committer = record(commit.committer, "commit.committer");
  const sha = requiredString(source, "sha", LIMITS.commitSha);

  return {
    sha,
    shortSha: sha.slice(0, 7),
    message: normalizeCommitMessage(requiredString(commit, "message", 10_000)),
    url: requiredUrl(source, "html_url"),
    branch,
    authoredAt: nullableDate(author, "date"),
    committedAt: nullableDate(committer, "date"),
  };
}
