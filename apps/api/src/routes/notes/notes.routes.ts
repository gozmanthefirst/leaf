import { createRoute, z } from "@hono/zod-openapi";
import {
  NotesInsertSchema,
  NotesSelectSchema,
  NotesUpdateSchema,
} from "@repo/database/validators/notes-validator";

import HttpStatusCodes from "@/utils/http-status-codes";
import { notesExamples } from "@/utils/openapi-examples";
import {
  createIdUUIDParamsSchema,
  errorContent,
  getErrDetailsFromErrFields,
  serverErrorContent,
  successContent,
} from "@/utils/openapi-helpers";

const tags = ["Notes"];

export const getAllNotes = createRoute({
  path: "/notes",
  method: "get",
  tags,
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "All notes retrieved",
      schema: z.array(NotesSelectSchema),
      resObj: {
        details: "All notes retrieved successfully",
        data: [notesExamples.note],
      },
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export const createNote = createRoute({
  path: "/notes",
  method: "post",
  tags,
  request: {
    body: {
      content: {
        "application/json": {
          schema: NotesInsertSchema,
        },
      },
      description: "Create a new note",
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.CREATED]: successContent({
      description: "Note created",
      schema: NotesSelectSchema,
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
          details: "title: Too small",
          fields: notesExamples.notesValErrs,
        },
      },
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export const getSingleNote = createRoute({
  path: "/notes/{id}",
  method: "get",
  request: {
    params: createIdUUIDParamsSchema("Note UUID"),
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "Note retrieved",
      schema: NotesSelectSchema,
      resObj: {
        details: "Note retrieved successfully",
        data: notesExamples.note,
      },
    }),
    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "Invalid request data",
      examples: {
        invalidId: {
          summary: "Invalid ID",
          code: "INVALID_DATA",
          details: "id: Invalid UUID",
          fields: { id: "Invalid UUID" },
        },
      },
    }),
    [HttpStatusCodes.NOT_FOUND]: errorContent({
      description: "Note not found",
      examples: {
        notFound: {
          summary: "Note not found",
          code: "NOT_FOUND",
          details: "Note not found",
        },
      },
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export const updateNote = createRoute({
  path: "/notes/{id}",
  method: "patch",
  request: {
    params: createIdUUIDParamsSchema("Note UUID"),
    body: {
      content: {
        "application/json": {
          schema: NotesUpdateSchema,
        },
      },
      description: "Update an existing note",
      required: true,
    },
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "Note updated",
      schema: NotesSelectSchema,
      resObj: {
        details: "Note updated successfully",
        data: { ...notesExamples.note, title: "Updated note" },
      },
    }),
    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "Invalid request data",
      examples: {
        validationError: {
          summary: "Validation error",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields(notesExamples.notesValErrs),
          fields: notesExamples.notesValErrs,
        },
        invalidId: {
          summary: "Invalid ID",
          code: "INVALID_DATA",
          details: "id: Invalid UUID",
          fields: { id: "Invalid UUID" },
        },
      },
    }),
    [HttpStatusCodes.NOT_FOUND]: errorContent({
      description: "Note not found",
      examples: {
        notFound: {
          summary: "Note not found",
          code: "NOT_FOUND",
          details: "Note not found",
        },
      },
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export const deleteNote = createRoute({
  path: "/notes/{id}",
  method: "delete",
  request: {
    params: createIdUUIDParamsSchema("Note UUID"),
  },
  tags,
  responses: {
    [HttpStatusCodes.NO_CONTENT]: {
      description: "Note deleted successfully",
    },
    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "Invalid request data",
      examples: {
        invalidId: {
          summary: "Invalid ID",
          code: "INVALID_DATA",
          details: "id: Invalid UUID",
          fields: { id: "Invalid UUID" },
        },
      },
    }),
    [HttpStatusCodes.NOT_FOUND]: errorContent({
      description: "Note not found",
      examples: {
        notFound: {
          summary: "Note not found",
          code: "NOT_FOUND",
          details: "Note not found",
        },
      },
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export type ListNotesRoute = typeof getAllNotes;
export type CreateNoteRoute = typeof createNote;
export type GetSingleNoteRoute = typeof getSingleNote;
export type UpdateNoteRoute = typeof updateNote;
export type DeleteNoteRoute = typeof deleteNote;
