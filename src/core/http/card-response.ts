import type { HandlerResponse } from "@netlify/functions";

export const DEFAULT_CARD_CACHE_CONTROL =
  "public, max-age=60, s-maxage=300, stale-while-revalidate=600";

const SVG_SECURITY_HEADERS: Readonly<Record<string, string>> = {
  "Access-Control-Allow-Origin": "*",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
  "Cross-Origin-Resource-Policy": "cross-origin",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};

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
      ...headers,
      "Cache-Control": cacheControl,
      "Content-Type": "image/svg+xml; charset=utf-8",
      ...SVG_SECURITY_HEADERS,
    },
    body: omitBody ? "" : svg,
  };
}
