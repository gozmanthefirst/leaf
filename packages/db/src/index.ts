import { drizzle } from "drizzle-orm/node-postgres";

import env from "./lib/env";
import * as authSchema from "./schemas/auth.schema";
import * as folderSchema from "./schemas/folder.schema";
import * as noteSchema from "./schemas/note.schema";
import * as userSchema from "./schemas/user.schema";

const db = drizzle(env.DATABASE_URL, {
  schema: {
    ...authSchema,
    ...folderSchema,
    ...noteSchema,
    ...userSchema,
  },
  casing: "snake_case",
});

export * from "drizzle-orm";
export { db };
