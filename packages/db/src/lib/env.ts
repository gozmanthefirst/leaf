import { config } from "dotenv";
import { expand } from "dotenv-expand";
import z, { type ZodError } from "zod";

expand(config());

const EnvSchema = z.object({
  DATABASE_URL: z.url(),
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
