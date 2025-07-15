import type { ErrorHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { StatusCodes } from "http-status-codes";

import env from "@/env";

const errorHandler: ErrorHandler = (err, c) => {
  const currentStatus =
    "status" in err ? err.status : c.newResponse(null).status;

  const statusCode =
    currentStatus !== StatusCodes.OK
      ? (currentStatus as ContentfulStatusCode)
      : StatusCodes.INTERNAL_SERVER_ERROR;

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
