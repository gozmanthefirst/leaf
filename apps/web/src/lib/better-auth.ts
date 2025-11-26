import { db } from "@repo/db";
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

  account: {
    accountLinking: {
      enabled: true,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30,
  },

  advanced: {
    cookies: {
      session_token: {
        name: "leaf_auth_session",
        attributes: {
          path: "/",
          httpOnly: true,
          secure: env.NODE_ENV === "production",
          sameSite: "lax",
          expires: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000),
        },
      },
    },
  },

  plugins: [bearer()],
});
