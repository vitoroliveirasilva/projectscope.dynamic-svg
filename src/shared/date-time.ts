import type { CardLocale } from "../core/validation/common-params.js";

export type ActivityState = "active" | "recent" | "warm" | "quiet" | "idle";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function elapsedMilliseconds(date: Date, now: Date): number {
  return Math.max(0, now.getTime() - date.getTime());
}

export function resolveActivityState(date: Date, now: Date): ActivityState {
  const elapsed = elapsedMilliseconds(date, now);

  if (elapsed <= HOUR) return "active";
  if (elapsed <= DAY) return "recent";
  if (elapsed <= 7 * DAY) return "warm";
  if (elapsed <= 30 * DAY) return "quiet";
  return "idle";
}

function plural(value: number, singular: string, pluralForm: string): string {
  return value === 1 ? singular : pluralForm;
}

export function formatRelativeDate(date: Date, now: Date, locale: CardLocale): string {
  const elapsed = elapsedMilliseconds(date, now);

  if (elapsed < MINUTE) return locale === "pt-BR" ? "agora" : "now";

  if (elapsed < HOUR) {
    const minutes = Math.floor(elapsed / MINUTE);
    return locale === "pt-BR"
      ? `há ${minutes} ${plural(minutes, "minuto", "minutos")}`
      : `${minutes} ${plural(minutes, "minute", "minutes")} ago`;
  }

  if (elapsed < DAY) {
    const hours = Math.floor(elapsed / HOUR);
    return locale === "pt-BR"
      ? `há ${hours} ${plural(hours, "hora", "horas")}`
      : `${hours} ${plural(hours, "hour", "hours")} ago`;
  }

  if (elapsed <= 30 * DAY) {
    const days = Math.floor(elapsed / DAY);
    return locale === "pt-BR"
      ? `há ${days} ${plural(days, "dia", "dias")}`
      : `${days} ${plural(days, "day", "days")} ago`;
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
