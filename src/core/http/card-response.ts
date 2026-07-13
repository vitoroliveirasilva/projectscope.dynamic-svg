import type { HandlerResponse } from "@netlify/functions";

export const DEFAULT_CARD_CACHE_CONTROL =
  "public, max-age=60, s-maxage=300, stale-while-revalidate=600";

interface SvgResponseOptions {
  readonly statusCode?: number;
  readonly cacheControl?: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly omitBody?: boolean;
}

export function createSvgResponse(
  svg: string,
  {
    statusCode = 200,
    cacheControl = DEFAULT_CARD_CACHE_CONTROL,
    headers = {},
    omitBody = false,
  }: SvgResponseOptions = {},
): HandlerResponse {
  return {
    statusCode,
    headers: {
      "Cache-Control": cacheControl,
      "Content-Type": "image/svg+xml; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
    body: omitBody ? "" : svg,
  };
}
