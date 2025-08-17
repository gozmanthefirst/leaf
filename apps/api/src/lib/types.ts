import type { OpenAPIHono, RouteConfig, RouteHandler } from "@hono/zod-openapi";

import type { errorResponse } from "@/utils/api-response";

export interface AppBindings {
  // biome-ignore lint/complexity/noBannedTypes: temporary fix
  Variables: {};
}

export type AppOpenAPI = OpenAPIHono<AppBindings>;

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<
  R,
  AppBindings
>;

export type ErrorStatusCodes<R> = Extract<
  R extends AppRouteHandler<infer Route>
    ? Route["responses"][keyof Route["responses"]]
    : never,
  { content: { "application/json": ReturnType<typeof errorResponse> } }
> extends { status: infer S }
  ? S
  : never;
