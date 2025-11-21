import type { FolderWithItems } from "@repo/db/validators/folder-validators";
import type { DecryptedNote } from "@repo/db/validators/note-validators";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { Underline } from "@tiptap/extension-underline";
import { type Editor, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useDebounce } from "@uidotdev/usehooks";
import { common, createLowlight } from "lowlight";
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
  TbArrowBackUp,
  TbArrowForwardUp,
  TbArrowNarrowRight,
  TbBlockquote,
  TbBold,
  TbBook,
  TbCheck,
  TbChevronDown,
  TbCircleCheck,
  TbCloudOff,
  TbCode,
  TbDotsVertical,
  TbEdit,
  TbH1,
  TbH2,
  TbH3,
  TbH4,
  TbH5,
  TbH6,
  TbHeading,
  TbItalic,
  TbLink,
  TbList,
  TbListCheck,
  TbListNumbers,
  TbLoader2,
  TbPencil,
  TbSourceCode,
  TbStrikethrough,
  TbSubscript,
  TbSuperscript,
  TbTrash,
  TbUnderline,
} from "react-icons/tb";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { cancelToastEl } from "@/components/ui/toaster";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiErrorHandler } from "@/lib/handle-api-error";
import { queryKeys } from "@/lib/query";
import { cn, getMostRecentlyUpdatedNote } from "@/lib/utils";
import { folderQueryOptions } from "@/server/folder";
import {
  $deleteNote,
  $getSingleNote,
  $renameNote,
  $updateNoteContent,
  singleNoteQueryOptions,
} from "@/server/note";

const lowlight = createLowlight(common);
const urlSchema = z.url();

export const Route = createFileRoute("/_main/notes/$noteId")({
  beforeLoad: async ({ context, params }) => {
    // Skip validation for temp notes
    if (params.noteId.startsWith("temp-note-")) {
      return;
    }

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

    return { note };
  },
  loader: async ({ params, context }) => {
    const note = await context.queryClient.ensureQueryData(
      singleNoteQueryOptions(params.noteId),
    );

    return { noteId: params.noteId, note };
  },
  component: NotePage,
});

