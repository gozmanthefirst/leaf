import type { FolderWithItems } from "@repo/database/validators/folders-validators";

import type { AppRouteHandler } from "@/lib/types";
import {
  getFolderWithNestedItems,
  getRootFolderWithNestedItems,
} from "@/queries/folders-queries";
import { errorResponse, successResponse } from "@/utils/api-response";
import HttpStatusCodes from "@/utils/http-status-codes";
import type { GetFolderWithItemsRoute } from "./folders.routes";

export const getFolderWithItems: AppRouteHandler<
  GetFolderWithItemsRoute
> = async (c) => {
  const user = c.get("user");
  const { folderId } = c.req.valid("query");

  let folderWithItems: FolderWithItems | null;

  if (folderId) {
    folderWithItems = await getFolderWithNestedItems(folderId, user.id);
  } else {
    folderWithItems = await getRootFolderWithNestedItems(user.id);
  }

  if (!folderWithItems) {
    return c.json(
      errorResponse(
        "NOT_FOUND",
        folderId ? "Folder not found" : "Root folder not found",
      ),
      HttpStatusCodes.NOT_FOUND,
    );
  }

  return c.json(
    successResponse(
      folderWithItems,
      folderId
        ? "Folder with items retrieved successfully"
        : "Root folder with items retrieved successfully",
    ),
    HttpStatusCodes.OK,
  );
};
