import type { Folder } from "@repo/db";
import type { FolderWithItems } from "@repo/db/validators/folder-validators";
import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";

import { axiosClient } from "@/lib/axios";
import { queryKeys } from "@/lib/query";
import type { ApiSuccessResponse } from "@/lib/types";
import { sessionMiddleware } from "@/middleware/auth-middleware";

//* GET FOLDER
// get folder server fn
export const $getFolder = createServerFn()
  .middleware([sessionMiddleware])
  .inputValidator(z.string().min(1).optional())
  .handler(async ({ context, data: folderId }) => {
    try {
      const response = await axiosClient.get<
        ApiSuccessResponse<FolderWithItems>
      >("/folders", {
        headers: {
          Authorization: `Bearer ${context.session.token}`,
        },
        params: folderId ? { folderId } : undefined,
      });

      return response.data.data;
    } catch (_error) {
      return null;
    }
  });
// get folder query options
export const folderQueryOptions = queryOptions({
  queryKey: queryKeys.folder("root"),
  queryFn: $getFolder,
});

//* CREATE FOLDER
// create folder server fn
export const $createFolder = createServerFn()
  .middleware([sessionMiddleware])
  .inputValidator(
    z.object({
      name: z.string().min(1),
      parentId: z.string().min(1).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const rootFolder = await $getFolder();

    const payload = {
      parentFolderId: data.parentId ?? rootFolder?.id,
      name: data.name,
    };

    const response = await axiosClient.post<ApiSuccessResponse<Folder>>(
      "/folders",
      payload,
      {
        headers: {
          Authorization: `Bearer ${context.session.token}`,
        },
      },
    );

    return response.data;
  });

//* RENAME FOLDER
// rename folder server fn
export const $renameFolder = createServerFn()
  .middleware([sessionMiddleware])
  .inputValidator(
    z.object({
      name: z.string().min(1),
      folderId: z.string().min(1),
    }),
  )
  .handler(async ({ context, data }) => {
    const payload = {
      name: data.name,
    };

    const response = await axiosClient.put<ApiSuccessResponse<Folder>>(
      `/folders/${data.folderId}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${context.session.token}`,
        },
      },
    );

    return response.data;
  });

//* MOVE FOLDER
// move folder server fn
export const $moveFolder = createServerFn({
  method: "POST",
})
  .middleware([sessionMiddleware])
  .inputValidator(
    z.object({
      folderId: z.string().min(1),
      parentFolderId: z.string().min(1),
    }),
  )
  .handler(async ({ context, data }) => {
    const payload = {
      parentFolderId: data.parentFolderId,
    };

    const response = await axiosClient.patch<ApiSuccessResponse<Folder>>(
      `/folders/${data.folderId}/move`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${context.session.token}`,
        },
      },
    );

    return response.data;
  });

//* DELETE FOLDER
// delete folder server fn
export const $deleteFolder = createServerFn()
  .middleware([sessionMiddleware])
  .inputValidator(
    z.object({
      folderId: z.string().min(1),
    }),
  )
  .handler(async ({ context, data }) => {
    await axiosClient.delete<ApiSuccessResponse<Folder>>(
      `/folders/${data.folderId}`,
      {
        headers: {
          Authorization: `Bearer ${context.session.token}`,
        },
      },
    );
  });
