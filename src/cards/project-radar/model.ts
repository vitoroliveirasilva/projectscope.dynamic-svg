import type { Theme } from "../../core/themes/theme.js";
import type { CardLocale, CommonCardParams } from "../../core/validation/common-params.js";

export type ProjectRadarSort = "activity";
export type ProjectRadarLayout = "orbit";
export type ActivityLevel = 0 | 1 | 2 | 3 | 4 | 5;
export type LabelAnchor = "start" | "end";

export interface ProjectRadarParams extends CommonCardParams {
  readonly limit: number;
  readonly exclude: readonly string[];
  readonly includeForks: boolean;
  readonly includeArchived: boolean;
  readonly labels: boolean;
  readonly showLanguage: boolean;
  readonly sort: ProjectRadarSort;
  readonly layout: ProjectRadarLayout;
  readonly centerLabel: string;
}

export interface RadarProject {
  readonly name: string;
  readonly fullName: string;
  readonly language: string | null;
  readonly activityLevel: ActivityLevel;
  readonly pushedAt: Date;
  readonly updatedAt: Date;
}

export interface RadarPoint {
  readonly repositoryName: string;
  readonly fullName: string;
  readonly language: string | null;
  readonly activityLevel: ActivityLevel;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly opacity: number;
  readonly label: string;
  readonly labelX: number;
  readonly labelY: number;
  readonly labelAnchor: LabelAnchor;
  readonly showLabel: boolean;
  readonly showLanguage: boolean;
}

export interface ProjectRadarViewModel {
  readonly width: number;
  readonly height: number;
  readonly hideBorder: boolean;
  readonly locale: CardLocale;
  readonly theme: Theme;
  readonly username: string;
  readonly centerLabel: string;
  readonly points: readonly RadarPoint[];
  readonly orbitRadii: readonly number[];
  readonly centerX: number;
  readonly centerY: number;
  readonly footerLabel: string;
}
