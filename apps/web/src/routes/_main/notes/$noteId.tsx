import type { DecryptedNote } from "@repo/db/validators/note-validators";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useDebounce } from "@uidotdev/usehooks";
import {
  type ComponentProps,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  TbAlertTriangle,
  TbCheck,
  TbCircleCheck,
  TbCloudOff,
  TbDotsVertical,
  TbEdit,
  TbFileArrowRight,
  TbFiles,
  TbLoader2,
  TbPencil,
  TbStar,
  TbTrash,
} from "react-icons/tb";
import { toast } from "sonner";

import { WithState } from "@/components/fallback/with-state";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cancelToastEl } from "@/components/ui/toaster";
import { queryKeys } from "@/lib/query";
import { cn, getMostRecentlyUpdatedNote } from "@/lib/utils";
import { folderQueryOptions } from "@/server/folder";
import {
  $getSingleNote,
  $renameNote,
  $updateNoteContent,
  singleNoteQueryOptions,
} from "@/server/note";

export const Route = createFileRoute("/_main/notes/$noteId")({
  ssr: "data-only",
  beforeLoad: async ({ context, params }) => {
    const note = await context.queryClient.ensureQueryData(
      singleNoteQueryOptions(params.noteId),
    );
    const rootFolder =
      await context.queryClient.ensureQueryData(folderQueryOptions);

    if (!note) {
      if (rootFolder) {
        const mostRecentNote = getMostRecentlyUpdatedNote(rootFolder);

        if (mostRecentNote) {
          throw redirect({
            to: "/notes/$noteId",
            params: { noteId: mostRecentNote.id },
          });
        } else {
          throw redirect({ to: "/" });
        }
      } else {
        throw redirect({ to: "/" });
      }
    }
  },
  loader: async ({ params, context }) => {
    await context.queryClient.prefetchQuery(
      singleNoteQueryOptions(params.noteId),
    );

    return { noteId: params.noteId };
  },
  component: NotePage,
});

// Lift state to the page so header can render it
function NotePage() {
  const { noteId } = Route.useLoaderData();
  const getSingleNote = useServerFn($getSingleNote);

  const [titleState, setTitleState] = useState<SyncState>("idle");
  const [contentState, setContentState] = useState<SyncState>("idle");

  const singleNoteQuery = useQuery({
    ...singleNoteQueryOptions(noteId),
    queryFn: () => getSingleNote({ data: noteId }),
  });

  // Combine title/content states into a single status with precedence
  const combinedState: SyncState = (() => {
    const order: SyncState[] = [
      "error",
      "offline",
      "saving",
      "dirty",
      "savedRecently",
      "idle",
    ];
    const has = (s: SyncState) => titleState === s || contentState === s;
    for (const s of order) if (has(s)) return s;
    return "idle";
  })();

  return (
    <main className="absolute inset-0 flex h-full flex-col">
      <NotePageHeader state={combinedState} />
      {/* let the editor manage its own scroll */}
      <div className="flex flex-1 overflow-auto pt-4">
        <div className="container flex min-h-0 flex-1">
          <WithState state={singleNoteQuery}>
            {(note) =>
              note ? (
                <NoteView
                  note={note}
                  setContentState={setContentState}
                  setTitleState={setTitleState}
                />
              ) : null
            }
          </WithState>
        </div>
      </div>
    </main>
  );
}

const NotePageHeader = ({ state }: { state: SyncState }) => {
  return (
    <header className="sticky top-0 isolate z-10 flex h-10 w-full items-center border-muted/80 px-3 lg:px-6">
      <SidebarTrigger className="lg:hidden" />
      <div className="ml-auto flex items-center gap-2">
        <StatusIcon labelPrefix="Note" state={state} />
        <NotePageDropdown />
      </div>
    </header>
  );
};

