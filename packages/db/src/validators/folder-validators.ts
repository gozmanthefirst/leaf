import z from "zod";

import type { Folder, Note } from "../../generated/prisma/client";
import { FolderInputSchema, FolderSchema } from "../../generated/zod/schemas";
import { EncryptedNoteSelectSchema } from "./note-validators";

export const FolderSelectSchema = FolderSchema;

export const FolderInsertSchema = FolderInputSchema.pick({
  name: true,
  parentFolderId: true,
}).extend({
  name: z.string().min(1).default("Untitled"),
  parentFolderId: z.uuid(),
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
