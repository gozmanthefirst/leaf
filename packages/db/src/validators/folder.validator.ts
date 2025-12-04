import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";

import { type Folder, folder } from "../schemas/folder.schema";
import type { Note } from "../schemas/note.schema";
import {
  EncryptedNoteSelectSchema,
  NoteMetadataSchema,
} from "./note.validator";

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

// Schema for folder with hasChildren hint (for lazy loading)
export const FolderChildItemSchema = FolderSelectSchema.extend({
  hasChildren: z.boolean(),
});

// Schema for folder children response (for lazy loading)
export const FolderChildrenResponseSchema = z.object({
  folders: z.array(FolderChildItemSchema),
  notes: z.array(NoteMetadataSchema),
});

export type FolderWithItems = Folder & {
  notes: Note[];
  folders: FolderWithItems[];
};

export type FolderChildItem = Folder & {
  hasChildren: boolean;
};

export type FolderChildrenResponse = {
  folders: FolderChildItem[];
  notes: Note[];
};
