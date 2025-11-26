import { type InferSelectModel, relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { account, session } from "./auth.schema";
import { folder } from "./folder.schema";
import { note } from "./note.schema";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  notes: many(note),
  folders: many(folder),
}));

export type User = InferSelectModel<typeof user>;