const TitleTextarea = ({
  noteId,
  title,
  onEnter,
  onStatusChange,
  ref,
}: ComponentProps<"textarea"> & {
  noteId: string;
  title: string;
  onEnter: () => void;
  onStatusChange: (s: SyncState) => void;
}) => {
  const queryClient = useQueryClient();
  const renameNote = useServerFn($renameNote);

  const [value, setValue] = useState(title);
  const [dirty, setDirty] = useState(false);
  const innerRef = useRef<HTMLTextAreaElement>(null);
  const titleSeqRef = useRef(0);

  const debounced = useDebounce(value.trim(), 750);

  // expose the inner ref to parent
  useEffect(() => {
    if (!ref) return;
    if (typeof ref === "function") ref(innerRef.current);
    else
      (ref as RefObject<HTMLTextAreaElement | null>).current = innerRef.current;
  }, [ref]);

  // Keep in sync if title prop changes (external updates) and clear dirty
  useEffect(() => {
    // Don't clobber local edits while focused
    if (innerRef.current === document.activeElement && dirty) return;
    setValue(title);
    setDirty(false);
    onStatusChange("idle");
  }, [title, onStatusChange, dirty]);

  const { mutate: saveTitle } = useMutation({
    mutationKey: ["rename-note-inline", noteId],
    mutationFn: async (newTitle: string) =>
      renameNote({ data: { noteId, title: newTitle } }),
    onMutate: () => {
      const seq = ++titleSeqRef.current;
      onStatusChange("saving");
      return { seq };
    },
    onSuccess: (_res, newTitle, ctx) => {
      if (ctx?.seq !== titleSeqRef.current) return; // stale response
      onStatusChange("savedRecently");
      setTimeout(() => onStatusChange("idle"), 1000);
      queryClient.setQueryData<DecryptedNote>(queryKeys.note(noteId), (prev) =>
        prev ? { ...prev, title: newTitle, updatedAt: new Date() } : prev,
      );
      queryClient.invalidateQueries({ queryKey: folderQueryOptions.queryKey });
      setDirty(false);
    },
    onError: () => {
      onStatusChange("error");
      toast.error(
        "Failed to rename note. Check your connection and try again.",
        cancelToastEl,
      );
    },
  });

  // Fire mutation when user stops typing and value changed (non-optimistic). Only runs if user typed (dirty).
  useEffect(() => {
    if (!dirty) return;
    if (!debounced) return;
    if (debounced === title.trim()) return;
    saveTitle(debounced);
  }, [debounced, title, dirty, saveTitle]);

  // Make flush stable and capture latest deps
  const flushIfChanged = useCallback(() => {
    const t = value.trim();
    if (!dirty) return;
    if (t && t !== title.trim()) {
      saveTitle(t);
    } else {
      setDirty(false);
    }
  }, [dirty, value, title, saveTitle]);

  // TitleTextarea beforeunload
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) flushIfChanged();
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      flushIfChanged();
      e.preventDefault();
      // Required by browsers to trigger the confirmation dialog
      (e as unknown as { returnValue: string }).returnValue = "";
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [dirty, flushIfChanged]);

  return (
    <textarea
      aria-label="Note title"
      className="field-sizing-content w-full resize-none bg-transparent font-semibold text-2xl leading-tight outline-none focus:outline-none focus:ring-0 md:text-3xl"
      onBlur={flushIfChanged}
      onChange={(e) => {
        setValue(e.target.value);
        setDirty(true);
        onStatusChange("dirty");
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (dirty) onStatusChange("saving");
          flushIfChanged();
          onEnter();
        } else if (
          e.key === "ArrowDown" &&
          !e.shiftKey &&
          !e.altKey &&
          !e.metaKey &&
          !e.ctrlKey
        ) {
          e.preventDefault();
          if (dirty) onStatusChange("saving");
          flushIfChanged();
          onEnter();
        }
      }}
      ref={innerRef}
      rows={1}
      spellCheck={false}
      value={value}
    />
  );
};

