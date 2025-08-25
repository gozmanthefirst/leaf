import { createRoute, z } from "@hono/zod-openapi";
import {
  FolderInsertSchema,
  FolderSelectSchema,
  FolderWithItemsSchema,
} from "@repo/database/validators/folders-validators";

import HttpStatusCodes from "@/utils/http-status-codes";
import { authExamples, foldersExamples } from "@/utils/openapi-examples";
import {
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
  request: {
    body: {
      content: {
        "application/json": {
          schema: FolderInsertSchema,
        },
      },
      description: "Create a new folder",
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

export type GetFolderWithItemsRoute = typeof getFolderWithItems;
export type CreateFolderRoute = typeof createFolder;
