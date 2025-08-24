import type { AppRouteHandler } from "@/lib/types";
import { getFolderWithNestedItems } from "@/queries/folders-queries";
import { errorResponse, successResponse } from "@/utils/api-response";
import HttpStatusCodes from "@/utils/http-status-codes";
import type { GetFolderWithItemsRoute } from "./folders.routes";

export const getFolderWithItems: AppRouteHandler<
  GetFolderWithItemsRoute
> = async (c) => {
  const user = c.get("user");
  const { id: folderId } = c.req.valid("param");

  const folderWithItems = await getFolderWithNestedItems(folderId, user.id);

  if (!folderWithItems) {
    return c.json(
      errorResponse("NOT_FOUND", "Folder not found"),
      HttpStatusCodes.NOT_FOUND,
    );
  }

  return c.json(
    successResponse(
      folderWithItems,
      "Folder with items retrieved successfully",
    ),
    HttpStatusCodes.OK,
  );
};
