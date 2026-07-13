import type { Theme } from "./theme.js";

export const THEME_NAMES = ["github-dark", "github-light", "midnight", "transparent"] as const;
export type ThemeName = (typeof THEME_NAMES)[number];

export const DEFAULT_THEME_NAME: ThemeName = "github-dark";

export const THEME_REGISTRY: Readonly<Record<ThemeName, Theme>> = {
  "github-dark": {
    name: "github-dark",
    colors: {
      background: "#0D1117",
      surface: "#161B22",
      foreground: "#F0F6FC",
      muted: "#8B949E",
      accent: "#58A6FF",
      border: "#30363D",
      success: "#3FB950",
      warning: "#D29922",
      danger: "#F85149",
    },
  },
  "github-light": {
    name: "github-light",
    colors: {
      background: "#FFFFFF",
      surface: "#F6F8FA",
      foreground: "#1F2328",
      muted: "#59636E",
      accent: "#0969DA",
      border: "#D0D7DE",
      success: "#1A7F37",
      warning: "#9A6700",
      danger: "#CF222E",
    },
  },
  midnight: {
    name: "midnight",
    colors: {
      background: "#090B16",
      surface: "#11152A",
      foreground: "#F5F7FF",
      muted: "#9AA4C7",
      accent: "#8B80F9",
      border: "#293052",
      success: "#54D6A1",
      warning: "#F2C14E",
      danger: "#FF6B7A",
    },
  },
  transparent: {
    name: "transparent",
    colors: {
      background: "transparent",
      surface: "#0D1117",
      foreground: "#F0F6FC",
      muted: "#B1BAC4",
      accent: "#58A6FF",
      border: "#6E7681",
      success: "#3FB950",
      warning: "#D29922",
      danger: "#F85149",
    },
  },
};
