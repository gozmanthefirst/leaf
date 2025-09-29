import type { ErrorHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import env from "@/lib/env";
import { errorResponse } from "@/utils/api-response";
import HttpStatusCodes from "@/utils/http-status-codes";

const errorHandler: ErrorHandler = (err, c) => {
  const nodeEnv = c.env.NODE_ENV || env.NODE_ENV;

  // Handle JSON syntax errors (400 client errors)
  if ("status" in err && typeof err.status === "number" && err.status === 400) {
    return c.json(
      errorResponse("BAD_REQUEST", err.message),
      HttpStatusCodes.BAD_REQUEST,
    );
  }

  // Handle other HTTP errors with status codes (4xx client errors)
  if ("status" in err && typeof err.status === "number" && err.status < 500) {
    const statusCode = err.status as ContentfulStatusCode;

    console.error("Client error:", err);

    return c.json(
      errorResponse(
        "CLIENT_ERROR",
        nodeEnv === "production" ? "An error occurred" : err.message,
      ),
      statusCode,
    );
  }

  // Handle database/server errors (catch-all for everything else)
  console.error("Server error:", err);

  return c.json(
    errorResponse(
      "INTERNAL_SERVER_ERROR",
      nodeEnv === "production" ? "An unexpected error occurred" : err.message,
    ),
    HttpStatusCodes.INTERNAL_SERVER_ERROR,
  );
};

export default errorHandler;
