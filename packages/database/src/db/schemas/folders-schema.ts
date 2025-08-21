import { pgTable, text, uuid } from "drizzle-orm/pg-core";

import { timestamps } from "../../lib/helpers";
import { user } from "./auth-schema";

export const folders = pgTable("folders", {
  id: uuid().primaryKey().defaultRandom().unique().notNull(),
  name: text().notNull(),
  parentFolderId: uuid("parent_folder_id").references(() => folders.id, {
    onDelete: "cascade",
  }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  ...timestamps,
});