function NotePage() {
  const { noteId, note } = Route.useLoaderData();

  const getSingleNote = useServerFn($getSingleNote);

  const [titleState, setTitleState] = useState<SyncState>("idle");
  const [contentState, setContentState] = useState<SyncState>("idle");
  const [isEditing, setIsEditing] = useState(true);

  const titleRef = useRef<HTMLTextAreaElement>(null);

  // Check if this is a temp note
  const isTempNote = noteId.startsWith("temp-note-");

  const singleNoteQuery = useQuery({
    ...singleNoteQueryOptions(noteId),
    queryFn: () => getSingleNote({ data: noteId }),
    // Disable query for temp notes
    enabled: !isTempNote,
    initialData: note,
  });

  // Merge title/content states into a single "Note" state for the header
  // Precedence: error > offline > saving > dirty > savedRecently > idle
  const noteState: SyncState = (() => {
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

  const toggleEditing = () => {
    if (isEditing) {
      (document.activeElement as HTMLElement | null)?.blur();
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  return (
    <main className="absolute inset-0 flex h-full flex-col">
      {/* Show loading state for temp notes */}
      {isTempNote ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-muted-foreground">
          <Spinner className="size-8" />
          <p className="text-sm">Creating note...</p>
        </div>
      ) : singleNoteQuery.data ? (
        <NoteView
          isEditing={isEditing}
          note={singleNoteQuery.data}
          noteState={noteState}
          onToggleEditing={toggleEditing}
          setContentState={setContentState}
          setTitleState={setTitleState}
          titleRef={titleRef}
        />
      ) : null}
    </main>
  );
}

const NoteView = ({
  note,
  setTitleState,
  setContentState,
  isEditing,
  noteState,
  onToggleEditing,
  titleRef,
}: {
  note: DecryptedNote;
  setTitleState: (s: SyncState) => void;
  setContentState: (s: SyncState) => void;
  isEditing: boolean;
  noteState: SyncState;
  onToggleEditing: () => void;
  titleRef: RefObject<HTMLTextAreaElement | null>;
}) => {
  const { queryClient } = Route.useRouteContext();
  const updateNoteContent = useServerFn($updateNoteContent);

  const [contentValue, setContentValue] = useState(note.content);
  const [contentDirty, setContentDirty] = useState(false);

  // Increasing number used to ignore older (stale) responses
  const contentSeqRef = useRef(0);

  const debouncedContent = useDebounce(contentValue, 750);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TaskList,
      Superscript,
      Subscript,
      TaskItem.configure({
        nested: true,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        enableTabIndentation: true,
      }),
    ],
    content: note.content,
    immediatelyRender: true,
    autofocus: "end",
    onUpdate: ({ editor }) => {
      // Avoid marking the editor as dirty if read mode is activated or if the content equals the server
      // content and we haven't started editing yet
      if (!editor.isEditable) return;
      const html = editor.getHTML();
      if (!contentDirty && html === note.content) return;

      setContentDirty(true);
      setContentState("dirty");
      setContentValue(html);
    },
    editorProps: {
      attributes: { class: "outline-none w-full h-full" },
      handleKeyDown: (view, event) => {
        if (
          event.key === "ArrowUp" &&
          !event.shiftKey &&
          !event.altKey &&
          !event.metaKey &&
          !event.ctrlKey &&
          isEditing
        ) {
          const { from, empty } = view.state.selection;
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

  // This syncs down server content on navigation or external updates
  // biome-ignore lint/correctness/useExhaustiveDependencies: syncing rule intentionally limited
  useEffect(() => {
    if (editor?.isFocused || contentDirty) return;

    setContentValue(note.content);
    setContentDirty(false);
    setContentState("idle");

    if (editor) {
      if (note.content !== editor.getHTML()) {
        editor.commands.setContent(note.content, {
          emitUpdate: false,
        });
      }
    }
  }, [note.id, note.content, editor]);

  // Read the latest title from the cache to avoid overwriting a rename
  // that may have landed since the NoteView was rendered
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
      // Drop stale responses (race condition guard)
      if (ctx?.seq !== contentSeqRef.current) return;
      setContentState("savedRecently");
      setTimeout(() => setContentState("idle"), 1000);

      // Patch the active note in cache with exactly what we saved
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

      // Sidebar ordering depends on updatedAt, so refresh the folder tree
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

  // Saves immediately if the current Markdown differs from the last saved value
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

  // Save the changes made to the note content after debouncing
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

  // Toggle editor editability when mode changes
  useEffect(() => {
    if (editor) editor.setEditable(isEditing);
  }, [editor, isEditing]);

  // When switching to read mode, clear dirty states visually if desired
  useEffect(() => {
    if (!isEditing) {
      setContentDirty(false);
      setContentState("idle");
    }
  }, [isEditing, setContentState]);

  // useEffect to try a best-effort save when the tab is hidden or the page is closing
  useEffect(() => {
    if (!editor) return;

    const flush = () => {
      if (!editor || !contentDirty) return;
      const html = editor.getHTML();
      saveContent(html);
    };

    // If the tab is hidden or the page is unloading, attempt a final save
    const onVis = () => {
      if (document.hidden) flush();
    };

    // If the page is being unloaded, show a confirmation dialog to let the user save
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!contentDirty) return;
      flush();
      e.preventDefault();
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
    <>
      <NotePageHeader
        isEditing={isEditing}
        onToggleEditing={onToggleEditing}
        state={noteState}
        titleRef={titleRef}
      />
      <div
        className="flex flex-1 overflow-auto pt-4"
        // Add space so caret/content aren’t hidden behind the keyboard on iOS
        style={{ paddingBottom: "var(--kb, 0px)" }}
      >
        <div className="container flex min-h-0 flex-1">
          <div className="flex min-h-0 w-full flex-1 flex-col">
            <TitleTextarea
              isEditing={isEditing}
              noteId={note.id}
              onEnter={() => editor?.chain().focus().run()}
              onStatusChange={setTitleState}
              ref={titleRef}
              title={note.title}
            />
            <div className="mt-4 min-h-0 flex-1">
              <EditorContent
                className={cn(
                  "tiptap h-full w-full",
                  !isEditing && "pointer-events-none select-text",
                )}
                editor={editor}
              />
            </div>
          </div>
        </div>
      </div>
      <NotePageFooter editor={editor} isEditing={isEditing} />
    </>
  );
};

const NotePageHeader = ({
  state,
  isEditing,
  onToggleEditing,
  titleRef,
}: {
  state: SyncState;
  isEditing: boolean;
  onToggleEditing: () => void;
  titleRef: RefObject<HTMLTextAreaElement | null>;
}) => {
  return (
    <header className="sticky top-0 isolate z-10 flex h-10 w-full items-center px-3 lg:px-6">
      <SidebarTrigger className="lg:hidden" />
      <div className="ml-auto flex items-center gap-2">
        <StatusIcon labelPrefix="Note" state={state} />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label={isEditing ? "Reading mode" : "Editing mode"}
              className="size-7"
              onClick={onToggleEditing}
              size="icon"
              variant="ghost"
            >
              {isEditing ? <TbBook /> : <TbEdit />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isEditing ? "Switch to read mode" : "Switch to edit mode"}
          </TooltipContent>
        </Tooltip>
        <NotePageDropdown titleRef={titleRef} />
      </div>
    </header>
  );
};

const NotePageFooter = ({
  isEditing,
  editor,
}: {
  isEditing: boolean;
  editor: Editor | null;
}) => {
  const [, forceUpdate] = useState({});
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const linkInputRef = useRef<HTMLInputElement>(null);
  const [listDropdownOpen, setListDropdownOpen] = useState(false);
  const [headingDropdownOpen, setHeadingDropdownOpen] = useState(false);

  // Subscribe to editor events to trigger re-renders WITHOUT unmounting
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => forceUpdate({});

    editor.on("selectionUpdate", handleUpdate);
    editor.on("transaction", handleUpdate);

    return () => {
      editor.off("selectionUpdate", handleUpdate);
      editor.off("transaction", handleUpdate);
    };
  }, [editor]);

  // Focus input when popover opens
  useEffect(() => {
    if (linkPopoverOpen && linkInputRef.current) {
      linkInputRef.current.focus();
    }
  }, [linkPopoverOpen]);

  // Get existing link URL when selection changes
  useEffect(() => {
    if (!editor || !linkPopoverOpen) return;

    const { href } = editor.getAttributes("link");
    if (href) {
      setLinkUrl(href);
    }
  }, [editor, linkPopoverOpen]);

  if (!editor) return null;

  // When code or codeBlock is active, other inline formatting should be disabled
  const isCodeActive = editor.isActive("code");
  const isCodeBlockActive = editor.isActive("codeBlock");
  const disableFormatting = isCodeActive || isCodeBlockActive;

  // Validate URL using Zod
  const isValidUrl = urlSchema.safeParse(linkUrl.trim()).success;

  const handleSetLink = () => {
    if (!isValidUrl) return;

    // Set link with the URL
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: linkUrl.trim() })
      .run();

    setLinkPopoverOpen(false);
    setLinkUrl("");
  };

  const handleRemoveLink = () => {
    editor.chain().focus().unsetLink().run();
    setLinkPopoverOpen(false);
    setLinkUrl("");
  };

  // Determine which list type is active and its icon
  const getActiveListIcon = () => {
    if (editor.isActive("bulletList")) return TbList;
    if (editor.isActive("orderedList")) return TbListNumbers;
    if (editor.isActive("taskList")) return TbListCheck;
    return TbList;
  };

  // Determine which heading level is active and its icon
  const getActiveHeadingIcon = () => {
    if (editor.isActive("heading", { level: 1 })) return TbH1;
    if (editor.isActive("heading", { level: 2 })) return TbH2;
    if (editor.isActive("heading", { level: 3 })) return TbH3;
    if (editor.isActive("heading", { level: 4 })) return TbH4;
    if (editor.isActive("heading", { level: 5 })) return TbH5;
    if (editor.isActive("heading", { level: 6 })) return TbH6;
    return TbHeading;
  };

  const ActiveListIcon = getActiveListIcon();
  const isAnyListActive =
    editor.isActive("bulletList") ||
    editor.isActive("orderedList") ||
    editor.isActive("taskList");

  const ActiveHeadingIcon = getActiveHeadingIcon();
  const isAnyHeadingActive = editor.isActive("heading");

  return (
    <footer
      className="hide-scrollbar sticky bottom-0 isolate z-10 flex h-10 w-full items-center gap-2 overflow-x-auto border-muted/80 border-t px-3 md:justify-center lg:px-6"
      // Lift above the on-screen keyboard on iOS
      style={{ transform: "translateY(calc(-1 * var(--kb, 0px)))" }}
    >
      <div className="flex items-center justify-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              disabled={!isEditing || !editor.can().undo()}
              onClick={() => editor.chain().focus().undo().run()}
              size="iconSm"
              variant="ghost"
            >
              <TbArrowBackUp className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              disabled={!isEditing || !editor.can().redo()}
              onClick={() => editor.chain().focus().redo().run()}
              size="iconSm"
              variant="ghost"
            >
              <TbArrowForwardUp className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo</TooltipContent>
        </Tooltip>
      </div>

      <Separator
        className="data-[orientation=vertical]:h-6"
        orientation="vertical"
      />

      <div className="flex items-center justify-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenu
              onOpenChange={setHeadingDropdownOpen}
              open={headingDropdownOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  className="w-auto min-w-8 px-1.5"
                  disabled={!isEditing}
                  size="iconSm"
                  variant={isAnyHeadingActive ? "muted" : "ghost"}
                >
                  <ActiveHeadingIcon className="size-4" />
                  <TbChevronDown
                    className={cn(
                      "-ml-2 size-3 transition-transform duration-200",
                      headingDropdownOpen && "rotate-180",
                    )}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                onCloseAutoFocus={(e) => e.preventDefault()}
                side="top"
                sideOffset={8}
              >
                <DropdownMenuItem
                  onSelect={() => {
                    editor.chain().focus().toggleHeading({ level: 1 }).run();
                  }}
                >
                  <TbH1 className="text-muted-foreground" />
                  <span>Heading 1</span>
                  <TbCheck
                    className={cn(
                      "ml-auto size-4",
                      !editor.isActive("heading", { level: 1 }) && "invisible",
                    )}
                  />
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    editor.chain().focus().toggleHeading({ level: 2 }).run();
                  }}
                >
                  <TbH2 className="text-muted-foreground" />
                  <span>Heading 2</span>
                  <TbCheck
                    className={cn(
                      "ml-auto size-4",
                      !editor.isActive("heading", { level: 2 }) && "invisible",
                    )}
                  />
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    editor.chain().focus().toggleHeading({ level: 3 }).run();
                  }}
                >
                  <TbH3 className="text-muted-foreground" />
                  <span>Heading 3</span>
                  <TbCheck
                    className={cn(
                      "ml-auto size-4",
                      !editor.isActive("heading", { level: 3 }) && "invisible",
                    )}
                  />
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    editor.chain().focus().toggleHeading({ level: 4 }).run();
                  }}
                >
                  <TbH4 className="text-muted-foreground" />
                  <span>Heading 4</span>
                  <TbCheck
                    className={cn(
                      "ml-auto size-4",
                      !editor.isActive("heading", { level: 4 }) && "invisible",
                    )}
                  />
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    editor.chain().focus().toggleHeading({ level: 5 }).run();
                  }}
                >
                  <TbH5 className="text-muted-foreground" />
                  <span>Heading 5</span>
                  <TbCheck
                    className={cn(
                      "ml-auto size-4",
                      !editor.isActive("heading", { level: 5 }) && "invisible",
                    )}
                  />
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    editor.chain().focus().toggleHeading({ level: 6 }).run();
                  }}
                >
                  <TbH6 className="text-muted-foreground" />
                  <span>Heading 6</span>
                  <TbCheck
                    className={cn(
                      "ml-auto size-4",
                      !editor.isActive("heading", { level: 6 }) && "invisible",
                    )}
                  />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipTrigger>
          <TooltipContent>Headings</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              disabled={!isEditing || disableFormatting}
              onClick={() => editor.chain().focus().toggleBold().run()}
              size="iconSm"
              variant={editor.isActive("bold") ? "muted" : "ghost"}
            >
              <TbBold className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Bold</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              disabled={!isEditing || disableFormatting}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              size="iconSm"
              variant={editor.isActive("italic") ? "muted" : "ghost"}
            >
              <TbItalic className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Italic</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              disabled={!isEditing || disableFormatting}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              size="iconSm"
              variant={editor.isActive("underline") ? "muted" : "ghost"}
            >
              <TbUnderline className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Underline</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              disabled={!isEditing || disableFormatting}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              size="iconSm"
              variant={editor.isActive("strike") ? "muted" : "ghost"}
            >
              <TbStrikethrough className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Strikethrough</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              disabled={!isEditing || isCodeBlockActive}
              onClick={() => editor.chain().focus().toggleCode().run()}
              size="iconSm"
              variant={editor.isActive("code") ? "muted" : "ghost"}
            >
              <TbCode className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Code</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Popover onOpenChange={setLinkPopoverOpen} open={linkPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  disabled={!isEditing || disableFormatting}
                  size="iconSm"
                  variant={editor.isActive("link") ? "muted" : "ghost"}
                >
                  <TbLink className="size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="center"
                className="w-80 rounded-2xl p-3 lg:w-88"
                side="top"
                sideOffset={8}
              >
                <div className="space-y-3">
                  <div className="space-y-2">
                    <InputGroup className="h-8">
                      <InputGroupInput
                        onChange={(e) => setLinkUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (isValidUrl) {
                              handleSetLink();
                            }
                          } else if (e.key === "Escape") {
                            setLinkPopoverOpen(false);
                            setLinkUrl("");
                          }
                        }}
                        placeholder="https://example.com"
                        ref={linkInputRef}
                        type="url"
                        value={linkUrl}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          className="h-5"
                          disabled={!isValidUrl}
                          onClick={handleSetLink}
                          variant="secondary"
                        >
                          <TbArrowNarrowRight />
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                  </div>
                  {editor.isActive("link") && (
                    <Button
                      className="w-full"
                      onClick={handleRemoveLink}
                      size="xs"
                      variant="outline"
                    >
                      Remove Link
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </TooltipTrigger>
          <TooltipContent>Link</TooltipContent>
        </Tooltip>
      </div>

      <Separator
        className="data-[orientation=vertical]:h-6"
        orientation="vertical"
      />

      <div className="flex items-center justify-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenu
              onOpenChange={setListDropdownOpen}
              open={listDropdownOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  className="w-auto min-w-8 px-1.5"
                  disabled={!isEditing}
                  size="iconSm"
                  variant={isAnyListActive ? "muted" : "ghost"}
                >
                  <ActiveListIcon className="size-4" />
                  <TbChevronDown
                    className={cn(
                      "-ml-2 size-3 transition-transform duration-200",
                      listDropdownOpen && "rotate-180",
                    )}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                onCloseAutoFocus={(e) => e.preventDefault()}
                side="top"
                sideOffset={8}
              >
                <DropdownMenuItem
                  onSelect={() => {
                    editor.chain().focus().toggleBulletList().run();
                  }}
                >
                  <TbList className="text-muted-foreground" />
                  <span>Bullet List</span>
                  <TbCheck
                    className={cn(
                      "ml-auto size-4",
                      !editor.isActive("bulletList") && "invisible",
                    )}
                  />
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    editor.chain().focus().toggleOrderedList().run();
                  }}
                >
                  <TbListNumbers className="text-muted-foreground" />
                  <span>Ordered List</span>
                  <TbCheck
                    className={cn(
                      "ml-auto size-4",
                      !editor.isActive("orderedList") && "invisible",
                    )}
                  />
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    editor.chain().focus().toggleTaskList().run();
                  }}
                >
                  <TbListCheck className="text-muted-foreground" />
                  <span>Task List</span>
                  <TbCheck
                    className={cn(
                      "ml-auto size-4",
                      !editor.isActive("taskList") && "invisible",
                    )}
                  />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipTrigger>
          <TooltipContent>Lists</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              disabled={!isEditing}
              onClick={() => {
                // If code block is active, deactivate it first
                if (isCodeBlockActive) {
                  editor.chain().focus().toggleCodeBlock().run();
                }
                editor.chain().focus().toggleBlockquote().run();
              }}
              size="iconSm"
              variant={editor.isActive("blockquote") ? "muted" : "ghost"}
            >
              <TbBlockquote className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Blockquote</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              disabled={!isEditing}
              onClick={() => {
                // If blockquote is active, deactivate it first
                if (editor.isActive("blockquote")) {
                  editor.chain().focus().toggleBlockquote().run();
                }
                editor.chain().focus().toggleCodeBlock().run();
              }}
              size="iconSm"
              variant={editor.isActive("codeBlock") ? "muted" : "ghost"}
            >
              <TbSourceCode className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Code Block</TooltipContent>
        </Tooltip>
      </div>

      <Separator
        className="data-[orientation=vertical]:h-6"
        orientation="vertical"
      />

      <div className="flex items-center justify-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              disabled={!isEditing || disableFormatting}
              onClick={() => {
                // If subscript is active, deactivate it first
                if (editor.isActive("subscript")) {
                  editor.chain().focus().toggleSubscript().run();
                }
                editor.chain().focus().toggleSuperscript().run();
              }}
              size="iconSm"
              variant={editor.isActive("superscript") ? "muted" : "ghost"}
            >
              <TbSuperscript className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Superscript</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              disabled={!isEditing || disableFormatting}
              onClick={() => {
                // If superscript is active, deactivate it first
                if (editor.isActive("superscript")) {
                  editor.chain().focus().toggleSuperscript().run();
                }
                editor.chain().focus().toggleSubscript().run();
              }}
              size="iconSm"
              variant={editor.isActive("subscript") ? "muted" : "ghost"}
            >
              <TbSubscript className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Subscript</TooltipContent>
        </Tooltip>
      </div>
    </footer>
  );
};

