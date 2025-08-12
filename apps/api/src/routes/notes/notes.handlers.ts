import db from "@repo/database";
import { notes } from "@repo/database/schema/notes-schema";

import type { AppRouteHandler } from "@/lib/types";
import { errorResponse, successResponse } from "@/utils/api-response";
import HttpStatusCodes from "@/utils/http-status-codes";
import type {
  CreateNoteRoute,
  GetSingleNoteRoute,
  ListNotesRoute,
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
    HttpStatusCodes.OK,
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
