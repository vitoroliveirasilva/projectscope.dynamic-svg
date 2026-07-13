import { DEFAULT_THEME_NAME, THEME_NAMES, type ThemeName } from "../themes/registry.js";
import type { ThemeColorOverrides } from "../themes/theme.js";
import {
  parseBoolean,
  parseEnum,
  parseHexColor,
  parseInteger,
  parseRequiredString,
} from "./primitives.js";

export type CardLocale = "pt-BR" | "en-US";
export type QueryParameters = Readonly<Record<string, string | undefined>>;

export interface CommonCardParams {
  readonly username: string;
  readonly theme: ThemeName;
  readonly locale: CardLocale;
  readonly width: number;
  readonly hideBorder: boolean;
  readonly colors: ThemeColorOverrides;
}

interface CommonCardParamsOptions {
  readonly defaultWidth: number;
  readonly minimumWidth?: number;
  readonly maximumWidth?: number;
}

const LOCALES = ["pt-BR", "en-US"] as const;
const GITHUB_USERNAME_PATTERN = /^(?!-)[A-Za-z0-9-]{1,39}(?<!-)$/;

function parseThemeName(value: string | undefined): ThemeName {
  const normalized = value?.trim().toLowerCase();
  return THEME_NAMES.find((name) => name === normalized) ?? DEFAULT_THEME_NAME;
}

export function parseCommonCardParams(
  query: QueryParameters,
  { defaultWidth, minimumWidth = 320, maximumWidth = 1200 }: CommonCardParamsOptions,
): CommonCardParams {
  const background = parseHexColor(query.background, "background");
  const foreground = parseHexColor(query.foreground, "foreground");
  const accent = parseHexColor(query.accent, "accent");
  const border = parseHexColor(query.border, "border");

  return {
    username: parseRequiredString(query.username, "um usuário", 39, GITHUB_USERNAME_PATTERN),
    theme: parseThemeName(query.theme),
    locale: parseEnum(query.locale, LOCALES, "pt-BR", "locale"),
    width: parseInteger(query.width, {
      name: "width",
      minimum: minimumWidth,
      maximum: maximumWidth,
      fallback: defaultWidth,
    }),
    hideBorder: parseBoolean(query.hide_border, false, "hide_border"),
    colors: {
      ...(background === undefined ? {} : { background }),
      ...(foreground === undefined ? {} : { foreground }),
      ...(accent === undefined ? {} : { accent }),
      ...(border === undefined ? {} : { border }),
    },
  };
}
