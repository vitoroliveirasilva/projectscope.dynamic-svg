const NARROW_CHARACTERS = /[ilI1.,'`|!:\s]/;
const WIDE_CHARACTERS = /[MW@#%&QO]/;
const UPPERCASE_CHARACTERS = /[A-Z]/;
const DIGIT_CHARACTERS = /[0-9]/;

function characterWidthFactor(character: string): number {
  if (NARROW_CHARACTERS.test(character)) return 0.34;
  if (WIDE_CHARACTERS.test(character)) return 0.9;
  if (UPPERCASE_CHARACTERS.test(character)) return 0.68;
  if (DIGIT_CHARACTERS.test(character)) return 0.58;
  return 0.56;
}

export function estimateTextWidth(value: string, fontSize: number): number {
  return Array.from(value).reduce(
    (total, character) => total + characterWidthFactor(character) * fontSize,
    0,
  );
}

export function truncateSvgText(value: string, maximumWidth: number, fontSize: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (!normalized || estimateTextWidth(normalized, fontSize) <= maximumWidth) {
    return normalized;
  }

  const ellipsis = "…";
  const ellipsisWidth = estimateTextWidth(ellipsis, fontSize);
  let result = "";
  let width = 0;

  for (const character of normalized) {
    const characterWidth = characterWidthFactor(character) * fontSize;
    if (width + characterWidth + ellipsisWidth > maximumWidth) break;
    result += character;
    width += characterWidth;
  }

  return `${result.trimEnd()}${ellipsis}`;
}
