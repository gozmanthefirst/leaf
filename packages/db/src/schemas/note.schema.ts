import { type InferSelectModel, relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { timestamps } from "../lib/helpers";
import { folder } from "./folder.schema";
import { user } from "./user.schema";

export const note = pgTable(
  "note",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    contentEncrypted: text("content_encrypted").notNull(),
    contentIv: text("content_iv").notNull(),
    contentTag: text("content_tag").notNull(),
    folderId: uuid("folder_id")
      .notNull()
      .references(() => folder.id, { onDelete: "cascade" }),
    isFavorite: boolean("is_favorite").notNull().default(false),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    deletedAt: timestamp("deleted_at"),
    ...timestamps,
  },
  (table) => [
    check(
      "note_content_size_limit",
      sql`length(${table.contentEncrypted}) <= 4194304`,
    ),
    index("idx_note_user_id").on(table.userId),
    index("idx_note_folder_id").on(table.folderId),
    index("idx_note_not_deleted")
      .on(table.userId)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);
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
