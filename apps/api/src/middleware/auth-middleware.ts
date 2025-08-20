import { createMiddleware } from "hono/factory";

import { auth } from "@/lib/auth";
import type { AppBindings } from "@/lib/types";
import { errorResponse } from "@/utils/api-response";
import HttpStatusCodes from "@/utils/http-status-codes";

export const authMiddleware = createMiddleware<AppBindings>(async (c, next) => {
  const authSession = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!authSession) {
    return c.json(
      errorResponse("UNAUTHORIZED", "No session found"),
      HttpStatusCodes.UNAUTHORIZED,
    );
  }

  c.set("session", authSession.session);
  c.set("user", authSession.user);

  return next();
});
