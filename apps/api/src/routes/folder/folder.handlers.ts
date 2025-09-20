import db from "@repo/db";
import type { FolderWithItems } from "@repo/db/validators/folder-validators";

import type { AppRouteHandler } from "@/lib/types";
import {
  generateUniqueFolderName,
  getFolderForUser,
  getFolderWithNestedItems,
  getRootFolderWithNestedItems,
  isDescendant,
} from "@/queries/folder-queries";
import type {
  CreateFolderRoute,
  DeleteFolderRoute,
  MoveFolderRoute,
  UpdateFolderRoute,
} from "@/routes/folder/folder.routes";
import { errorResponse, successResponse } from "@/utils/api-response";
import HttpStatusCodes from "@/utils/http-status-codes";
import type { GetFolderWithItemsRoute } from "./folder.routes";

export const getFolderWithItems: AppRouteHandler<
  GetFolderWithItemsRoute
> = async (c) => {
  const user = c.get("user");
  const { folderId } = c.req.valid("query");

  try {
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
  } catch (error) {
    console.error("Error retrieving folders with items:", error);
    return c.json(
      errorResponse("INTERNAL_SERVER_ERROR", "Failed to retrieve folders"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const createFolder: AppRouteHandler<CreateFolderRoute> = async (c) => {
  const user = c.get("user");
  const folderData = c.req.valid("json");

  try {
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

    const newFolder = await db.folder.create({
      data: payload,
    });

    return c.json(
      successResponse(newFolder, "Folder created successfully"),
      HttpStatusCodes.CREATED,
    );
  } catch (error) {
    console.error("Error creating folder:", error);
    return c.json(
      errorResponse("INTERNAL_SERVER_ERROR", "Failed to create folder"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const moveFolder: AppRouteHandler<MoveFolderRoute> = async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const { parentFolderId } = c.req.valid("json");

  try {
    const folder = await getFolderForUser(id, user.id);

    if (!folder) {
      return c.json(
        errorResponse("FOLDER_NOT_FOUND", "Folder not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    if (folder.isRoot) {
      return c.json(
        errorResponse("ROOT_FOLDER", "Root folder cannot be moved"),
        HttpStatusCodes.UNPROCESSABLE_ENTITY,
      );
    }

    if (parentFolderId === folder.parentFolderId) {
      return c.json(
        successResponse(folder, "Folder moved successfully"),
        HttpStatusCodes.OK,
      );
    }

    const parentFolder = await getFolderForUser(parentFolderId, user.id);
    if (!parentFolder) {
      return c.json(
        errorResponse("PARENT_FOLDER_NOT_FOUND", "Parent folder not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    if (await isDescendant(id, parentFolderId, user.id)) {
      return c.json(
        errorResponse(
          "FOLDER_CYCLE",
          "Cannot move a folder into its own descendant or itself",
        ),
        HttpStatusCodes.UNPROCESSABLE_ENTITY,
      );
    }

    const updatedFolder = await db.$transaction(async (tx) => {
      const uniqueName = await generateUniqueFolderName(
        folder.name,
        user.id,
        parentFolderId,
      );

      return await tx.folder.update({
        data: {
          parentFolderId,
          name: uniqueName,
        },
        where: { id },
      });
    });

    return c.json(
      successResponse(updatedFolder, "Folder moved successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    console.error("Error moving folder:", error);
    return c.json(
      errorResponse("INTERNAL_SERVER_ERROR", "Failed to move folder"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const updateFolder: AppRouteHandler<UpdateFolderRoute> = async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const folderData = c.req.valid("json");

  try {
    const folder = await getFolderForUser(id, user.id);

    if (!folder) {
      return c.json(
        errorResponse("FOLDER_NOT_FOUND", "Folder not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    if (folder.isRoot) {
      return c.json(
        errorResponse("ROOT_FOLDER", "Root folder cannot be updated"),
        HttpStatusCodes.UNPROCESSABLE_ENTITY,
      );
    }

    const parentFolderId = folderData.parentFolderId ?? folder.parentFolderId;
    if (parentFolderId !== folder.parentFolderId) {
      const parentFolder = await getFolderForUser(parentFolderId, user.id);
      if (!parentFolder) {
        return c.json(
          errorResponse("PARENT_FOLDER_NOT_FOUND", "Parent folder not found"),
          HttpStatusCodes.NOT_FOUND,
        );
      }
      if (await isDescendant(id, parentFolderId, user.id)) {
        return c.json(
          errorResponse(
            "FOLDER_CYCLE",
            "Cannot move a folder into its own descendant or itself",
          ),
          HttpStatusCodes.UNPROCESSABLE_ENTITY,
        );
      }
    }

    if (parentFolderId === folder.parentFolderId) {
      const name = folderData.name ?? folder.name;
      if (name !== folder.name) {
        const updatedFolder = await db.folder.update({
          data: { name },
          where: { id },
        });

        return c.json(
          successResponse(updatedFolder, "Folder updated successfully"),
          HttpStatusCodes.OK,
        );
      }

      return c.json(
        successResponse(folder, "Folder updated successfully"),
        HttpStatusCodes.OK,
      );
    }

    const updatedFolder = await db.$transaction(async (tx) => {
      let name = folderData.name ?? folder.name;
      if (parentFolderId !== folder.parentFolderId || name !== folder.name) {
        name = await generateUniqueFolderName(name, user.id, parentFolderId);
      }

      return await tx.folder.update({
        data: {
          ...folderData,
          parentFolderId,
          name,
        },
        where: { id },
      });
    });

    return c.json(
      successResponse(updatedFolder, "Folder updated successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    console.error("Error updating folder:", error);
    return c.json(
      errorResponse("INTERNAL_SERVER_ERROR", "Failed to update folder"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const deleteFolder: AppRouteHandler<DeleteFolderRoute> = async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");

  try {
    const folder = await getFolderForUser(id, user.id);

    if (!folder) {
      return c.json(
        errorResponse("NOT_FOUND", "Folder not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    if (folder.isRoot) {
      return c.json(
        errorResponse("ROOT_FOLDER", "Root folder cannot be deleted"),
        HttpStatusCodes.UNPROCESSABLE_ENTITY,
      );
    }

    await db.folder.deleteMany({
      where: { id },
    });

    return c.json(
      successResponse(folder, "Folder deleted successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    console.error("Error deleting folder:", error);
    return c.json(
      errorResponse("INTERNAL_SERVER_ERROR", "Failed to delete folder"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};
