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
  ToggleNoteArchiveRoute,
  ToggleNoteFavoriteRoute,
  UpdateNoteRoute,
} from "@/routes/notes/notes.routes";
import { errorResponse, successResponse } from "@/utils/api-response";
import HttpStatusCodes from "@/utils/http-status-codes";
import type { CreateNoteRoute, GetAllNotesRoute } from "./notes.routes";

export const getAllNotes: AppRouteHandler<GetAllNotesRoute> = async (c) => {
  const notes = await db.query.notes.findMany();

  return c.json(
    successResponse(notes, "All notes retrieved successfully"),
    HttpStatusCodes.OK,
  );
};

export const createNote: AppRouteHandler<CreateNoteRoute> = async (c) => {
  const user = c.get("user");
  const noteData = c.req.valid("json");

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

  const payload = { ...noteData, userId: user.id, title: uniqueTitle };

  const [newNote] = await db.insert(notes).values(payload).returning();

  return c.json(
    successResponse(newNote, "Note created successfully"),
    HttpStatusCodes.CREATED,
  );
};

export const getSingleNote: AppRouteHandler<GetSingleNoteRoute> = async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");

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
};

export const copyNote: AppRouteHandler<CopyNoteRoute> = async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");

  const noteToBeCopied = await getNoteForUser(id, user.id);

  // Check if the note exists
  if (!noteToBeCopied) {
    return c.json(
      errorResponse("NOTE_NOT_FOUND", "Note not found"),
      HttpStatusCodes.NOT_FOUND,
    );
  }

  // Check if the note is archived
  if (noteToBeCopied.isArchived) {
    return c.json(
      errorResponse("ARCHIVED_NOTE", "Archived notes cannot be copied"),
      HttpStatusCodes.UNPROCESSABLE_ENTITY,
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
    isArchived: false,
    isFavorite: false,
    tags: noteToBeCopied.tags,
  };

  const [copiedNote] = await db.insert(notes).values(payload).returning();

  return c.json(
    successResponse(copiedNote, "Note copied successfully"),
    HttpStatusCodes.CREATED,
  );
};

export const toggleNoteArchive: AppRouteHandler<
  ToggleNoteArchiveRoute
> = async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const { archived } = c.req.valid("json");

  const note = await getNoteForUser(id, user.id);

  if (!note) {
    return c.json(
      errorResponse("NOT_FOUND", "Note not found"),
      HttpStatusCodes.NOT_FOUND,
    );
  }

  const updateData: Partial<typeof notes.$inferInsert> = {
    isArchived: archived,
  };

  if (archived) {
    updateData.isFavorite = false;
  }

  const [updatedNote] = await db
    .update(notes)
    .set(updateData)
    .where(eq(notes.id, id))
    .returning();

  return c.json(
    successResponse(updatedNote, "Note archive state updated successfully"),
    HttpStatusCodes.OK,
  );
};

export const toggleNoteFavorite: AppRouteHandler<
  ToggleNoteFavoriteRoute
> = async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const { favorite } = c.req.valid("json");

  const note = await getNoteForUser(id, user.id);

  if (!note) {
    return c.json(
      errorResponse("NOT_FOUND", "Note not found"),
      HttpStatusCodes.NOT_FOUND,
    );
  }

  if (note.isArchived) {
    return c.json(
      errorResponse("ARCHIVED_NOTE", "Archived notes cannot be favorited"),
      HttpStatusCodes.UNPROCESSABLE_ENTITY,
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
};

export const moveNote: AppRouteHandler<MoveNoteRoute> = async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const { folderId } = c.req.valid("json");

  const note = await getNoteForUser(id, user.id);

  if (!note) {
    return c.json(
      errorResponse("NOTE_NOT_FOUND", "Note not found"),
      HttpStatusCodes.NOT_FOUND,
    );
  }

  if (note.isArchived) {
    return c.json(
      errorResponse("ARCHIVED_NOTE", "Archived notes cannot be moved"),
      HttpStatusCodes.UNPROCESSABLE_ENTITY,
    );
  }

  // Check if destination folder exists for user
  const folder = await getFolderForUser(folderId, user.id);
  if (!folder) {
    return c.json(
      errorResponse("FOLDER_NOT_FOUND", "Folder not found"),
      HttpStatusCodes.NOT_FOUND,
    );
  }

  // Ensure unique title in destination folder
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
};

export const updateNote: AppRouteHandler<UpdateNoteRoute> = async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const noteData = c.req.valid("json");

  const note = await getNoteForUser(id, user.id);

  if (!note) {
    return c.json(
      errorResponse("NOTE_NOT_FOUND", "Note not found"),
      HttpStatusCodes.NOT_FOUND,
    );
  }

  // If folderId is being updated, check folder existence
  const folderId = noteData.folderId ?? note.folderId;
  if (folderId !== note.folderId) {
    const folder = await getFolderForUser(folderId, user.id);
    if (!folder) {
      return c.json(
        errorResponse("FOLDER_NOT_FOUND", "Folder not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }
  }

  // If moving to a new folder, ensure unique title in that folder
  let title = noteData.title ?? note.title;
  if (folderId !== note.folderId || title !== note.title) {
    title = await generateUniqueNoteTitle(title, user.id, folderId);
  }

  // If trying to favorite or move an archived note, block
  if (
    note.isArchived &&
    (noteData.isFavorite === true || folderId !== note.folderId)
  ) {
    return c.json(
      errorResponse(
        "ARCHIVED_NOTE",
        "Archived notes cannot be moved or favorited",
      ),
      HttpStatusCodes.UNPROCESSABLE_ENTITY,
    );
  }

  // If archiving, set isFavorite to false
  let isFavorite = noteData.isFavorite ?? note.isFavorite;
  if (noteData.isArchived === true) {
    isFavorite = false;
  }

  const [updatedNote] = await db
    .update(notes)
    .set({
      ...noteData,
      folderId,
      title,
      isFavorite,
    })
    .where(eq(notes.id, id))
    .returning();

  return c.json(
    successResponse(updatedNote, "Note updated successfully"),
    HttpStatusCodes.OK,
  );
};

export const deleteNote: AppRouteHandler<DeleteNoteRoute> = async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");

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
};
