import { createRoute, z } from "@hono/zod-openapi";
import {
  ReqPwdResetSchema,
  ResetPasswordSchema,
  SendVerificationEmailSchema,
  SignInSchema,
  SignUpSchema,
} from "@repo/database/validators/auth-validators";
import { UserSelectSchema } from "@repo/database/validators/user-validators";

import HttpStatusCodes from "@/utils/http-status-codes";
import { authExamples, userExamples } from "@/utils/openapi-examples";
import {
  errorContent,
  genericErrorContent,
  getErrDetailsFromErrFields,
  serverErrorContent,
  successContent,
} from "@/utils/openapi-helpers";

const tags = ["Auth"];

export const signUp = createRoute({
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
          user: userExamples.user,
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
      token: z.jwt().openapi({
        param: {
          name: "token",
          in: "query",
          required: true,
        },
        required: ["token"],
        example: authExamples.jwt,
        description: "The token to verify the email",
      }),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "Email verified",
      schema: z.object({
        status: z.boolean(),
      }),
      resObj: {
        details: "Email verified successfully",
        data: {
          status: true,
        },
      },
    }),
    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "Invalid request data",
      examples: {
        expiredToken: {
          summary: "Validation error",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields(authExamples.jwtValErr),
          fields: authExamples.jwtValErr,
        },
      },
    }),
    [HttpStatusCodes.UNAUTHORIZED]: errorContent({
      description: "Unauthorized",
      examples: {
        expiredToken: {
          summary: "Expired token",
          code: "TOKEN_EXPIRED",
          details: "token_expired",
          fields: {},
        },
      },
    }),
    [HttpStatusCodes.FORBIDDEN]: genericErrorContent(
      "FORBIDDEN",
      "Access denied",
    ),
    [HttpStatusCodes.NOT_FOUND]: genericErrorContent(
      "NOT_FOUND",
      "Resource not found",
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export const signIn = createRoute({
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
        redirect: z.boolean(),
        token: z.string(),
        user: UserSelectSchema,
        url: z.url().nullable(),
      }),
      resObj: {
        details: "User signed in successfully",
        data: {
          redirect: false,
          token: authExamples.token,
          user: userExamples.user,
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

export const sendVerificationEmail = createRoute({
  path: "/auth/send-verification-email",
  method: "post",
  tags,
  request: {
    body: {
      content: {
        "application/json": {
          schema: SendVerificationEmailSchema,
        },
      },
      description: "Send a verification email to a user",
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "Verification email sent",
      schema: z.object({
        status: z.boolean(),
      }),
      resObj: {
        details: "Verification email sent successfully",
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
          details: getErrDetailsFromErrFields(authExamples.emailValErr),
          fields: authExamples.emailValErr,
        },
      },
    }),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export const reqPwdResetEmail = createRoute({
  path: "/auth/request-password-reset",
  method: "post",
  tags,
  request: {
    body: {
      content: {
        "application/json": {
          schema: ReqPwdResetSchema,
        },
      },
      description: "Send a password reset email to a user",
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "Password reset email sent",
      schema: z.object({
        status: z.boolean(),
        message: z.string().optional(),
      }),
      resObj: {
        details: "Password reset email sent successfully",
        data: {
          status: true,
          message:
            "If this email exists in our system, check your email for the reset link",
        },
      },
    }),
    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "Invalid request data",
      examples: {
        validationError: {
          summary: "Validation error",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields(authExamples.emailValErr),
          fields: authExamples.emailValErr,
        },
      },
    }),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export const resetPwd = createRoute({
  path: "/auth/reset-password",
  method: "post",
  tags,
  request: {
    body: {
      content: {
        "application/json": {
          schema: ResetPasswordSchema,
        },
      },
      description: "Reset the password for a user",
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "Password reset successfully",
      schema: z.object({
        status: z.boolean(),
      }),
      resObj: {
        details: "Password reset successfully",
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
          details: getErrDetailsFromErrFields(authExamples.resetPwdValErrs),
          fields: authExamples.resetPwdValErrs,
        },
        invalidToken: {
          summary: "Invalid token",
          code: "INVALID_TOKEN",
          details: "invalid token",
          fields: {},
        },
      },
    }),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export const signOut = createRoute({
  path: "/auth/sign-out",
  method: "get",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "User signed out successfully",
      schema: z.object({
        success: z.boolean(),
      }),
      resObj: {
        details: "User signed out successfully",
        data: {
          success: true,
        },
      },
    }),
    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "No session",
      examples: {
        validationError: {
          summary: "No session",
          code: "FAILED_TO_GET_SESSION",
          details: "Failed to get session",
          fields: {},
        },
      },
    }),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export type SignUpUserRoute = typeof signUp;
export type VerifyEmailRoute = typeof verifyEmail;
export type SignInRoute = typeof signIn;
export type SendVerificationEmailRoute = typeof sendVerificationEmail;
export type ReqPwdResetEmailRoute = typeof reqPwdResetEmail;
export type ResetPwdRoute = typeof resetPwd;
export type SignOutRoute = typeof signOut;
