import { pgTable, text, uuid } from "drizzle-orm/pg-core";

import { timestamps } from "../../lib/helpers";

export const notes = pgTable("notes", {
  id: uuid().primaryKey().defaultRandom().unique().notNull(),
  title: text().default("untitled").notNull(),
  content: text().notNull(),
  ...timestamps,
});
