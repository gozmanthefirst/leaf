import { OpenAPIHono } from "@hono/zod-openapi";
import { logger } from "hono/logger";
import { StatusCodes } from "http-status-codes";

import emojiFavicon from "@/middleware/emoji-favicon";
import errorHandler from "@/middleware/error-handler";
import notFoundRoute from "@/middleware/not-found-route";

export const createRouter = () => {
  return new OpenAPIHono({
    strict: false,
    defaultHook: (result, c) => {
      if (!result.success) {
        return c.json(
          {
            success: result.success,
            details: result.error,
          },
          StatusCodes.UNPROCESSABLE_ENTITY,
        );
      }
    },
  });
};

const createApp = () => {
  const app = createRouter();

  // Middleware for Logging requests and setting up the emoji favicon
  app.use(logger());
  app.use(emojiFavicon("📔"));

  // Middleware for handling errors and not found routes
  app.notFound(notFoundRoute);
  app.onError(errorHandler);

  return app;
};

export default createApp;
