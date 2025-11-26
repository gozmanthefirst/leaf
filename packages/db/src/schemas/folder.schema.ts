import type { InferSelectModel } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { type AnyPgColumn, boolean, pgTable, text } from "drizzle-orm/pg-core";

import { timestamps } from "../lib/helpers";
import { note } from "./note.schema";
import { user } from "./user.schema";

export const folder = pgTable("folder", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  parentFolderId: text("parent_folder_id")
    .notNull()
    .references((): AnyPgColumn => folder.id, { onDelete: "cascade" }),
  isRoot: boolean("is_root").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  ...timestamps,
});
export const folderRelations = relations(folder, ({ many, one }) => ({
  notes: many(note),
  author: one(user, {
    fields: [folder.userId],
    references: [user.id],
  }),
  subFolders: many(folder),
  parentFolder: one(folder, {
    fields: [folder.parentFolderId],
    references: [folder.id],
  }),
}));

export type Folder = InferSelectModel<typeof folder>;
