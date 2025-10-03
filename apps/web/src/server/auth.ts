import type { User } from "@repo/db";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";

import { axiosClient } from "@/lib/axios";
import { $createSessionToken, $delSessionToken } from "@/lib/server-utils";
import type { ApiSuccessResponse } from "@/lib/types";
import { sessionMiddleware } from "@/middleware/auth-middleware";
import {
  EmailSchema,
  ResetPwdSchema,
  SignInSchema,
  SignUpSchema,
} from "@/schemas/auth-schema";

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
  .inputValidator(SignUpSchema)
  .handler(async ({ data }) => {
    const { confirmPassword: _c, ...payload } = data;

    const response = await axiosClient.post<ApiSuccessResponse<SignUpData>>(
      "/auth/sign-up",
      payload,
    );

    return response.data;
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
  .inputValidator(z.object({ token: z.string().trim().catch("") }))
  .handler(async ({ data }) => {
    const response = await axiosClient.get<ApiSuccessResponse<VerifyEmailData>>(
      "/auth/verify-email",
      { params: data },
    );

    return response.data;
  });

//* SIGN IN
// sign in res data type
type SignInData = {
  redirect: boolean;
  token: string;
  url: string | undefined;
  user: User;
};
// sign in server fn
export const $signIn = createServerFn({
  method: "POST",
})
  .inputValidator(SignInSchema)
  .handler(async ({ data }) => {
    const response = await axiosClient.post<ApiSuccessResponse<SignInData>>(
      "/auth/sign-in",
      data,
    );

    const token = response.data.data.token;
    await $createSessionToken({ data: token });

    return response.data;
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
  .inputValidator(EmailSchema)
  .handler(async ({ data }) => {
    const response = await axiosClient.post<ApiSuccessResponse<ForgotPwdData>>(
      "/auth/request-password-reset",
      data,
    );

    return response.data;
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
  .inputValidator(ResetPwdSchema)
  .handler(async ({ data }) => {
    const { confirmPassword: _c, ...payload } = data;

    const response = await axiosClient.post<ApiSuccessResponse<ResetPwdData>>(
      "/auth/reset-password",
      payload,
    );

    return response.data;
  });

//* SIGN OUT
// sign out server fn
export const $signOut = createServerFn({
  method: "GET",
})
  .middleware([sessionMiddleware])
  .handler(async ({ context }) => {
    const response = await axiosClient.get<ApiSuccessResponse>(
      "/auth/sign-out",
      {
        headers: {
          Authorization: `Bearer ${context.session.token}`,
        },
      },
    );

    await $delSessionToken();
    return response.data;
  });
