import type { Handler } from "@netlify/functions";

import { loadAppConfig } from "../../src/config/app-config.js";
import { executeNowBuilding } from "../../src/cards/now-building/index.js";
import { createCardHandler } from "../../src/core/http/create-card-handler.js";
import { createGitHubProvider } from "../../src/providers/github/create-github-provider.js";
import type { ProjectProvider } from "../../src/providers/project-provider.js";

let provider: ProjectProvider | undefined;

export const handler: Handler = createCardHandler({
  execute: async (event) => {
    const config = loadAppConfig();
    provider ??= createGitHubProvider(config);
    return executeNowBuilding(event, provider, new Date(), config.cardCacheControl);
  },
});
