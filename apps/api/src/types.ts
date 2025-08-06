import type z from "@hono/zod-openapi";

export type ZodSchema =
  // @ts-expect-error
  | z.ZodUnion
  // @ts-expect-error
  | z.AnyZodObject
  // @ts-expect-error
  | z.ZodArray<z.AnyZodObject>;
