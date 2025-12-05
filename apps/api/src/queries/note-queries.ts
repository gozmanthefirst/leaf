import { db } from "@repo/db";

/**
 * Fetches the note with the given ID belonging to the specified user, or null if not found.
 * Only returns non-deleted notes.
 */
export const getNoteForUser = async (noteId: string, userId: string) => {
  const note = await db.query.note.findFirst({
    where: (note, { and, eq, isNull }) =>
      and(eq(note.id, noteId), eq(note.userId, userId), isNull(note.deletedAt)),
  });

  return note;
};

/**
 * Generates a unique note title using incrementing numbers within the same folder.
 * Only considers non-deleted notes.
 */
export const generateUniqueNoteTitle = async (
  intendedTitle: string,
  userId: string,
  folderId: string,
): Promise<string> => {
  // Get all existing notes with titles that start with the intended title
  // BUT only within the same folder, excluding soft-deleted notes
  const existingNote = await db.query.note.findMany({
    columns: {
      title: true,
    },
    where: (note, { and, eq, like, isNull }) =>
      and(
        eq(note.userId, userId),
        eq(note.folderId, folderId),
        like(note.title, `${intendedTitle}%`),
        isNull(note.deletedAt),
      ),
  });

  const existingTitles = new Set(existingNote.map((note) => note.title));

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
