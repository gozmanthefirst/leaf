import type { Note, User } from "@repo/db";
import type { FolderWithItems } from "@repo/db/validators/folder-validators";
import type { QueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { cancelToastEl } from "@/components/ui/toaster";
import { apiErrorHandler } from "@/lib/handle-api-error";
import { folderQueryOptions } from "@/server/folder";
import { $createNote, $deleteNote, $renameNote } from "@/server/note";

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
  const createNoteFn = useServerFn($createNote);
  const deleteNoteFn = useServerFn($deleteNote);
  const renameNoteFn = useServerFn($renameNote);

  const clone = (node: FolderWithItems): FolderWithItems => ({
    ...node,
    folders: node.folders.map(clone),
    notes: [...node.notes],
  });

  /* CREATE NOTE */
  const createNoteMutation = useMutation({
    mutationKey: ["create-note"],
    mutationFn: async (vars: { title: string; parentId?: string }) =>
      createNoteFn({ data: { title: vars.title, folderId: vars.parentId } }),
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

      const tempId = `temp-note-${Date.now()}`;
      const draft = clone(previous);

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
            } satisfies Note,
          ];
          return true;
        }
        for (const f of node.folders) if (insert(f)) return true;
        return false;
      };
      insert(draft);

      queryClient.setQueryData(folderQueryOptions.queryKey, draft);
      setActiveNoteParentId(null);

      return { previous, tempId };
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(folderQueryOptions.queryKey, ctx.previous);
      }
      const apiError = apiErrorHandler(error, {
        defaultMessage: "Failed to create note.",
      });
      toast.error(apiError.details, cancelToastEl);
    },
    onSuccess: (data, _vars, ctx) => {
      if (!ctx?.tempId) return;
      const serverNote = data.data as Note;
      const current = queryClient.getQueryData<FolderWithItems | null>(
        folderQueryOptions.queryKey,
      );
      if (!current) return;

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
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: folderQueryOptions.queryKey });
    },
  });

  /* DELETE NOTE */
  const deleteNoteMutation = useMutation({
    mutationKey: ["delete-note"],
    mutationFn: async (vars: { noteId: string }) =>
      deleteNoteFn({ data: { noteId: vars.noteId } }),
    onMutate: async ({ noteId }) => {
      await queryClient.cancelQueries({
        queryKey: folderQueryOptions.queryKey,
      });

      const previous = queryClient.getQueryData<FolderWithItems | null>(
        folderQueryOptions.queryKey,
      );
      if (!previous) return { previous: null as FolderWithItems | null };

      const draft = clone(previous);
      let removed = false;

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

      queryClient.setQueryData(folderQueryOptions.queryKey, draft);
      return { previous };
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(folderQueryOptions.queryKey, ctx.previous);
      }
      const apiError = apiErrorHandler(error, {
        defaultMessage: "Failed to delete note.",
      });
      toast.error(apiError.details, cancelToastEl);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: folderQueryOptions.queryKey });
    },
  });

  /* RENAME NOTE */
  const renameNoteMutation = useMutation({
    mutationKey: ["rename-note"],
    mutationFn: async (vars: { noteId: string; title: string }) =>
      renameNoteFn({ data: { noteId: vars.noteId, title: vars.title } }),
    onMutate: async ({ noteId, title }) => {
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

      queryClient.setQueryData(folderQueryOptions.queryKey, draft);
      return { previous };
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(folderQueryOptions.queryKey, ctx.previous);
      }
      const apiError = apiErrorHandler(error, {
        defaultMessage: "Failed to rename note.",
      });
      toast.error(apiError.details, cancelToastEl);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: folderQueryOptions.queryKey });
    },
  });

  const createNoteOptimistic = (title: string, parentId: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    createNoteMutation.mutate({ title: trimmed, parentId });
  };

  const deleteNoteOptimistic = (noteId: string) => {
    if (!noteId) return;
    deleteNoteMutation.mutate({ noteId });
  };

  const renameNoteOptimistic = (noteId: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    renameNoteMutation.mutate({ noteId, title: trimmed });
  };

  return {
    createNoteOptimistic,
    deleteNoteOptimistic,
    renameNoteOptimistic,
    createNotePending: createNoteMutation.isPending,
  };
}
