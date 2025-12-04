import { createRoute, z } from "@hono/zod-openapi";
import {
  FolderChildrenResponseSchema,
  FolderInsertSchema,
  FolderSelectSchema,
  FolderUpdateSchema,
  FolderWithItemsSchema,
} from "@repo/db/validators/folder.validator";

import HttpStatusCodes from "@/utils/http-status-codes";
import { authExamples, foldersExamples } from "@/utils/openapi-examples";
import {
  createIdUUIDParamsSchema,
  errorContent,
  genericErrorContent,
  getErrDetailsFromErrFields,
  serverErrorContent,
  successContent,
} from "@/utils/openapi-helpers";

const tags = ["Folders"];

export const getFolderWithItems = createRoute({
  path: "/folders",
  method: "get",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  description: "Get a folder with its items",
  request: {
    query: z.object({
      folderId: z
        .uuid()
        .optional()
        .openapi({
          param: {
            name: "folderId",
            in: "query",
            required: false,
            description: "Folder ID. If not provided, returns the root folder.",
          },
          example: "123e4567-e89b-12d3-a456-426614174000",
        }),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "Folder with items retrieved",
      schema: FolderWithItemsSchema,
      resObj: {
        details: "Folder with items retrieved successfully",
        data: foldersExamples.folderWithItems,
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

export const createFolder = createRoute({
  path: "/folders",
  method: "post",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  description: "Create a new folder",
  request: {
    body: {
      content: {
        "application/json": {
          schema: FolderInsertSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.CREATED]: successContent({
      description: "Folder created successfully",
      schema: FolderSelectSchema,
      resObj: {
        details: "Folder created successfully",
        data: { ...foldersExamples.folder, isRoot: false },
      },
    }),
    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "Invalid request data",
      examples: {
        validationError: {
          summary: "Validation error",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields(
            foldersExamples.createFolderValErrs,
          ),
          fields: foldersExamples.createFolderValErrs,
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
      "Parent folder not found",
      "Parent folder not found",
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
      "Too many requests have been made. Please try again later.",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export const moveFolder = createRoute({
  path: "/folders/{id}/move",
  method: "patch",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  description: "Move folder to another parent folder",
  request: {
    params: createIdUUIDParamsSchema("Folder ID"),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            parentFolderId: z.uuid().openapi({
              description: "Destination parent folder ID",
              example: "123e4567-e89b-12d3-a456-426614174001",
            }),
          }),
        },
      },
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "Folder moved",
      schema: FolderSelectSchema,
      resObj: {
        details: "Folder moved successfully",
        data: foldersExamples.folder,
      },
    }),
    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "Invalid request data",
      examples: {
        invalidFolderUUID: {
          summary: "Invalid folder ID",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields(authExamples.uuidValErr),
          fields: authExamples.uuidValErr,
        },
        invalidParentUUID: {
          summary: "Invalid parent folder ID",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields({
            parentFolderId: "Invalid UUID",
          }),
          fields: { parentFolderId: "Invalid UUID" },
        },
      },
    }),
    [HttpStatusCodes.UNAUTHORIZED]: genericErrorContent(
      "UNAUTHORIZED",
      "Unauthorized",
      "No session found",
    ),
    [HttpStatusCodes.NOT_FOUND]: errorContent({
      description: "Folder or parent folder not found",
      examples: {
        folderNotFound: {
          summary: "Folder not found",
          code: "FOLDER_NOT_FOUND",
          details: "Folder not found",
        },
        parentNotFound: {
          summary: "Parent folder not found",
          code: "PARENT_FOLDER_NOT_FOUND",
          details: "Parent folder not found",
        },
      },
    }),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: errorContent({
      description: "Cannot move root folder or create cycles",
      examples: {
        rootFolder: {
          summary: "Root folder cannot be moved",
          code: "ROOT_FOLDER",
          details: "Root folder cannot be moved",
        },
        folderCycle: {
          summary: "Folder cycle detected",
          code: "FOLDER_CYCLE",
          details: "Cannot move a folder into its own descendant or itself",
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

export const updateFolder = createRoute({
  path: "/folders/{id}",
  method: "put",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  description: "Update an existing folder",
  request: {
    params: createIdUUIDParamsSchema("Folder ID"),
    body: {
      content: {
        "application/json": {
          schema: FolderUpdateSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "Folder updated successfully",
      schema: FolderSelectSchema,
      resObj: {
        details: "Folder updated successfully",
        data: { ...foldersExamples.folder, isRoot: false },
      },
    }),
    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "Invalid request data",
      examples: {
        invalidFolderUUID: {
          summary: "Invalid folder ID",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields(authExamples.uuidValErr),
          fields: authExamples.uuidValErr,
        },
        validationError: {
          summary: "Validation error",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields(
            foldersExamples.createFolderValErrs,
          ),
          fields: foldersExamples.createFolderValErrs,
        },
      },
    }),
    [HttpStatusCodes.UNAUTHORIZED]: genericErrorContent(
      "UNAUTHORIZED",
      "Unauthorized",
      "No session found",
    ),
    [HttpStatusCodes.NOT_FOUND]: errorContent({
      description: "Folder or parent folder not found",
      examples: {
        folderNotFound: {
          summary: "Folder not found",
          code: "FOLDER_NOT_FOUND",
          details: "Folder not found",
        },
        parentNotFound: {
          summary: "Parent folder not found",
          code: "PARENT_FOLDER_NOT_FOUND",
          details: "Parent folder not found",
        },
      },
    }),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: errorContent({
      description: "Cannot update root folder or create cycles",
      examples: {
        rootFolder: {
          summary: "Root folder cannot be updated",
          code: "ROOT_FOLDER",
          details: "Root folder cannot be updated",
        },
        folderCycle: {
          summary: "Folder cycle detected",
          code: "FOLDER_CYCLE",
          details: "Cannot move a folder into its own descendant or itself",
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

export const deleteFolder = createRoute({
  path: "/folders/{id}",
  method: "delete",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  description: "Delete a folder",
  request: {
    params: createIdUUIDParamsSchema("Folder ID"),
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "Folder deleted",
      schema: FolderSelectSchema,
      resObj: {
        details: "Folder deleted successfully",
        data: foldersExamples.folder,
      },
    }),
    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "Invalid request data",
      examples: {
        invalidFolderUUID: {
          summary: "Invalid folder ID",
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
    [HttpStatusCodes.NOT_FOUND]: errorContent({
      description: "Folder not found",
      examples: {
        folderNotFound: {
          summary: "Folder not found",
          code: "NOT_FOUND",
          details: "Folder not found",
        },
      },
    }),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: errorContent({
      description: "Cannot delete root folder",
      examples: {
        rootFolder: {
          summary: "Root folder cannot be deleted",
          code: "ROOT_FOLDER",
          details: "Root folder cannot be deleted",
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

// Route for getting folder children (lazy loading)
export const getFolderChildren = createRoute({
  path: "/folders/{id}/children",
  method: "get",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  description:
    "Get direct children of a folder (folders and notes) with hasChildren hints for lazy loading",
  request: {
    params: createIdUUIDParamsSchema("Folder ID"),
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "Folder children retrieved",
      schema: FolderChildrenResponseSchema,
      resObj: {
        details: "Folder children retrieved successfully",
        data: {
          folders: [{ ...foldersExamples.folder, hasChildren: true }],
          notes: [],
        },
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

// Route for creating root folder (called from Better Auth hook)
export const createRootFolder = createRoute({
  path: "/folders/root",
  method: "post",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  description: "Create root folder for authenticated user (used by auth hook)",
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "Root folder already exists",
      schema: FolderSelectSchema,
      resObj: {
        details: "Root folder already exists",
        data: { ...foldersExamples.folder, isRoot: true },
      },
    }),
    [HttpStatusCodes.CREATED]: successContent({
      description: "Root folder created successfully",
      schema: FolderSelectSchema,
      resObj: {
        details: "Root folder created successfully",
        data: { ...foldersExamples.folder, isRoot: true },
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

export type GetFolderWithItemsRoute = typeof getFolderWithItems;
export type GetFolderChildrenRoute = typeof getFolderChildren;
export type CreateFolderRoute = typeof createFolder;
export type CreateRootFolderRoute = typeof createRootFolder;
export type MoveFolderRoute = typeof moveFolder;
export type UpdateFolderRoute = typeof updateFolder;
export type DeleteFolderRoute = typeof deleteFolder;
