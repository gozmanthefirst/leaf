import { type InferSelectModel, relations } from "drizzle-orm";
import { boolean, pgTable, text } from "drizzle-orm/pg-core";

import { timestamps } from "../lib/helpers";
import { folder } from "./folder.schema";
import { user } from "./user.schema";

export const note = pgTable("note", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  contentEncrypted: text("content_encrypted").notNull(),
  contentIv: text("content_iv").notNull(),
  contentTag: text("content_tag").notNull(),
  folderId: text("folder_id")
    .notNull()
    .references(() => folder.id, { onDelete: "cascade" }),
  isFavorite: boolean("is_favorite").notNull().default(false),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  tags: text("tags").array().notNull().default([]),
  ...timestamps,
});
export const noteRelations = relations(note, ({ one }) => ({
  author: one(user, {
    fields: [note.userId],
    references: [user.id],
  }),
  folder: one(folder, {
    fields: [note.folderId],
    references: [folder.id],
  }),
}));

export type Note = InferSelectModel<typeof note>;
