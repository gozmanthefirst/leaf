import { createRoute, z } from "@hono/zod-openapi";
import {
  NoteInsertSchema,
  NoteSelectSchema,
} from "@repo/database/validators/notes-validators";

import HttpStatusCodes from "@/utils/http-status-codes";
import { notesExamples } from "@/utils/openapi-examples";
import {
  errorContent,
  genericErrorContent,
  getErrDetailsFromErrFields,
  serverErrorContent,
  successContent,
} from "@/utils/openapi-helpers";

const tags = ["Notes"];

export const getAllNotes = createRoute({
  path: "/notes",
  method: "get",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "All notes retrieved",
      schema: z.array(NoteSelectSchema),
      resObj: {
        details: "All notes retrieved successfully",
        data: [notesExamples.note],
      },
    }),
    [HttpStatusCodes.UNAUTHORIZED]: genericErrorContent(
      "UNAUTHORIZED",
      "Unauthorized",
      "No session found",
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export const createNote = createRoute({
  path: "/notes",
  method: "post",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  request: {
    body: {
      content: {
        "application/json": {
          schema: NoteInsertSchema,
        },
      },
      description: "Create a new note",
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.CREATED]: successContent({
      description: "Note created",
      schema: NoteSelectSchema,
      resObj: {
        details: "Note created successfully",
        data: { ...notesExamples.note, title: "New note" },
      },
    }),
    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "Invalid request data",
      examples: {
        validationError: {
          summary: "Validation error",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields(notesExamples.createNoteValErrs),
          fields: notesExamples.createNoteValErrs,
        },
      },
    }),
    [HttpStatusCodes.UNAUTHORIZED]: genericErrorContent(
      "UNAUTHORIZED",
      "Unauthorized",
      "No session found",
    ),
    [HttpStatusCodes.NOT_FOUND]: genericErrorContent(
      "NOT_FOUND",
      "Folder not found",
      "Folder not found",
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
      "Too many requests have been made. Please try again later.",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export type GetAllNotesRoute = typeof getAllNotes;
export type CreateNoteRoute = typeof createNote;
