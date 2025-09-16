import db from "@repo/database";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer, openAPI } from "better-auth/plugins";

import { sendResetPasswordEmail, sendVerificationEmail } from "@/lib/email";
import { createRootFolder } from "@/queries/folders-queries";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
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

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          createRootFolder(user.id);
        },
      },
    },
  },

  plugins: [openAPI(), bearer()],
});
