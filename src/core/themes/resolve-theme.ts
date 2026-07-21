import { DEFAULT_THEME_NAME, THEME_REGISTRY, type ThemeName } from "./registry.js";
import type { Theme, ThemeColorOverrides, ThemeColors } from "./theme.js";

const TEXT_CONTRAST_RATIO = 4.5;
const DECORATIVE_CONTRAST_RATIO = 3;

export interface ResolveThemeOptions {
  readonly name?: ThemeName;
  readonly overrides?: ThemeColorOverrides;
}

interface RgbColor {
  readonly red: number;
  readonly green: number;
  readonly blue: number;
}

function normalizeColor(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim().replace(/^#/, "");
  return /^[0-9a-f]{6}$/i.test(normalized) ? `#${normalized.toUpperCase()}` : undefined;
}

function toRgb(color: string): RgbColor | undefined {
  const normalized = normalizeColor(color);

  if (normalized === undefined) {
    return undefined;
  }

  return {
    red: Number.parseInt(normalized.slice(1, 3), 16),
    green: Number.parseInt(normalized.slice(3, 5), 16),
    blue: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

function linearize(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(color: string): number | undefined {
  const rgb = toRgb(color);

  if (rgb === undefined) {
    return undefined;
  }

  return 0.2126 * linearize(rgb.red) + 0.7152 * linearize(rgb.green) + 0.0722 * linearize(rgb.blue);
}

export function contrastRatio(first: string, second: string): number {
  const firstLuminance = luminance(first);
  const secondLuminance = luminance(second);

  if (firstLuminance === undefined || secondLuminance === undefined) {
    return 1;
  }

  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function readableColor(
  preferred: string,
  background: string,
  fallbacks: readonly string[],
  minimumRatio: number,
): string {
  for (const candidate of [preferred, ...fallbacks]) {
    if (contrastRatio(candidate, background) >= minimumRatio) {
      return candidate;
    }
  }

  return contrastRatio("#FFFFFF", background) >= contrastRatio("#000000", background)
    ? "#FFFFFF"
    : "#000000";
}

export function resolveTheme({
  name = DEFAULT_THEME_NAME,
  overrides = {},
}: ResolveThemeOptions = {}): Theme {
  const baseTheme = THEME_REGISTRY[name] ?? THEME_REGISTRY[DEFAULT_THEME_NAME];
  const overrideBackground = normalizeColor(overrides.background);
  const overrideForeground = normalizeColor(overrides.foreground);
  const overrideAccent = normalizeColor(overrides.accent);
  const overrideBorder = normalizeColor(overrides.border);

  let background = overrideBackground ?? baseTheme.colors.background;
  const contrastBackground = background === "transparent" ? baseTheme.colors.surface : background;
  let foreground = overrideForeground ?? baseTheme.colors.foreground;

  if (contrastRatio(foreground, contrastBackground) < TEXT_CONTRAST_RATIO) {
    foreground = readableColor(
      baseTheme.colors.foreground,
      contrastBackground,
      ["#FFFFFF", "#000000"],
      TEXT_CONTRAST_RATIO,
    );
  }

  if (contrastRatio(foreground, contrastBackground) < TEXT_CONTRAST_RATIO) {
    background = baseTheme.colors.background;
    const restoredBackground = background === "transparent" ? baseTheme.colors.surface : background;
    foreground = readableColor(
      overrideForeground ?? baseTheme.colors.foreground,
      restoredBackground,
      [baseTheme.colors.foreground, "#FFFFFF", "#000000"],
      TEXT_CONTRAST_RATIO,
    );
  }

  const finalContrastBackground =
    background === "transparent" ? baseTheme.colors.surface : background;
  const accent = readableColor(
    overrideAccent ?? baseTheme.colors.accent,
    finalContrastBackground,
    [baseTheme.colors.accent, foreground],
    DECORATIVE_CONTRAST_RATIO,
  );
  const muted = readableColor(
    baseTheme.colors.muted,
    finalContrastBackground,
    [foreground],
    DECORATIVE_CONTRAST_RATIO,
  );

  const colors: ThemeColors = {
    ...baseTheme.colors,
    background,
    foreground,
    muted,
    accent,
    border: overrideBorder ?? baseTheme.colors.border,
  };

  return {
    name: baseTheme.name,
    colors,
  };
}
