import db from "@repo/database";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";

import env from "./env";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },

  advanced: {
    cookies: {
      session_token: {
        name: env.AUTH_COOKIE,
        attributes: {
          path: "/",
          httpOnly: true,
          secure: env.NODE_ENV === "production",
          sameSite: "lax",
        },
      },
    },
  },

  plugins: [bearer()],
});
