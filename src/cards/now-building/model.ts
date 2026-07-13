import type { CardLocale, CommonCardParams } from "../../core/validation/common-params.js";
import type { Theme } from "../../core/themes/theme.js";
import type { ActivityState } from "../../shared/date-time.js";

export interface NowBuildingParams extends CommonCardParams {
  readonly repository?: string;
  readonly branch?: string;
  readonly exclude: readonly string[];
  readonly includeForks: boolean;
  readonly includeArchived: boolean;
  readonly showDescription: boolean;
  readonly showCommit: boolean;
  readonly showLanguage: boolean;
  readonly showBranch: boolean;
  readonly showUpdated: boolean;
  readonly compact: boolean;
}

export interface NowBuildingViewModel {
  readonly width: number;
  readonly height: number;
  readonly hideBorder: boolean;
  readonly compact: boolean;
  readonly locale: CardLocale;
  readonly theme: Theme;
  readonly username: string;
  readonly repositoryName: string;
  readonly description?: string;
  readonly commitMessage?: string;
  readonly metadata: readonly string[];
  readonly activityState: ActivityState;
  readonly activityLabel: string;
  readonly updatedLabel?: string;
  readonly degraded: boolean;
}
