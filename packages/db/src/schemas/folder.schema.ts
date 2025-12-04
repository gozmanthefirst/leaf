import type { InferSelectModel } from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { timestamps } from "../lib/helpers";
import { note } from "./note.schema";
import { user } from "./user.schema";

export const folder = pgTable(
  "folder",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    parentFolderId: uuid("parent_folder_id")
      .notNull()
      .references((): AnyPgColumn => folder.id, { onDelete: "cascade" }),
    isRoot: boolean("is_root").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    deletedAt: timestamp("deleted_at"),
    ...timestamps,
  },
  (table) => [
    index("idx_folder_user_id").on(table.userId),
    index("idx_folder_parent").on(table.userId, table.parentFolderId),
    index("idx_folder_user_root")
      .on(table.userId, table.isRoot)
      .where(sql`${table.isRoot} IS TRUE`),
    index("idx_folder_not_deleted")
      .on(table.userId)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);
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
