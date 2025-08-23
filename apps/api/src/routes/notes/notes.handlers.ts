import db from "@repo/database";
import { notes } from "@repo/database/schemas/notes-schema";

import type { AppRouteHandler } from "@/lib/types";
import { getFolderForUser } from "@/queries/folders-queries";
import { generateUniqueTitle, getNoteForUser } from "@/queries/notes-queries";
import type {
  CopyNoteRoute,
  GetSingleNoteRoute,
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

  const uniqueTitle = await generateUniqueTitle(
    noteData.title || "untitled",
    user.id,
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

  const uniqueTitle = await generateUniqueTitle(
    noteToBeCopied.title || "untitled",
    user.id,
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
