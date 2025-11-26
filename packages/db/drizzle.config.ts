import { defineConfig } from "drizzle-kit";

import env from "./src/lib/env";

export default defineConfig({
  out: "./src/migrations",
  schema: "./src/schemas",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  casing: "snake_case",
});
