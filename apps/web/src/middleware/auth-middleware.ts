import { createMiddleware } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";

import env from "@/lib/env";
import { normalizeTokenEncoding } from "@/lib/utils";

export const sessionMiddleware = createMiddleware().server(async ({ next }) => {
  const rawSessionToken = getCookie(env.AUTH_COOKIE);

  const sessionToken = rawSessionToken
    ? normalizeTokenEncoding(rawSessionToken)
    : undefined;

  return next({
    context: {
      session: { token: sessionToken },
    },
  });
});
