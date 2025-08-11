import type { z } from "@hono/zod-openapi";

export const jsonContent = <T extends z.ZodType>(
  schema: T,
  description: string,
) => {
  return {
    content: {
      "application/json": {
        schema,
      },
    },
    description,
  };
};
