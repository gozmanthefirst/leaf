import db, { eq } from "@repo/database";
import { notes } from "@repo/database/schemas/notes-schema";

import type { AppRouteHandler } from "@/lib/types";
import { getFolderForUser } from "@/queries/folders-queries";
import {
  generateUniqueNoteTitle,
  getNoteForUser,
} from "@/queries/notes-queries";
import type {
  CopyNoteRoute,
  DeleteNoteRoute,
  GetSingleNoteRoute,
  MoveNoteRoute,
  ToggleNoteFavoriteRoute,
  UpdateNoteRoute,
} from "@/routes/notes/notes.routes";
import { errorResponse, successResponse } from "@/utils/api-response";
import HttpStatusCodes from "@/utils/http-status-codes";
import type { CreateNoteRoute, GetAllNotesRoute } from "./notes.routes";

const normalizeTags = (tags: string[] | undefined): string[] => {
  if (!tags) return [];
  // Remove empty strings and duplicates
  return Array.from(new Set(tags.filter((tag) => tag.trim().length > 0)));
};

export const getAllNotes: AppRouteHandler<GetAllNotesRoute> = async (c) => {
  try {
    const notes = await db.query.notes.findMany();

    return c.json(
      successResponse(notes, "All notes retrieved successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    console.error("Error retrieving notes:", error);
    return c.json(
      errorResponse("INTERNAL_SERVER_ERROR", "Failed to retrieve notes"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const createNote: AppRouteHandler<CreateNoteRoute> = async (c) => {
  const user = c.get("user");
  const noteData = c.req.valid("json");

  try {
    const folder = await getFolderForUser(noteData.folderId, user.id);

    if (!folder) {
      return c.json(
        errorResponse("NOT_FOUND", "Folder not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    const uniqueTitle = await generateUniqueNoteTitle(
      noteData.title || "untitled",
      user.id,
      noteData.folderId,
    );

    const payload = {
      ...noteData,
      userId: user.id,
      title: uniqueTitle,
      tags: normalizeTags(noteData.tags),
    };

    const [newNote] = await db.insert(notes).values(payload).returning();

    return c.json(
      successResponse(newNote, "Note created successfully"),
      HttpStatusCodes.CREATED,
    );
  } catch (error) {
    console.error("Error creating note:", error);
    return c.json(
      errorResponse("INTERNAL_SERVER_ERROR", "Failed to create note"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const getSingleNote: AppRouteHandler<GetSingleNoteRoute> = async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");

  try {
    const note = await getNoteForUser(id, user.id);

    if (!note) {
      return c.json(
        errorResponse("NOT_FOUND", "Note not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    return c.json(
      successResponse(note, "Note retrieved successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    console.error("Error retrieving note:", error);
    return c.json(
      errorResponse("INTERNAL_SERVER_ERROR", "Failed to retrieve note"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const copyNote: AppRouteHandler<CopyNoteRoute> = async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");

  try {
    const noteToBeCopied = await getNoteForUser(id, user.id);

    // Check if the note exists
    if (!noteToBeCopied) {
      return c.json(
        errorResponse("NOTE_NOT_FOUND", "Note not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    const uniqueTitle = await generateUniqueNoteTitle(
      noteToBeCopied.title || "untitled",
      user.id,
      noteToBeCopied.folderId,
    );

    const payload = {
      title: uniqueTitle,
      content: noteToBeCopied.content,
      userId: user.id,
      folderId: noteToBeCopied.folderId,
      isFavorite: false,
      tags: normalizeTags(noteToBeCopied.tags),
    };

    const [copiedNote] = await db.insert(notes).values(payload).returning();

    return c.json(
      successResponse(copiedNote, "Note copied successfully"),
      HttpStatusCodes.CREATED,
    );
  } catch (error) {
    console.error("Error copying note:", error);
    return c.json(
      errorResponse("INTERNAL_SERVER_ERROR", "Failed to copy note"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const toggleNoteFavorite: AppRouteHandler<
  ToggleNoteFavoriteRoute
> = async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const { favorite } = c.req.valid("json");

  try {
    const note = await getNoteForUser(id, user.id);

    if (!note) {
      return c.json(
        errorResponse("NOT_FOUND", "Note not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    const [updatedNote] = await db
      .update(notes)
      .set({
        isFavorite: favorite,
      })
      .where(eq(notes.id, id))
      .returning();

    return c.json(
      successResponse(updatedNote, "Note favorite state updated successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    console.error("Error updating note favorite state:", error);
    return c.json(
      errorResponse(
        "INTERNAL_SERVER_ERROR",
        "Failed to update note favorite state",
      ),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const moveNote: AppRouteHandler<MoveNoteRoute> = async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const { folderId } = c.req.valid("json");

  try {
    const note = await getNoteForUser(id, user.id);

    if (!note) {
      return c.json(
        errorResponse("NOTE_NOT_FOUND", "Note not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    if (folderId === note.folderId) {
      return c.json(
        successResponse(note, "Note moved successfully"),
        HttpStatusCodes.OK,
      );
    }

    const folder = await getFolderForUser(folderId, user.id);
    if (!folder) {
      return c.json(
        errorResponse("FOLDER_NOT_FOUND", "Folder not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    const uniqueTitle = await generateUniqueNoteTitle(
      note.title,
      user.id,
      folderId,
    );

    const [updatedNote] = await db
      .update(notes)
      .set({
        folderId,
        title: uniqueTitle,
      })
      .where(eq(notes.id, id))
      .returning();

    return c.json(
      successResponse(updatedNote, "Note moved successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    console.error("Error moving note:", error);
    return c.json(
      errorResponse("INTERNAL_SERVER_ERROR", "Failed to move note"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const updateNote: AppRouteHandler<UpdateNoteRoute> = async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const noteData = c.req.valid("json");

  try {
    const note = await getNoteForUser(id, user.id);

    if (!note) {
      return c.json(
        errorResponse("NOTE_NOT_FOUND", "Note not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    const folderId = noteData.folderId ?? note.folderId;
    const title = noteData.title ?? note.title;
    const content = noteData.content ?? note.content;
    const isFavorite = noteData.isFavorite ?? note.isFavorite;
    const tags = normalizeTags(noteData.tags ?? note.tags);

    // Check for no changes
    if (
      folderId === note.folderId &&
      title === note.title &&
      content === note.content &&
      isFavorite === note.isFavorite &&
      JSON.stringify(tags) === JSON.stringify(note.tags)
    ) {
      return c.json(
        successResponse(note, "No changes to update"),
        HttpStatusCodes.OK,
      );
    }

    if (folderId !== note.folderId) {
      const folder = await getFolderForUser(folderId, user.id);
      if (!folder) {
        return c.json(
          errorResponse("FOLDER_NOT_FOUND", "Folder not found"),
          HttpStatusCodes.NOT_FOUND,
        );
      }
    }

    let newTitle = title;
    if (folderId !== note.folderId || title !== note.title) {
      newTitle = await generateUniqueNoteTitle(title, user.id, folderId);
    }

    const [updatedNote] = await db
      .update(notes)
      .set({
        ...noteData,
        folderId,
        title: newTitle,
        content,
        isFavorite,
        tags,
      })
      .where(eq(notes.id, id))
      .returning();

    return c.json(
      successResponse(updatedNote, "Note updated successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    console.error("Error updating note:", error);
    return c.json(
      errorResponse("INTERNAL_SERVER_ERROR", "Failed to update note"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const deleteNote: AppRouteHandler<DeleteNoteRoute> = async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");

  try {
    const note = await getNoteForUser(id, user.id);

    if (!note) {
      return c.json(
        errorResponse("NOTE_NOT_FOUND", "Note not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    await db.delete(notes).where(eq(notes.id, id));

    return c.json(
      successResponse(note, "Note deleted successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    console.error("Error deleting note:", error);
    return c.json(
      errorResponse("INTERNAL_SERVER_ERROR", "Failed to delete note"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};
