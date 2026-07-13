import { createSvgDocument } from "../core/render/document.js";
import { escapeXml } from "../core/render/escape.js";

interface HealthCardOptions {
  readonly state?: "healthy" | "error";
  readonly message?: string;
}

const WIDTH = 560;
const HEIGHT = 160;

export function renderHealthCard({
  state = "healthy",
  message = "Fundação TypeScript e Netlify Functions ativa.",
}: HealthCardOptions = {}): string {
  const isHealthy = state === "healthy";
  const accent = isHealthy ? "#3FB950" : "#F85149";
  const title = isHealthy ? "ProjectScope operacional" : "ProjectScope indisponível";

  const content = [
    '<rect width="560" height="160" rx="14" fill="#0D1117"/>',
    '<rect x="0.5" y="0.5" width="559" height="159" rx="13.5" fill="none" stroke="#30363D"/>',
    `<circle cx="42" cy="44" r="7" fill="${accent}"/>`,
    '<text x="62" y="50" fill="#8B949E" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="14" font-weight="600" letter-spacing="1.2">PROJECTSCOPE</text>',
    `<text x="32" y="94" fill="#F0F6FC" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="24" font-weight="700">${escapeXml(title)}</text>`,
    `<text x="32" y="124" fill="#8B949E" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="14">${escapeXml(message)}</text>`,
  ].join("");

  return createSvgDocument({
    width: WIDTH,
    height: HEIGHT,
    title,
    description: message,
    trustedContent: content,
  });
}