const TitleTextarea = ({
  noteId,
  title,
  onEnter,
  onStatusChange,
  isEditing,
  ref,
}: ComponentProps<"textarea"> & {
  noteId: string;
  title: string;
  onEnter: () => void;
  onStatusChange: (s: SyncState) => void;
  isEditing: boolean;
}) => {
  const queryClient = useQueryClient();
  const renameNote = useServerFn($renameNote);

  const [value, setValue] = useState(title);
  const [dirty, setDirty] = useState(false);

  // DOM ref for focus checks and caret placement; expose to parent via "ref" prop
  const innerRef = useRef<HTMLTextAreaElement>(null);

  // Increasing number used to ignore older (stale) responses
  const titleSeqRef = useRef(0);

  const debounced = useDebounce(value.trim(), 750);

  // useEffect for exposing the internal ref to the parent (so editor can focus us on ArrowUp)
  useEffect(() => {
    if (!ref) return;
    if (typeof ref === "function") ref(innerRef.current);
    else
      (ref as RefObject<HTMLTextAreaElement | null>).current = innerRef.current;
  }, [ref]);

  // useEffect for syncing down external title updates unless the user is actively editing here
  useEffect(() => {
    // If currently focused and dirty, don't overwrite the user's in-progress edit
    if (innerRef.current === document.activeElement && dirty) return;
    setValue(title);
    setDirty(false);
    onStatusChange("idle");
  }, [title, onStatusChange, dirty]);

  // Non-optimistic rename mutation (server is source of truth)
  // We still patch the local note cache on success to keep the UI consistent without refetch
  const { mutate: saveTitle } = useMutation({
    mutationKey: ["rename-note-inline", noteId],
    mutationFn: async (newTitle: string) =>
      renameNote({ data: { noteId, title: newTitle } }),
    onMutate: () => {
      // Bump sequence; any earlier response becomes stale
      const seq = ++titleSeqRef.current;
      onStatusChange("saving");

      return { seq };
    },
    onSuccess: (_res, newTitle, ctx) => {
      // Drop stale responses (race condition guard)
      if (ctx?.seq !== titleSeqRef.current) return;

      onStatusChange("savedRecently");
      setTimeout(() => onStatusChange("idle"), 1000);

      // Patch active note in cache (no refetch) so the page stays consistent
      queryClient.setQueryData<DecryptedNote>(queryKeys.note(noteId), (prev) =>
        prev ? { ...prev, title: newTitle, updatedAt: new Date() } : prev,
      );

      // Sidebar needs updatedAt to re-sort items
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

  // Debounced save: only fire if the user actually typed (dirty) and title changed
  useEffect(() => {
    if (!dirty) return;
    if (!debounced) return;
    if (debounced === title.trim()) return;

    saveTitle(debounced);
  }, [debounced, title, dirty, saveTitle]);

  // useEffect for saving the note on blur/Enter/ArrowDown/exit events if there are any changes
  const flushIfChanged = useCallback(() => {
    const t = value.trim();

    if (!dirty) return;

    if (t && t !== title.trim()) {
      saveTitle(t);
    } else {
      setDirty(false);
    }
  }, [dirty, value, title, saveTitle]);

  // useEffect to try a best-effort save when the tab is hidden or the page is closing
  useEffect(() => {
    // If the tab is hidden or the page is unloading, attempt a final save
    const onVis = () => {
      if (document.hidden) flushIfChanged();
    };

    // If the page is being unloaded, show a confirmation dialog to let the user save
    // unsaved changes
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      flushIfChanged();
      e.preventDefault();
      (e as unknown as { returnValue: string }).returnValue = "";
    };

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [dirty, flushIfChanged]);

  // Render static title in read mode
  if (!isEditing) {
    return (
      <h1
        className="w-full bg-transparent font-semibold text-2xl leading-tight md:text-3xl"
        data-mode="read"
      >
        {value}
      </h1>
    );
  }

  return (
    <textarea
      aria-label="Note title"
      className="field-sizing-content w-full resize-none bg-transparent font-semibold text-2xl leading-tight outline-none focus:outline-none focus:ring-0 md:text-3xl xl:text-4xl"
      onBlur={flushIfChanged}
      onChange={(e) => {
        setValue(e.target.value);
        setDirty(true);
        onStatusChange("dirty");
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === "Escape") {
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

const NotePageDropdown = ({
  titleRef,
}: {
  titleRef: RefObject<HTMLTextAreaElement | null>;
}) => {
  const { noteId } = Route.useLoaderData();
  const navigate = useNavigate();
  const { queryClient } = Route.useRouteContext();
  const deleteNoteFn = useServerFn($deleteNote);

  // Get the title textarea ref from parent scope (we'll pass it down)
  // const titleInputRef = useRef<HTMLTextAreaElement>(null);

  const { mutate: deleteNote } = useMutation({
    mutationKey: ["delete-note-from-page", noteId],
    mutationFn: async () => deleteNoteFn({ data: { noteId } }),
    onMutate: async () => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: folderQueryOptions.queryKey,
      });

      const previousFolder = queryClient.getQueryData<FolderWithItems | null>(
        folderQueryOptions.queryKey,
      );
      if (!previousFolder) return { previous: null };

      // Clone and remove note
      const clone = (node: FolderWithItems): FolderWithItems => ({
        ...node,
        folders: node.folders.map(clone),
        notes: [...node.notes],
      });

      const draft = clone(previousFolder);
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

      if (!removed) return { previous: previousFolder };

      // Update cache
      queryClient.setQueryData(folderQueryOptions.queryKey, draft);

      // Navigate away to most recent note or home
      const mostRecent = getMostRecentlyUpdatedNote(draft);
      if (mostRecent) {
        navigate({ to: "/notes/$noteId", params: { noteId: mostRecent.id } });
      } else {
        navigate({ to: "/" });
      }

      return { previous: previousFolder };
    },
    onError: (error, _vars, ctx) => {
      // Rollback on error
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="size-7" size={"icon"} variant={"ghost"}>
          <TbDotsVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={"end"} className="w-56" side={"bottom"}>
        <DropdownMenuItem
          onSelect={() => {
            setTimeout(() => {
              titleRef.current?.focus();
              titleRef.current?.select();
            }, 250);
          }}
        >
          <TbEdit className="text-muted-foreground" />
          <span>Rename note</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => deleteNote()} variant="destructive">
          <TbTrash className="text-muted-foreground" />
          <span>Delete note</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Used to show sync state between the server and the local versions of the note.
// "savedRecently" is used briefly after success to provide visual feedback
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
