import type { Note, User } from "@repo/db";
import type { FolderWithItems } from "@repo/db/validators/folder-validators";
import type { QueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { useSidebar } from "@/components/ui/sidebar";
import { cancelToastEl } from "@/components/ui/toaster";
import { apiErrorHandler } from "@/lib/handle-api-error";
import { queryKeys } from "@/lib/query";
import {
  getMostRecentlyUpdatedNote,
  parseNoteIdFromPath,
  suggestUniqueTitle,
} from "@/lib/utils";
import { folderQueryOptions } from "@/server/folder";
import {
  $createNote,
  $deleteNote,
  $makeNoteCopy,
  $renameNote,
} from "@/server/note";

type Params = {
  queryClient: QueryClient;
  rootFolder: FolderWithItems | null | undefined;
  user: User;
  setActiveNoteParentId: React.Dispatch<React.SetStateAction<string | null>>;
};

export function useNoteMutations({
  queryClient,
  rootFolder,
  user,
  setActiveNoteParentId,
}: Params) {
  const navigate = useNavigate();
  const location = useLocation();

  const createNoteFn = useServerFn($createNote);
  const deleteNoteFn = useServerFn($deleteNote);
  const renameNoteFn = useServerFn($renameNote);
  const copyNoteFn = useServerFn($makeNoteCopy);

  const [pendingNoteIds, setPendingNoteIds] = useState<Set<string>>(new Set());

  const { setOpenMobile } = useSidebar();

  // Helpers to manage pending note IDs for optimistic updates that are still
  // awaiting server confirmation. This allows the UI to disable interactions
  // with these notes until the server responds.
  const markPending = (id: string) =>
    setPendingNoteIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  const unmarkPending = (id: string) =>
    setPendingNoteIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  const isNotePending = (id: string) => pendingNoteIds.has(id);

  // A shared deep clone helper needed to avoid mutating the existing state
  // directly when performing optimistic updates. This is a recursive function
  // because FolderWithItems is a nested structure with folders containing
  // more folders recursively.
  const clone = (node: FolderWithItems): FolderWithItems => ({
    ...node,
    folders: node.folders.map(clone),
    notes: [...node.notes],
  });

  // A recursive function to find a note and its parent folder by note ID.
  const findNoteAndParent = (
    root: FolderWithItems,
    noteId: string,
  ): { parent: FolderWithItems; note: Note } | null => {
    // Direct match in current folder
    const direct = root.notes.find((n) => n.id === noteId);
    if (direct) {
      return { parent: root, note: direct };
    }
    // Recurse into child folders
    for (const f of root.folders) {
      const found = findNoteAndParent(f, noteId);
      if (found) return found;
    }
    return null;
  };

  /* CREATE NOTE */
  const createNoteMutation = useMutation({
    mutationKey: ["create-note"],
    mutationFn: async (vars: { title: string; parentId?: string }) =>
      createNoteFn({ data: { title: vars.title, folderId: vars.parentId } }),
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

      // Create a temporary ID for the optimistic new note and clone the current
      // folder structure
      const tempId = `temp-note-${Date.now()}`;
      const draft = clone(previous);

      // Insert the new note into the correct folder in the cloned structure
      const insert = (node: FolderWithItems): boolean => {
        if (node.id === parentId) {
          node.notes = [
            ...node.notes,
            {
              id: tempId,
              title: vars.title,
              createdAt: new Date(),
              updatedAt: new Date(),
              userId: user.id,
              contentEncrypted: "",
              contentIv: "",
              contentTag: "",
              folderId: parentId,
              isFavorite: false,
              tags: [],
              // __optimistic is used to identify optimistic updates where the added UI is
              // disabled to show that the real data is still pending from the server
              __optimistic: true,
            } as unknown as Note,
          ];
          return true;
        }
        for (const f of node.folders) if (insert(f)) return true;
        return false;
      };
      insert(draft);

      // Add the temp ID to the pending set to disable interactions
      markPending(tempId);

      // Update the query cache with the folder structure including the new note
      // and remove the creation input UI by clearing activeParentId
      queryClient.setQueryData(folderQueryOptions.queryKey, draft);
      setActiveNoteParentId(null);

      // Navigate to temp note immediately
      navigate({
        to: "/notes/$noteId",
        params: { noteId: tempId },
      });
      setOpenMobile(false);

      return { previous, tempId };
    },
    onError: (error, _vars, ctx) => {
      // On error, roll back to the previous folder structure
      if (ctx?.previous) {
        queryClient.setQueryData(folderQueryOptions.queryKey, ctx.previous);
      }
      // Also remove the temp ID from the pending set to re-enable interactions
      if (ctx?.tempId) unmarkPending(ctx.tempId);

      const apiError = apiErrorHandler(error, {
        defaultMessage: "Failed to create note.",
      });
      toast.error(apiError.details, cancelToastEl);
    },
    onSuccess: (data, _vars, ctx) => {
      if (!ctx?.tempId) return;

      // If mutation succeeds, get the real new note from the server response
      const serverNote = data.data as Note;
      const current = queryClient.getQueryData<FolderWithItems | null>(
        folderQueryOptions.queryKey,
      );
      if (!current) return;

      // Replace the temporary note in the folder structure with the real one
      const replace = (node: FolderWithItems): FolderWithItems => ({
        ...node,
        notes: node.notes.map((n) =>
          n.id === ctx.tempId
            ? {
                ...n,
                id: serverNote.id,
                title: serverNote.title,
                createdAt: serverNote.createdAt,
                updatedAt: serverNote.updatedAt,
                userId: serverNote.userId,
                contentEncrypted: serverNote.contentEncrypted,
                contentIv: serverNote.contentIv,
                contentTag: serverNote.contentTag,
                folderId: serverNote.folderId,
                isFavorite: serverNote.isFavorite,
                tags: serverNote.tags,
              }
            : n,
        ),
        folders: node.folders.map(replace),
      });

      queryClient.setQueryData(folderQueryOptions.queryKey, replace(current));
      unmarkPending(ctx.tempId);

      // Update URL to real ID if still on temp note page
      const currentPath = location.pathname;
      if (currentPath.includes(ctx.tempId)) {
        navigate({
          to: "/notes/$noteId",
          params: { noteId: serverNote.id },
          replace: true,
        });
      }
    },
    onSettled: (data) => {
      queryClient.invalidateQueries({
        queryKey: folderQueryOptions.queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.note(data?.data.id ?? ""),
      });
    },
  });

  /* DELETE NOTE */
  const deleteNoteMutation = useMutation({
    mutationKey: ["delete-note"],
    mutationFn: async (vars: { noteId: string }) =>
      deleteNoteFn({ data: { noteId: vars.noteId } }),
    onMutate: async ({ noteId }) => {
      // Cancel any outgoing refetches (so they don't overwrite the optimistic update)
      await queryClient.cancelQueries({
        queryKey: folderQueryOptions.queryKey,
      });

      const previous = queryClient.getQueryData<FolderWithItems | null>(
        folderQueryOptions.queryKey,
      );
      if (!previous) return { previous: null as FolderWithItems | null };

      const draft = clone(previous);
      let removed = false;

      // A recursive function to find and remove the note from the folder structure
      const removeNote = (node: FolderWithItems): boolean => {
        const idx = node.notes.findIndex((n) => n.id === noteId);
        if (idx !== -1) {
          node.notes = [
            ...node.notes.slice(0, idx),
            ...node.notes.slice(idx + 1),
          ];
          removed = true;
          return true;
        }
        for (const f of node.folders) if (removeNote(f)) return true;
        return false;
      };
      removeNote(draft);
      if (!removed) return { previous };

      // Update the query cache with the folder structure minus the deleted note
      queryClient.setQueryData(folderQueryOptions.queryKey, draft);

      const currentOpenNoteId = parseNoteIdFromPath(location.pathname);

      // If the deleted note is currently open, navigate away to the most recently
      // updated note, or home if no notes remain
      if (currentOpenNoteId === noteId) {
        const optimisticRF = queryClient.getQueryData<FolderWithItems | null>(
          folderQueryOptions.queryKey,
        );

        if (optimisticRF) {
          const note = getMostRecentlyUpdatedNote(optimisticRF);

          if (note) {
            navigate({
              to: "/notes/$noteId",
              params: { noteId: note.id },
            });
          } else {
            navigate({ to: "/" });
          }
        } else {
          navigate({ to: "/" });
        }
      }

      return { previous };
    },
    onError: (error, _vars, ctx) => {
      // On error, roll back to the previous folder structure
      if (ctx?.previous) {
        queryClient.setQueryData(folderQueryOptions.queryKey, ctx.previous);
      }
      const apiError = apiErrorHandler(error, {
        defaultMessage: "Failed to delete note.",
      });
      toast.error(apiError.details, cancelToastEl);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: folderQueryOptions.queryKey,
      });
    },
  });

  /* RENAME NOTE */
  const renameNoteMutation = useMutation({
    mutationKey: ["rename-note"],
    mutationFn: async (vars: { noteId: string; title: string }) =>
      renameNoteFn({ data: { noteId: vars.noteId, title: vars.title } }),
    onMutate: async ({ noteId, title }) => {
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

      // A recursive function to find and update the note's title in the folder structure
      const update = (node: FolderWithItems): boolean => {
        const idx = node.notes.findIndex((n) => n.id === noteId);
        if (idx !== -1) {
          node.notes[idx] = {
            ...node.notes[idx],
            title,
            updatedAt: new Date(),
          };
          return true;
        }
        for (const f of node.folders) if (update(f)) return true;
        return false;
      };
      update(draft);

      // Update the query cache with the folder structure including the renamed note
      queryClient.setQueryData(folderQueryOptions.queryKey, draft);
      return { previous };
    },
    onError: (error, _vars, ctx) => {
      // On error, roll back to the previous folder structure
      if (ctx?.previous) {
        queryClient.setQueryData(folderQueryOptions.queryKey, ctx.previous);
      }
      const apiError = apiErrorHandler(error, {
        defaultMessage: "Failed to rename note.",
      });
      toast.error(apiError.details, cancelToastEl);
    },
    onSettled: (data) => {
      queryClient.invalidateQueries({
        queryKey: folderQueryOptions.queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.note(data?.data.id ?? ""),
      });
    },
  });

  /* COPY NOTE */
  const copyNoteMutation = useMutation({
    mutationKey: ["copy-note"],
    mutationFn: async (vars: { noteId: string }) =>
      copyNoteFn({ data: { noteId: vars.noteId } }),
    onMutate: async ({ noteId }) => {
      if (!rootFolder)
        return {
          previous: null as FolderWithItems | null,
          tempId: null as string | null,
        };

      // Cancel any outgoing refetches (so they don't overwrite the optimistic update)
      await queryClient.cancelQueries({
        queryKey: folderQueryOptions.queryKey,
      });

      const previous = queryClient.getQueryData<FolderWithItems | null>(
        folderQueryOptions.queryKey,
      );
      if (!previous)
        return {
          previous: null as FolderWithItems | null,
          tempId: null as string | null,
        };

      const draft = clone(previous);
      const found = findNoteAndParent(draft, noteId);
      if (!found) return { previous, tempId: null as string | null };

      const { parent, note } = found;
      const existingTitles = parent.notes.map((n) => n.title);
      const uniqueTitle = suggestUniqueTitle(note.title, existingTitles);
      const tempId = `temp-copy-${Date.now()}`;

      // Insert the copied note into the same folder as the original note
      parent.notes = [
        ...parent.notes,
        {
          id: tempId,
          title: uniqueTitle,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: note.userId,
          contentEncrypted: "",
          contentIv: "",
          contentTag: "",
          folderId: parent.id,
          isFavorite: false,
          tags: [],
          __optimistic: true,
        } as unknown as Note,
      ];

      // Add the temp ID to the pending set to disable interactions
      markPending(tempId);

      // Update the query cache with the folder structure including the copied note
      queryClient.setQueryData(folderQueryOptions.queryKey, draft);

      return { previous, tempId };
    },
    onError: (error, _vars, ctx) => {
      // On error, roll back to the previous folder structure
      if (ctx?.previous) {
        queryClient.setQueryData(folderQueryOptions.queryKey, ctx.previous);
      }

      // Also remove the temp ID from the pending set to re-enable interactions
      if (ctx?.tempId) unmarkPending(ctx.tempId);

      const apiError = apiErrorHandler(error, {
        defaultMessage: "Failed to copy note.",
      });
      toast.error(apiError.details, cancelToastEl);
    },
    onSuccess: (data, _vars, ctx) => {
      if (!ctx?.tempId) return;

      // If mutation succeeds, get the real copied note from the server response
      const serverNote = data.data as Note;
      const current = queryClient.getQueryData<FolderWithItems | null>(
        folderQueryOptions.queryKey,
      );
      if (!current) return;

      // Replace the temporary copied note in the folder structure with the real one
      const replace = (node: FolderWithItems): FolderWithItems => ({
        ...node,
        notes: node.notes.map((n) =>
          n.id === ctx.tempId
            ? {
                ...n,
                id: serverNote.id,
                title: serverNote.title,
                createdAt: serverNote.createdAt,
                updatedAt: serverNote.updatedAt,
                userId: serverNote.userId,
                contentEncrypted: serverNote.contentEncrypted,
                contentIv: serverNote.contentIv,
                contentTag: serverNote.contentTag,
                folderId: serverNote.folderId,
                isFavorite: serverNote.isFavorite,
                tags: serverNote.tags,
              }
            : n,
        ),
        folders: node.folders.map(replace),
      });

      // Update the query cache with the folder structure including the real copied note
      queryClient.setQueryData(folderQueryOptions.queryKey, replace(current));
      unmarkPending(ctx.tempId);

      // Navigate to the new note's page
      navigate({
        to: "/notes/$noteId",
        params: { noteId: serverNote.id },
      });

      // Close the sidebar on mobile to show the copied note
      setOpenMobile(false);
    },
    onSettled: (data) => {
      queryClient.invalidateQueries({
        queryKey: folderQueryOptions.queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.note(data?.data.id ?? ""),
      });
    },
  });

  return {
    createNoteOptimistic: (title: string, parentId: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      createNoteMutation.mutate({ title: trimmed, parentId });
    },
    deleteNoteOptimistic: (noteId: string) => {
      if (!noteId) return;
      deleteNoteMutation.mutate({ noteId });
    },
    renameNoteOptimistic: (noteId: string, title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      renameNoteMutation.mutate({ noteId, title: trimmed });
    },
    copyNoteOptimistic: (noteId: string) => {
      if (!noteId) return;
      copyNoteMutation.mutate({ noteId });
    },
    createNotePending: createNoteMutation.isPending,
    isNotePending,
  };
}
