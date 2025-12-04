import { createRoute, z } from "@hono/zod-openapi";
import {
  EncryptedNoteSelectSchema,
  NoteInsertSchema,
  NoteSelectSchema,
  NoteUpdateSchema,
} from "@repo/db/validators/note.validator";

import HttpStatusCodes from "@/utils/http-status-codes";
import { authExamples, notesExamples } from "@/utils/openapi-examples";
import {
  createIdUUIDParamsSchema,
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
  description: "Get all notes for the current user",
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "All notes retrieved",
      schema: z.array(EncryptedNoteSelectSchema),
      resObj: {
        details: "All notes retrieved successfully",
        data: [notesExamples.encryptedNote],
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
      "Too many requests have been made. Please try again later.",
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
  description: "Create a new note",
  request: {
    body: {
      content: {
        "application/json": {
          schema: NoteInsertSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.CREATED]: successContent({
      description: "Note created",
      schema: EncryptedNoteSelectSchema,
      resObj: {
        details: "Note created successfully",
        data: { ...notesExamples.encryptedNote, title: "New note" },
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
    [HttpStatusCodes.CONTENT_TOO_LARGE]: genericErrorContent(
      "PAYLOAD_TOO_LARGE",
      "Payload too large",
      "Note content exceeds 2MB limit",
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
      "Too many requests have been made. Please try again later.",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export const getSingleNote = createRoute({
  path: "/notes/{id}",
  method: "get",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  description: "Get a single note for the current user",
  request: {
    params: createIdUUIDParamsSchema("Note ID"),
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "Note retrieved",
      schema: NoteSelectSchema,
      resObj: {
        details: "Note retrieved successfully",
        data: notesExamples.note,
      },
    }),
    [HttpStatusCodes.NOT_MODIFIED]: {
      description: "Note not modified",
    },
    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "Invalid request data",
      examples: {
        validationError: {
          summary: "Validation error",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields(authExamples.uuidValErr),
          fields: authExamples.uuidValErr,
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
      "Note not found",
      "Note not found",
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
      "Too many requests have been made. Please try again later.",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export const copyNote = createRoute({
  path: "/notes/{id}/copy",
  method: "get",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  description: "Make a copy of a note",
  request: {
    params: createIdUUIDParamsSchema("Note ID"),
  },
  responses: {
    [HttpStatusCodes.CREATED]: successContent({
      description: "Note copied",
      schema: EncryptedNoteSelectSchema,
      resObj: {
        details: "Note copied successfully",
        data: notesExamples.encryptedNote,
      },
    }),
    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "Invalid request data",
      examples: {
        validationError: {
          summary: "Validation error",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields(authExamples.uuidValErr),
          fields: authExamples.uuidValErr,
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
      "Note not found",
      "Note not found",
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
      "Too many requests have been made. Please try again later.",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export const toggleNoteFavorite = createRoute({
  path: "/notes/{id}/favorite",
  method: "patch",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  description: "Favorite or unfavorite a note",
  request: {
    params: createIdUUIDParamsSchema("Note ID"),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            favorite: z.boolean().openapi({
              description: "Set to true to favorite, false to unfavorite",
              example: true,
            }),
          }),
        },
      },
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "Note favorite state updated",
      schema: EncryptedNoteSelectSchema,
      resObj: {
        details: "Note favorite state updated successfully",
        data: { ...notesExamples.encryptedNote, isFavorite: true },
      },
    }),
    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "Invalid request data",
      examples: {
        invalidUUID: {
          summary: "Invalid note ID",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields(authExamples.uuidValErr),
          fields: authExamples.uuidValErr,
        },
        invalidInput: {
          summary: "Invalid request data",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields(
            notesExamples.favoriteNoteValErrs,
          ),
          fields: notesExamples.favoriteNoteValErrs,
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
      "Note not found",
      "Note not found",
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
      "Too many requests have been made. Please try again later.",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export const moveNote = createRoute({
  path: "/notes/{id}/move",
  method: "patch",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  description: "Move note to another folder",
  request: {
    params: createIdUUIDParamsSchema("Note ID"),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            folderId: z.uuid().openapi({
              description: "Destination folder ID",
              example: "123e4567-e89b-12d3-a456-426614174000",
            }),
          }),
        },
      },
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "Note moved",
      schema: EncryptedNoteSelectSchema,
      resObj: {
        details: "Note moved successfully",
        data: notesExamples.encryptedNote,
      },
    }),
    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "Invalid request data",
      examples: {
        invalidNoteUUID: {
          summary: "Invalid note ID",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields(authExamples.uuidValErr),
          fields: authExamples.uuidValErr,
        },
        invalidFolderUUID: {
          summary: "Invalid folder ID",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields({
            folderId: authExamples.uuidValErr.id,
          }),
          fields: { folderId: authExamples.uuidValErr.id },
        },
      },
    }),
    [HttpStatusCodes.UNAUTHORIZED]: genericErrorContent(
      "UNAUTHORIZED",
      "Unauthorized",
      "No session found",
    ),
    [HttpStatusCodes.NOT_FOUND]: errorContent({
      description: "Note or folder not found",
      examples: {
        noteNotFound: {
          summary: "Note not found",
          code: "NOTE_NOT_FOUND",
          details: "Note not found",
        },
        folderNotFound: {
          summary: "Folder not found",
          code: "FOLDER_NOT_FOUND",
          details: "Folder not found",
        },
      },
    }),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
      "Too many requests have been made. Please try again later.",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export const updateNote = createRoute({
  path: "/notes/{id}",
  method: "put",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  description: "Update all editable fields of a note",
  request: {
    params: createIdUUIDParamsSchema("Note ID"),
    body: {
      content: {
        "application/json": {
          schema: NoteUpdateSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "Note updated",
      schema: NoteSelectSchema,
      resObj: {
        details: "Note updated successfully",
        data: { ...notesExamples.note, title: "Updated note" },
      },
    }),
    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "Invalid request data",
      examples: {
        invalidNoteUUID: {
          summary: "Invalid note ID",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields(authExamples.uuidValErr),
          fields: authExamples.uuidValErr,
        },
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
    [HttpStatusCodes.NOT_FOUND]: errorContent({
      description: "Note or folder not found",
      examples: {
        noteNotFound: {
          summary: "Note not found",
          code: "NOTE_NOT_FOUND",
          details: "Note not found",
        },
        folderNotFound: {
          summary: "Folder not found",
          code: "FOLDER_NOT_FOUND",
          details: "Folder not found",
        },
      },
    }),
    [HttpStatusCodes.PRECONDITION_FAILED]: genericErrorContent(
      "PRECONDITION_FAILED",
      "Note was modified",
      "Note was modified by another request. Please refresh and try again.",
    ),
    [HttpStatusCodes.CONTENT_TOO_LARGE]: genericErrorContent(
      "PAYLOAD_TOO_LARGE",
      "Payload too large",
      "Note content exceeds 2MB limit",
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
      "Too many requests have been made. Please try again later.",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export const deleteNote = createRoute({
  path: "/notes/{id}",
  method: "delete",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  description: "Delete a note",
  request: {
    params: createIdUUIDParamsSchema("Note ID"),
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "Note deleted",
      schema: EncryptedNoteSelectSchema,
      resObj: {
        details: "Note deleted successfully",
        data: notesExamples.encryptedNote,
      },
    }),
    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "Invalid request data",
      examples: {
        invalidUUID: {
          summary: "Invalid note ID",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields(authExamples.uuidValErr),
          fields: authExamples.uuidValErr,
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
      "Note not found",
      "Note not found",
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
export type GetSingleNoteRoute = typeof getSingleNote;
export type CopyNoteRoute = typeof copyNote;
export type ToggleNoteFavoriteRoute = typeof toggleNoteFavorite;
export type MoveNoteRoute = typeof moveNote;
export type DeleteNoteRoute = typeof deleteNote;
export type UpdateNoteRoute = typeof updateNote;
