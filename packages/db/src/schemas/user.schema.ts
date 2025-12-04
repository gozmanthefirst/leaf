import { type InferSelectModel, relations, sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { account, session } from "./auth.schema";
import { folder } from "./folder.schema";
import { note } from "./note.schema";

export const user = pgTable("user", {
  id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  encryptionSalt: text("encryption_salt"),
  encryptionVersion: integer("encryption_version").default(1).notNull(),
});
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  notes: many(note),
  folders: many(folder),
}));

export type User = InferSelectModel<typeof user>;
