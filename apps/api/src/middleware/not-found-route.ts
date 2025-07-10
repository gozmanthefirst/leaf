import type { NotFoundHandler } from "hono";
import { StatusCodes } from "http-status-codes";

export const notFoundRoute: NotFoundHandler = (c) => {
  return c.json(
    {
      message: `Route not found - '${c.req.path}'`,
    },
    StatusCodes.NOT_FOUND,
  );
};
