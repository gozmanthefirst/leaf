import { APIError } from "better-auth/api";
import { setCookie } from "hono/cookie";

import { auth } from "@/lib/auth";
import env from "@/lib/env";
import type { AppRouteHandler, ErrorStatusCodes } from "@/lib/types";
import { getUserByEmail } from "@/queries/user-queries";
import type {
  ChangePwdRoute,
  ReqPwdResetEmailRoute,
  ResetPwdRoute,
  SendVerificationEmailRoute,
  SignOutRoute,
} from "@/routes/auth/auth.routes";
import { errorResponse, successResponse } from "@/utils/api-response";
import HttpStatusCodes from "@/utils/http-status-codes";
import type {
  SignInRoute,
  SignUpUserRoute,
  VerifyEmailRoute,
} from "./auth.routes";

export const signUp: AppRouteHandler<SignUpUserRoute> = async (c) => {
  try {
    const data = c.req.valid("json");

    const existingAccount = await getUserByEmail(data.email);

    if (existingAccount) {
      return c.json(
        errorResponse("ACCOUNT_EXISTS", "Account already exists"),
        HttpStatusCodes.CONFLICT,
      );
    }

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
        error.statusCode as ErrorStatusCodes<typeof signUp>,
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

export const signIn: AppRouteHandler<SignInRoute> = async (c) => {
  try {
    const data = c.req.valid("json");

    const { response, headers } = await auth.api.signInEmail({
      body: data,
      headers: c.req.raw.headers,
      returnHeaders: true,
    });

    // For setting the auth token in cookies and sending it in the response
    const authToken = headers.get("set-auth-token") || "";
    c.res.headers.append("Set-Auth-Token", authToken);
    setCookie(c, env.AUTH_COOKIE, authToken, {
      path: "/",
      secure: env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return c.json(
      successResponse(response, "User signed in successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    if (error instanceof APIError) {
      return c.json(
        errorResponse(
          error.body?.code ?? "AUTH_ERROR",
          error.body?.message ?? error.message,
        ),
        error.statusCode as ErrorStatusCodes<typeof signIn>,
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

    const existingAccount = await getUserByEmail(data.email);

    if (!existingAccount) {
      return c.json(
        errorResponse("NOT_FOUND", "Account not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    if (existingAccount.emailVerified) {
      return c.json(
        errorResponse("ALREADY_VERIFIED", "Account already verified"),
        HttpStatusCodes.CONFLICT,
      );
    }

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

export const changePwd: AppRouteHandler<ChangePwdRoute> = async (c) => {
  try {
    const data = c.req.valid("json");

    const response = await auth.api.changePassword({
      body: { ...data, revokeOtherSessions: true },
      headers: c.req.raw.headers,
    });

    return c.json(
      successResponse(response, "Password changed successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    if (error instanceof APIError) {
      return c.json(
        errorResponse(
          error.body?.code ?? "AUTH_ERROR",
          error.body?.message ?? error.message,
        ),
        error.statusCode as ErrorStatusCodes<typeof changePwd>,
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
