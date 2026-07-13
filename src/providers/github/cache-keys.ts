function segment(value: string): string {
  return value.trim().toLowerCase();
}

export const githubCacheKeys = {
  user: (username: string): string => `github:user:${segment(username)}`,
  repositories: (username: string): string => `github:repositories:${segment(username)}`,
  repository: (username: string, repository: string): string =>
    `github:repository:${segment(username)}/${segment(repository)}`,
  commit: (owner: string, repository: string, branch: string): string =>
    `github:commit:${segment(owner)}/${segment(repository)}:${segment(branch)}`,
} as const;
