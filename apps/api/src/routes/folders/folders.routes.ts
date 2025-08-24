import { createRoute } from "@hono/zod-openapi";
import { FolderWithItemsSchema } from "@repo/database/validators/folders-validators";

import HttpStatusCodes from "@/utils/http-status-codes";
import { foldersExamples } from "@/utils/openapi-examples";
import {
  createIdUUIDParamsSchema,
  genericErrorContent,
  serverErrorContent,
  successContent,
} from "@/utils/openapi-helpers";

const tags = ["Folders"];

export const getFolderWithItems = createRoute({
  path: "/folders/{id}",
  method: "get",
  security: [
    {
      Bearer: [],
    },
  ],
  tags,
  request: {
    params: createIdUUIDParamsSchema("Folder ID"),
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

export type GetFolderWithItemsRoute = typeof getFolderWithItems;
