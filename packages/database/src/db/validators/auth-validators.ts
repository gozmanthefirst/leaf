import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { user } from "../schemas/user-schema";

export const SignUpSchema = createInsertSchema(user, {
  email: z.email(),
  name: z.string().min(1).max(100),
  image: z.url().optional(),
})
  .extend({
    password: z.string().min(8).max(100),
    rememberMe: z.boolean().optional(),
  })
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    emailVerified: true,
  });

export const SignInSchema = createInsertSchema(user, {
  email: z.email(),
})
  .extend({
    password: z.string().min(8).max(100),
    rememberMe: z.boolean().optional(),
  })
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    emailVerified: true,
    name: true,
    image: true,
  });

export const SendVerificationEmailSchema = createInsertSchema(user, {
  email: z.email(),
}).pick({
  email: true,
});

export const ReqPwdResetSchema = createInsertSchema(user, {
  email: z.email(),
}).pick({
  email: true,
});

export const ResetPasswordSchema = z.object({
  newPassword: z.string().min(8).max(100),
  token: z.string().min(1),
});

export const ChangePasswordSchema = z.object({
  newPassword: z.string().min(8).max(100),
  currentPassword: z.string().min(8).max(100),
});
