import type { InferSelectModel } from "drizzle-orm";
import { createSelectSchema } from "drizzle-zod";
import z from "zod";

import { folders } from "../schemas/folders-schema";
import { type Note, NoteSelectSchema } from "./notes-validators";

export const FolderSelectSchema = createSelectSchema(folders);

export const FolderWithItemsSchema = z.object({
  ...FolderSelectSchema.shape,
  notes: z.array(NoteSelectSchema),
  folders: z.array(z.any()),
});

export type Folder = InferSelectModel<typeof folders>;

export type FolderWithItems = {
  id: string;
  name: string;
  parentFolderId: string;
  isRoot: boolean;
  userId: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  notes: Note[];
  folders: FolderWithItems[];
};
