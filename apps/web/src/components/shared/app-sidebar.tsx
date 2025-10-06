import type { Note, User } from "@repo/db";
import type { FolderWithItems } from "@repo/db/validators/folder-validators";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useClickAway } from "@uidotdev/usehooks";
import { Image } from "@unpic/react";
import { useTheme } from "next-themes";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useHotkeys } from "react-hotkeys-hook";
import {
  TbAppWindow,
  TbChevronRight,
  TbDeviceDesktop,
  TbDotsVertical,
  TbEdit,
  TbFile,
  TbFileArrowRight,
  TbFilePlus,
  TbFiles,
  TbFolderPlus,
  TbLogout,
  TbMoon,
  TbPaint,
  TbSettings,
  TbStar,
  TbSun,
  TbTrash,
} from "react-icons/tb";
import { toast } from "sonner";

import { usePersistentFocus } from "@/hooks/use-persistent-focus";
import { apiErrorHandler } from "@/lib/handle-api-error";
import { queryKeys } from "@/lib/query";
import type { Theme } from "@/lib/types";
import {
  countFolderStats,
  findLatestNoteFolderPath,
  initialsFromName,
  maskEmail,
  sortFolderItems,
} from "@/lib/utils";
import { $signOut } from "@/server/auth";
import {
  $createFolder,
  $getFolder,
  $getFoldersInFolder,
  folderQueryOptions,
  foldersInFolderQueryOptions,
} from "@/server/folder";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../ui/sidebar";
import { cancelToastEl } from "../ui/toaster";

/* ---------- Folder Creation Context ---------- */
type FolderCreationCtx = {
  activeParentId: string | null;
  start: (parentId: string) => void;
  cancel: () => void;
  isOpen: (folderId: string) => boolean;
  openFolder: (folderId: string) => void;
  closeFolder: (folderId: string) => void;
  toggleFolder: (folderId: string) => void;
};

const FolderCreationContext = createContext<FolderCreationCtx | null>(null);
const useFolderCreation = () => {
  const ctx = useContext(FolderCreationContext);
  if (!ctx) throw new Error("useFolderCreation must be used inside provider");
  return ctx;
};
// ------------------------------------------------

const SIDEBAR_BTN_SIZE: "sm" | "default" | "lg" = "sm";

