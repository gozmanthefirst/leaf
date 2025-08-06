import { createRoute, z } from "@hono/zod-openapi";

import { createRouter } from "@/lib/create-app";

const SampleSchema = z
  .object({
    note: z.string().openapi({ example: "Welcome message" }),
  })
  .openapi({
    type: "object",
    description: "API Index Response",
  });

const indexRouter = createRouter().openapi(
  createRoute({
    method: "get",
    path: "/",
    responses: {
      200: {
        content: {
          "application/json": {
            schema: SampleSchema,
          },
        },
        description: "Notes API Index",
      },
    },
  }),
  (c) => {
    return c.json({
      note: "123",
    });
  },
);

export default indexRouter;
