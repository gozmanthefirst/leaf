import { createRoute, z } from "@hono/zod-openapi";
import {
  UserSelectSchema,
  UserUpdateSchema,
} from "@repo/db/validators/user.validator";

import HttpStatusCodes from "@/utils/http-status-codes";
import { userExamples } from "@/utils/openapi-examples";
import {
  errorContent,
  genericErrorContent,
  getErrDetailsFromErrFields,
  serverErrorContent,
  successContent,
} from "@/utils/openapi-helpers";

const tags = ["User"];

export const getUser = createRoute({
  path: "/user/me",
  method: "get",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  description: "Get the current user",
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "User retrieved",
      schema: UserSelectSchema,
      resObj: {
        details: "User retrieved successfully",
        data: userExamples.user,
      },
    }),
    [HttpStatusCodes.UNAUTHORIZED]: genericErrorContent(
      "UNAUTHORIZED",
      "Unauthorized",
      "No session found",
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
      "Too many requests have been made. Please try again later.",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export const updateUser = createRoute({
  path: "/user/me",
  method: "patch",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  description: "Update all editable fields of the current user",
  request: {
    body: {
      content: {
        "application/json": {
          schema: UserUpdateSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "User updated",
      schema: z.object({
        status: z.boolean(),
      }),
      resObj: {
        details: "User updated successfully",
        data: {
          status: true,
        },
      },
    }),
    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "Invalid request data",
      examples: {
        validationError: {
          summary: "Validation error",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields(userExamples.updateUserValErrs),
          fields: userExamples.updateUserValErrs,
        },
      },
    }),
    [HttpStatusCodes.UNAUTHORIZED]: genericErrorContent(
      "UNAUTHORIZED",
      "Unauthorized",
      "No session found",
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
      "Too many requests have been made. Please try again later.",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export type GetUserRoute = typeof getUser;
export type UpdateUserRoute = typeof updateUser;
