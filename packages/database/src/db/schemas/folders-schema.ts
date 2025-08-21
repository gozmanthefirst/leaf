/** biome-ignore-all lint/suspicious/noExplicitAny: needed for the folders circular reference */
import { boolean, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { timestamps } from "../../lib/helpers";
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
  isArchived: boolean("is_archived").default(false).notNull(),
  ...timestamps,
});
