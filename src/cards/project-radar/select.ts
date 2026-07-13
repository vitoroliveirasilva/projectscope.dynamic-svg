import { AppError } from "../../core/errors/app-error.js";
import { resolveTheme } from "../../core/themes/resolve-theme.js";
import type { ProjectProvider, RepositorySummary } from "../../providers/project-provider.js";
import { layoutRadar, deriveRadarHeight } from "./layout.js";
import type { ProjectRadarParams, ProjectRadarViewModel, RadarProject } from "./model.js";
import { compareRepositoriesByActivity, resolveActivityLevel } from "./score.js";

interface SelectProjectRadarOptions {
  readonly provider: ProjectProvider;
  readonly params: ProjectRadarParams;
  readonly now: Date;
}

function noProjects(): never {
  throw new AppError({
    code: "NO_DATA",
    publicMessage: "Nenhum projeto disponível.",
  });
}

function toRadarProject(repository: RepositorySummary, now: Date): RadarProject | null {
  if (repository.pushedAt === null) return null;

  return {
    name: repository.name,
    fullName: repository.fullName,
    language: repository.primaryLanguage,
    activityLevel: resolveActivityLevel(repository.pushedAt, now),
    pushedAt: repository.pushedAt,
    updatedAt: repository.updatedAt,
  };
}

function footerLabel(locale: ProjectRadarParams["locale"]): string {
  return locale === "pt-BR"
    ? "Atividade baseada no último push"
    : "Activity based on the latest push";
}

export async function selectProjectRadar({
  provider,
  params,
  now,
}: SelectProjectRadarOptions): Promise<ProjectRadarViewModel> {
  const repositories = await provider.listRepositories(params.username, {
    includeForks: params.includeForks,
    includeArchived: params.includeArchived,
    exclude: params.exclude,
    maximum: 1_000,
  });
  const selected = [...repositories]
    .filter((repository) => repository.pushedAt !== null)
    .sort((first, second) => compareRepositoriesByActivity(first, second, now))
    .slice(0, params.limit)
    .map((repository) => toRadarProject(repository, now))
    .filter((project): project is RadarProject => project !== null);

  if (selected.length === 0) return noProjects();

  const height = deriveRadarHeight(params.width);
  const layout = layoutRadar({
    projects: selected,
    width: params.width,
    height,
    labels: params.labels,
    showLanguage: params.showLanguage,
  });

  return {
    width: params.width,
    height,
    hideBorder: params.hideBorder,
    locale: params.locale,
    theme: resolveTheme({ name: params.theme, overrides: params.colors }),
    username: params.username,
    centerLabel: params.centerLabel,
    points: layout.points,
    orbitRadii: layout.orbitRadii,
    centerX: layout.centerX,
    centerY: layout.centerY,
    footerLabel: footerLabel(params.locale),
  };
}
