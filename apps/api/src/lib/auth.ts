import { db } from "@repo/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer, openAPI } from "better-auth/plugins";

import { sendResetPasswordEmail, sendVerificationEmail } from "@/lib/email";
import { createRootFolder } from "@/queries/folder-queries";
import env from "./env";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  basePath: "/api/better-auth",

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, token }) => {
      await sendResetPasswordEmail({
        to: user.email,
        name: user.name,
        token,
      });
    },
    revokeSessionsOnPasswordReset: true,
    autoSignIn: false,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    sendVerificationEmail: async ({ user, token }) => {
      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        token,
      });
    },
  },

  account: {
    accountLinking: {
      enabled: true,
    },
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          createRootFolder(user.id);
        },
      },
    },
  },

  advanced: {
    cookies: {
      session_token: {
        name: "leaf_api_auth",
        attributes: {
          path: "/",
          httpOnly: true,
          secure: env.NODE_ENV === "production",
          sameSite: "lax",
        },
      },
    },
  },

  plugins: [openAPI(), bearer()],
});
