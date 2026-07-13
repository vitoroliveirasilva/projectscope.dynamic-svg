import { createSvgDocument } from "../../core/render/document.js";
import { escapeXml } from "../../core/render/escape.js";
import { truncateSvgText } from "../../core/render/text.js";
import type { ActivityLevel, ProjectRadarViewModel, RadarPoint } from "./model.js";

const FONT_FAMILY = "-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif";
const HORIZONTAL_PADDING = 28;

function textElement(
  x: number,
  y: number,
  value: string,
  options: {
    readonly fill: string;
    readonly size: number;
    readonly weight?: number;
    readonly letterSpacing?: number;
    readonly anchor?: "start" | "middle" | "end";
    readonly opacity?: number;
  },
): string {
  const weight = options.weight === undefined ? "" : ` font-weight="${options.weight}"`;
  const spacing =
    options.letterSpacing === undefined ? "" : ` letter-spacing="${options.letterSpacing}"`;
  const anchor = options.anchor === undefined ? "" : ` text-anchor="${options.anchor}"`;
  const opacity = options.opacity === undefined ? "" : ` opacity="${options.opacity}"`;

  return `<text x="${x}" y="${y}" fill="${options.fill}" font-family="${FONT_FAMILY}" font-size="${options.size}"${weight}${spacing}${anchor}${opacity}>${escapeXml(value)}</text>`;
}

function activityColor(model: ProjectRadarViewModel, level: ActivityLevel): string {
  if (level >= 5) return model.theme.colors.success;
  if (level === 4) return model.theme.colors.accent;
  if (level === 3) return model.theme.colors.warning;
  return model.theme.colors.muted;
}

function renderPoint(model: ProjectRadarViewModel, point: RadarPoint): string {
  const color = activityColor(model, point.activityLevel);
  const elements = [
    `<circle cx="${point.x}" cy="${point.y}" r="${point.radius + 3}" fill="none" stroke="${color}" stroke-opacity="${Math.max(0.18, point.opacity - 0.55).toFixed(2)}"/>`,
    `<circle cx="${point.x}" cy="${point.y}" r="${point.radius}" fill="${color}" opacity="${point.opacity}"/>`,
  ];

  if (!point.showLabel) return elements.join("");

  const connectorEnd = point.labelAnchor === "start" ? point.labelX - 3 : point.labelX + 3;
  elements.push(
    `<line x1="${point.x}" y1="${point.y}" x2="${connectorEnd}" y2="${point.y}" stroke="${model.theme.colors.border}" stroke-width="1" opacity="0.7"/>`,
    textElement(point.labelX, point.labelY, point.label, {
      fill: model.theme.colors.foreground,
      size: 12,
      weight: point.activityLevel >= 4 ? 650 : 550,
      anchor: point.labelAnchor,
    }),
  );

  if (point.showLanguage && point.language !== null) {
    elements.push(
      textElement(point.labelX, point.labelY + 14, truncateSvgText(point.language, 120, 10), {
        fill: model.theme.colors.muted,
        size: 10,
        weight: 500,
        anchor: point.labelAnchor,
      }),
    );
  }

  return elements.join("");
}

export function renderProjectRadar(model: ProjectRadarViewModel): string {
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
    textElement(HORIZONTAL_PADDING, 34, "PROJECT RADAR", {
      fill: model.theme.colors.muted,
      size: 13,
      weight: 700,
      letterSpacing: 1.25,
    }),
    textElement(model.width - HORIZONTAL_PADDING, 34, String(model.points.length), {
      fill: model.theme.colors.accent,
      size: 13,
      weight: 700,
      anchor: "end",
    }),
  );

  for (const radius of model.orbitRadii) {
    content.push(
      `<ellipse cx="${model.centerX}" cy="${model.centerY}" rx="${radius}" ry="${Number((radius * 0.78).toFixed(2))}" fill="none" stroke="${model.theme.colors.border}" stroke-width="1" stroke-dasharray="4 6" opacity="0.72"/>`,
    );
  }

  content.push(
    `<circle cx="${model.centerX}" cy="${model.centerY}" r="34" fill="${model.theme.colors.surface}" stroke="${model.theme.colors.border}"/>`,
    `<circle cx="${model.centerX}" cy="${model.centerY}" r="25" fill="none" stroke="${model.theme.colors.accent}" stroke-opacity="0.4"/>`,
    textElement(model.centerX, model.centerY + 4, truncateSvgText(model.centerLabel, 118, 13), {
      fill: model.theme.colors.foreground,
      size: 13,
      weight: 700,
      anchor: "middle",
    }),
  );

  for (const point of model.points) content.push(renderPoint(model, point));

  content.push(
    textElement(HORIZONTAL_PADDING, model.height - 18, model.footerLabel, {
      fill: model.theme.colors.muted,
      size: 11,
      weight: 500,
    }),
    textElement(
      model.width - HORIZONTAL_PADDING,
      model.height - 18,
      model.locale === "pt-BR"
        ? `${model.points.length} projeto${model.points.length === 1 ? "" : "s"}`
        : `${model.points.length} project${model.points.length === 1 ? "" : "s"}`,
      {
        fill: model.theme.colors.muted,
        size: 11,
        weight: 500,
        anchor: "end",
      },
    ),
  );

  const names = model.points
    .map((point) => truncateSvgText(point.repositoryName, 120, 12))
    .join(", ");
  const title =
    model.locale === "pt-BR"
      ? `Radar de projetos de ${model.username}`
      : `Project radar for ${model.username}`;
  const projectNoun =
    model.locale === "pt-BR"
      ? `projeto${model.points.length === 1 ? "" : "s"}`
      : `project${model.points.length === 1 ? "" : "s"}`;
  const description =
    model.locale === "pt-BR"
      ? `Radar com ${model.points.length} ${projectNoun} ordenado${model.points.length === 1 ? "" : "s"} por atividade recente: ${names}.`
      : `Radar with ${model.points.length} ${projectNoun} ordered by recent activity: ${names}.`;

  return createSvgDocument({
    width: model.width,
    height: model.height,
    title,
    description: truncateSvgText(description, 720, 12),
    trustedContent: content.join(""),
  });
}
