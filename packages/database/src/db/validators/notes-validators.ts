import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";

import { notes } from "../schemas/notes-schema";

export const NoteSelectSchema = createSelectSchema(notes);

export const NoteInsertSchema = createInsertSchema(notes, {
  title: (t) => t.min(1),
  content: (c) => c.min(1),
  tags: z.array(z.string().min(1)).default([]),
  isArchived: z.boolean().default(false),
  isFavorite: z.boolean().default(false),
}).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const NoteUpdateSchema = NoteInsertSchema.partial();
