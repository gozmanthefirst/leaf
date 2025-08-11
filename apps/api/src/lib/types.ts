import type { OpenAPIHono } from "@hono/zod-openapi";

export interface AppBindings {
  // biome-ignore lint/complexity/noBannedTypes: temporary fix
  Variables: {};
}

export type AppOpenAPI = OpenAPIHono<AppBindings>;
