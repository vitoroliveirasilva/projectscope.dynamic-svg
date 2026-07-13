import { AppError } from "../../core/errors/app-error.js";
import {
  parseCommonCardParams,
  type QueryParameters,
} from "../../core/validation/common-params.js";
import {
  optionalTrimmed,
  parseBoolean,
  parseEnum,
  parseInteger,
  parseList,
} from "../../core/validation/primitives.js";
import type { ProjectRadarLayout, ProjectRadarParams, ProjectRadarSort } from "./model.js";

const SORTS = ["activity"] as const satisfies readonly ProjectRadarSort[];
const LAYOUTS = ["orbit"] as const satisfies readonly ProjectRadarLayout[];
const MAX_CENTER_LABEL_LENGTH = 32;

function hasInvalidControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0);
    return codePoint !== undefined && (codePoint < 0x20 || codePoint === 0x7f);
  });
}

function parseCenterLabel(value: string | undefined, username: string): string {
  const normalized = optionalTrimmed(value);

  if (normalized === undefined) return username;
  if (normalized.length > MAX_CENTER_LABEL_LENGTH || hasInvalidControlCharacter(normalized)) {
    throw new AppError({
      code: "INVALID_REQUEST",
      publicMessage: "center_label possui um formato inválido.",
    });
  }

  return normalized;
}

export function parseProjectRadarParams(query: QueryParameters): ProjectRadarParams {
  const common = parseCommonCardParams(query, {
    defaultWidth: 640,
    minimumWidth: 420,
    maximumWidth: 1200,
  });

  return {
    ...common,
    limit: parseInteger(query.limit, {
      name: "limit",
      minimum: 1,
      maximum: 12,
      fallback: 6,
    }),
    exclude: parseList(query.exclude, {
      name: "exclude",
      maximumItems: 25,
      maximumItemLength: 100,
    }),
    includeForks: parseBoolean(query.include_forks, false, "include_forks"),
    includeArchived: parseBoolean(query.include_archived, false, "include_archived"),
    labels: parseBoolean(query.labels, true, "labels"),
    showLanguage: parseBoolean(query.show_language, true, "show_language"),
    sort: parseEnum(query.sort, SORTS, "activity", "sort"),
    layout: parseEnum(query.layout, LAYOUTS, "orbit", "layout"),
    centerLabel: parseCenterLabel(query.center_label, common.username),
  };
}
