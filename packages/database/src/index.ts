import { drizzle } from "drizzle-orm/node-postgres";

import * as notesSchema from "./db/schema/notes-schema";
import env from "./lib/env";

const db = drizzle(env.DATABASE_URL, {
  schema: {
    ...notesSchema,
  },
});

export * from "drizzle-orm";
export default db;
