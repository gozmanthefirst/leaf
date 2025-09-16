import type { User } from "@repo/database/validators/user-validators";
import { createServerFn } from "@tanstack/react-start";
import { getHeader, setCookie } from "@tanstack/react-start/server";
import z from "zod";

import { verifyEmailErrMaps } from "@/error-mappings/auth-error-mappings";
import { apiErrorHandler } from "@/lib/api-error";
import { axiosClient } from "@/lib/axios-config";
import env from "@/lib/env";
import type { ApiSuccessResponse } from "@/lib/types";
import {
  EmailSchema,
  ResetPwdSchema,
  SignInSchema,
  SignUpSchema,
} from "@/schemas/auth-schema";
import { transformAxiosError } from "@/utils/axios";

//* SIGN UP
// sign up res data type
type SignUpData = {
  token: string | null;
  user: User;
};
// sign up server fn
export const $signUp = createServerFn({
  method: "POST",
})
  .validator(SignUpSchema)
  .handler(async ({ data }) => {
    try {
      const response = await axiosClient.post<ApiSuccessResponse<SignUpData>>(
        "/auth/sign-up",
        data,
      );

      return response.data;
    } catch (error) {
      throw transformAxiosError(error);
    }
  });

//* VERIFY EMAIL
// verify email res data type
type VerifyEmailData = {
  status: boolean;
};
// verify email server fn
export const $verifyEmail = createServerFn({
  method: "POST",
})
  .validator(z.object({ token: z.string().trim().catch("") }))
  .handler(async ({ data }) => {
    try {
      const response = await axiosClient.get<
        ApiSuccessResponse<VerifyEmailData>
      >("/auth/verify-email", { params: data });

      return response.data;
    } catch (error) {
      return apiErrorHandler(error, {
        defaultMessage: "An error occurred while verifying the email.",
        errorMapping: verifyEmailErrMaps,
      });
    }
  });

//* SIGN IN
// sign in res data type
type SignInData = {
  redirect: boolean;
  token: string | null;
  user: User;
};
// sign in server fn
export const $signIn = createServerFn({
  method: "POST",
})
  .validator(SignInSchema)
  .handler(async ({ data }) => {
    try {
      const response = await axiosClient.post<ApiSuccessResponse<SignInData>>(
        "/auth/sign-in",
        data,
      );

      const token = response.data.data.token || getHeader("Set-Auth-Token");

      setCookie(env.AUTH_COOKIE, token || "", {
        path: "/",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      });

      return response.data;
    } catch (error) {
      throw transformAxiosError(error);
    }
  });

//* FORGOT PASSWORD
// forgot pwd res data type
type ForgotPwdData = {
  status: boolean;
};
// forgot pwd server fn
export const $forgotPwd = createServerFn({
  method: "POST",
})
  .validator(EmailSchema)
  .handler(async ({ data }) => {
    try {
      const response = await axiosClient.post<
        ApiSuccessResponse<ForgotPwdData>
      >("/auth/request-password-reset", data);

      return response.data;
    } catch (error) {
      throw transformAxiosError(error);
    }
  });

//* RESET PASSWORD
// reset pwd res data type
type ResetPwdData = {
  status: boolean;
};
// reset pwd server fn
export const $resetPwd = createServerFn({
  method: "POST",
})
  .validator(ResetPwdSchema)
  .handler(async ({ data }) => {
    const { confirmPassword: _c, ...payload } = data;

    try {
      const response = await axiosClient.post<ApiSuccessResponse<ResetPwdData>>(
        "/auth/reset-password",
        payload,
      );

      return response.data;
    } catch (error) {
      throw transformAxiosError(error);
    }
  });
