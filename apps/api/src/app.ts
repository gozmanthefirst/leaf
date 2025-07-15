import { OpenAPIHono } from "@hono/zod-openapi";
import { logger } from "hono/logger";

import emojiFavicon from "./middleware/emoji-favicon";
import errorHandler from "./middleware/error-handler";
import notFoundRoute from "./middleware/not-found-route";

const app = new OpenAPIHono();

// Middleware for Logging requests and setting up the emoji favicon
app.use(logger());
app.use(emojiFavicon("📔"));

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/error", (c) => {
  c.status(422);
  throw new Error("This is a test error");
});

// Middleware for handling errors and not found routes
app.notFound(notFoundRoute);
app.onError(errorHandler);

export default app;
