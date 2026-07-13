import type { Handler, HandlerEvent } from "@netlify/functions";

import type { ProjectProvider } from "../../providers/project-provider.js";
import {
  createCardHandler,
  type CardExecutionResult,
} from "../../core/http/create-card-handler.js";
import { parseNowBuildingParams } from "./params.js";
import { renderNowBuilding } from "./render.js";
import { selectNowBuilding } from "./select.js";

interface CreateNowBuildingHandlerOptions {
  readonly provider: ProjectProvider;
  readonly cacheControl?: string;
  readonly now?: () => Date;
}

function queryFromEvent(event: HandlerEvent): Readonly<Record<string, string | undefined>> {
  return event.queryStringParameters ?? {};
}

export async function executeNowBuilding(
  event: HandlerEvent,
  provider: ProjectProvider,
  now: Date,
  cacheControl?: string,
): Promise<CardExecutionResult> {
  const params = parseNowBuildingParams(queryFromEvent(event));
  const model = await selectNowBuilding({ provider, params, now });

  return {
    svg: renderNowBuilding(model),
    ...(cacheControl === undefined ? {} : { cacheControl }),
    headers: {
      "X-ProjectScope-Card": "now-building",
      "X-ProjectScope-Degraded": String(model.degraded),
    },
  };
}

export function createNowBuildingHandler({
  provider,
  cacheControl,
  now = () => new Date(),
}: CreateNowBuildingHandlerOptions): Handler {
  return createCardHandler({
    ...(cacheControl === undefined ? {} : { defaultCacheControl: cacheControl }),
    execute: (event) => executeNowBuilding(event, provider, now(), cacheControl),
  });
}
