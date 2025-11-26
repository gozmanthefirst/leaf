import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";

import { type Folder, folder } from "../schemas/folder.schema";
import type { Note } from "../schemas/note.schema";
import { EncryptedNoteSelectSchema } from "./note.validator";

export const FolderSelectSchema = createSelectSchema(folder);

export const FolderInsertSchema = createInsertSchema(folder)
  .pick({
    name: true,
    parentFolderId: true,
  })
  .extend({
    name: z.string().min(1).default("Untitled"),
  });

export const FolderUpdateSchema = FolderInsertSchema.extend({
  name: z.string().min(1),
}).partial();

export const FolderWithItemsSchema = z.object({
  ...FolderSelectSchema.shape,
  notes: z.array(EncryptedNoteSelectSchema),
  folders: z.array(z.any()),
});

export type FolderWithItems = Folder & {
  notes: Note[];
  folders: FolderWithItems[];
};
