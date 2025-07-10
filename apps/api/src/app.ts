import { Hono } from "hono";

import { notFoundRoute } from "@/middleware/not-found-route";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.notFound(notFoundRoute);

export default app;
