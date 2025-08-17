import { OpenAPIHono } from "@hono/zod-openapi";
import { logger } from "hono/logger";

import type { AppBindings, AppOpenAPI } from "@/lib/types";
import emojiFavicon from "@/middleware/emoji-favicon";
import errorHandler from "@/middleware/error-handler";
import notFoundRoute from "@/middleware/not-found-route";
import { validationErrorHandler } from "@/utils/openapi-helpers";
import { auth } from "./auth";

// This is a function for creating API routes.
export const createRouter = () => {
  return new OpenAPIHono<AppBindings>({
    strict: false,
    defaultHook: validationErrorHandler,
  });
};

// This is a function for creating the main app.
// All the necessary middleware will be added to this function.
const createApp = () => {
  const app = createRouter();

  // Middleware for Logging requests and setting up the emoji favicon
  app.use(logger());
  app.use(emojiFavicon("📔"));

  // Better Auth
  app.on(["POST", "GET"], "/api/better-auth/**", (c) =>
    auth.handler(c.req.raw),
  );

  // Middleware for handling errors and not found routes
  app.notFound(notFoundRoute);
  app.onError(errorHandler);

  return app;
};

export const createTestApp = (router: AppOpenAPI) => {
  return createApp().route("/", router);
};

export default createApp;
