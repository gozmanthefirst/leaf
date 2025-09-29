import z, { type ZodError } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  API_URL: z.url(),
  DATABASE_URL: z.url(),
  AUTH_COOKIE: z.string(),
  BETTER_AUTH_SECRET: z.string(),
  BETTER_AUTH_URL: z.url(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
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
