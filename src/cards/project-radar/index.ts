import type { Handler, HandlerEvent } from "@netlify/functions";

import {
  createCardHandler,
  type CardExecutionResult,
} from "../../core/http/create-card-handler.js";
import type { ProjectProvider } from "../../providers/project-provider.js";
import { parseProjectRadarParams } from "./params.js";
import { renderProjectRadar } from "./render.js";
import { selectProjectRadar } from "./select.js";

interface CreateProjectRadarHandlerOptions {
  readonly provider: ProjectProvider;
  readonly cacheControl?: string;
  readonly now?: () => Date;
}

function queryFromEvent(event: HandlerEvent): Readonly<Record<string, string | undefined>> {
  return event.queryStringParameters ?? {};
}

export async function executeProjectRadar(
  event: HandlerEvent,
  provider: ProjectProvider,
  now: Date,
  cacheControl?: string,
): Promise<CardExecutionResult> {
  const params = parseProjectRadarParams(queryFromEvent(event));
  const model = await selectProjectRadar({ provider, params, now });

  return {
    svg: renderProjectRadar(model),
    ...(cacheControl === undefined ? {} : { cacheControl }),
    headers: {
      "X-ProjectScope-Card": "project-radar",
      "X-ProjectScope-Projects": String(model.points.length),
    },
  };
}

export function createProjectRadarHandler({
  provider,
  cacheControl,
  now = () => new Date(),
}: CreateProjectRadarHandlerOptions): Handler {
  return createCardHandler({
    ...(cacheControl === undefined ? {} : { defaultCacheControl: cacheControl }),
    execute: (event) => executeProjectRadar(event, provider, now(), cacheControl),
  });
}
