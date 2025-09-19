/** biome-ignore-all lint/suspicious/noExplicitAny: needed for the folders circular reference */

import { relations } from "drizzle-orm";
import { boolean, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { timestamps } from "../../lib/helpers";
import { notes } from "./notes-schema";
import { user } from "./user-schema";

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
  ...timestamps,
});
export const folderRelations = relations(folders, ({ many }) => ({
  folders: many(folders),
  notes: many(notes),
}));
