import { AppError } from "../errors/app-error.js";

interface IntegerOptions {
  readonly name: string;
  readonly minimum: number;
  readonly maximum: number;
  readonly fallback: number;
}

interface ListOptions {
  readonly name: string;
  readonly maximumItems?: number;
  readonly maximumItemLength?: number;
}

function invalid(message: string): never {
  throw new AppError({
    code: "INVALID_REQUEST",
    publicMessage: message,
  });
}

export function optionalTrimmed(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function parseBoolean(value: string | undefined, fallback: boolean, name: string): boolean {
  const normalized = optionalTrimmed(value)?.toLowerCase();

  if (normalized === undefined) {
    return fallback;
  }

  if (normalized === "true" || normalized === "1") {
    return true;
  }

  if (normalized === "false" || normalized === "0") {
    return false;
  }

  return invalid(`${name} deve ser true, false, 1 ou 0.`);
}

export function parseInteger(value: string | undefined, options: IntegerOptions): number {
  const normalized = optionalTrimmed(value);

  if (normalized === undefined) {
    return options.fallback;
  }

  if (!/^\d+$/.test(normalized)) {
    return invalid(`${options.name} deve ser um número inteiro.`);
  }

  const parsed = Number.parseInt(normalized, 10);

  if (parsed < options.minimum || parsed > options.maximum) {
    return invalid(`${options.name} deve estar entre ${options.minimum} e ${options.maximum}.`);
  }

  return parsed;
}

export function parseEnum<const TValue extends string>(
  value: string | undefined,
  allowedValues: readonly TValue[],
  fallback: TValue,
  name: string,
): TValue {
  const normalized = optionalTrimmed(value);

  if (normalized === undefined) {
    return fallback;
  }

  const matched = allowedValues.find(
    (allowed) => allowed.toLowerCase() === normalized.toLowerCase(),
  );

  if (matched === undefined) {
    return invalid(`${name} possui um valor não suportado.`);
  }

  return matched;
}

export function parseList(
  value: string | undefined,
  { name, maximumItems = 25, maximumItemLength = 100 }: ListOptions,
): readonly string[] {
  const normalized = optionalTrimmed(value);

  if (normalized === undefined) {
    return [];
  }

  const uniqueItems = new Set<string>();

  for (const rawItem of normalized.split(",")) {
    const item = rawItem.trim();

    if (!item) {
      continue;
    }

    if (item.length > maximumItemLength) {
      return invalid(`${name} contém um item maior que ${maximumItemLength} caracteres.`);
    }

    uniqueItems.add(item);

    if (uniqueItems.size > maximumItems) {
      return invalid(`${name} aceita no máximo ${maximumItems} itens.`);
    }
  }

  return [...uniqueItems];
}

export function parseHexColor(value: string | undefined, name: string): string | undefined {
  const normalized = optionalTrimmed(value)?.replace(/^#/, "");

  if (normalized === undefined) {
    return undefined;
  }

  if (!/^[0-9a-f]{6}$/i.test(normalized)) {
    return invalid(`${name} deve usar seis caracteres hexadecimais.`);
  }

  return normalized.toUpperCase();
}

export function parseRequiredString(
  value: string | undefined,
  name: string,
  maximumLength: number,
  pattern?: RegExp,
): string {
  const normalized = optionalTrimmed(value);

  if (normalized === undefined) {
    return invalid(`Informe ${name}.`);
  }

  if (normalized.length > maximumLength || (pattern !== undefined && !pattern.test(normalized))) {
    return invalid(`${name} possui um formato inválido.`);
  }

  return normalized;
}
