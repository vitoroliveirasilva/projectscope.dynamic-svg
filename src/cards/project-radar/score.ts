import type { RepositorySummary } from "../../providers/project-provider.js";
import type { ActivityLevel } from "./model.js";

const DAY_IN_MILLISECONDS = 86_400_000;

export function resolveActivityLevel(pushedAt: Date | null, now: Date): ActivityLevel {
  if (pushedAt === null || Number.isNaN(pushedAt.getTime())) return 0;

  const age = Math.max(0, now.getTime() - pushedAt.getTime());
  const days = age / DAY_IN_MILLISECONDS;

  if (days <= 1) return 5;
  if (days <= 7) return 4;
  if (days <= 30) return 3;
  if (days <= 90) return 2;
  return 1;
}

function timestamp(value: Date | null): number {
  return value?.getTime() ?? Number.NEGATIVE_INFINITY;
}

export function compareRepositoriesByActivity(
  first: RepositorySummary,
  second: RepositorySummary,
  now: Date,
): number {
  const levelDifference =
    resolveActivityLevel(second.pushedAt, now) - resolveActivityLevel(first.pushedAt, now);
  if (levelDifference !== 0) return levelDifference;

  const pushedDifference = timestamp(second.pushedAt) - timestamp(first.pushedAt);
  if (pushedDifference !== 0) return pushedDifference;

  const updatedDifference = second.updatedAt.getTime() - first.updatedAt.getTime();
  if (updatedDifference !== 0) return updatedDifference;

  return first.name.localeCompare(second.name, "en", { sensitivity: "base" });
}
