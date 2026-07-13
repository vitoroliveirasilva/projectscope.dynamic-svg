const XML_ESCAPE_MAP: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

const XML_SPECIAL_CHARACTERS = /[&<>"']/g;
const XML_HORIZONTAL_TAB = 0x09;
const XML_LINE_FEED = 0x0a;
const XML_CARRIAGE_RETURN = 0x0d;
const XML_MINIMUM_PRINTABLE_CODE_POINT = 0x20;
const DELETE_CONTROL_CHARACTER = 0x7f;

function isValidXmlCharacter(character: string): boolean {
  const codePoint = character.codePointAt(0);

  if (codePoint === undefined) {
    return false;
  }

  return (
    codePoint === XML_HORIZONTAL_TAB ||
    codePoint === XML_LINE_FEED ||
    codePoint === XML_CARRIAGE_RETURN ||
    (codePoint >= XML_MINIMUM_PRINTABLE_CODE_POINT && codePoint !== DELETE_CONTROL_CHARACTER)
  );
}

export function sanitizeXmlText(value: string): string {
  return Array.from(value).filter(isValidXmlCharacter).join("");
}

export function escapeXml(value: string): string {
  return sanitizeXmlText(value).replace(
    XML_SPECIAL_CHARACTERS,
    (character) => XML_ESCAPE_MAP[character] ?? "",
  );
}
