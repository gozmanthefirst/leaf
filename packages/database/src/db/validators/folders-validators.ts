import type { InferSelectModel } from "drizzle-orm";
import { createSelectSchema } from "drizzle-zod";

import { folders } from "../schemas/folders-schema";

export const FolderSelectSchema = createSelectSchema(folders);

export type Folder = InferSelectModel<typeof folders>;
