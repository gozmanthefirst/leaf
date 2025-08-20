import { createRoute } from "@hono/zod-openapi";
import { UserSelectSchema } from "@repo/database/validators/user-validators";

import HttpStatusCodes from "@/utils/http-status-codes";
import { userExamples } from "@/utils/openapi-examples";
import {
  genericErrorContent,
  serverErrorContent,
  successContent,
} from "@/utils/openapi-helpers";

const tags = ["User"];

export const getUser = createRoute({
  path: "/user/me",
  method: "get",
  tags,
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "User retrieved",
      schema: UserSelectSchema,
      resObj: {
        details: "User retrieved successfully",
        data: userExamples.user,
      },
    }),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export type GetUserRoute = typeof getUser;
