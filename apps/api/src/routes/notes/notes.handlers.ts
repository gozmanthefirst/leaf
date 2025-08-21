import db from "@repo/database";
import { notes } from "@repo/database/schemas/notes-schema";

import type { AppRouteHandler } from "@/lib/types";
import { getFolderForUser } from "@/queries/folders";
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

  const payload = { ...noteData, userId: user.id };

  const [newNote] = await db.insert(notes).values(payload).returning();

  return c.json(
    successResponse(newNote, "Note created successfully"),
    HttpStatusCodes.CREATED,
  );
};
