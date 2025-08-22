import db from "@repo/database";
import { folders } from "@repo/database/schemas/folders-schema";
import type { Folder } from "@repo/database/validators/folders-validators";
import { and, eq } from "drizzle-orm";

/**
 * Returns true if a folder with the given ID exists and belongs to the specified user.
 */
export const folderBelongsToUser = async (
  folderId: string,
  userId: string,
): Promise<boolean> => {
  const rows = await db
    .select()
    .from(folders)
    .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
    .limit(1);

  return rows.length === 1;
};

/**
 * Fetches the folder with the given ID belonging to the specified user, or null if not found.
 */
export const getFolderForUser = async (
  folderId: string,
  userId: string,
): Promise<Folder | null> => {
  const [foundFolder] = await db
    .select()
    .from(folders)
    .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
    .limit(1);

  return foundFolder || null;
};
