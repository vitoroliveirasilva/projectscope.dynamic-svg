import type { Handler } from "@netlify/functions";

import { createSvgResponse } from "../../src/core/http/card-response.js";
import { renderHealthCard } from "../../src/health/render-health-card.js";

const NO_STORE = "no-store";

export const handler: Handler = (event) => {
  const method = event.httpMethod.toUpperCase();

  if (method !== "GET" && method !== "HEAD") {
    return Promise.resolve(
      createSvgResponse(
        renderHealthCard({
          state: "error",
          message: "Método não permitido. Use GET ou HEAD.",
        }),
        {
          statusCode: 405,
          cacheControl: NO_STORE,
          headers: { Allow: "GET, HEAD" },
        },
      ),
    );
  }

  return Promise.resolve(
    createSvgResponse(renderHealthCard(), {
      cacheControl: NO_STORE,
      omitBody: method === "HEAD",
    }),
  );
};
