import { drizzle } from "drizzle-orm/node-postgres";

import * as authSchema from "./db/schemas/auth-schema";
import * as foldersSchema from "./db/schemas/folders-schema";
import * as notesSchema from "./db/schemas/notes-schema";
import * as userSchema from "./db/schemas/user-schema";
import env from "./lib/env";

const db = drizzle(env.DATABASE_URL, {
  schema: {
    ...authSchema,
    ...userSchema,
    ...notesSchema,
    ...foldersSchema,
  },
  casing: "snake_case",
});

export * from "drizzle-orm";
export default db;
