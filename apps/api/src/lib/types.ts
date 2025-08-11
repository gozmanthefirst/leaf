import type { OpenAPIHono, RouteConfig, RouteHandler } from "@hono/zod-openapi";

export interface AppBindings {
  // biome-ignore lint/complexity/noBannedTypes: temporary fix
  Variables: {};
}

export type AppOpenAPI = OpenAPIHono<AppBindings>;

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<
  R,
  AppBindings
>;
