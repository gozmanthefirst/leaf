import db, { eq } from "@repo/database";
import { folders } from "@repo/database/schemas/folders-schema";
import type { FolderWithItems } from "@repo/database/validators/folders-validators";

import type { AppRouteHandler } from "@/lib/types";
import {
  generateUniqueFolderName,
  getFolderForUser,
  getFolderWithNestedItems,
  getRootFolderWithNestedItems,
  isDescendant,
} from "@/queries/folders-queries";
import type {
  CreateFolderRoute,
  DeleteFolderRoute,
  MoveFolderRoute,
  UpdateFolderRoute,
} from "@/routes/folders/folders.routes";
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

export const moveFolder: AppRouteHandler<MoveFolderRoute> = async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const { parentFolderId } = c.req.valid("json");

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

  const [updatedFolder] = await db.transaction(async (tx) => {
    const uniqueName = await generateUniqueFolderName(
      folder.name,
      user.id,
      parentFolderId,
    );

    return await tx
      .update(folders)
      .set({
        parentFolderId,
        name: uniqueName,
      })
      .where(eq(folders.id, id))
      .returning();
  });

  return c.json(
    successResponse(updatedFolder, "Folder moved successfully"),
    HttpStatusCodes.OK,
  );
};

export const updateFolder: AppRouteHandler<UpdateFolderRoute> = async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const folderData = c.req.valid("json");

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
      const [updatedFolder] = await db.transaction(async (tx) => {
        return await tx
          .update(folders)
          .set({ name })
          .where(eq(folders.id, id))
          .returning();
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

  const [updatedFolder] = await db.transaction(async (tx) => {
    let name = folderData.name ?? folder.name;
    if (parentFolderId !== folder.parentFolderId || name !== folder.name) {
      name = await generateUniqueFolderName(name, user.id, parentFolderId);
    }
    return await tx
      .update(folders)
      .set({
        ...folderData,
        parentFolderId,
        name,
      })
      .where(eq(folders.id, id))
      .returning();
  });

  return c.json(
    successResponse(updatedFolder, "Folder updated successfully"),
    HttpStatusCodes.OK,
  );
};

export const deleteFolder: AppRouteHandler<DeleteFolderRoute> = async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");

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

  await db.delete(folders).where(eq(folders.id, id));

  return c.json(
    successResponse(folder, "Folder deleted successfully"),
    HttpStatusCodes.OK,
  );
};
