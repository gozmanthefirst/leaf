import db from "@repo/database";
import { folders } from "@repo/database/schemas/folders-schema";
import type { FolderWithItems } from "@repo/database/validators/folders-validators";

import type { AppRouteHandler } from "@/lib/types";
import {
  generateUniqueFolderName,
  getFolderForUser,
  getFolderWithNestedItems,
  getRootFolderWithNestedItems,
} from "@/queries/folders-queries";
import type { CreateFolderRoute } from "@/routes/folders/folders.routes";
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

export const createFolder: AppRouteHandler<CreateFolderRoute> = async (c) => {
  const user = c.get("user");
  const folderData = c.req.valid("json");

  const parentFolder = await getFolderForUser(
    folderData.parentFolderId,
    user.id,
  );

  if (!parentFolder) {
    return c.json(
      errorResponse("NOT_FOUND", "Parent folder not found"),
      HttpStatusCodes.NOT_FOUND,
    );
  }

  const uniqueTitle = await generateUniqueFolderName(
    folderData.name || "untitled",
    user.id,
    folderData.parentFolderId,
  );

  const payload = { ...folderData, userId: user.id, name: uniqueTitle };

  const [newFolder] = await db.insert(folders).values(payload).returning();

  return c.json(
    successResponse(newFolder, "Folder created successfully"),
    HttpStatusCodes.CREATED,
  );
};
