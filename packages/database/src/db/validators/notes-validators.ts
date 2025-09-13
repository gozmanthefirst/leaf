import type { InferSelectModel } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";

import { notes } from "../schemas/notes-schema";

export const EncryptedNoteSelectSchema = createSelectSchema(notes).omit({});

export const NoteSelectSchema = createSelectSchema(notes)
  .omit({
    contentEncrypted: true,
    contentIv: true,
    contentTag: true,
  })
  .extend({
    content: z.string(),
  });

export const NoteInsertSchema = createInsertSchema(notes, {
  title: (t) => t.min(1).default("untitled"),
  tags: z.array(z.string().min(1)).default([]),
  isFavorite: z.boolean().default(false),
})
  .omit({
    id: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
    contentEncrypted: true,
    contentIv: true,
    contentTag: true,
  })
  .extend({
    content: z.string().default(""),
  });

export const NoteUpdateSchema = NoteInsertSchema.extend({
  title: z.string().min(1),
  tags: z.array(z.string().min(1)),
  isFavorite: z.boolean(),
}).partial();

export type Note = InferSelectModel<typeof notes>;
