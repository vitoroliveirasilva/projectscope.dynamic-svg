import { createSvgDocument } from "../../core/render/document.js";
import { escapeXml } from "../../core/render/escape.js";
import { truncateSvgText } from "../../core/render/text.js";
import type { ActivityState } from "../../shared/date-time.js";
import type { NowBuildingViewModel } from "./model.js";

const FONT_FAMILY = "-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif";
const HORIZONTAL_PADDING = 28;

function activityColor(model: NowBuildingViewModel): string {
  const colors: Readonly<Record<ActivityState, string>> = {
    active: model.theme.colors.success,
    recent: model.theme.colors.success,
    warm: model.theme.colors.accent,
    quiet: model.theme.colors.warning,
    idle: model.theme.colors.muted,
  };

  return colors[model.activityState];
}

function textElement(
  x: number,
  y: number,
  value: string,
  options: {
    readonly fill: string;
    readonly size: number;
    readonly weight?: number;
    readonly letterSpacing?: number;
  },
): string {
  const weight = options.weight === undefined ? "" : ` font-weight="${options.weight}"`;
  const spacing =
    options.letterSpacing === undefined ? "" : ` letter-spacing="${options.letterSpacing}"`;

  return `<text x="${x}" y="${y}" fill="${options.fill}" font-family="${FONT_FAMILY}" font-size="${options.size}"${weight}${spacing}>${escapeXml(value)}</text>`;
}

function renderMetadata(model: NowBuildingViewModel, y: number): string {
  const availableWidth = model.width - HORIZONTAL_PADDING * 2;
  const parts = [...model.metadata];

  if (model.updatedLabel !== undefined) parts.push(model.updatedLabel);
  if (parts.length === 0) parts.push(model.activityLabel);

  return textElement(
    HORIZONTAL_PADDING,
    y,
    truncateSvgText(parts.join("  •  "), availableWidth, 13),
    { fill: model.theme.colors.muted, size: 13, weight: 500 },
  );
}

export function renderNowBuilding(model: NowBuildingViewModel): string {
  const availableWidth = model.width - HORIZONTAL_PADDING * 2;
  const content: string[] = [];
  const backgroundFill =
    model.theme.colors.background === "transparent" ? "none" : model.theme.colors.background;

  content.push(
    `<rect width="${model.width}" height="${model.height}" rx="14" fill="${backgroundFill}"/>`,
  );

  if (!model.hideBorder) {
    content.push(
      `<rect x="0.5" y="0.5" width="${model.width - 1}" height="${model.height - 1}" rx="13.5" fill="none" stroke="${model.theme.colors.border}"/>`,
    );
  }

  content.push(
    `<circle cx="${HORIZONTAL_PADDING + 6}" cy="29" r="6" fill="${activityColor(model)}"/>`,
    textElement(HORIZONTAL_PADDING + 20, 34, "NOW BUILDING", {
      fill: model.theme.colors.muted,
      size: 13,
      weight: 700,
      letterSpacing: 1.25,
    }),
    textElement(
      HORIZONTAL_PADDING,
      model.compact ? 74 : 72,
      truncateSvgText(model.repositoryName, availableWidth, 24),
      { fill: model.theme.colors.foreground, size: 24, weight: 700 },
    ),
  );

  if (model.compact) {
    if (model.description !== undefined) {
      content.push(
        textElement(
          HORIZONTAL_PADDING,
          99,
          truncateSvgText(model.description, availableWidth, 12),
          { fill: model.theme.colors.muted, size: 12 },
        ),
      );
    }

    if (model.commitMessage !== undefined) {
      content.push(
        textElement(
          HORIZONTAL_PADDING,
          model.description === undefined ? 110 : 124,
          truncateSvgText(model.commitMessage, availableWidth, 13),
          { fill: model.theme.colors.foreground, size: 13, weight: 500 },
        ),
      );
    }
    content.push(renderMetadata(model, 150));
  } else {
    if (model.description !== undefined) {
      content.push(
        textElement(
          HORIZONTAL_PADDING,
          101,
          truncateSvgText(model.description, availableWidth, 14),
          { fill: model.theme.colors.muted, size: 14 },
        ),
      );
    }

    if (model.commitMessage !== undefined) {
      content.push(
        `<rect x="${HORIZONTAL_PADDING}" y="119" width="3" height="22" rx="1.5" fill="${model.theme.colors.accent}"/>`,
        textElement(
          HORIZONTAL_PADDING + 12,
          136,
          truncateSvgText(model.commitMessage, availableWidth - 12, 14),
          { fill: model.theme.colors.foreground, size: 14, weight: 500 },
        ),
      );
    }

    content.push(renderMetadata(model, 178));
    content.push(
      textElement(
        model.width - HORIZONTAL_PADDING - Math.min(150, availableWidth / 3),
        34,
        truncateSvgText(model.activityLabel, Math.min(150, availableWidth / 3), 12),
        { fill: activityColor(model), size: 12, weight: 600 },
      ),
    );
  }

  const accessibleTitle =
    model.locale === "pt-BR"
      ? `Projeto em destaque de ${model.username}`
      : `Featured project for ${model.username}`;
  const accessibleRepositoryName = truncateSvgText(model.repositoryName, 560, 14);
  const accessibleDescription =
    model.locale === "pt-BR"
      ? `${accessibleRepositoryName}, ${model.activityLabel.toLowerCase()}${model.updatedLabel === undefined ? "" : `, atualizado ${model.updatedLabel}`}.`
      : `${accessibleRepositoryName}, ${model.activityLabel.toLowerCase()}${model.updatedLabel === undefined ? "" : `, updated ${model.updatedLabel}`}.`;

  return createSvgDocument({
    width: model.width,
    height: model.height,
    title: accessibleTitle,
    description: accessibleDescription,
    trustedContent: content.join(""),
  });
}
