export { createSvgDocument } from "../../../src/core/render/document.js";
export type { SvgDocumentOptions } from "../../../src/core/render/document.js";

export { escapeXml, sanitizeXmlText } from "../../../src/core/render/escape.js";
export { estimateTextWidth, truncateSvgText } from "../../../src/core/render/text.js";

export {
  DEFAULT_THEME_NAME,
  THEME_NAMES,
  THEME_REGISTRY,
} from "../../../src/core/themes/registry.js";
export type { ThemeName } from "../../../src/core/themes/registry.js";

export { contrastRatio, resolveTheme } from "../../../src/core/themes/resolve-theme.js";
export type { ResolveThemeOptions } from "../../../src/core/themes/resolve-theme.js";

export type { Theme, ThemeColorOverrides, ThemeColors } from "../../../src/core/themes/theme.js";
