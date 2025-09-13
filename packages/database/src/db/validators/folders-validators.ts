import type { InferSelectModel } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";

import { folders } from "../schemas/folders-schema";
import { EncryptedNoteSelectSchema, type Note } from "./notes-validators";

export const FolderSelectSchema = createSelectSchema(folders);

export const FolderInsertSchema = createInsertSchema(folders, {
  name: (t) => t.min(1).default("untitled"),
}).pick({
  name: true,
  parentFolderId: true,
});

export const FolderUpdateSchema = FolderInsertSchema.extend({
  name: z.string().min(1),
}).partial();

export const FolderWithItemsSchema = z.object({
  ...FolderSelectSchema.shape,
  notes: z.array(EncryptedNoteSelectSchema),
  folders: z.array(z.any()),
});

export type Folder = InferSelectModel<typeof folders>;

export type FolderWithItems = {
  id: string;
  name: string;
  parentFolderId: string;
  isRoot: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  notes: Note[];
  folders: FolderWithItems[];
};
