import type { Handler, HandlerEvent } from "@netlify/functions";

import { AppError, toAppError } from "../errors/app-error.js";
import { renderErrorCard } from "../errors/render-error-card.js";
import { createSvgResponse, DEFAULT_CARD_CACHE_CONTROL } from "./card-response.js";

export interface CardExecutionResult {
  readonly svg: string;
  readonly statusCode?: number;
  readonly cacheControl?: string;
  readonly headers?: Readonly<Record<string, string>>;
}

interface CreateCardHandlerOptions {
  readonly execute: (event: HandlerEvent) => CardExecutionResult | Promise<CardExecutionResult>;
  readonly defaultCacheControl?: string;
  readonly renderError?: (error: AppError) => string;
  readonly methodNotAllowedMessage?: string;
}

const NO_STORE = "no-store";

function responseOptions(
  result: CardExecutionResult,
  omitBody: boolean,
): Parameters<typeof createSvgResponse>[1] {
  return {
    ...(result.statusCode === undefined ? {} : { statusCode: result.statusCode }),
    ...(result.cacheControl === undefined ? {} : { cacheControl: result.cacheControl }),
    ...(result.headers === undefined ? {} : { headers: result.headers }),
    omitBody,
  };
}

export function createCardHandler({
  execute,
  defaultCacheControl = DEFAULT_CARD_CACHE_CONTROL,
  renderError = renderErrorCard,
  methodNotAllowedMessage = "Método não permitido. Use GET ou HEAD.",
}: CreateCardHandlerOptions): Handler {
  return async (event) => {
    const method = event.httpMethod.toUpperCase();

    if (method !== "GET" && method !== "HEAD") {
      const error = new AppError({
        code: "METHOD_NOT_ALLOWED",
        publicMessage: methodNotAllowedMessage,
      });

      return createSvgResponse(renderError(error), {
        statusCode: error.statusCode,
        cacheControl: NO_STORE,
        headers: { Allow: "GET, HEAD" },
      });
    }

    try {
      const result = await execute(event);
      return createSvgResponse(
        result.svg,
        responseOptions(
          {
            ...result,
            cacheControl: result.cacheControl ?? defaultCacheControl,
          },
          method === "HEAD",
        ),
      );
    } catch (caughtError) {
      const error = toAppError(caughtError);

      return createSvgResponse(renderError(error), {
        statusCode: error.statusCode,
        cacheControl: NO_STORE,
        omitBody: method === "HEAD",
      });
    }
  };
}
