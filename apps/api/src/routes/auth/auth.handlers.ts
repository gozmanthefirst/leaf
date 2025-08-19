import { APIError } from "better-auth/api";
import { setCookie } from "hono/cookie";

import { auth } from "@/lib/auth";
import env from "@/lib/env";
import type { AppRouteHandler, ErrorStatusCodes } from "@/lib/types";
import type {
  ReqPwdResetEmailRoute,
  ResetPwdRoute,
  SendVerificationEmailRoute,
  SignOutRoute,
} from "@/routes/auth/auth.routes";
import { errorResponse, successResponse } from "@/utils/api-response";
import HttpStatusCodes from "@/utils/http-status-codes";
import type {
  SignInUserRoute,
  SignUpUserRoute,
  VerifyEmailRoute,
} from "./auth.routes";

export const signUpUser: AppRouteHandler<SignUpUserRoute> = async (c) => {
  try {
    const data = c.req.valid("json");

    const response = await auth.api.signUpEmail({
      body: data,
    });

    return c.json(
      successResponse(response, "User signed up successfully"),
      HttpStatusCodes.CREATED,
    );
  } catch (error) {
    if (error instanceof APIError) {
      return c.json(
        errorResponse(
          error.body?.code ?? "AUTH_ERROR",
          error.body?.message ?? error.message,
        ),
        error.statusCode as ErrorStatusCodes<typeof signUpUser>,
      );
    }

    throw error;
  }
};

export const verifyEmail: AppRouteHandler<VerifyEmailRoute> = async (c) => {
  try {
    const data = c.req.valid("query");

    await auth.api.verifyEmail({
      query: data,
    });

    return c.json(
      successResponse({ status: true }, "Email verified successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    if (error instanceof APIError) {
      return c.json(
        errorResponse(
          error.body?.code ?? "AUTH_ERROR",
          error.body?.message ?? error.message,
        ),
        error.statusCode as ErrorStatusCodes<typeof verifyEmail>,
      );
    }

    throw error;
  }
};

export const signInUser: AppRouteHandler<SignInUserRoute> = async (c) => {
  try {
    const data = c.req.valid("json");

    const response = await auth.api.signInEmail({
      body: data,
      headers: c.req.raw.headers,
      asResponse: true, // This will be removed. The token needed is already included in the response data
    });

    // This too will be removed.
    const authToken = (response.headers.get("set-auth-token") || "").split(
      ".",
    )[0];
    c.res.headers.append("Set-Auth-Token", authToken);
    setCookie(c, "notes_api_auth_token", authToken, {
      path: "/",
      secure: env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });
    const resData = await response.json();

    return c.json(
      successResponse(resData, "User signed in successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    if (error instanceof APIError) {
      return c.json(
        errorResponse(
          error.body?.code ?? "AUTH_ERROR",
          error.body?.message ?? error.message,
        ),
        error.statusCode as ErrorStatusCodes<typeof signUpUser>,
      );
    }

    throw error;
  }
};

export const sendVerificationEmail: AppRouteHandler<
  SendVerificationEmailRoute
> = async (c) => {
  try {
    const data = c.req.valid("json");

    const response = await auth.api.sendVerificationEmail({
      body: data,
    });

    return c.json(
      successResponse(response, "Verification email sent successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    if (error instanceof APIError) {
      return c.json(
        errorResponse(
          error.body?.code ?? "AUTH_ERROR",
          error.body?.message ?? error.message,
        ),
        error.statusCode as ErrorStatusCodes<typeof sendVerificationEmail>,
      );
    }

    throw error;
  }
};

export const reqPwdResetEmail: AppRouteHandler<ReqPwdResetEmailRoute> = async (
  c,
) => {
  try {
    const data = c.req.valid("json");

    const response = await auth.api.requestPasswordReset({
      body: data,
    });

    return c.json(
      successResponse(response, "Password reset email sent successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    if (error instanceof APIError) {
      return c.json(
        errorResponse(
          error.body?.code ?? "AUTH_ERROR",
          error.body?.message ?? error.message,
        ),
        error.statusCode as ErrorStatusCodes<typeof reqPwdResetEmail>,
      );
    }

    throw error;
  }
};

export const resetPwd: AppRouteHandler<ResetPwdRoute> = async (c) => {
  try {
    const data = c.req.valid("json");

    const response = await auth.api.resetPassword({
      body: data,
    });

    return c.json(
      successResponse(response, "Password reset successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    if (error instanceof APIError) {
      return c.json(
        errorResponse(
          error.body?.code ?? "AUTH_ERROR",
          error.body?.message ?? error.message,
        ),
        error.statusCode as ErrorStatusCodes<typeof resetPwd>,
      );
    }

    throw error;
  }
};

export const signOut: AppRouteHandler<SignOutRoute> = async (c) => {
  try {
    const response = await auth.api.signOut({
      headers: c.req.raw.headers,
    });

    return c.json(
      successResponse(response, "User signed out successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    if (error instanceof APIError) {
      return c.json(
        errorResponse(
          error.body?.code ?? "AUTH_ERROR",
          error.body?.message ?? error.message,
        ),
        error.statusCode as ErrorStatusCodes<typeof signOut>,
      );
    }

    throw error;
  }
};
