import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as authSchema from "./db/schemas/auth-schema";
import * as notesSchema from "./db/schemas/notes-schema";
import env from "./lib/env";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  idleTimeoutMillis: 30000,
});

const db = drizzle(pool, {
  schema: {
    ...notesSchema,
    ...authSchema,
  },
  casing: "snake_case",
});

export * from "drizzle-orm";
export default db;
