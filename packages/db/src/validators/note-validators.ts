import z from "zod";

import { NoteInputSchema, NoteSchema } from "../../generated/zod/schemas";

export const EncryptedNoteSelectSchema = NoteSchema;

export const NoteSelectSchema = EncryptedNoteSelectSchema.omit({
  contentEncrypted: true,
  contentIv: true,
  contentTag: true,
}).extend({
  content: z.string(),
});

export const NoteInsertSchema = NoteInputSchema.pick({
  title: true,
  tags: true,
  isFavorite: true,
  folderId: true,
}).extend({
  title: z.string().min(1).default("Untitled"),
  content: z.string().default(""),
  tags: z.array(z.string().min(1)).default([]),
  isFavorite: z.boolean().default(false),
  folderId: z.uuid(),
});

export const NoteUpdateSchema = NoteInsertSchema.extend({
  title: z.string().min(1),
  tags: z.array(z.string().min(1)),
  isFavorite: z.boolean(),
  _compressed: z.boolean(),
}).partial();

export type DecryptedNote = z.infer<typeof NoteSelectSchema>;
