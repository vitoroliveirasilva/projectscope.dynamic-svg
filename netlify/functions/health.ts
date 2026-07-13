import { createCardHandler } from "../../src/core/http/create-card-handler.js";
import { renderHealthCard } from "../../src/health/render-health-card.js";

const NO_STORE = "no-store";

export const handler = createCardHandler({
  defaultCacheControl: NO_STORE,
  execute: () => ({
    svg: renderHealthCard(),
  }),
  renderError: (error) =>
    renderHealthCard({
      state: "error",
      message: error.publicMessage,
    }),
});
