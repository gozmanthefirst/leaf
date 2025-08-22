import db from "@repo/database";
import { notes } from "@repo/database/schemas/notes-schema";
import type { Note } from "@repo/database/validators/notes-validators";
import { and, eq } from "drizzle-orm";

/**
 * Fetches the note with the given ID belonging to the specified user, or null if not found.
 */
export const getNoteForUser = async (
  noteId: string,
  userId: string,
): Promise<Note | null> => {
  const [foundNote] = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
    .limit(1);

  return foundNote || null;
};
