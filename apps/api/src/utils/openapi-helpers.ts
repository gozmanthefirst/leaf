import type { z } from "zod";

export const jsonContent = <T extends z.ZodSchema>(
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
