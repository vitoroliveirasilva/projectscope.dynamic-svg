import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  verifyDeployment,
  type FetchImplementation,
} from "../../src/verification/deploy-verifier.js";

const SECURITY_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
  "Cross-Origin-Resource-Policy": "cross-origin",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};

function svg(marker: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg"><title>Card</title><desc>Descrição</desc><text>${marker}</text></svg>`;
}

function createSuccessfulFetch(): FetchImplementation {
  return async (input, init) => {
    const url = new URL(input);
    const method = init?.method ?? "GET";
    const isHealth = url.pathname === "/api/health.svg";
    const isNowBuilding = url.pathname.endsWith("/now-building.svg");
    const marker = isHealth ? "PROJECTSCOPE" : isNowBuilding ? "NOW BUILDING" : "PROJECT RADAR";
    const card = isHealth ? undefined : isNowBuilding ? "now-building" : "project-radar";

    return new Response(method === "HEAD" ? null : svg(marker), {
      status: 200,
      headers: {
        ...SECURITY_HEADERS,
        "Cache-Control": isHealth ? "no-store" : "public, max-age=60",
        "Content-Type": "image/svg+xml; charset=utf-8",
        ...(card === undefined ? {} : { "X-ProjectScope-Card": card }),
      },
    });
  };
}

describe("verifyDeployment", () => {
  it("validates GET and HEAD for all public endpoints", async () => {
    const report = await verifyDeployment({
      baseUrl: "https://projectscope.example.com/",
      username: "vitoroliveirasilva",
      fetchImplementation: createSuccessfulFetch(),
    });

    assert.equal(report.baseUrl, "https://projectscope.example.com");
    assert.equal(report.username, "vitoroliveirasilva");
    assert.equal(report.results.length, 6);
    assert.equal(report.results.filter((result) => result.method === "GET").length, 3);
    assert.equal(report.results.filter((result) => result.method === "HEAD").length, 3);
    assert.ok(report.results.every((result) => result.statusCode === 200));
  });

  it("allows HTTP only for local verification", async () => {
    const report = await verifyDeployment({
      baseUrl: "http://localhost:8888",
      username: "vitor",
      fetchImplementation: createSuccessfulFetch(),
    });

    assert.equal(report.baseUrl, "http://localhost:8888");

    await assert.rejects(
      verifyDeployment({
        baseUrl: "http://projectscope.example.com",
        username: "vitor",
        fetchImplementation: createSuccessfulFetch(),
      }),
      /precisa usar HTTPS/,
    );
  });

  it("rejects invalid usernames and base paths", async () => {
    await assert.rejects(
      verifyDeployment({
        baseUrl: "https://projectscope.example.com/cards",
        username: "vitor",
        fetchImplementation: createSuccessfulFetch(),
      }),
      /raiz do deploy/,
    );

    await assert.rejects(
      verifyDeployment({
        baseUrl: "https://projectscope.example.com",
        username: "-invalid-",
        fetchImplementation: createSuccessfulFetch(),
      }),
      /formato inválido/,
    );
  });

  it("rejects missing hardening headers", async () => {
    const fetchImplementation: FetchImplementation = async () =>
      new Response(svg("PROJECTSCOPE"), {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "image/svg+xml",
          "X-Content-Type-Options": "nosniff",
        },
      });

    await assert.rejects(
      verifyDeployment({
        baseUrl: "https://projectscope.example.com",
        username: "vitor",
        fetchImplementation,
      }),
      /Access-Control-Allow-Origin/i,
    );
  });

  it("rejects unsafe SVG content", async () => {
    const fetchImplementation: FetchImplementation = async (input, init) => {
      const url = new URL(input);
      const body = `<svg onload="alert(1)"><title>Card</title><desc>Descrição</desc><text>PROJECTSCOPE</text></svg>`;

      return new Response(init?.method === "HEAD" ? null : body, {
        status: 200,
        headers: {
          ...SECURITY_HEADERS,
          "Cache-Control": url.pathname === "/api/health.svg" ? "no-store" : "public",
          "Content-Type": "image/svg+xml",
        },
      });
    };

    await assert.rejects(
      verifyDeployment({
        baseUrl: "https://projectscope.example.com",
        username: "vitor",
        fetchImplementation,
      }),
      /Conteúdo SVG inseguro/,
    );
  });

  it("rejects invalid timeout values before making requests", async () => {
    let calls = 0;
    const fetchImplementation: FetchImplementation = async () => {
      calls += 1;
      return new Response();
    };

    await assert.rejects(
      verifyDeployment({
        baseUrl: "https://projectscope.example.com",
        username: "vitor",
        timeoutMilliseconds: 10,
        fetchImplementation,
      }),
      /timeout precisa ser um inteiro/,
    );
    assert.equal(calls, 0);
  });
});
