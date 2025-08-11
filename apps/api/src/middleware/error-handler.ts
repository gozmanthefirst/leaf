import type { ErrorHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import env from "@/lib/env";
import HttpStatusCodes from "@/utils/http-status-codes";

const errorHandler: ErrorHandler = (err, c) => {
  const currentStatus =
    "status" in err ? err.status : c.newResponse(null).status;

  const statusCode =
    currentStatus !== HttpStatusCodes.OK
      ? (currentStatus as ContentfulStatusCode)
      : HttpStatusCodes.INTERNAL_SERVER_ERROR;

  const nodeEnv = c.env.NODE_ENV || env.NODE_ENV;

  return c.json(
    {
      message: err.message,
      stack: nodeEnv === "production" ? undefined : err.stack,
    },
    statusCode,
  );
};

export default errorHandler;
