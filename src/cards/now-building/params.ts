import {
  parseCommonCardParams,
  type QueryParameters,
} from "../../core/validation/common-params.js";
import { AppError } from "../../core/errors/app-error.js";
import { optionalTrimmed, parseBoolean, parseList } from "../../core/validation/primitives.js";
import type { NowBuildingParams } from "./model.js";

const REPOSITORY_PATTERN = /^[A-Za-z0-9._-]{1,100}$/;

function parseOptionalRepository(value: string | undefined): string | undefined {
  const normalized = optionalTrimmed(value);

  if (normalized === undefined) return undefined;
  if (!REPOSITORY_PATTERN.test(normalized) || normalized.includes("/")) {
    throw new AppError({
      code: "INVALID_REQUEST",
      publicMessage: "Repositório possui um formato inválido.",
    });
  }

  return normalized;
}

function containsInvalidBranchCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0);
    return codePoint !== undefined && (codePoint < 0x20 || codePoint === 0x7f);
  });
}

function parseOptionalBranch(value: string | undefined): string | undefined {
  const normalized = optionalTrimmed(value);

  if (normalized === undefined) return undefined;
  if (normalized.length > 255 || containsInvalidBranchCharacter(normalized)) {
    throw new AppError({
      code: "INVALID_REQUEST",
      publicMessage: "Branch possui um formato inválido.",
    });
  }

  return normalized;
}

export function parseNowBuildingParams(query: QueryParameters): NowBuildingParams {
  const compact = parseBoolean(query.compact, false, "compact");
  const common = parseCommonCardParams(query, {
    defaultWidth: 600,
    minimumWidth: 360,
    maximumWidth: 1000,
  });

  const repository = parseOptionalRepository(query.repository);
  const branch = parseOptionalBranch(query.branch);

  return {
    ...common,
    ...(repository === undefined ? {} : { repository }),
    ...(branch === undefined ? {} : { branch }),
    exclude: parseList(query.exclude, {
      name: "exclude",
      maximumItems: 25,
      maximumItemLength: 100,
    }),
    includeForks: parseBoolean(query.include_forks, false, "include_forks"),
    includeArchived: parseBoolean(query.include_archived, false, "include_archived"),
    showDescription: parseBoolean(query.show_description, !compact, "show_description"),
    showCommit: parseBoolean(query.show_commit, true, "show_commit"),
    showLanguage: parseBoolean(query.show_language, true, "show_language"),
    showBranch: parseBoolean(query.show_branch, true, "show_branch"),
    showUpdated: parseBoolean(query.show_updated, true, "show_updated"),
    compact,
  };
}
