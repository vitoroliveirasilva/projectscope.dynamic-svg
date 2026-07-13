import { estimateTextWidth, truncateSvgText } from "../../core/render/text.js";
import { stableHash } from "../../shared/hash.js";
import type { LabelAnchor, RadarPoint, RadarProject } from "./model.js";

interface Rectangle {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

interface RadarLayoutResult {
  readonly points: readonly RadarPoint[];
  readonly orbitRadii: readonly number[];
  readonly centerX: number;
  readonly centerY: number;
}

interface LayoutRadarOptions {
  readonly projects: readonly RadarProject[];
  readonly width: number;
  readonly height: number;
  readonly labels: boolean;
  readonly showLanguage: boolean;
}

const HEADER_HEIGHT = 52;
const FOOTER_HEIGHT = 38;
const EDGE_PADDING = 16;
const LABEL_FONT_SIZE = 12;
const LANGUAGE_FONT_SIZE = 10;
const ANGLE_ATTEMPTS = [0, 12, -12, 24, -24, 36, -36, 48, -48] as const;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function deriveRadarHeight(width: number): number {
  return clamp(Math.round(width * 0.625 + 20), 320, 720);
}

export function resolveOrbitCount(projectCount: number): 1 | 2 | 3 {
  if (projectCount <= 4) return 1;
  if (projectCount <= 8) return 2;
  return 3;
}

function radiiForCount(projectCount: number, width: number, height: number): readonly number[] {
  const orbitCount = resolveOrbitCount(projectCount);
  const maximumRadius = Math.min(width * 0.4, (height - HEADER_HEIGHT - FOOTER_HEIGHT) * 0.48);
  const factors = orbitCount === 1 ? [0.72] : orbitCount === 2 ? [0.52, 0.82] : [0.4, 0.62, 0.84];

  return factors.map((factor) => Math.round(maximumRadius * factor));
}

function intersects(first: Rectangle, second: Rectangle): boolean {
  return !(
    first.right < second.left ||
    first.left > second.right ||
    first.bottom < second.top ||
    first.top > second.bottom
  );
}

function isInsideCanvas(box: Rectangle, width: number, height: number): boolean {
  return (
    box.left >= EDGE_PADDING &&
    box.right <= width - EDGE_PADDING &&
    box.top >= HEADER_HEIGHT &&
    box.bottom <= height - FOOTER_HEIGHT
  );
}

function labelBox(
  labelX: number,
  labelY: number,
  anchor: LabelAnchor,
  label: string,
  language: string | null,
  showLanguage: boolean,
): Rectangle {
  const nameWidth = estimateTextWidth(label, LABEL_FONT_SIZE);
  const languageWidth =
    showLanguage && language !== null ? estimateTextWidth(language, LANGUAGE_FONT_SIZE) : 0;
  const width = Math.max(nameWidth, languageWidth);
  const left = anchor === "start" ? labelX : labelX - width;

  return {
    left,
    right: left + width,
    top: labelY - LABEL_FONT_SIZE,
    bottom: labelY + (showLanguage && language !== null ? 15 : 3),
  };
}

function pointRadius(level: RadarProject["activityLevel"]): number {
  return 3 + level;
}

function pointOpacity(level: RadarProject["activityLevel"]): number {
  return Number((0.45 + level * 0.11).toFixed(2));
}

function candidatePoint(
  project: RadarProject,
  angleDegrees: number,
  orbitRadius: number,
  centerX: number,
  centerY: number,
  labelMaximumWidth: number,
  labels: boolean,
  showLanguage: boolean,
): Omit<RadarPoint, "showLabel"> & { readonly box: Rectangle } {
  const hash = stableHash(project.fullName);
  const angle = (angleDegrees * Math.PI) / 180;
  const radialJitter = ((hash >>> 8) % 21) - 10;
  const activityPull = (project.activityLevel - 3) * 2.5;
  const radius = Math.max(28, orbitRadius + radialJitter - activityPull);
  const x = Number((centerX + Math.cos(angle) * radius).toFixed(2));
  const y = Number((centerY + Math.sin(angle) * radius * 0.78).toFixed(2));
  const dotRadius = pointRadius(project.activityLevel);
  const anchor: LabelAnchor = Math.cos(angle) >= 0 ? "start" : "end";
  const labelX = Number((x + (anchor === "start" ? dotRadius + 8 : -(dotRadius + 8))).toFixed(2));
  const labelY = Number((y + 3).toFixed(2));
  const label = truncateSvgText(project.name, labelMaximumWidth, LABEL_FONT_SIZE);
  const displayLanguage = labels && showLanguage && project.language !== null;

  return {
    repositoryName: project.name,
    fullName: project.fullName,
    language: project.language,
    activityLevel: project.activityLevel,
    x,
    y,
    radius: dotRadius,
    opacity: pointOpacity(project.activityLevel),
    label,
    labelX,
    labelY,
    labelAnchor: anchor,
    showLanguage: displayLanguage,
    box: labelBox(labelX, labelY, anchor, label, project.language, displayLanguage),
  };
}

export function layoutRadar({
  projects,
  width,
  height,
  labels,
  showLanguage,
}: LayoutRadarOptions): RadarLayoutResult {
  const centerX = width / 2;
  const centerY = HEADER_HEIGHT + (height - HEADER_HEIGHT - FOOTER_HEIGHT) / 2;
  const orbitRadii = radiiForCount(projects.length, width, height);
  const labelMaximumWidth = clamp(width * 0.2, 92, 156);
  const centerBox: Rectangle = {
    left: centerX - 72,
    right: centerX + 72,
    top: centerY - 34,
    bottom: centerY + 34,
  };
  const occupied: Rectangle[] = [centerBox];
  const orderedProjects = [...projects].sort(
    (first, second) => stableHash(first.fullName) - stableHash(second.fullName),
  );
  const points: RadarPoint[] = [];

  for (const [index, project] of orderedProjects.entries()) {
    const hash = stableHash(project.fullName);
    const orbitIndex = index % orbitRadii.length;
    const orbitRadius = orbitRadii[orbitIndex] ?? orbitRadii[0] ?? 60;
    const baseAngle = ((hash % 3600) / 10 - 90 + index * 17) % 360;
    let selected: ReturnType<typeof candidatePoint> | undefined;

    for (const offset of ANGLE_ATTEMPTS) {
      const candidate = candidatePoint(
        project,
        baseAngle + offset,
        orbitRadius,
        centerX,
        centerY,
        labelMaximumWidth,
        labels,
        showLanguage,
      );

      if (
        !labels ||
        (isInsideCanvas(candidate.box, width, height) &&
          !occupied.some((box) => intersects(candidate.box, box)))
      ) {
        selected = candidate;
        break;
      }
    }

    selected ??= candidatePoint(
      project,
      baseAngle,
      orbitRadius,
      centerX,
      centerY,
      labelMaximumWidth,
      labels,
      false,
    );

    const showLabel =
      labels &&
      isInsideCanvas(selected.box, width, height) &&
      !occupied.some((box) => intersects(selected.box, box));

    if (showLabel) occupied.push(selected.box);

    const { box: _box, ...point } = selected;
    points.push({ ...point, showLabel });
  }

  return {
    points,
    orbitRadii,
    centerX,
    centerY,
  };
}
