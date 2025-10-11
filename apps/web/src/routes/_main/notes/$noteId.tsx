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
  singleNoteQueryOptions,
} from "@/server/note";

export const Route = createFileRoute("/_main/notes/$noteId")({
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
      <div className="flex flex-1 overflow-auto pt-4">
        <div className="container flex flex-1">
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

const NoteView = ({
  note,
  setTitleState,
  setContentState,
}: {
  note: DecryptedNote;
  setTitleState: (s: SyncState) => void;
  setContentState: (s: SyncState) => void;
}) => {
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: note.content,
    onUpdate: () => {
      setContentState("dirty");
      // when you add a debounced save, set "saving" → "savedRecently"/"error"
    },
    editorProps: {
      attributes: { class: "outline-none w-full" },
      handleKeyDown: (view, event) => {
        if (
          event.key === "ArrowUp" &&
          !event.shiftKey &&
          !event.altKey &&
          !event.metaKey &&
          !event.ctrlKey
        ) {
          const { from, empty } = view.state.selection;
          // At very start of the document
          if (empty && from <= 1) {
            event.preventDefault();
            const el = titleRef.current;
            if (el) {
              el.focus();
              // place caret at end of title
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

  return (
    <div className="flex w-full flex-col">
      <TitleTextarea
        noteId={note.id}
        onEnter={() => editor?.chain().focus().run()}
        onStatusChange={setTitleState}
        ref={titleRef}
        title={note.title}
      />
      <EditorContent className="mt-4 w-full flex-1" editor={editor} />
    </div>
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

  // expose the inner ref to parent
  useEffect(() => {
    if (!ref) return;
    if (typeof ref === "function") ref(innerRef.current);
    else
      (ref as RefObject<HTMLTextAreaElement | null>).current = innerRef.current;
  }, [ref]);

  const debounced = useDebounce(value.trim(), 750);

  // Keep in sync if title prop changes (external updates) and clear dirty
  useEffect(() => {
    setValue(title);
    setDirty(false);
    onStatusChange("idle");
  }, [title, onStatusChange]);

  const { mutate: saveTitle } = useMutation({
    mutationKey: ["rename-note-inline", noteId],
    mutationFn: async (newTitle: string) =>
      renameNote({ data: { noteId, title: newTitle } }),
    onMutate: () => onStatusChange("saving"),
    onSuccess: () => {
      onStatusChange("savedRecently");
      // fall back to idle after a short flash
      setTimeout(() => onStatusChange("idle"), 1000);
      // Refresh caches so sidebar and note query reflect the new title
      queryClient.invalidateQueries({ queryKey: folderQueryOptions.queryKey });
      queryClient.invalidateQueries({ queryKey: queryKeys.note(noteId) });
      setDirty(false);
    },
    onError: () => {
      onStatusChange("error");
      // Keep user's input so they can retry; surface a retry action
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

  const flushIfChanged = () => {
    const t = value.trim();
    if (!dirty) return;
    if (t && t !== title.trim()) {
      saveTitle(t);
    } else {
      setDirty(false);
    }
  };

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
