import { createRoute, z } from "@hono/zod-openapi";

import { createRouter } from "@/lib/create-app";
import HttpStatusCodes from "@/utils/http-status-codes";
import { jsonContent } from "@/utils/openapi-helpers";

const IndexSchema = z
  .object({
    message: z.string(),
  })
  .openapi({
    type: "object",
    example: { message: "Welcome to the Notes API" },
  });

const indexRouter = createRouter().openapi(
  createRoute({
    path: "/",
    method: "get",
    tags: ["Index"],
    responses: {
      [HttpStatusCodes.OK]: jsonContent(IndexSchema, "Notes API Index"),
    },
  }),
  (c) => {
    return c.json({ message: "Welcome to the Notes API" }, HttpStatusCodes.OK);
  },
);

export default indexRouter;