const NoteView = ({
  note,
  setTitleState,
  setContentState,
}: {
  note: DecryptedNote;
  setTitleState: (s: SyncState) => void;
  setContentState: (s: SyncState) => void;
}) => {
  const { queryClient } = Route.useRouteContext();
  const updateNoteContent = useServerFn($updateNoteContent);

  const titleRef = useRef<HTMLTextAreaElement>(null);

  const [contentValue, setContentValue] = useState(note.content);
  const [contentDirty, setContentDirty] = useState(false);
  const contentSeqRef = useRef(0);

  const debouncedContent = useDebounce(contentValue, 750);

  const editor = useEditor({
    extensions: [StarterKit],
    content: note.content,
    immediatelyRender: true,
    onUpdate: ({ editor }) => {
      setContentDirty(true);
      setContentState("dirty");
      setContentValue(editor.getHTML());
    },
    editorProps: {
      attributes: { class: "outline-none w-full h-full" },
      handleKeyDown: (view, event) => {
        if (
          event.key === "ArrowUp" &&
          !event.shiftKey &&
          !event.altKey &&
          !event.metaKey &&
          !event.ctrlKey
        ) {
          const { from, empty } = view.state.selection;
          // At very start of the document, move focus to title
          if (empty && from === 1) {
            event.preventDefault();
            const el = titleRef.current;
            if (el) {
              el.focus();
              const end = el.value.length;
              el.setSelectionRange(end, end);
            }
            return true;
          }
        }
        return false;
      },
    },
  });

  // Keep local content in sync when navigating or server updates
  // biome-ignore lint/correctness/useExhaustiveDependencies: required
  useEffect(() => {
    // If the user is editing, don't apply external content
    if (editor?.isFocused || contentDirty) return;

    setContentValue(note.content);
    setContentDirty(false);
    setContentState("idle");

    if (editor) {
      // Only sync if different (and not editing) to avoid flicker/clobbering
      if (note.content !== editor.getHTML()) {
        editor.commands.setContent(note.content, { emitUpdate: false });
      }
    }
  }, [note.id, note.content, editor]); // contentDirty comes from closure

  // Helper: read the latest title from cache to avoid overwriting a recent rename
  const getCurrentTitle = () => {
    const cached = queryClient.getQueryData<DecryptedNote>(
      queryKeys.note(note.id),
    );
    return cached?.title ?? note.title;
  };

  const { mutate: saveContent } = useMutation({
    mutationKey: ["update-note-content", note.id],
    mutationFn: async (html: string) =>
      updateNoteContent({
        data: { noteId: note.id, title: getCurrentTitle(), content: html },
      }),
    onMutate: () => {
      const seq = ++contentSeqRef.current;
      setContentState("saving");
      return { seq };
    },
    onSuccess: (_res, html, ctx) => {
      if (ctx?.seq !== contentSeqRef.current) return; // stale response
      setContentState("savedRecently");
      setTimeout(() => setContentState("idle"), 1000);
      queryClient.setQueryData<DecryptedNote>(
        queryKeys.note(note.id),
        (prev) =>
          prev
            ? {
                ...prev,
                title: getCurrentTitle(),
                content: html,
                updatedAt: new Date(),
              }
            : prev,
      );
      queryClient.invalidateQueries({ queryKey: folderQueryOptions.queryKey });
      setContentDirty(false);
    },
    onError: () => {
      setContentState("error");
      toast.error(
        "Failed to save content. Check your connection and try again.",
        cancelToastEl,
      );
    },
  });

  // Flush on editor blur
  useEffect(() => {
    if (!editor) return;
    const handler = () => {
      if (!contentDirty) return;
      const html = editor.getHTML();
      const cached = queryClient.getQueryData<DecryptedNote>(
        queryKeys.note(note.id),
      );
      if (html !== (cached?.content ?? note.content)) {
        saveContent(html);
      } else {
        setContentDirty(false);
      }
    };
    editor.on("blur", handler);
    return () => {
      editor.off("blur", handler);
    };
  }, [editor, contentDirty, note.id, note.content, queryClient, saveContent]);

  // Debounced save after user stops typing
  useEffect(() => {
    if (!contentDirty) return;
    const cached = queryClient.getQueryData<DecryptedNote>(
      queryKeys.note(note.id),
    );
    const lastSaved = cached?.content ?? note.content;
    if (debouncedContent !== lastSaved) {
      saveContent(debouncedContent);
    }
  }, [
    debouncedContent,
    contentDirty,
    note.id,
    note.content,
    queryClient,
    saveContent,
  ]);

  // NoteView beforeunload
  useEffect(() => {
    if (!editor) return;
    const flush = () => {
      if (!editor || !contentDirty) return;
      const html = editor.getHTML();
      saveContent(html);
    };
    const onVis = () => {
      if (document.hidden) flush();
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!contentDirty) return;
      flush();
      e.preventDefault();
      // Required by browsers to trigger the confirmation dialog
      (e as unknown as { returnValue: string }).returnValue = "";
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [editor, contentDirty, saveContent]);

  return (
    // allow children to grow and scroll
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <TitleTextarea
        noteId={note.id}
        onEnter={() => editor?.chain().focus().run()}
        onStatusChange={setTitleState}
        ref={titleRef}
        title={note.title}
      />
      {/* wrapper provides height; EditorContent fills and page scrolls */}
      <div className="mt-4 min-h-0 flex-1">
        <EditorContent className="tiptap h-full w-full" editor={editor} />
      </div>
    </div>
  );
};

const NotePageDropdown = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="size-7" size={"icon"} variant={"ghost"}>
          <TbDotsVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={"end"} className="w-56" side={"bottom"}>
        <DropdownMenuItem>
          <TbFiles className="text-muted-foreground" />
          <span>Make a copy</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <TbFileArrowRight className="text-muted-foreground" />
          <span>Move note to...</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <TbStar className="text-muted-foreground" />
          <span>Favorite note</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <TbEdit className="text-muted-foreground" />
          <span>Rename note</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <TbTrash className="text-muted-foreground" />
          <span>Delete note</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

type SyncState =
  | "idle"
  | "dirty"
  | "saving"
  | "error"
  | "offline"
  | "savedRecently";

function StatusIcon({
  state,
  labelPrefix,
}: {
  state: SyncState;
  labelPrefix: string;
}) {
  const common = "size-4";
  const map: Record<
    SyncState,
    { icon: React.ReactNode; label: string; className?: string }
  > = {
    idle: {
      icon: <TbCheck className={common} />,
      label: "Synced",
      className: "text-green-600 dark:text-green-500",
    },
    dirty: {
      icon: <TbPencil className={common} />,
      label: "Edited",
      className: "text-amber-600 dark:text-amber-500",
    },
    saving: {
      icon: <TbLoader2 className={`${common} animate-spin`} />,
      label: "Saving…",
      className: "text-blue-600 dark:text-blue-500",
    },
    error: {
      icon: <TbAlertTriangle className={common} />,
      label: "Save failed",
      className: "text-red-600 dark:text-red-500",
    },
    offline: {
      icon: <TbCloudOff className={common} />,
      label: "Offline",
      className: "text-zinc-500",
    },
    savedRecently: {
      icon: <TbCircleCheck className={common} />,
      label: "Saved",
      className: "text-green-600 dark:text-green-500",
    },
  };

  const s = map[state];
  return (
    <div
      aria-label={`${labelPrefix}: ${s.label}`}
      className={cn("mr-4", s.className)}
      role="img"
      title={`${labelPrefix}: ${s.label}`}
    >
      {s.icon}
    </div>
  );
}
