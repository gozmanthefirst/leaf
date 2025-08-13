import { createRoute, z } from "@hono/zod-openapi";
import {
  NotesInsertSchema,
  NotesSelectSchema,
} from "@repo/database/schema/notes-schema";

import HttpStatusCodes from "@/utils/http-status-codes";
import {
  create422ErrorSchema,
  createErrorSchema,
  createSuccessSchema,
  IdUUIDParamsSchema,
  jsonContent,
  jsonContentRequired,
} from "@/utils/openapi-helpers";

const tags = ["Notes"];

export const getAllNotes = createRoute({
  path: "/notes",
  method: "get",
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      createSuccessSchema(z.array(NotesSelectSchema)),
      "All notes retrieved",
    ),
  },
});

export const createNote = createRoute({
  path: "/notes",
  method: "post",
  request: {
    body: jsonContentRequired(NotesInsertSchema, "Create new note"),
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      createSuccessSchema(NotesSelectSchema),
      "Note created",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      create422ErrorSchema(NotesInsertSchema),
      "Invalid request data",
    ),
  },
});

export const getSingleNote = createRoute({
  path: "/notes/{id}",
  method: "get",
  request: {
    params: IdUUIDParamsSchema,
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      createSuccessSchema(NotesSelectSchema),
      "Note retrieved",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      createErrorSchema({
        status: "error",
        error: {
          code: "NOT_FOUND",
          details: "Note not found",
          fields: {},
        },
      }),
      "Note not found",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      create422ErrorSchema(IdUUIDParamsSchema, [
        {
          code: "INVALID_DATA",
          details: "id: Invalid UUID",
          fields: {
            id: "Invalid UUID",
          },
        },
      ]),
      "Invalid request data",
    ),
  },
});

export type ListNotesRoute = typeof getAllNotes;
export type CreateNoteRoute = typeof createNote;
export type GetSingleNoteRoute = typeof getSingleNote;
