import type { FolderWithItems } from "@repo/db/validators/folder-validators";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import { QueryClient } from "@tanstack/react-query";

import { axiosBase } from "./axios";
import { queryKeys } from "./query";
import type { ApiSuccessResponse } from "./types";

const queryClient = new QueryClient();

export const folderCollection = createCollection(
  queryCollectionOptions({
    queryKey: queryKeys.folder("root"),
    queryFn: async () => {
      try {
        const response =
          await axiosBase.get<ApiSuccessResponse<FolderWithItems>>(
            "/folders/root",
          );

        const folder = response.data.data;
        return folder ? [folder] : [];
      } catch (_error) {
        return [];
      }
    },
    queryClient,
    getKey: (item) => item.id,
  }),
);
