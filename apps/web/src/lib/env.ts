import z, { type ZodError } from "zod";

const EnvSchema = z.object({
  API_URL: z.url(),
  AUTH_COOKIE: z.string(),
});

export type Env = z.infer<typeof EnvSchema>;

let env: Env;

try {
  env = EnvSchema.parse(process.env);
} catch (e) {
  const error = e as ZodError;
  console.error(z.prettifyError(error));
  process.exit(1);
}

export default env;
