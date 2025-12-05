import type { User } from "@repo/db/schemas/user.schema";
import type { FolderWithItems } from "@repo/db/validators/folder.validator";
import type { QueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { cancelToastEl } from "@/components/ui/toaster";
import { apiErrorHandler } from "@/lib/handle-api-error";
import { getMostRecentlyUpdatedNote, parseNoteIdFromPath } from "@/lib/utils";
import {
  $createFolder,
  $deleteFolder,
  $moveFolder,
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
  const navigate = useNavigate();
  const location = useLocation();

  const createFolderFn = useServerFn($createFolder);
  const deleteFolderFn = useServerFn($deleteFolder);
  const renameFolderFn = useServerFn($renameFolder);
  const moveFolderFn = useServerFn($moveFolder);

  // A shared deep clone helper needed to avoid mutating the existing state
  // directly when performing optimistic updates. This is a recursive function
  // because FolderWithItems is a nested structure with folders containing
  // more folders recursively.
  const clone = (node: FolderWithItems): FolderWithItems => ({
    ...node,
    folders: node.folders.map(clone),
    notes: [...node.notes],
  });

  /* CREATE FOLDER */
  const createFolderMutation = useMutation({
    mutationKey: ["create-folder"],
    mutationFn: async (vars: { name: string; parentId?: string }) =>
      createFolderFn({ data: { name: vars.name, parentId: vars.parentId } }),
    onMutate: async (vars) => {
      const parentId = vars.parentId ?? rootFolder?.id;
      if (!parentId || !rootFolder)
        return { previous: null as FolderWithItems | null };

      // Cancel any outgoing refetches (so they don't overwrite the optimistic update)
      await queryClient.cancelQueries({
        queryKey: folderQueryOptions.queryKey,
      });

      const previous = queryClient.getQueryData<FolderWithItems | null>(
        folderQueryOptions.queryKey,
      );
      if (!previous) return { previous: null as FolderWithItems | null };

      // Create a temporary ID for the optimistic new folder and clone the current
      // folder structure
      const tempId = `temp-${Date.now()}`;
      const draft = clone(previous);

      // Insert the new folder into the correct parent folder in the cloned structure
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
              deletedAt: null,
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

      // Update the query cache with the folder structure including the new folder
      // and remove the creation input UI by clearing activeParentId
      queryClient.setQueryData(folderQueryOptions.queryKey, draft);
      setActiveParentId(null);

      return { previous, tempId };
    },
    onError: (error, _vars, ctx) => {
      // Revert to the previous folder structure on error
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

      // If mutation succeeds, get the real new folder from the server response
      const serverFolder = data.data;
      const current = queryClient.getQueryData<FolderWithItems | null>(
        folderQueryOptions.queryKey,
      );
      if (!current) return;

      // Replace the temporary folder in the cached structure with the real one
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
      // Invalidate queries to ensure fresh data is fetched
      queryClient.invalidateQueries({
        queryKey: folderQueryOptions.queryKey,
      });
    },
  });

  /* DELETE FOLDER */
  const deleteFolderMutation = useMutation({
    mutationKey: ["delete-folder"],
    mutationFn: async (vars: { folderId: string }) =>
      deleteFolderFn({ data: { folderId: vars.folderId } }),
    onMutate: async ({ folderId }) => {
      // Prevent deleting the root folder
      if (rootFolder && folderId === rootFolder.id) {
        return { previous: null as FolderWithItems | null };
      }

      // Cancel any outgoing refetches (so they don't overwrite the optimistic update)
      await queryClient.cancelQueries({
        queryKey: folderQueryOptions.queryKey,
      });

      const previous = queryClient.getQueryData<FolderWithItems | null>(
        folderQueryOptions.queryKey,
      );
      if (!previous) return { previous: null as FolderWithItems | null };

      const draft = clone(previous);
      let removedNode: FolderWithItems | null = null;

      // Remove the folder from the cloned structure
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

      // Get the ids of the removed folder and all its descendant folders
      const removedIds: string[] = [];
      const gather = (n: FolderWithItems) => {
        removedIds.push(n.id);
        n.folders.forEach(gather);
      };
      gather(removedNode);

      // Update openFolderIds and activeParentId to remove the ids of deleted folder
      // and its descendants
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

      // Update the query cache with the folder structure excluding the deleted folder
      queryClient.setQueryData(folderQueryOptions.queryKey, draft);

      const currentOpenNoteId = parseNoteIdFromPath(location.pathname);

      // If the currently open note is inside the deleted folder subtree, redirect
      if (currentOpenNoteId && removedNode) {
        const containsNote = (
          node: FolderWithItems,
          noteId: string,
        ): boolean => {
          if (node.notes.some((n) => n.id === noteId)) return true;
          for (const f of node.folders)
            if (containsNote(f, noteId)) return true;
          return false;
        };

        if (containsNote(removedNode, currentOpenNoteId)) {
          const nextNote = getMostRecentlyUpdatedNote(draft);
          if (nextNote) {
            navigate({ to: "/notes/$noteId", params: { noteId: nextNote.id } });
          } else {
            navigate({ to: "/" });
          }
        }
      }

      return { previous };
    },
    onError: (error, _vars, ctx) => {
      // Revert to the previous folder structure on error
      if (ctx?.previous) {
        queryClient.setQueryData(folderQueryOptions.queryKey, ctx.previous);
      }
      const apiError = apiErrorHandler(error, {
        defaultMessage: "Failed to delete folder.",
      });
      toast.error(apiError.details, cancelToastEl);
    },
    onSettled: () => {
      // Invalidate queries to ensure fresh data is fetched
      queryClient.invalidateQueries({
        queryKey: folderQueryOptions.queryKey,
      });
    },
  });

  /* RENAME FOLDER */
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

      // Cancel any outgoing refetches (so they don't overwrite the optimistic update)
      await queryClient.cancelQueries({
        queryKey: folderQueryOptions.queryKey,
      });

      const previous = queryClient.getQueryData<FolderWithItems | null>(
        folderQueryOptions.queryKey,
      );
      if (!previous) return { previous: null as FolderWithItems | null };

      const draft = clone(previous);

      // Update the name of the folder in the cloned structure
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

      // Update the query cache with the folder structure including the renamed folder
      queryClient.setQueryData(folderQueryOptions.queryKey, draft);
      return { previous };
    },
    onError: (error, _vars, ctx) => {
      // Revert to the previous folder structure on error
      if (ctx?.previous) {
        queryClient.setQueryData(folderQueryOptions.queryKey, ctx.previous);
      }
      const apiError = apiErrorHandler(error, {
        defaultMessage: "Failed to rename folder.",
      });
      toast.error(apiError.details, cancelToastEl);
    },
    onSettled: () => {
      // Invalidate queries to ensure fresh data is fetched
      queryClient.invalidateQueries({
        queryKey: folderQueryOptions.queryKey,
      });
    },
  });

  /* MOVE FOLDER */
  const moveFolderMutation = useMutation({
    mutationKey: ["move-folder"],
    mutationFn: async (vars: { folderId: string; parentFolderId: string }) =>
      moveFolderFn({ data: vars }),
    onMutate: async ({ folderId, parentFolderId }) => {
      if (!rootFolder || folderId === rootFolder.id) {
        return { previous: null as FolderWithItems | null };
      }

      await queryClient.cancelQueries({
        queryKey: folderQueryOptions.queryKey,
      });

      const previous = queryClient.getQueryData<FolderWithItems | null>(
        folderQueryOptions.queryKey,
      );
      if (!previous) return { previous: null as FolderWithItems | null };

      // Prevent circular moves
      const isDescendant = (
        node: FolderWithItems,
        targetId: string,
      ): boolean => {
        if (node.id === targetId) return true;
        return node.folders.some((f) => isDescendant(f, targetId));
      };

      const findFolder = (
        node: FolderWithItems,
        id: string,
      ): FolderWithItems | null => {
        if (node.id === id) return node;
        for (const f of node.folders) {
          const found = findFolder(f, id);
          if (found) return found;
        }
        return null;
      };

      const folderToMove = findFolder(previous, folderId);
      if (!folderToMove || isDescendant(folderToMove, parentFolderId)) {
        return { previous };
      }

      const draft = clone(previous);

      // Remove from old location
      const removeFrom = (node: FolderWithItems): boolean => {
        const idx = node.folders.findIndex((f) => f.id === folderId);
        if (idx !== -1) {
          node.folders = [
            ...node.folders.slice(0, idx),
            ...node.folders.slice(idx + 1),
          ];
          return true;
        }
        for (const f of node.folders) if (removeFrom(f)) return true;
        return false;
      };
      removeFrom(draft);

      // Add to new location
      const newParent = findFolder(draft, parentFolderId);
      if (newParent) {
        newParent.folders = [
          ...newParent.folders,
          { ...folderToMove, parentFolderId, updatedAt: new Date() },
        ];
      }

      queryClient.setQueryData(folderQueryOptions.queryKey, draft);
      return { previous };
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(folderQueryOptions.queryKey, ctx.previous);
      }
      const apiError = apiErrorHandler(error, {
        defaultMessage: "Failed to move folder.",
      });
      toast.error(apiError.details, cancelToastEl);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: folderQueryOptions.queryKey,
      });
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
  const moveFolderOptimistic = (folderId: string, parentFolderId: string) => {
    moveFolderMutation.mutate({ folderId, parentFolderId });
  };

  return {
    createFolderOptimistic,
    deleteFolderOptimistic,
    renameFolderOptimistic,
    moveFolderOptimistic,
    creatingFolderPending: createFolderMutation.isPending,
  };
}
