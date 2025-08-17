import db, { eq } from "@repo/database";
import { notes } from "@repo/database/schemas/notes-schema";

import type { AppRouteHandler } from "@/lib/types";
import type { DeleteNoteRoute } from "@/routes/notes/notes.routes";
import { errorResponse, successResponse } from "@/utils/api-response";
import HttpStatusCodes from "@/utils/http-status-codes";
import type {
  CreateNoteRoute,
  GetSingleNoteRoute,
  ListNotesRoute,
  UpdateNoteRoute,
} from "./notes.routes";

export const getAllNotes: AppRouteHandler<ListNotesRoute> = async (c) => {
  const notes = await db.query.notes.findMany();

  return c.json(
    successResponse(notes, "Notes retrieved successfully"),
    HttpStatusCodes.OK,
  );
};

export const createNote: AppRouteHandler<CreateNoteRoute> = async (c) => {
  const noteData = c.req.valid("json");
  const [newNote] = await db.insert(notes).values(noteData).returning();

  return c.json(
    successResponse(newNote, "Note created successfully"),
    HttpStatusCodes.CREATED,
  );
};

export const getSingleNote: AppRouteHandler<GetSingleNoteRoute> = async (c) => {
  const { id } = c.req.valid("param");

  const note = await db.query.notes.findFirst({
    where: (notes, { eq }) => eq(notes.id, id),
  });

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

export const updateNote: AppRouteHandler<UpdateNoteRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const updateData = c.req.valid("json");

  const [note] = await db
    .update(notes)
    .set(updateData)
    .where(eq(notes.id, id))
    .returning();

  if (!note) {
    return c.json(
      errorResponse("NOT_FOUND", "Note not found"),
      HttpStatusCodes.NOT_FOUND,
    );
  }

  return c.json(
    successResponse(note, "Note updated successfully"),
    HttpStatusCodes.OK,
  );
};

export const deleteNote: AppRouteHandler<DeleteNoteRoute> = async (c) => {
  const { id } = c.req.valid("param");

  const result = await db.delete(notes).where(eq(notes.id, id));

  if (result.rowCount === 0) {
    return c.json(
      errorResponse("NOT_FOUND", "Note not found"),
      HttpStatusCodes.NOT_FOUND,
    );
  }

  return c.body(null, HttpStatusCodes.NO_CONTENT);
};
