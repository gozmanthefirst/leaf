/** biome-ignore-all lint/suspicious/noExplicitAny: needed for the folders circular reference */
import { boolean, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { timestamps } from "../../lib/helpers";
import { user } from "./auth-schema";

export const folders = pgTable("folders", {
  id: uuid().primaryKey().defaultRandom().unique().notNull(),
  name: text().notNull(),
  parentFolderId: uuid("parent_folder_id")
    .notNull()
    .references((): any => folders.id, { onDelete: "cascade" }),
  isRoot: boolean("is_root").default(false).notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  ...timestamps,
});

export const notes = pgTable("notes", {
  id: uuid().primaryKey().defaultRandom().unique().notNull(),
  title: text().default("untitled").notNull(),
  content: text().notNull(),
  folderId: uuid("folder_id")
    .notNull()
    .references(() => folders.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  ...timestamps,
});
