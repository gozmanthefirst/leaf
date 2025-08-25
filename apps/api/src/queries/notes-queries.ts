import db, { and, eq, sql } from "@repo/database";
import { notes } from "@repo/database/schemas/notes-schema";
import type { Note } from "@repo/database/validators/notes-validators";

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

/**
 * Generates a unique note title using incrementing numbers within the same folder.
 */
export const generateUniqueNoteTitle = async (
  intendedTitle: string,
  userId: string,
  folderId: string,
): Promise<string> => {
  // Get all existing notes with titles that start with the intended title
  // BUT only within the same folder
  const existingNotes = await db
    .select({ title: notes.title })
    .from(notes)
    .where(
      and(
        eq(notes.userId, userId),
        eq(notes.folderId, folderId),
        sql`${notes.title} LIKE ${`${intendedTitle}%`}`,
      ),
    );

  const existingTitles = new Set(existingNotes.map((note) => note.title));

  // If the original title doesn't exist, use it
  if (!existingTitles.has(intendedTitle)) {
    return intendedTitle;
  }

  // Find the highest number suffix and increment
  let maxSuffix = 0;

  for (const title of existingTitles) {
    if (title === intendedTitle) {
      maxSuffix = Math.max(maxSuffix, 0);
    } else if (title.startsWith(`${intendedTitle} `)) {
      const suffix = title.substring(intendedTitle.length + 1);
      const num = parseInt(suffix, 10);
      if (!Number.isNaN(num)) {
        maxSuffix = Math.max(maxSuffix, num);
      }
    }
  }

  return `${intendedTitle} ${maxSuffix + 1}`;
};

/**
 * Checks if a note with the given title exists for the specified user.
 */
export const noteExistsWithTitle = async (
  title: string,
  userId: string,
): Promise<boolean> => {
  const [existingNote] = await db
    .select({ id: notes.id })
    .from(notes)
    .where(and(eq(notes.title, title), eq(notes.userId, userId)))
    .limit(1);

  return !!existingNote;
};
