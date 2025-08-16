import db, { eq } from "@repo/database";
import { notes } from "@repo/database/schema/notes-schema";

import type { AppRouteHandler } from "@/lib/types";
import { errorResponse, successResponse } from "@/utils/api-response";
import HttpStatusCodes from "@/utils/http-status-codes";
import type {
  CreateNoteRoute,
  GetSingleNoteRoute,
  ListNotesRoute,
  UpdateNoteRoute,
} from "./notes.routes";

export const getAllNotes: AppRouteHandler<ListNotesRoute> = async (c) => {
  try {
    const notes = await db.query.notes.findMany();

    return c.json(
      successResponse(notes, "Notes retrieved successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    console.error("Error retrieving all notes:", error);
    return c.json(
      errorResponse("SERVER_ERROR", "Error retrieving all notes"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const createNote: AppRouteHandler<CreateNoteRoute> = async (c) => {
  try {
    const noteData = c.req.valid("json");
    const [newNote] = await db.insert(notes).values(noteData).returning();

    return c.json(
      successResponse(newNote, "Note created successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    console.error("Error creating note:", error);
    return c.json(
      errorResponse("SERVER_ERROR", "Error creating note"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const getSingleNote: AppRouteHandler<GetSingleNoteRoute> = async (c) => {
  try {
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
  } catch (error) {
    console.error("Error retrieving note:", error);
    return c.json(
      errorResponse("SERVER_ERROR", "Error retrieving note"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const updateNote: AppRouteHandler<UpdateNoteRoute> = async (c) => {
  try {
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
  } catch (error) {
    console.error("Error updating note:", error);
    return c.json(
      errorResponse("SERVER_ERROR", "Error updating note"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};
