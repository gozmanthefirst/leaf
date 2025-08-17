import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { notes } from "../schema/notes-schema";

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