export const AppSidebar = ({ user }: { user: User }) => {
  const mainRoute = getRouteApi("/_main");
  const { queryClient } = mainRoute.useRouteContext();
  const signOut = useServerFn($signOut);
  const getFolder = useServerFn($getFolder);
  const createFolder = useServerFn($createFolder);
  const getFoldersInFolder = useServerFn($getFoldersInFolder);
  const navigate = useNavigate();

  const [activeParentId, setActiveParentId] = useState<string | null>(null);

  const { isMobile } = useSidebar();
  const { setTheme, theme } = useTheme();

  const folderQuery = useQuery({
    ...folderQueryOptions,
    queryFn: () => getFolder(),
  });
  const foldersInFolderQuery = useQuery({
    ...foldersInFolderQueryOptions,
    queryFn: () => getFoldersInFolder(),
  });

  const rootFolder = folderQuery.data;
  const _foldersInFolder = foldersInFolderQuery.data;

  // INITIAL open folder ids (latest note path)
  const initialOpenFolderIds = useMemo(
    () =>
      rootFolder
        ? new Set(findLatestNoteFolderPath(rootFolder))
        : new Set<string>(),
    [rootFolder],
  );

  // Controlled open state
  const [openFolderIds, setOpenFolderIds] = useState<Set<string>>(
    () => initialOpenFolderIds,
  );

  useEffect(() => {
    // Refresh open state when rootFolder changes drastically
    setOpenFolderIds(initialOpenFolderIds);
  }, [initialOpenFolderIds]);

  // Folder open state helpers
  const openFolder = (id: string) =>
    setOpenFolderIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  const closeFolder = (id: string) =>
    setOpenFolderIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  const toggleFolder = (id: string) =>
    setOpenFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const isOpen = (id: string) => openFolderIds.has(id);

  const createFolderMutation = useMutation({
    mutationFn: async (vars: { name: string; parentId?: string }) =>
      await createFolder({
        data: { name: vars.name, parentId: vars.parentId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderQueryOptions.queryKey });
      queryClient.invalidateQueries({
        queryKey: foldersInFolderQueryOptions.queryKey,
      });
      setActiveParentId(null);
    },
  });

  const startCreation = (parentId: string) => {
    // ensure folder is open before input mounts
    openFolder(parentId);
    // then set active parent to show folder input node
    setActiveParentId(parentId);
  };
  const cancelCreation = () => setActiveParentId(null);

  const submitCreation = (name: string, parentId: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createFolderMutation.mutate({ name: trimmed, parentId });
  };

  // actions
  const actions = [
    {
      title: "Create new folder",
      icon: TbFolderPlus,
      onClick: () => rootFolder && startCreation(rootFolder.id),
    },
    {
      title: "Create new note",
      icon: TbFilePlus,
      onClick: () => {
        /* TODO note creation */
      },
    },
  ];

  const signOutUser = async () => {
    toast.promise(signOut, {
      loading: "Signing out...",
      success: (response) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.user(),
        });
        navigate({ to: "/auth/sign-in" });

        return response.details;
      },
      error: (error) => {
        const apiError = apiErrorHandler(error, {
          defaultMessage: "Failed to sign out. Please try again.",
        });
        return apiError.details;
      },
      ...cancelToastEl,
    });
  };

  const folderStats = rootFolder ? countFolderStats(rootFolder) : null;

  return (
    <FolderCreationContext.Provider
      value={{
        activeParentId,
        start: startCreation,
        cancel: cancelCreation,
        isOpen,
        openFolder,
        closeFolder,
        toggleFolder,
      }}
    >
      <Sidebar variant="inset">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="h-auto rounded-2xl"
                size={"lg"}
              >
                <div className="flex items-center gap-3 font-medium text-lg">
                  <div className="size-10">
                    <Image
                      alt="App Logo"
                      background="auto"
                      layout="fullWidth"
                      priority
                      src={"/logos/app-logo.png"}
                    />
                  </div>
                  <div>
                    <h3 className="font-roboto font-semibold text-xl">Leaf</h3>
                    <p className="text-muted-foreground text-xs">
                      {folderStats
                        ? `${folderStats.folders} ${folderStats.folders === 1 ? "folder" : "folders"}. ${folderStats.notes} ${folderStats.notes === 1 ? "note" : "notes"}.`
                        : "0 folders. 0 notes."}
                    </p>
                  </div>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Actions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {actions.map((action) => (
                  <SidebarMenuItem key={action.title}>
                    <SidebarMenuButton
                      onClick={action.onClick}
                      size={SIDEBAR_BTN_SIZE}
                    >
                      <action.icon />
                      <span>{action.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Notes</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {rootFolder && (
                  <RootFolderSection
                    creating={createFolderMutation.isPending}
                    isCreating={activeParentId === rootFolder.id}
                    onCancel={cancelCreation}
                    onSubmit={submitCreation}
                    rootFolder={rootFolder}
                  />
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    className="h-auto data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    size="lg"
                  >
                    <Avatar className="size-10 rounded-lg">
                      <AvatarImage
                        alt={user.name}
                        src={user.image || undefined}
                      />
                      <AvatarFallback className="rounded-lg">
                        {initialsFromName(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user.name}
                      </span>
                      <span className="truncate text-muted-foreground text-xs">
                        {maskEmail(user.email)}
                      </span>
                    </div>
                    <TbDotsVertical className="ml-auto size-4 text-muted-foreground" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="size-10 rounded-lg">
                        <AvatarImage
                          alt={user.name}
                          src={user.image || undefined}
                        />
                        <AvatarFallback className="rounded-lg">
                          {initialsFromName(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                          {user.name}
                        </span>
                        <span className="truncate text-muted-foreground text-xs">
                          {maskEmail(user.email)}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  <DropdownMenuGroup>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <TbPaint className="size-4" />
                        <span>Theme</span>
                      </DropdownMenuSubTrigger>

                      <DropdownMenuSubContent className="min-w-0">
                        {uiThemes.map((uiTheme) => (
                          <DropdownMenuCheckboxItem
                            checked={uiTheme.value === theme}
                            key={uiTheme.value}
                            onSelect={() => setTheme(uiTheme.value as Theme)}
                          >
                            <uiTheme.icon />
                            <span className="max-[480px]:hidden">
                              {uiTheme.label}
                            </span>
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    <DropdownMenuItem disabled>
                      <TbSettings className="size-4" />
                      Settings
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOutUser} variant="destructive">
                    <TbLogout className="size-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </FolderCreationContext.Provider>
  );
};

/* ---------- Root Folder Section ---------- */
const RootFolderSection = ({
  rootFolder,
  isCreating,
  creating,
  onSubmit,
  onCancel,
}: {
  rootFolder: FolderWithItems;
  isCreating: boolean;
  creating: boolean;
  onSubmit: (name: string, parentId: string) => void;
  onCancel: () => void;
}) => {
  const { folders, notes } = sortFolderItems(rootFolder);
  const empty = folders.length === 0 && notes.length === 0;

  return (
    <>
      {empty && (
        <div className="flex flex-col gap-4 px-2 py-2">
          <p className="text-muted-foreground text-xs">
            You have no notes or folders. Create one to get started.
          </p>
          <Button size="xs">
            <TbFilePlus className="size-4" />
            <span className="text-xs">Create your first note</span>
          </Button>
        </div>
      )}

      {folders.map((f) => (
        <FolderNode folder={f} key={f.id} />
      ))}

      {isCreating && (
        <FolderInputInline
          loading={creating}
          onCancel={onCancel}
          onCreate={onSubmit}
          parentId={rootFolder.id}
          parentOpen={true}
        />
      )}

      {notes.map((n) => (
        <NoteItem key={n.id} note={n} />
      ))}
    </>
  );
};

/* ---------- Folder Node (adds inline creation for children) ---------- */
const FolderNode = ({ folder }: { folder: FolderWithItems }) => {
  const createFolder = useServerFn($createFolder);
  const {
    activeParentId,
    start,
    cancel,
    isOpen,
    openFolder,
    closeFolder,
    toggleFolder,
  } = useFolderCreation();

  const [renaming, setRenaming] = useState(false);
  const [folderName, setFolderName] = useState(folder.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRef = useClickAway<HTMLLIElement>(() => setRenaming(false));
  useHotkeys("esc", () => setRenaming(false), { enableOnFormTags: true });

  useEffect(() => {
    if (renaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [renaming]);

  const { folders, notes } = sortFolderItems(folder);
  const open = isOpen(folder.id);
  const isCreatingChild = activeParentId === folder.id;

  const { mutate: createChild, isPending: creating } = useMutation({
    mutationFn: async (vars: { name: string }) =>
      await createFolder({ data: { name: vars.name, parentId: folder.id } }),
    onSuccess: () => {
      cancel();
    },
  });

  const startFolderRename = () => setRenaming(true);

  return (
    <Collapsible
      className="collapsible-node"
      onOpenChange={(o) => (o ? openFolder(folder.id) : closeFolder(folder.id))}
      open={open}
    >
      <SidebarMenuItem ref={itemRef}>
        <CollapsibleTrigger
          asChild
          onClick={() => {
            if (!renaming) toggleFolder(folder.id);
          }}
        >
          <SidebarMenuButton
            onClick={(e) => (renaming ? e.stopPropagation() : undefined)}
            size={SIDEBAR_BTN_SIZE}
            variant={renaming ? "input" : "default"}
          >
            <TbChevronRight
              className={`transition-transform ${open ? "rotate-90" : ""}`}
            />
            {renaming ? (
              <input
                className="w-full bg-transparent focus-visible:outline-none"
                onChange={(e) => setFolderName(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setRenaming(false);
                    // TODO: rename mutation
                  } else if (e.key === "Escape") {
                    setFolderName(folder.name);
                    setRenaming(false);
                  }
                }}
                ref={inputRef}
                value={folderName}
              />
            ) : (
              <span>{folder.name}</span>
            )}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        {!renaming && (
          <FolderNodeDropdown
            folderId={folder.id}
            startFolderRename={startFolderRename}
            startNewFolder={() => {
              openFolder(folder.id);
              start(folder.id);
            }}
          />
        )}
      </SidebarMenuItem>

      <CollapsibleContent className="ml-4 border-muted border-l pl-2">
        <SidebarMenu>
          {folders.map((f) => (
            <FolderNode folder={f} key={f.id} />
          ))}

          {isCreatingChild && (
            <FolderInputInline
              loading={creating}
              onCancel={cancel}
              onCreate={(name) => createChild({ name })}
              parentId={folder.id}
              parentOpen={open}
            />
          )}

          {notes.map((n) => (
            <NoteItem key={n.id} note={n} />
          ))}
        </SidebarMenu>
      </CollapsibleContent>
    </Collapsible>
  );
};

/* ---------- Inline creation input ---------- */
const FolderInputInline = ({
  parentId,
  onCreate,
  onCancel,
  loading,
  parentOpen = true,
}: {
  parentId: string;
  onCreate: (name: string, parentId: string) => void;
  onCancel: () => void;
  loading: boolean;
  parentOpen?: boolean;
}) => {
  const [name, setName] = useState("Untitled");
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRef = useClickAway<HTMLLIElement>(() => onCancel());
  useHotkeys("esc", onCancel, { enableOnFormTags: true });

  // Replaces earlier complex effect
  usePersistentFocus(inputRef, {
    enabled: parentOpen && !loading,
    select: true,
  });

  return (
    <SidebarMenuItem ref={itemRef}>
      <SidebarMenuButton
        className="disabled:opacity-50"
        disabled={loading}
        onClick={(e) => e.stopPropagation()}
        size={SIDEBAR_BTN_SIZE}
        variant="input"
      >
        {/* Visible, non-interactive chevron to indicate a folder row shape */}
        <TbChevronRight
          aria-hidden="true"
          className="pointer-events-none shrink-0 text-muted-foreground/60"
        />
        <input
          className="w-full bg-transparent focus-visible:outline-none"
          disabled={loading}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onCreate(name, parentId);
            else if (e.key === "Escape") onCancel();
          }}
          ref={inputRef}
          value={name}
        />
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

/* ---------- FolderNodeDropdown updated to expose startNewFolder ---------- */
const FolderNodeDropdown = ({
  folderId,
  startFolderRename,
  startNewFolder,
}: {
  folderId: string;
  startFolderRename: () => void;
  startNewFolder: () => void;
}) => {
  const { isMobile } = useSidebar();
  const { activeParentId } = useFolderCreation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuAction showOnHover>
          <TbDotsVertical className="size-4 text-muted-foreground" />
          <span className="sr-only">More</span>
        </SidebarMenuAction>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={isMobile ? "end" : "start"}
        className="w-56"
        onCloseAutoFocus={(e) => {
          // Prevent Radix from restoring focus to trigger when we just spawned a creation input
          if (activeParentId === folderId) {
            e.preventDefault();
          }
        }}
        side={isMobile ? "bottom" : "right"}
      >
        <DropdownMenuItem
          onSelect={() => {
            // Let menu close, then start creation (slight delay optional)
            startNewFolder();
          }}
        >
          <TbFolderPlus className="text-muted-foreground" />
          <span>New folder</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <TbFilePlus className="text-muted-foreground" />
          <span>New note</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem>
          <TbFileArrowRight className="text-muted-foreground" />
          <span>Move folder to...</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={startFolderRename}>
          <TbEdit className="text-muted-foreground" />
          <span>Rename folder</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <TbTrash className="text-muted-foreground" />
          <span>Delete folder</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const NoteItem = ({ note }: { note: Note }) => {
  const [renaming, setRenaming] = useState(false);
  const [noteTitle, setNoteTitle] = useState(note.title);

  // Disable editing mode when clicking outside the input.
  const inputRef = useClickAway<HTMLInputElement>(() => {
    setRenaming(false);
  });

  // Disable editing mode by pressing "Esc" even if the input is not focused.
  useHotkeys("esc", () => setRenaming(false), {
    enableOnFormTags: true,
  });

  useEffect(() => {
    if (renaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [renaming, inputRef]);

  const startNoteRename = () => {
    setRenaming(true);
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={(e) => (renaming ? e.stopPropagation() : undefined)}
        size={SIDEBAR_BTN_SIZE}
        variant={renaming ? "input" : "default"}
      >
        <TbFile />
        {renaming ? (
          <input
            className="w-full bg-transparent focus-visible:outline-none"
            onChange={(e) => setNoteTitle(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setRenaming(false);
                // TODO: trigger rename mutation here.
              } else if (e.key === "Escape") {
                setNoteTitle(note.title);
                setRenaming(false);
              }
            }}
            ref={inputRef}
            value={noteTitle}
          />
        ) : (
          <span>{note.title}</span>
        )}
      </SidebarMenuButton>
      {renaming ? null : <NoteItemDropdown startNoteRename={startNoteRename} />}
    </SidebarMenuItem>
  );
};

const NoteItemDropdown = ({
  startNoteRename,
}: {
  startNoteRename: () => void;
}) => {
  const { isMobile } = useSidebar();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuAction showOnHover>
          <TbDotsVertical className="size-4 text-muted-foreground" />
          <span className="sr-only">More</span>
        </SidebarMenuAction>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={isMobile ? "end" : "start"}
        className="w-56"
        side={isMobile ? "bottom" : "right"}
      >
        <DropdownMenuItem>
          <TbFile className="text-muted-foreground" />
          <span>Open</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <TbAppWindow className="text-muted-foreground" />
          <span>Open in new window</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem>
          <TbFiles className="text-muted-foreground" />
          <span>Make a copy</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <TbFileArrowRight className="text-muted-foreground" />
          <span>Move note to...</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <TbStar className="text-muted-foreground" />
          <span>Favorite note</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={startNoteRename}>
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

const uiThemes = [
  {
    value: "system",
    label: "System",
    icon: TbDeviceDesktop,
  },
  {
    value: "light",
    label: "Light",
    icon: TbSun,
  },
  {
    value: "dark",
    label: "Dark",
    icon: TbMoon,
  },
];
