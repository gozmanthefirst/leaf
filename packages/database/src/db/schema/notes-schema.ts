import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { timestamps } from "../../lib/helpers";

export const notes = pgTable("notes", {
  id: uuid().primaryKey().defaultRandom().unique().notNull(),
  title: text().default("untitled").notNull(),
  content: text().notNull(),
  ...timestamps,
});

export const NotesSelectSchema = createSelectSchema(notes);
export const NotesInsertSchema = createInsertSchema(notes, {
  title: (t) => t.min(1),
  content: (c) => c.min(1),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const NotesUpdateSchema = NotesInsertSchema.partial();
