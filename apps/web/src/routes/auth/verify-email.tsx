import { createFileRoute, redirect } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import z from "zod";

import { $verifyEmail } from "@/server/auth";

const SearchSchema = z.object({
  token: z.string().trim().catch(""),
});

export const Route = createFileRoute("/auth/verify-email")({
  validateSearch: zodValidator(SearchSchema),
  beforeLoad: async ({ search }) => {
    const result = await $verifyEmail({ data: { token: search.token } });

    if (result.status === "error") {
      throw redirect({
        to: "/auth/sign-in",
        search: {
          error: result.details,
        },
      });
    } else {
      throw redirect({
        to: "/auth/sign-in",
        search: {
          success: "Email verified successfully! You can now sign in.",
        },
      });
    }
  },
});
