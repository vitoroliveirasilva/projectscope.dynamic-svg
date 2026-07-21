import { escapeXml } from "./escape.js";

export interface SvgDocumentOptions {
  readonly width: number;
  readonly height: number;
  readonly title: string;
  readonly description: string;
  readonly trustedContent: string;
}

const MIN_DIMENSION = 1;
const MAX_DIMENSION = 4096;

function assertDimension(value: number, name: "width" | "height"): void {
  if (!Number.isInteger(value) || value < MIN_DIMENSION || value > MAX_DIMENSION) {
    throw new Error(`${name} must be an integer between ${MIN_DIMENSION} and ${MAX_DIMENSION}.`);
  }
}

export function createSvgDocument({
  width,
  height,
  title,
  description,
  trustedContent,
}: SvgDocumentOptions): string {
  assertDimension(width, "width");
  assertDimension(height, "height");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="card-title card-description">`,
    `<title id="card-title">${escapeXml(title)}</title>`,
    `<desc id="card-description">${escapeXml(description)}</desc>`,
    trustedContent,
    "</svg>",
  ].join("");
}
