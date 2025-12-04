import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";

import { queryKeys } from "@/lib/query";
import { $ensureRootFolder, $getFolder } from "@/server/folder";

/**
 * Hook to ensure the user has a root folder.
 * Checks if the folder query returns null and creates a root folder if needed.
 */
export function useEnsureRootFolder() {
  const queryClient = useQueryClient();
  const ensureRootFolderFn = useServerFn($ensureRootFolder);
  const getFolderFn = useServerFn($getFolder);

  // Query for the root folder
  const { data: rootFolder, isLoading } = useQuery({
    queryKey: queryKeys.folder("root"),
    queryFn: () => getFolderFn(),
  });

  useEffect(() => {
    const ensureRoot = async () => {
      // If we're still loading or already have a root folder, do nothing
      if (isLoading || rootFolder) {
        return;
      }

      try {
        // Create the root folder
        await ensureRootFolderFn();

        // Invalidate the folder query to refetch with the new root
        queryClient.invalidateQueries({
          queryKey: queryKeys.folder("root"),
        });
      } catch (error) {
        console.error("Failed to ensure root folder:", error);
      }
    };

    ensureRoot();
  }, [isLoading, rootFolder, ensureRootFolderFn, queryClient]);

  return { rootFolder, isLoading };
}
