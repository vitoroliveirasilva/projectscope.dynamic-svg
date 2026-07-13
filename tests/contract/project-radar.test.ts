import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { HandlerEvent, HandlerResponse } from "@netlify/functions";

import { createProjectRadarHandler } from "../../src/cards/project-radar/index.js";
import { AppError } from "../../src/core/errors/app-error.js";
import { FakeProjectProvider, repositoryFixture } from "../fixtures/project-provider.js";

const NOW = new Date("2026-07-13T12:00:00.000Z");

function createEvent(
  httpMethod: string,
  queryStringParameters: Record<string, string> | null = {
    username: "vitoroliveirasilva",
  },
): HandlerEvent {
  return {
    rawUrl: "http://localhost:8888/api/cards/project-radar.svg",
    rawQuery: "",
    path: "/api/cards/project-radar.svg",
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
  method = "GET",
  query?: Record<string, string> | null,
): Promise<HandlerResponse> {
  const handler = createProjectRadarHandler({
    provider,
    cacheControl: "public, max-age=30",
    now: () => NOW,
  });
  const response = await handler(
    createEvent(method, query === undefined ? undefined : query),
    {} as never,
  );

  if (response === undefined) throw new Error("The project radar handler returned no response.");
  return response;
}

describe("project radar contract", () => {
  it("returns an SVG with card metadata", async () => {
    const response = await invoke(
      new FakeProjectProvider({
        repositories: [
          repositoryFixture(),
          repositoryFixture({ name: "sourcewise", fullName: "owner/sourcewise" }),
        ],
      }),
    );

    assert.equal(response.statusCode, 200);
    assert.equal(response.headers?.["Content-Type"], "image/svg+xml; charset=utf-8");
    assert.equal(response.headers?.["Cache-Control"], "public, max-age=30");
    assert.equal(response.headers?.["X-ProjectScope-Card"], "project-radar");
    assert.equal(response.headers?.["X-ProjectScope-Projects"], "2");
    assert.match(response.body ?? "", /PROJECT RADAR/);
    assert.match(response.body ?? "", /viewBox="0 0 640 420"/);
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
    assert.match(response.body ?? "", /Método não permitido/);
  });

  it("renders validation and no-data errors safely", async () => {
    const invalid = await invoke(new FakeProjectProvider(), "GET", {
      username: "vitor",
      limit: "20",
    });
    const noData = await invoke(
      new FakeProjectProvider({ repositories: [repositoryFixture({ pushedAt: null })] }),
    );

    assert.equal(invalid.statusCode, 400);
    assert.match(invalid.body ?? "", /limit deve estar entre 1 e 12/);
    assert.equal(noData.statusCode, 200);
    assert.match(noData.body ?? "", /Nenhum projeto disponível/);
  });

  it("does not expose unexpected provider errors", async () => {
    const response = await invoke(
      new FakeProjectProvider({ error: new Error("secret provider detail") }),
    );

    assert.equal(response.statusCode, 500);
    assert.match(response.body ?? "", /Não foi possível gerar o card/);
    assert.doesNotMatch(response.body ?? "", /secret provider detail/);
  });

  it("preserves public provider errors", async () => {
    const response = await invoke(
      new FakeProjectProvider({
        error: new AppError({
          code: "RATE_LIMITED",
          publicMessage: "Dados temporariamente indisponíveis.",
        }),
      }),
    );

    assert.equal(response.statusCode, 429);
    assert.match(response.body ?? "", /Dados temporariamente indisponíveis/);
  });
});
