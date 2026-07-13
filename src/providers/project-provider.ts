export interface UserSummary {
  readonly login: string;
  readonly name: string | null;
  readonly avatarUrl: string;
  readonly url: string;
}

export interface RepositorySummary {
  readonly owner: string;
  readonly name: string;
  readonly fullName: string;
  readonly description: string | null;
  readonly url: string;
  readonly defaultBranch: string;
  readonly primaryLanguage: string | null;
  readonly isFork: boolean;
  readonly isArchived: boolean;
  readonly isPrivate: boolean;
  readonly pushedAt: Date | null;
  readonly updatedAt: Date;
}

export interface CommitSummary {
  readonly sha: string;
  readonly shortSha: string;
  readonly message: string;
  readonly url: string;
  readonly branch: string;
  readonly authoredAt: Date | null;
  readonly committedAt: Date | null;
}

export interface RepositoryQuery {
  readonly includeForks?: boolean;
  readonly includeArchived?: boolean;
  readonly exclude?: readonly string[];
  readonly maximum?: number;
}

export interface ProjectProvider {
  getUser(username: string): Promise<UserSummary>;
  listRepositories(
    username: string,
    options?: RepositoryQuery,
  ): Promise<readonly RepositorySummary[]>;
  getRepository(username: string, repository: string): Promise<RepositorySummary>;
  getLatestCommit(repository: RepositorySummary, branch?: string): Promise<CommitSummary | null>;
}
