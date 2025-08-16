import { createRoute, z } from "@hono/zod-openapi";
import {
  NotesInsertSchema,
  NotesSelectSchema,
  NotesUpdateSchema,
} from "@repo/database/schema/notes-schema";

import HttpStatusCodes from "@/utils/http-status-codes";
import {
  createErrorSchema,
  createIdUUIDParamsSchema,
  createSuccessSchema,
  jsonContentRequired,
} from "@/utils/openapi-helpers";

const tags = ["Notes"];

export const getAllNotes = createRoute({
  path: "/notes",
  method: "get",
  tags,
  responses: {
    [HttpStatusCodes.OK]: {
      description: "All notes retrieved",
      content: {
        "application/json": {
          schema: createSuccessSchema(z.array(NotesSelectSchema)),
          examples: {
            success: {
              summary: "Notes retrieval successful",
              value: {
                status: "success",
                details: "All notes retrieved successfully",
                data: [
                  {
                    id: "123e4567-e89b-12d3-a456-426614174000",
                    title: "An untitled note",
                    content: "This is the content of the note with no title.",
                    createdAt: "2025-08-11T18:26:20.296Z",
                    updatedAt: "2025-08-11T18:26:20.296Z",
                  },
                ],
              },
            },
          },
        },
      },
    },
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: {
      description: "Server error",
      content: {
        "application/json": {
          schema: createErrorSchema(),
          examples: {
            error: {
              summary: "Server error",
              value: {
                status: "error",
                error: {
                  code: "SERVER_ERROR",
                  details: "Error retrieving all notes",
                  fields: {},
                },
              },
            },
          },
        },
      },
    },
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
    [HttpStatusCodes.OK]: {
      description: "Note created",
      content: {
        "application/json": {
          schema: createSuccessSchema(NotesSelectSchema),
          examples: {
            success: {
              summary: "Notes creation successful",
              value: {
                status: "success",
                details: "Note created successfully",
                data: {
                  id: "123e4567-e89b-12d3-a456-426614174000",
                  title: "New note",
                  content: "This is the content of the new note.",
                  createdAt: "2025-08-11T18:26:20.296Z",
                  updatedAt: "2025-08-11T18:26:20.296Z",
                },
              },
            },
          },
        },
      },
    },
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: {
      description: "Invalid request data",
      content: {
        "application/json": {
          schema: createErrorSchema(),
          examples: {
            error: {
              summary: "Invalid request data",
              value: {
                status: "error",
                error: {
                  code: "INVALID_DATA",
                  details:
                    "title: Too small: expected string to have >=1 characters",
                  fields: {
                    title: "Too small: expected string to have >=1 characters",
                    content:
                      "Too small: expected string to have >=1 characters",
                  },
                },
              },
            },
          },
        },
      },
    },
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: {
      description: "Server error",
      content: {
        "application/json": {
          schema: createErrorSchema(),
          examples: {
            error: {
              summary: "Server error",
              value: {
                status: "error",
                error: {
                  code: "SERVER_ERROR",
                  details: "Error creating note",
                  fields: {},
                },
              },
            },
          },
        },
      },
    },
  },
});

export const getSingleNote = createRoute({
  path: "/notes/{id}",
  method: "get",
  request: {
    params: createIdUUIDParamsSchema("The unique ID of the note"),
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: {
      description: "Note retrieved",
      content: {
        "application/json": {
          schema: createSuccessSchema(NotesSelectSchema),
          examples: {
            success: {
              summary: "Note retrieval successful",
              value: {
                status: "success",
                details: "Note retrieved successfully",
                data: {
                  id: "123e4567-e89b-12d3-a456-426614174000",
                  title: "An untitled note",
                  content: "This is the content of the note with no title.",
                  createdAt: "2025-08-11T18:26:20.296Z",
                  updatedAt: "2025-08-11T18:26:20.296Z",
                },
              },
            },
          },
        },
      },
    },
    [HttpStatusCodes.NOT_FOUND]: {
      description: "Note not found",
      content: {
        "application/json": {
          schema: createErrorSchema(),
          examples: {
            error: {
              summary: "Note not found",
              value: {
                status: "error",
                error: {
                  code: "NOT_FOUND",
                  details: "Note not found",
                  fields: {},
                },
              },
            },
          },
        },
      },
    },
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: {
      description: "Invalid request data",
      content: {
        "application/json": {
          schema: createErrorSchema(),
          examples: {
            error: {
              summary: "Invalid ID",
              value: {
                status: "error",
                error: {
                  code: "INVALID_DATA",
                  details: "id: Invalid UUID",
                  fields: {
                    id: "Invalid UUID",
                  },
                },
              },
            },
          },
        },
      },
    },
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: {
      description: "Server error",
      content: {
        "application/json": {
          schema: createErrorSchema(),
          examples: {
            error: {
              summary: "Server error",
              value: {
                status: "error",
                error: {
                  code: "SERVER_ERROR",
                  details: "Error retrieving note",
                  fields: {},
                },
              },
            },
          },
        },
      },
    },
  },
});

export const updateNote = createRoute({
  path: "/notes/{id}",
  method: "patch",
  request: {
    params: createIdUUIDParamsSchema("The unique ID of the note"),
    body: jsonContentRequired(NotesUpdateSchema, "Update note"),
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: {
      description: "Note updated",
      content: {
        "application/json": {
          schema: createSuccessSchema(NotesSelectSchema),
          examples: {
            success: {
              summary: "Note update successful",
              value: {
                status: "success",
                details: "Note updated successfully",
                data: {
                  id: "123e4567-e89b-12d3-a456-426614174000",
                  title: "An updated note",
                  content: "This is the content of the updated note.",
                  createdAt: "2025-08-11T18:26:20.296Z",
                  updatedAt: "2025-08-11T18:26:20.296Z",
                },
              },
            },
          },
        },
      },
    },
    [HttpStatusCodes.NOT_FOUND]: {
      description: "Note not found",
      content: {
        "application/json": {
          schema: createErrorSchema(),
          examples: {
            error: {
              summary: "Note not found",
              value: {
                status: "error",
                error: {
                  code: "NOT_FOUND",
                  details: "Note not found",
                  fields: {},
                },
              },
            },
          },
        },
      },
    },
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: {
      description: "Unprocessable Entity",
      content: {
        "application/json": {
          schema: createErrorSchema(),
          examples: {
            invalidId: {
              summary: "Invalid ID",
              value: {
                status: "error",
                error: {
                  code: "INVALID_DATA",
                  details: "id: Invalid UUID",
                  fields: {
                    id: "Invalid UUID",
                  },
                },
              },
            },
            invalidData: {
              summary: "Invalid request data",
              value: {
                status: "error",
                error: {
                  code: "INVALID_DATA",
                  details:
                    "title: Too small: expected string to have >=1 characters",
                  fields: {
                    title: "Too small: expected string to have >=1 characters",
                    content:
                      "Too small: expected string to have >=1 characters",
                  },
                },
              },
            },
          },
        },
      },
    },
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: {
      description: "Server error",
      content: {
        "application/json": {
          schema: createErrorSchema(),
          examples: {
            error: {
              summary: "Server error",
              value: {
                status: "error",
                error: {
                  code: "SERVER_ERROR",
                  details: "Error updating note",
                  fields: {},
                },
              },
            },
          },
        },
      },
    },
  },
});

export type ListNotesRoute = typeof getAllNotes;
export type CreateNoteRoute = typeof createNote;
export type GetSingleNoteRoute = typeof getSingleNote;
export type UpdateNoteRoute = typeof updateNote;
