const DEFAULT_TIMEOUT_MILLISECONDS = 10_000;
const MAXIMUM_SVG_BYTES = 512 * 1024;
const GITHUB_USERNAME_PATTERN = /^(?!-)[A-Za-z0-9-]{1,39}(?<!-)$/;
const SVG_CONTENT_TYPE_PATTERN = /^image\/svg\+xml(?:\s*;|$)/i;
const EVENT_HANDLER_ATTRIBUTE_PATTERN = /<[^>]*\son[a-z][a-z0-9:-]*\s*=/i;

export type FetchImplementation = (input: string | URL, init?: RequestInit) => Promise<Response>;

interface EndpointSpecification {
  readonly name: string;
  readonly path: string;
  readonly marker: string;
  readonly expectedCard?: string;
  readonly expectedCacheControl?: string;
}

export interface DeployVerificationOptions {
  readonly baseUrl: string;
  readonly username: string;
  readonly fetchImplementation?: FetchImplementation;
  readonly timeoutMilliseconds?: number;
}

export interface EndpointVerificationResult {
  readonly name: string;
  readonly method: "GET" | "HEAD";
  readonly url: string;
  readonly statusCode: number;
  readonly durationMilliseconds: number;
  readonly bodyBytes: number;
}

export interface DeployVerificationReport {
  readonly baseUrl: string;
  readonly username: string;
  readonly totalDurationMilliseconds: number;
  readonly results: readonly EndpointVerificationResult[];
}

function normalizeBaseUrl(value: string): string {
  let url: URL;

  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("A URL base do deploy é inválida.");
  }

  const localHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
  const isLocalHttp = url.protocol === "http:" && localHosts.has(url.hostname);

  if (url.protocol !== "https:" && !isLocalHttp) {
    throw new Error("A URL base precisa usar HTTPS, exceto em ambiente local.");
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new Error("A URL base não pode conter credenciais, query string ou fragmento.");
  }

  if (url.pathname !== "/" && url.pathname !== "") {
    throw new Error("A URL base deve apontar para a raiz do deploy.");
  }

  return url.origin;
}

function normalizeUsername(value: string): string {
  const username = value.trim();

  if (!GITHUB_USERNAME_PATTERN.test(username)) {
    throw new Error("O usuário do GitHub possui formato inválido.");
  }

  return username;
}

function createEndpointSpecifications(username: string): readonly EndpointSpecification[] {
  const encodedUsername = encodeURIComponent(username);

  return [
    {
      name: "Health",
      path: "/api/health.svg",
      marker: "PROJECTSCOPE",
      expectedCacheControl: "no-store",
    },
    {
      name: "Now Building",
      path: `/api/cards/now-building.svg?username=${encodedUsername}`,
      marker: "NOW BUILDING",
      expectedCard: "now-building",
    },
    {
      name: "Project Radar",
      path: `/api/cards/project-radar.svg?username=${encodedUsername}&limit=6`,
      marker: "PROJECT RADAR",
      expectedCard: "project-radar",
    },
  ];
}

function requireHeader(response: Response, name: string, expectedValue?: string): string {
  const value = response.headers.get(name);

  if (value === null) {
    throw new Error(`Cabeçalho obrigatório ausente: ${name}.`);
  }

  if (expectedValue !== undefined && value !== expectedValue) {
    throw new Error(`Cabeçalho ${name} possui valor inesperado.`);
  }

  return value;
}

function validateCommonHeaders(response: Response, endpoint: EndpointSpecification): void {
  const contentType = requireHeader(response, "content-type");

  if (!SVG_CONTENT_TYPE_PATTERN.test(contentType)) {
    throw new Error(`Content-Type inválido em ${endpoint.name}.`);
  }

  requireHeader(response, "x-content-type-options", "nosniff");
  requireHeader(response, "access-control-allow-origin", "*");
  requireHeader(response, "cross-origin-resource-policy", "cross-origin");
  requireHeader(response, "referrer-policy", "no-referrer");

  const contentSecurityPolicy = requireHeader(response, "content-security-policy");
  if (!contentSecurityPolicy.includes("default-src 'none'")) {
    throw new Error(`Content-Security-Policy inválida em ${endpoint.name}.`);
  }

  const cacheControl = requireHeader(response, "cache-control");
  if (
    endpoint.expectedCacheControl !== undefined &&
    cacheControl !== endpoint.expectedCacheControl
  ) {
    throw new Error(`Cache-Control inválido em ${endpoint.name}.`);
  }

  if (endpoint.expectedCard !== undefined) {
    requireHeader(response, "x-projectscope-card", endpoint.expectedCard);
  }
}

