import { createRoute, z } from "@hono/zod-openapi";
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
import { SignInSchema } from "../../../../../packages/database/src/db/validators/auth-validator";

const tags = ["Auth"];

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
      schema: z.object({
        token: z.string().nullable(),
        user: UserSelectSchema,
      }),
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

export const verifyEmail = createRoute({
  path: "/auth/verify-email",
  method: "get",
  tags,
  request: {
    query: z.object({
      token: z
        .string()
        .min(1)
        .openapi({
          param: {
            name: "token",
            in: "query",
            required: true,
          },
          required: ["token"],
          example: authExamples.token,
          description: "The token to verify the email",
        }),
      callBackUrl: z
        .url()
        .optional()
        .openapi({
          param: {
            name: "callBackUrl",
            in: "query",
            required: false,
          },
          example: "https://example.com/auth/callback",
          description: "The URL to redirect to after email verification",
        }),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "Email verified",
      schema: z.object({
        status: z.boolean(),
        user: UserSelectSchema,
      }),
      resObj: {
        details: "Email verified successfully",
        data: {
          status: true,
        },
      },
    }),
    [HttpStatusCodes.BAD_REQUEST]: genericErrorContent(
      "VALIDATION_ERROR",
      "Invalid query parameters",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: genericErrorContent(
      "INVALID_TOKEN",
      "Invalid token",
    ),
    [HttpStatusCodes.FORBIDDEN]: genericErrorContent(
      "FORBIDDEN",
      "Access denied",
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export const signInUser = createRoute({
  path: "/auth/sign-in",
  method: "post",
  tags,
  request: {
    body: {
      content: {
        "application/json": {
          schema: SignInSchema,
        },
      },
      description: "Sign in with email and password",
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "User signed in",
      schema: z.object({
        token: z.string(),
        user: UserSelectSchema,
        url: z.url().nullable(),
      }),
      resObj: {
        details: "User signed in successfully",
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
          details: getErrDetailsFromErrFields(authExamples.signInValErrs),
          fields: authExamples.signInValErrs,
        },
      },
    }),
    [HttpStatusCodes.UNAUTHORIZED]: errorContent({
      description: "Invalid credentials",
      examples: {
        validationError: {
          summary: "Invalid credentials",
          code: "INVALID_EMAIL_OR_PASSWORD",
          details: "Invalid email or password",
          fields: {},
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
export type VerifyEmailRoute = typeof verifyEmail;
export type SignInUserRoute = typeof signInUser;
