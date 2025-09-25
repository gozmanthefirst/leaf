import { createMiddleware } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";

import env from "@/lib/env";

export const sessionMiddleware = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const cookieName =
      env.NODE_ENV === "development"
        ? env.AUTH_COOKIE
        : `__Secure-${env.AUTH_COOKIE}`;

    const sessionToken = getCookie(cookieName) ?? undefined;

    return next({
      context: {
        session: { token: sessionToken },
      },
    });
  },
);
