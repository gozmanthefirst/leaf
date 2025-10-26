import { db } from "@repo/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer } from "better-auth/plugins";

import env from "./env";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
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
