import { createSvgDocument } from "../render/document.js";
import { escapeXml } from "../render/escape.js";
import { resolveTheme } from "../themes/resolve-theme.js";
import type { ThemeColorOverrides } from "../themes/theme.js";
import type { ThemeName } from "../themes/registry.js";
import type { AppError } from "./app-error.js";

interface ErrorCardOptions {
  readonly theme?: ThemeName;
  readonly colors?: ThemeColorOverrides;
  readonly width?: number;
}

const DEFAULT_WIDTH = 560;
const HEIGHT = 170;

export function renderErrorCard(
  error: AppError,
  { theme, colors, width = DEFAULT_WIDTH }: ErrorCardOptions = {},
): string {
  const resolvedTheme = resolveTheme({
    ...(theme === undefined ? {} : { name: theme }),
    ...(colors === undefined ? {} : { overrides: colors }),
  });
  const { background, foreground, muted, danger, border } = resolvedTheme.colors;
  const retryLabel = error.retryable
    ? "Tente novamente em alguns instantes."
    : "Revise os parâmetros informados.";

  const content = [
    `<rect width="${width}" height="${HEIGHT}" rx="14" fill="${background}"/>`,
    `<rect x="0.5" y="0.5" width="${width - 1}" height="${HEIGHT - 1}" rx="13.5" fill="none" stroke="${border}"/>`,
    `<circle cx="38" cy="38" r="7" fill="${danger}"/>`,
    `<text x="56" y="43" fill="${muted}" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="13" font-weight="700" letter-spacing="1">${escapeXml(error.code)}</text>`,
    `<text x="28" y="88" fill="${foreground}" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="22" font-weight="700">Não foi possível gerar o card</text>`,
    `<text x="28" y="120" fill="${muted}" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="14">${escapeXml(error.publicMessage)}</text>`,
    `<text x="28" y="146" fill="${muted}" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="12">${escapeXml(retryLabel)}</text>`,
  ].join("");

  return createSvgDocument({
    width,
    height: HEIGHT,
    title: "Erro ao gerar o card",
    description: `${error.publicMessage} ${retryLabel}`,
    trustedContent: content,
  });
}
