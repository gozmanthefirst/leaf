import { createRoute } from "@hono/zod-openapi";
import {
  SignUpSchema,
  UserSelectSchema,
} from "@repo/database/validators/auth-validator";

import HttpStatusCodes from "@/utils/http-status-codes";
import { authExamples } from "@/utils/openapi-examples";
import {
  errorContent,
  genericErrorContent,
  getErrDetailsFromErrFields,
  serverErrorContent,
  successContent,
} from "@/utils/openapi-helpers";

const tags = ["Auth"];

// ROUTES
export const signUpUser = createRoute({
  path: "/auth/sign-up",
  method: "post",
  tags,
  request: {
    body: {
      content: {
        "application/json": {
          schema: SignUpSchema,
        },
      },
      description: "Sign up a new user",
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.CREATED]: successContent({
      description: "User created",
      schema: UserSelectSchema,
      resObj: {
        details: "User created successfully",
        data: {
          token: authExamples.token,
          user: authExamples.user,
        },
      },
    }),
    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "Invalid request data",
      examples: {
        validationError: {
          summary: "Validation error",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields(authExamples.signUpValErrs),
          fields: authExamples.signUpValErrs,
        },
      },
    }),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: genericErrorContent(
      "UNPROCESSABLE_ENTITY",
      "Unprocessable entity",
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export type SignUpUserRoute = typeof signUpUser;
