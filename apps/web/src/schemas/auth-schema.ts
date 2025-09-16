import { z } from "zod";

export const SignUpSchema = z
  .object({
    name: z.string().min(1, { error: "A name is required" }).trim(),
    email: z
      .email({
        error: (e) =>
          String(e.input).trim().length === 0
            ? "The email is required"
            : "The email is invalid",
      })
      .trim(),
    password: z
      .string()
      .trim()
      .min(8, {
        error: "The password must have at least 8 characters",
      })
      .max(64, {
        error: "The password can't have more than 64 characters",
      })
      .trim()
      .refine((data) => !/\s/.test(data), {
        error: "The password can't contain any whitespace",
      }),
    confirmPassword: z.string().trim(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "The passwords do not match",
    path: ["confirmPassword"],
  });

export const SignInSchema = z.object({
  email: z
    .email({
      error: (e) =>
        String(e.input).trim().length === 0
          ? "The email is required"
          : "The email is invalid",
    })
    .trim(),
  password: z
    .string()
    .trim()
    .min(8, {
      error: "The password must have at least 8 characters",
    })
    .max(64, {
      error: "The password can't have more than 64 characters",
    })
    .trim()
    .refine((data) => !/\s/.test(data), {
      error: "The password can't contain any whitespace",
    }),
});

export const EmailSchema = z.object({
  email: z
    .email({
      error: (e) =>
        String(e.input).trim().length === 0
          ? "The email is required"
          : "The email is invalid",
    })
    .trim(),
});

export const ResetPwdSchema = z
  .object({
    token: z.string().min(1, { error: "A token is required" }),
    newPassword: z
      .string()
      .trim()
      .min(8, {
        error: "The new password must have at least 8 characters",
      })
      .max(64, {
        error: "The new password can't have more than 64 characters",
      })
      .trim()
      .refine((data) => !/\s/.test(data), {
        error: "The new password can't contain any whitespace",
      }),
    confirmPassword: z.string().trim(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    error: "The passwords do not match",
    path: ["confirmPassword"],
  });
