import { createServerFn } from "@tanstack/react-start";
import {
  deleteCookie,
  getCookie,
  setCookie,
} from "@tanstack/react-start/server";
import z from "zod";

import env from "@/lib/env";

export const $createSessionToken = createServerFn({
  method: "GET",
})
  .inputValidator(z.string().trim().min(1))
  .handler(({ data: token }) => {
    const cookieName =
      env.NODE_ENV === "development"
        ? env.AUTH_COOKIE
        : `__Secure-${env.AUTH_COOKIE}`;

    setCookie(cookieName, token, {
      path: "/",
      secure: env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });
  });

export const $getSessionToken = createServerFn({
  method: "GET",
}).handler(() => {
  const cookieName =
    env.NODE_ENV === "development"
      ? env.AUTH_COOKIE
      : `__Secure-${env.AUTH_COOKIE}`;

  const sessionToken = getCookie(cookieName);

  return sessionToken;
});

export const $delSessionToken = createServerFn({
  method: "GET",
}).handler(() => {
  const cookieName =
    env.NODE_ENV === "development"
      ? env.AUTH_COOKIE
      : `__Secure-${env.AUTH_COOKIE}`;

  deleteCookie(cookieName);
});
