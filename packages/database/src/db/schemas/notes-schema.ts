import { relations } from "drizzle-orm";
import { boolean, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { timestamps } from "../../lib/helpers";
import { folders } from "./folders-schema";
import { user } from "./user-schema";

export const notes = pgTable("notes", {
  id: uuid().primaryKey().defaultRandom(),
  title: text().notNull(),
  contentEncrypted: text("content_encrypted").default("").notNull(),
  contentIv: text("content_iv").notNull(),
  contentTag: text("content_tag").notNull(),
  folderId: uuid("folder_id")
    .notNull()
    .references(() => folders.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  tags: text("tags").array().default([]).notNull(),
  ...timestamps,
});
export const noteRelations = relations(notes, ({ one }) => ({
  author: one(user, {
    fields: [notes.userId],
    references: [user.id],
  }),
  folders: one(folders, {
    fields: [notes.folderId],
    references: [folders.id],
  }),
}));
