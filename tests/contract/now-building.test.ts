import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { HandlerEvent, HandlerResponse } from "@netlify/functions";

import { createNowBuildingHandler } from "../../src/cards/now-building/index.js";
import { AppError } from "../../src/core/errors/app-error.js";
import { FakeProjectProvider } from "../fixtures/project-provider.js";

const NOW = new Date("2026-07-13T13:00:00.000Z");

function createEvent(
  httpMethod: string,
  queryStringParameters: Record<string, string> | null = {
    username: "vitoroliveirasilva",
  },
): HandlerEvent {
  return {
    rawUrl: "http://localhost:8888/api/cards/now-building.svg",
    rawQuery: "",
    path: "/api/cards/now-building.svg",
    httpMethod,
    headers: {},
    multiValueHeaders: {},
    queryStringParameters,
    multiValueQueryStringParameters: null,
    body: null,
    isBase64Encoded: false,
  };
}

async function invoke(
  provider: FakeProjectProvider,
  httpMethod = "GET",
  queryStringParameters?: Record<string, string> | null,
): Promise<HandlerResponse> {
  const handler = createNowBuildingHandler({
    provider,
    cacheControl: "public, max-age=30",
    now: () => NOW,
  });
  const event =
    queryStringParameters === undefined
      ? createEvent(httpMethod)
      : createEvent(httpMethod, queryStringParameters);
  const response = await handler(event, {} as never);
  if (response === undefined) throw new Error("Now Building handler returned no response.");
  return response;
}

describe("Now Building contract", () => {
  it("returns the card for GET", async () => {
    const response = await invoke(new FakeProjectProvider());

    assert.equal(response.statusCode, 200);
    assert.equal(response.headers?.["Content-Type"], "image/svg+xml; charset=utf-8");
    assert.equal(response.headers?.["Cache-Control"], "public, max-age=30");
    assert.equal(response.headers?.["X-ProjectScope-Card"], "now-building");
    assert.equal(response.headers?.["X-ProjectScope-Degraded"], "false");
    assert.match(response.body ?? "", /NOW BUILDING/);
  });

  it("returns headers without a body for HEAD", async () => {
    const response = await invoke(new FakeProjectProvider(), "HEAD");
    assert.equal(response.statusCode, 200);
    assert.equal(response.body, "");
  });

  it("returns 405 for unsupported methods", async () => {
    const response = await invoke(new FakeProjectProvider(), "POST");
    assert.equal(response.statusCode, 405);
    assert.equal(response.headers?.Allow, "GET, HEAD");
  });

  it("returns a safe validation card when username is absent", async () => {
    const response = await invoke(new FakeProjectProvider(), "GET", {});
    assert.equal(response.statusCode, 400);
    assert.match(response.body ?? "", /Informe um usuário/);
    assert.doesNotMatch(response.body ?? "", /<script/i);
  });

  it("does not expose unexpected provider errors", async () => {
    const provider = new FakeProjectProvider({ error: new Error("secret internal detail") });
    const response = await invoke(provider);

    assert.equal(response.statusCode, 500);
    assert.match(response.body ?? "", /Não foi possível gerar o card/);
    assert.doesNotMatch(response.body ?? "", /secret internal detail/);
  });

  it("preserves public provider errors", async () => {
    const provider = new FakeProjectProvider({
      error: new AppError({
        code: "RATE_LIMITED",
        publicMessage: "Dados temporariamente indisponíveis.",
      }),
    });
    const response = await invoke(provider);

    assert.equal(response.statusCode, 429);
    assert.match(response.body ?? "", /Dados temporariamente indisponíveis/);
  });
});
