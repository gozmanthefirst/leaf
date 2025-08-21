/** biome-ignore-all lint/suspicious/noExplicitAny: needed for the folders circular reference */
import { boolean, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { timestamps } from "../../lib/helpers";
import { user } from "./auth-schema";

export const notes = pgTable("notes", {
  id: uuid().primaryKey().defaultRandom(),
  title: text().default("untitled").notNull(),
  content: text().notNull(),
  folderId: uuid("folder_id")
    .notNull()
    .references(() => folders.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  isArchived: boolean("is_archived").default(false).notNull(),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  tags: text("tags").array().default([]).notNull(),
  ...timestamps,
});

export const folders = pgTable("folders", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  parentFolderId: uuid("parent_folder_id")
    .notNull()
    .references((): any => folders.id, { onDelete: "cascade" }),
  isRoot: boolean("is_root").default(false).notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  isArchived: boolean("is_archived").default(false).notNull(),
  ...timestamps,
});
