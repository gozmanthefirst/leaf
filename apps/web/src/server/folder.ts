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
export const $getFolder = createServerFn({
  method: "GET",
})
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
  queryKey: [queryKeys.folder],
  queryFn: $getFolder,
});
