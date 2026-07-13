import type {
  CommitSummary,
  ProjectProvider,
  RepositoryQuery,
  RepositorySummary,
  UserSummary,
} from "../../src/providers/project-provider.js";

export function repositoryFixture(overrides: Partial<RepositorySummary> = {}): RepositorySummary {
  return {
    owner: "vitoroliveirasilva",
    name: "projectscope.dynamic-svg",
    fullName: "vitoroliveirasilva/projectscope.dynamic-svg",
    description: "SVGs dinâmicos para projetos e atividade de desenvolvimento.",
    url: "https://github.com/vitoroliveirasilva/projectscope.dynamic-svg",
    defaultBranch: "dev",
    primaryLanguage: "TypeScript",
    isFork: false,
    isArchived: false,
    isPrivate: false,
    pushedAt: new Date("2026-07-13T12:00:00.000Z"),
    updatedAt: new Date("2026-07-13T12:00:00.000Z"),
    ...overrides,
  };
}

export function commitFixture(overrides: Partial<CommitSummary> = {}): CommitSummary {
  return {
    sha: "abcdef1234567890",
    shortSha: "abcdef1",
    message: "feat: adiciona card now building",
    url: "https://github.com/vitoroliveirasilva/projectscope.dynamic-svg/commit/abcdef1",
    branch: "dev",
    authoredAt: new Date("2026-07-13T12:00:00.000Z"),
    committedAt: new Date("2026-07-13T12:00:00.000Z"),
    ...overrides,
  };
}

interface FakeProjectProviderOptions {
  readonly repositories?: readonly RepositorySummary[];
  readonly repository?: RepositorySummary;
  readonly commit?: CommitSummary | null;
  readonly commitByBranch?: Readonly<Record<string, CommitSummary | null | Error>>;
  readonly error?: Error;
}

export class FakeProjectProvider implements ProjectProvider {
  readonly repositories: readonly RepositorySummary[];
  readonly repository: RepositorySummary;
  readonly commit: CommitSummary | null;
  readonly commitByBranch: Readonly<Record<string, CommitSummary | null | Error>>;
  readonly error: Error | undefined;
  lastRepositoryQuery: RepositoryQuery | undefined;
  latestCommitBranches: string[] = [];

  constructor({
    repositories = [repositoryFixture()],
    repository = repositoryFixture(),
    commit = commitFixture(),
    commitByBranch = {},
    error,
  }: FakeProjectProviderOptions = {}) {
    this.repositories = repositories;
    this.repository = repository;
    this.commit = commit;
    this.commitByBranch = commitByBranch;
    this.error = error;
  }

  async getUser(username: string): Promise<UserSummary> {
    if (this.error !== undefined) throw this.error;
    return {
      login: username,
      name: "Vitor Oliveira Silva",
      avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
      url: `https://github.com/${username}`,
    };
  }

  async listRepositories(
    _username: string,
    options?: RepositoryQuery,
  ): Promise<readonly RepositorySummary[]> {
    if (this.error !== undefined) throw this.error;
    this.lastRepositoryQuery = options;
    return this.repositories;
  }

  async getRepository(_username: string, _repository: string): Promise<RepositorySummary> {
    if (this.error !== undefined) throw this.error;
    return this.repository;
  }

  async getLatestCommit(
    _repository: RepositorySummary,
    branch?: string,
  ): Promise<CommitSummary | null> {
    if (this.error !== undefined) throw this.error;
    const selectedBranch = branch ?? this.repository.defaultBranch;
    this.latestCommitBranches.push(selectedBranch);
    const configured = this.commitByBranch[selectedBranch];
    if (configured instanceof Error) throw configured;
    if (configured !== undefined) return configured;
    return this.commit === null ? null : { ...this.commit, branch: selectedBranch };
  }
}
