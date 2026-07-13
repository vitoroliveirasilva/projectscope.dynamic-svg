import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { HandlerEvent, HandlerResponse } from "@netlify/functions";

import { AppError } from "../../src/core/errors/app-error.js";
import { createCardHandler } from "../../src/core/http/create-card-handler.js";

function createEvent(httpMethod: string): HandlerEvent {
  return {
    rawUrl: "http://localhost:8888/api/cards/example.svg",
    rawQuery: "",
    path: "/api/cards/example.svg",
    httpMethod,
    headers: {},
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    body: null,
    isBase64Encoded: false,
  };
}

async function invoke(
  handler: ReturnType<typeof createCardHandler>,
  method: string,
): Promise<HandlerResponse> {
  const response = await handler(createEvent(method), {} as never);
  if (response === undefined) throw new Error("Handler returned no response.");
  return response;
}

describe("createCardHandler", () => {
  it("normalizes successful SVG responses", async () => {
    const handler = createCardHandler({
      execute: () => ({ svg: "<svg></svg>", headers: { "X-Card": "example" } }),
    });
    const response = await invoke(handler, "GET");

    assert.equal(response.statusCode, 200);
    assert.equal(response.headers?.["X-Card"], "example");
    assert.equal(response.headers?.["X-Content-Type-Options"], "nosniff");
    assert.equal(response.body, "<svg></svg>");
  });

  it("omits bodies for HEAD requests", async () => {
    const handler = createCardHandler({ execute: () => ({ svg: "<svg></svg>" }) });
    const response = await invoke(handler, "HEAD");
    assert.equal(response.statusCode, 200);
    assert.equal(response.body, "");
  });

  it("returns 405 without executing unsupported methods", async () => {
    let executed = false;
    const handler = createCardHandler({
      execute: () => {
        executed = true;
        return { svg: "<svg></svg>" };
      },
    });
    const response = await invoke(handler, "DELETE");

    assert.equal(executed, false);
    assert.equal(response.statusCode, 405);
    assert.equal(response.headers?.Allow, "GET, HEAD");
    assert.match(response.body ?? "", /METHOD_NOT_ALLOWED/);
  });

  it("maps known application errors to safe SVG responses", async () => {
    const handler = createCardHandler({
      execute: () => {
        throw new AppError({
          code: "NOT_FOUND",
          publicMessage: "Projeto não encontrado.",
        });
      },
    });
    const response = await invoke(handler, "GET");

    assert.equal(response.statusCode, 404);
    assert.equal(response.headers?.["Cache-Control"], "no-store");
    assert.match(response.body ?? "", /Projeto não encontrado/);
  });

  it("hides unexpected error details", async () => {
    const handler = createCardHandler({
      execute: () => {
        throw new Error("database password leaked");
      },
    });
    const response = await invoke(handler, "GET");

    assert.equal(response.statusCode, 500);
    assert.doesNotMatch(response.body ?? "", /password leaked/);
    assert.match(response.body ?? "", /Não foi possível gerar o card/);
  });
});
