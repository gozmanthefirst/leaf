import { OpenAPIHono } from "@hono/zod-openapi";
import { logger } from "hono/logger";
import { StatusCodes } from "http-status-codes";

import type { AppBindings } from "@/lib/types";
import emojiFavicon from "@/middleware/emoji-favicon";
import errorHandler from "@/middleware/error-handler";
import notFoundRoute from "@/middleware/not-found-route";
import { errorResponse } from "@/utils/api-response";

// This is a function for creating API routes.
export const createRouter = () => {
  return new OpenAPIHono<AppBindings>({
    strict: false,
    defaultHook: (result, c) => {
      if (!result.success) {
        const errorDetails =
          result.error.issues[0]?.message ?? "Invalid request data.";

        return c.json(
          errorResponse("INVALID_DATA", errorDetails),
          StatusCodes.UNPROCESSABLE_ENTITY,
        );
      }
    },
  });
};

// This is a function for creating the main app.
// All the necessary middleware will be added to this function.
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
