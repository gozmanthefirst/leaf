import type { FolderWithItems } from "@repo/db/validators/folder-validators";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query";

const queryClient = new QueryClient();

export const createFolderCollection = ({
  fn,
}: {
  fn: () => Promise<FolderWithItems[]>;
}) =>
  createCollection(
    queryCollectionOptions({
      queryKey: queryKeys.folder("root"),
      queryFn: async () => await fn(),
      queryClient,
      getKey: (folder) => folder.id,
    }),
  );