function validateSvgBody(body: string, endpoint: EndpointSpecification): number {
  const bodyBytes = Buffer.byteLength(body, "utf8");

  if (bodyBytes === 0) {
    throw new Error(`Resposta SVG vazia em ${endpoint.name}.`);
  }

  if (bodyBytes > MAXIMUM_SVG_BYTES) {
    throw new Error(`Resposta SVG excede ${MAXIMUM_SVG_BYTES} bytes em ${endpoint.name}.`);
  }

  if (!body.startsWith("<svg") || !body.includes("<title") || !body.includes("<desc")) {
    throw new Error(`Documento SVG incompleto em ${endpoint.name}.`);
  }

  if (!body.includes(endpoint.marker)) {
    throw new Error(`Marcador esperado não encontrado em ${endpoint.name}.`);
  }

  if (
    /<script/i.test(body) ||
    /<foreignObject/i.test(body) ||
    EVENT_HANDLER_ATTRIBUTE_PATTERN.test(body)
  ) {
    throw new Error(`Conteúdo SVG inseguro detectado em ${endpoint.name}.`);
  }

  return bodyBytes;
}

async function fetchWithTimeout(
  fetchImplementation: FetchImplementation,
  url: URL,
  method: "GET" | "HEAD",
  timeoutMilliseconds: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMilliseconds);

  try {
    return await fetchImplementation(url, {
      method,
      headers: { Accept: "image/svg+xml" },
      redirect: "follow",
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`Tempo limite excedido ao consultar ${url.pathname}.`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function verifyRequest(
  baseUrl: string,
  endpoint: EndpointSpecification,
  method: "GET" | "HEAD",
  fetchImplementation: FetchImplementation,
  timeoutMilliseconds: number,
): Promise<EndpointVerificationResult> {
  const url = new URL(endpoint.path, `${baseUrl}/`);
  const startedAt = Date.now();
  const response = await fetchWithTimeout(fetchImplementation, url, method, timeoutMilliseconds);

  if (response.status !== 200) {
    throw new Error(`${endpoint.name} respondeu com HTTP ${response.status}.`);
  }

  validateCommonHeaders(response, endpoint);

  const body = await response.text();
  const bodyBytes =
    method === "GET" ? validateSvgBody(body, endpoint) : Buffer.byteLength(body, "utf8");

  if (method === "HEAD" && bodyBytes !== 0) {
    throw new Error(`A resposta HEAD de ${endpoint.name} retornou corpo.`);
  }

  return {
    name: endpoint.name,
    method,
    url: url.toString(),
    statusCode: response.status,
    durationMilliseconds: Date.now() - startedAt,
    bodyBytes,
  };
}

export async function verifyDeployment({
  baseUrl,
  username,
  fetchImplementation = fetch,
  timeoutMilliseconds = DEFAULT_TIMEOUT_MILLISECONDS,
}: DeployVerificationOptions): Promise<DeployVerificationReport> {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const normalizedUsername = normalizeUsername(username);

  if (
    !Number.isInteger(timeoutMilliseconds) ||
    timeoutMilliseconds < 100 ||
    timeoutMilliseconds > 60_000
  ) {
    throw new Error("O timeout precisa ser um inteiro entre 100 e 60000 milissegundos.");
  }

  const startedAt = Date.now();
  const results: EndpointVerificationResult[] = [];

  for (const endpoint of createEndpointSpecifications(normalizedUsername)) {
    results.push(
      await verifyRequest(
        normalizedBaseUrl,
        endpoint,
        "GET",
        fetchImplementation,
        timeoutMilliseconds,
      ),
    );
    results.push(
      await verifyRequest(
        normalizedBaseUrl,
        endpoint,
        "HEAD",
        fetchImplementation,
        timeoutMilliseconds,
      ),
    );
  }

  return {
    baseUrl: normalizedBaseUrl,
    username: normalizedUsername,
    totalDurationMilliseconds: Date.now() - startedAt,
    results,
  };
}
