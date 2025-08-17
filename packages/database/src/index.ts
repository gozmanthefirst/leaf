import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as notesSchema from "./db/schema/notes-schema";
import env from "./lib/env";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  idleTimeoutMillis: 30000,
});

const db = drizzle(pool, {
  schema: {
    ...notesSchema,
  },
  casing: "snake_case",
});

export * from "drizzle-orm";
export default db;
