import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";

import type { AppBindings } from "@/lib/types";
import emojiFavicon from "@/middleware/emoji-favicon";
import errorHandler from "@/middleware/error-handler";
import notFoundRoute from "@/middleware/not-found-route";
import { validationErrorHandler } from "@/utils/openapi-helpers";
import { auth } from "./auth";
import env from "./env";

// For creating API routers.
export const createRouter = () => {
  return new OpenAPIHono<AppBindings>({
    strict: false,
    defaultHook: validationErrorHandler,
  });
};

// For creating the main app.
// All the necessary middleware will be added to this function.
const createApp = () => {
  const app = createRouter();

  // CORS
  app.use("/api/*", cors({ origin: "http://localhost:3120" }));

  // Security Headers
  app.use(
    "*",
    secureHeaders({
      xFrameOptions: "DENY",
      xXssProtection: "1",
      strictTransportSecurity:
        env.NODE_ENV === "production"
          ? "max-age=31536000; includeSubDomains"
          : false,
      referrerPolicy: "strict-origin-when-cross-origin",
    }),
  );

  // Middleware for compressing the response body, logging requests and setting up the emoji favicon
  app.use(logger());
  app.use(emojiFavicon("🍀"));

  // Better Auth
  app.on(["POST", "GET"], "/api/better-auth/**", (c) =>
    auth.handler(c.req.raw),
  );

  // Middleware for handling errors and not found routes
  app.notFound(notFoundRoute);
  app.onError(errorHandler);

  return app;
};

export default createApp;
