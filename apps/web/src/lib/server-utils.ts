import { createServerFn } from "@tanstack/react-start";
import {
  deleteCookie,
  getCookie,
  setCookie,
} from "@tanstack/react-start/server";
import z from "zod";

import env from "@/lib/env";
import { normalizeTokenEncoding } from "@/lib/utils";

export const $createSessionToken = createServerFn({
  method: "GET",
})
  .inputValidator(z.string().trim().min(1))
  .handler(({ data: token }) => {
    // Normalize the token encoding
    const normalizedToken = normalizeTokenEncoding(token);

    setCookie(env.AUTH_COOKIE, normalizedToken, {
      path: "/",
      secure: env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });
  });

export const $getSessionToken = createServerFn({
  method: "GET",
}).handler(() => {
  const sessionToken = getCookie(env.AUTH_COOKIE);

  // Normalize the token encoding when retrieving
  return sessionToken ? normalizeTokenEncoding(sessionToken) : sessionToken;
});

export const $delSessionToken = createServerFn({
  method: "GET",
}).handler(() => {
  deleteCookie(env.AUTH_COOKIE);
});
