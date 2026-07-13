import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { HandlerEvent, HandlerResponse } from "@netlify/functions";

import { handler } from "../../netlify/functions/health.js";

function createEvent(httpMethod: string): HandlerEvent {
  return {
    rawUrl: "http://localhost:8888/api/health.svg",
    rawQuery: "",
    path: "/api/health.svg",
    httpMethod,
    headers: {},
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    body: null,
    isBase64Encoded: false,
  };
}

async function invoke(httpMethod: string): Promise<HandlerResponse> {
  const response = await handler(createEvent(httpMethod), {} as never);

  if (response === undefined) {
    throw new Error("The health handler returned no response.");
  }

  return response;
}

describe("health function", () => {
  it("returns an accessible SVG for GET", async () => {
    const response = await invoke("GET");

    assert.equal(response.statusCode, 200);
    assert.equal(response.headers?.["Cache-Control"], "no-store");
    assert.equal(response.headers?.["Content-Type"], "image/svg+xml; charset=utf-8");
    assert.equal(response.headers?.["X-Content-Type-Options"], "nosniff");
    assert.match(response.body ?? "", /<svg/);
    assert.match(response.body ?? "", /<title/);
    assert.match(response.body ?? "", /<desc/);
    assert.doesNotMatch(response.body ?? "", /<script/);
    assert.doesNotMatch(response.body ?? "", /<foreignObject/);
    assert.doesNotMatch(response.body ?? "", /\son[a-z]+=/i);
  });

  it("returns headers without a body for HEAD", async () => {
    const response = await invoke("HEAD");

    assert.equal(response.statusCode, 200);
    assert.equal(response.body, "");
  });

  it("returns a safe SVG for unsupported methods", async () => {
    const response = await invoke("POST");

    assert.equal(response.statusCode, 405);
    assert.equal(response.headers?.Allow, "GET, HEAD");
    assert.match(response.body ?? "", /Método não permitido/);
    assert.match(response.body ?? "", /<svg/);
  });
});
