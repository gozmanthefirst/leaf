import { boolean, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { timestamps } from "../../lib/helpers";
import { folders } from "./folders-schema";
import { user } from "./user-schema";

export const notes = pgTable("notes", {
  id: uuid().primaryKey().defaultRandom(),
  title: text().notNull(),
  content: text().default("").notNull(),
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
