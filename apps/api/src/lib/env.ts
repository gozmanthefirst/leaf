import z, { type ZodError } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  FRONTEND_URL: z.url(),
  DATABASE_URL: z.url(),
  AUTH_COOKIE: z.string().min(1),
  ENCRYPTION_KEY: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.url(),
  RESEND_API_KEY: z.string().min(1),
  RESEND_DOMAIN: z.string().min(1),
  // Comma-separated list of allowed CORS origins (e.g., "http://localhost:3120,https://app.example.com")
  CORS_ORIGINS: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

let env: Env;

try {
  const parsedEnv = EnvSchema.parse(process.env);

  env = {
    ...parsedEnv,
    AUTH_COOKIE:
      parsedEnv.NODE_ENV === "production"
        ? `__Secure-${parsedEnv.AUTH_COOKIE}`
        : parsedEnv.AUTH_COOKIE,
  };
} catch (e) {
  const error = e as ZodError;
  console.error(z.prettifyError(error));
  process.exit(1);
}

export default env;
