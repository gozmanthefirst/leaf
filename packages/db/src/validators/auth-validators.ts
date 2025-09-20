import { z } from "zod";

import { UserInputSchema } from "../../generated/zod/schemas";

export const SignUpSchema = UserInputSchema.pick({
  name: true,
  email: true,
  image: true,
}).extend({
  name: z.string().min(1).max(100),
  email: z.email(),
  image: z.url().optional(),
  password: z.string().min(8).max(100),
  rememberMe: z.boolean().optional(),
});

export const SignInSchema = UserInputSchema.pick({
  email: true,
}).extend({
  email: z.email(),
  password: z.string().min(8).max(100),
  rememberMe: z.boolean().optional(),
});

export const SendVerificationEmailSchema = UserInputSchema.pick({
  email: true,
}).extend({
  email: z.email(),
});

export const ReqPwdResetSchema = UserInputSchema.pick({
  email: true,
}).extend({
  email: z.email(),
});

export const ResetPasswordSchema = z.object({
  newPassword: z.string().min(8).max(100),
  token: z.string().min(1),
});

export const ChangePasswordSchema = z.object({
  newPassword: z.string().min(8).max(100),
  currentPassword: z.string().min(8).max(100),
});
