import { AppError } from "../../core/errors/app-error.js";
import { resolveTheme } from "../../core/themes/resolve-theme.js";
import type {
  CommitSummary,
  ProjectProvider,
  RepositorySummary,
} from "../../providers/project-provider.js";
import {
  formatRelativeDate,
  resolveActivityState,
  type ActivityState,
} from "../../shared/date-time.js";
import type { NowBuildingParams, NowBuildingViewModel } from "./model.js";

interface SelectNowBuildingOptions {
  readonly provider: ProjectProvider;
  readonly params: NowBuildingParams;
  readonly now: Date;
}

interface SelectedCommit {
  readonly commit: CommitSummary | null;
  readonly branch: string;
  readonly degraded: boolean;
}

function unavailable(): never {
  throw new AppError({
    code: "NO_DATA",
    publicMessage: "Nenhum projeto disponível.",
  });
}

function isExcluded(repository: RepositorySummary, exclude: readonly string[]): boolean {
  const values = new Set(exclude.map((item) => item.trim().toLowerCase()).filter(Boolean));
  return values.has(repository.name.toLowerCase()) || values.has(repository.fullName.toLowerCase());
}

function assertExplicitRepositoryEligible(
  repository: RepositorySummary,
  params: NowBuildingParams,
): RepositorySummary {
  if (
    (!params.includeForks && repository.isFork) ||
    (!params.includeArchived && repository.isArchived) ||
    isExcluded(repository, params.exclude)
  ) {
    return unavailable();
  }

  return repository;
}

async function selectRepository(
  provider: ProjectProvider,
  params: NowBuildingParams,
): Promise<RepositorySummary> {
  if (params.repository !== undefined) {
    return assertExplicitRepositoryEligible(
      await provider.getRepository(params.username, params.repository),
      params,
    );
  }

  const repositories = await provider.listRepositories(params.username, {
    includeForks: params.includeForks,
    includeArchived: params.includeArchived,
    exclude: params.exclude,
    maximum: 1_000,
  });
  const selected = repositories.find((repository) => repository.pushedAt !== null);
  return selected ?? unavailable();
}

async function selectCommit(
  provider: ProjectProvider,
  repository: RepositorySummary,
  requestedBranch: string | undefined,
): Promise<SelectedCommit> {
  const branch = requestedBranch ?? repository.defaultBranch;

  try {
    const commit = await provider.getLatestCommit(repository, branch);
    return { commit, branch, degraded: commit === null };
  } catch (error) {
    const canFallback =
      requestedBranch !== undefined &&
      branch !== repository.defaultBranch &&
      error instanceof AppError &&
      error.code === "NOT_FOUND";

    if (!canFallback) throw error;

    const commit = await provider.getLatestCommit(repository, repository.defaultBranch);
    return {
      commit,
      branch: repository.defaultBranch,
      degraded: true,
    };
  }
}

function activityLabel(state: ActivityState, locale: NowBuildingParams["locale"]): string {
  const labels = {
    "pt-BR": {
      active: "Atividade agora",
      recent: "Ativo hoje",
      warm: "Ativo nesta semana",
      quiet: "Atividade recente",
      idle: "Em repouso",
    },
    "en-US": {
      active: "Active now",
      recent: "Active today",
      warm: "Active this week",
      quiet: "Recent activity",
      idle: "At rest",
    },
  } as const;

  return labels[locale][state];
}

export async function selectNowBuilding({
  provider,
  params,
  now,
}: SelectNowBuildingOptions): Promise<NowBuildingViewModel> {
  const repository = await selectRepository(provider, params);
  const selectedCommit = await selectCommit(provider, repository, params.branch);
  const activityDate = repository.pushedAt ?? repository.updatedAt;
  const activityState = resolveActivityState(activityDate, now);
  const metadata: string[] = [];

  if (params.showLanguage && repository.primaryLanguage !== null) {
    metadata.push(repository.primaryLanguage);
  }
  if (params.showBranch) metadata.push(selectedCommit.branch);

  return {
    width: params.width,
    height: params.compact ? 170 : 210,
    hideBorder: params.hideBorder,
    compact: params.compact,
    locale: params.locale,
    theme: resolveTheme({ name: params.theme, overrides: params.colors }),
    username: params.username,
    repositoryName: repository.name,
    ...(params.showDescription && repository.description !== null
      ? { description: repository.description }
      : {}),
    ...(params.showCommit && selectedCommit.commit !== null
      ? { commitMessage: selectedCommit.commit.message }
      : {}),
    metadata,
    activityState,
    activityLabel: activityLabel(activityState, params.locale),
    ...(params.showUpdated
      ? { updatedLabel: formatRelativeDate(activityDate, now, params.locale) }
      : {}),
    degraded: selectedCommit.degraded || repository.pushedAt === null,
  };
}
