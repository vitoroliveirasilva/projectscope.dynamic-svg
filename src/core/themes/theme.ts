export interface ThemeColors {
  readonly background: string;
  readonly surface: string;
  readonly foreground: string;
  readonly muted: string;
  readonly accent: string;
  readonly border: string;
  readonly success: string;
  readonly warning: string;
  readonly danger: string;
}

export interface Theme {
  readonly name: string;
  readonly colors: ThemeColors;
}

export interface ThemeColorOverrides {
  readonly background?: string;
  readonly foreground?: string;
  readonly accent?: string;
  readonly border?: string;
}
