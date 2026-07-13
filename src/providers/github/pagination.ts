const NEXT_RELATION_PATTERN = /<[^>]+>\s*;\s*rel="next"/i;

export function hasNextGitHubPage(linkHeader: string | null): boolean {
  return linkHeader !== null && NEXT_RELATION_PATTERN.test(linkHeader);
}
