import type { User } from "@repo/db";
import type { FolderWithItems } from "@repo/db/validators/folder-validators";
import type { QueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { cancelToastEl } from "@/components/ui/toaster";
import { apiErrorHandler } from "@/lib/handle-api-error";
import {
  $createFolder,
  $deleteFolder,
  $renameFolder,
  folderQueryOptions,
} from "@/server/folder";

type Params = {
  queryClient: QueryClient;
  rootFolder: FolderWithItems | null | undefined;
  user: User;
  setActiveParentId: React.Dispatch<React.SetStateAction<string | null>>;
  setOpenFolderIds: React.Dispatch<React.SetStateAction<Set<string>>>;
};

export function useFolderMutations({
  queryClient,
  rootFolder,
  user,
  setActiveParentId,
  setOpenFolderIds,
}: Params) {
  const createFolderFn = useServerFn($createFolder);
  const deleteFolderFn = useServerFn($deleteFolder);
  const renameFolderFn = useServerFn($renameFolder);

  // Shared deep clone helper
  const clone = (node: FolderWithItems): FolderWithItems => ({
    ...node,
    folders: node.folders.map(clone),
    notes: [...node.notes],
  });

  /* CREATE */
  const createFolderMutation = useMutation({
    mutationKey: ["create-folder"],
    mutationFn: async (vars: { name: string; parentId?: string }) =>
      createFolderFn({ data: { name: vars.name, parentId: vars.parentId } }),
    onMutate: async (vars) => {
      const parentId = vars.parentId ?? rootFolder?.id;
      if (!parentId || !rootFolder)
        return { previous: null as FolderWithItems | null };

      await queryClient.cancelQueries({
        queryKey: folderQueryOptions.queryKey,
      });

      const previous = queryClient.getQueryData<FolderWithItems | null>(
        folderQueryOptions.queryKey,
      );
      if (!previous) return { previous: null as FolderWithItems | null };

      const tempId = `temp-${Date.now()}`;
      const draft = clone(previous);

      const insert = (node: FolderWithItems): boolean => {
        if (node.id === parentId) {
          node.folders = [
            ...node.folders,
            {
              id: tempId,
              name: vars.name,
              createdAt: new Date(),
              updatedAt: new Date(),
              parentFolderId: parentId,
              isRoot: false,
              userId: user.id,
              folders: [],
              notes: [],
            },
          ];
          return true;
        }
        for (const f of node.folders) if (insert(f)) return true;
        return false;
      };
      insert(draft);

      queryClient.setQueryData(folderQueryOptions.queryKey, draft);
      setActiveParentId(null);

      return { previous, tempId };
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(folderQueryOptions.queryKey, ctx.previous);
      }
      const apiError = apiErrorHandler(error, {
        defaultMessage: "Failed to create folder.",
      });
      toast.error(apiError.details, cancelToastEl);
    },
    onSuccess: (data, _vars, ctx) => {
      if (!ctx?.tempId) return;
      const serverFolder = data.data;
      const current = queryClient.getQueryData<FolderWithItems | null>(
        folderQueryOptions.queryKey,
      );
      if (!current) return;

      const replace = (node: FolderWithItems): FolderWithItems => ({
        ...node,
        folders: node.folders.map((f) =>
          f.id === ctx.tempId
            ? {
                ...f,
                id: serverFolder.id,
                name: serverFolder.name,
                createdAt: serverFolder.createdAt,
                updatedAt: serverFolder.updatedAt,
                parentFolderId: serverFolder.parentFolderId,
                isRoot: serverFolder.isRoot,
                userId: serverFolder.userId,
                folders: f.folders,
                notes: f.notes,
              }
            : replace(f),
        ),
      });
      queryClient.setQueryData(folderQueryOptions.queryKey, replace(current));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: folderQueryOptions.queryKey });
    },
  });

  /* DELETE */
  const deleteFolderMutation = useMutation({
    mutationKey: ["delete-folder"],
    mutationFn: async (vars: { folderId: string }) =>
      deleteFolderFn({ data: { folderId: vars.folderId } }),
    onMutate: async ({ folderId }) => {
      if (rootFolder && folderId === rootFolder.id) {
        return { previous: null as FolderWithItems | null };
      }

      await queryClient.cancelQueries({
        queryKey: folderQueryOptions.queryKey,
      });

      const previous = queryClient.getQueryData<FolderWithItems | null>(
        folderQueryOptions.queryKey,
      );
      if (!previous) return { previous: null as FolderWithItems | null };

      const draft = clone(previous);
      let removedNode: FolderWithItems | null = null;

      const remove = (node: FolderWithItems): boolean => {
        const idx = node.folders.findIndex((f) => f.id === folderId);
        if (idx !== -1) {
          removedNode = node.folders[idx];
          node.folders = [
            ...node.folders.slice(0, idx),
            ...node.folders.slice(idx + 1),
          ];
          return true;
        }
        for (const f of node.folders) if (remove(f)) return true;
        return false;
      };
      remove(draft);
      if (!removedNode) return { previous };

      const removedIds: string[] = [];
      const gather = (n: FolderWithItems) => {
        removedIds.push(n.id);
        n.folders.forEach(gather);
      };
      gather(removedNode);

      setOpenFolderIds((prev) => {
        if (prev.size === 0) return prev;
        const next = new Set(prev);
        removedIds.forEach((id) => {
          next.delete(id);
        });
        return next;
      });

      setActiveParentId((prev) =>
        prev && removedIds.includes(prev) ? null : prev,
      );

      queryClient.setQueryData(folderQueryOptions.queryKey, draft);
      return { previous };
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(folderQueryOptions.queryKey, ctx.previous);
      }
      const apiError = apiErrorHandler(error, {
        defaultMessage: "Failed to delete folder.",
      });
      toast.error(apiError.details, cancelToastEl);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: folderQueryOptions.queryKey });
    },
  });

  /* RENAME */
  const renameFolderMutation = useMutation({
    mutationKey: ["rename-folder"],
    mutationFn: async (vars: { folderId: string; name: string }) =>
      renameFolderFn({
        data: {
          folderId: vars.folderId,
          name: vars.name,
        },
      }),
    onMutate: async ({ folderId, name }) => {
      if (!rootFolder) return { previous: null as FolderWithItems | null };
      await queryClient.cancelQueries({
        queryKey: folderQueryOptions.queryKey,
      });

      const previous = queryClient.getQueryData<FolderWithItems | null>(
        folderQueryOptions.queryKey,
      );
      if (!previous) return { previous: null as FolderWithItems | null };

      const draft = clone(previous);

      const update = (node: FolderWithItems): boolean => {
        if (node.id === folderId) {
          node.name = name;
          node.updatedAt = new Date();
          return true;
        }
        for (const f of node.folders) if (update(f)) return true;
        return false;
      };
      update(draft);

      queryClient.setQueryData(folderQueryOptions.queryKey, draft);
      return { previous };
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(folderQueryOptions.queryKey, ctx.previous);
      }
      const apiError = apiErrorHandler(error, {
        defaultMessage: "Failed to rename folder.",
      });
      toast.error(apiError.details, cancelToastEl);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: folderQueryOptions.queryKey });
    },
  });

  /* Exposed helpers */
  const createFolderOptimistic = (name: string, parentId: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createFolderMutation.mutate({ name: trimmed, parentId });
  };
  const deleteFolderOptimistic = (folderId: string) => {
    deleteFolderMutation.mutate({ folderId });
  };
  const renameFolderOptimistic = (folderId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    renameFolderMutation.mutate({ folderId, name: trimmed });
  };

  return {
    createFolderOptimistic,
    deleteFolderOptimistic,
    renameFolderOptimistic,
    creatingFolderPending: createFolderMutation.isPending,
  };
}
