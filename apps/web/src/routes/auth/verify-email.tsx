import { createFileRoute, redirect } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import z from "zod";

import { verifyEmailErrMaps } from "@/error-mappings/auth-error-mappings";
import { apiErrorHandler } from "@/lib/handle-api-error";
import { $verifyEmail } from "@/server/auth";

const SearchSchema = z.object({
  token: z.string().trim().catch(""),
});

export const Route = createFileRoute("/auth/verify-email")({
  validateSearch: zodValidator(SearchSchema),
  beforeLoad: async ({ search }) => {
    try {
      await $verifyEmail({ data: { token: search.token } });
    } catch (error) {
      const apiError = apiErrorHandler(error, {
        defaultMessage: "An error occurred while verifying the email.",
        errorMapping: verifyEmailErrMaps,
      });

      throw redirect({
        to: "/auth/sign-in",
        search: {
          error: apiError.details,
        },
      });
    }

    throw redirect({
      to: "/auth/sign-in",
      search: {
        success: "Email verified successfully! You can now sign in.",
      },
    });
  },
});
