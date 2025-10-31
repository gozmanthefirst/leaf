/** biome-ignore-all lint/a11y/noNoninteractiveElementInteractions: required */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: required */

import type { Note, User } from "@repo/db";
import type { FolderWithItems } from "@repo/db/validators/folder-validators";
import { useQuery } from "@tanstack/react-query";
import {
  getRouteApi,
  useMatchRoute,
  useNavigate,
} from "@tanstack/react-router";
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
  TbSun,
  TbTrash,
} from "react-icons/tb";
import { toast } from "sonner";

import { Spinner } from "@/components/ui/spinner";
import { useFolderMutations } from "@/hooks/use-folder-mutations";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNoteMutations } from "@/hooks/use-note-mutations";
import { usePersistentFocus } from "@/hooks/use-persistent-focus";
import { type DraggedItem, useTreeDnD } from "@/hooks/use-tree-dnd";
import { apiErrorHandler } from "@/lib/handle-api-error";
import { queryKeys } from "@/lib/query";
import type { Theme } from "@/lib/types";
import {
  countFolderStats,
  findLatestNoteFolderPath,
  initialsFromName,
  maskEmail,
  sortFolderItems,
  suggestUniqueTitle,
} from "@/lib/utils";
import { $signOut } from "@/server/auth";
import { $getFolder, folderQueryOptions } from "@/server/folder";
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
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
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

  startFolderCreation: (parentId: string) => void;
  cancelFolderCreation: () => void;

  activeNoteParentId: string | null;
  startNoteCreation: (parentId: string) => void;
  cancelNoteCreation: () => void;

  isOpen: (folderId: string) => boolean;
  openFolder: (folderId: string) => void;
  closeFolder: (folderId: string) => void;
  toggleFolder: (folderId: string) => void;

  createFolderOptimistic: (name: string, parentId: string) => void;
  deleteFolderOptimistic: (folderId: string) => void;
  renameFolderOptimistic: (folderId: string, name: string) => void;

  createNoteOptimistic: (title: string, parentId: string) => void;
  deleteNoteOptimistic: (noteId: string) => void;
  renameNoteOptimistic: (noteId: string, title: string) => void;
  copyNoteOptimistic: (noteId: string) => void;
  moveNoteOptimistic: (noteId: string, folderId: string) => void;
  moveFolderOptimistic: (folderId: string, parentFolderId: string) => void;
  createNotePending: boolean;
  isNotePending: (noteId: string) => boolean;

  // DnD state
  draggedItem: DraggedItem | null;
  dropTarget: string | null;
  startDrag: (item: DraggedItem) => void;
  endDrag: () => void;
  setDragOver: (targetId: string | null) => void;
  isDragging: boolean;
};

const FolderCreationContext = createContext<FolderCreationCtx | null>(null);
const useFolderCreation = () => {
  const ctx = useContext(FolderCreationContext);
  if (!ctx) throw new Error("useFolderCreation must be used inside provider");
  return ctx;
};
// ------------------------------------------------

const SIDEBAR_BTN_SIZE: "sm" | "default" | "lg" = "default";

export const AppSidebar = ({ user }: { user: User }) => {
  const mainRoute = getRouteApi("/_main");
  const { queryClient } = mainRoute.useRouteContext();
  const signOut = useServerFn($signOut);
  const getFolder = useServerFn($getFolder);
  const navigate = useNavigate();

  const [activeParentId, setActiveParentId] = useState<string | null>(null);
  const [activeNoteParentId, setActiveNoteParentId] = useState<string | null>(
    null,
  );

  const { isMobile } = useSidebar();
  const { setTheme, theme } = useTheme();

  // Get the root folder
  const folderQuery = useQuery({
    ...folderQueryOptions,
    queryFn: () => getFolder(),
  });
  const rootFolder = folderQuery.data;

  // Initial open folder ids (depends on the most recently updated note)
  const initialOpenFolderIds = useMemo(
    () =>
      rootFolder
        ? new Set(findLatestNoteFolderPath(rootFolder))
        : new Set<string>(),
    [rootFolder],
  );

  // Controlled folder open state
  const [openFolderIds, setOpenFolderIds] = useState<Set<string>>(
    () => initialOpenFolderIds,
  );

  // useEffect to update openFolderIds when rootFolder changes since the effect depends
  // on initialOpenFolderIds, and this is turn is a memoized value that depends on rootFolder.
  // The openFolderIds state is initialized with initialOpenFolderIds only once on mount.
  // Then on sunsequent updates to the rootFolder, we merge the existing openFolderIds with
  // any new ids from the updated initialOpenFolderIds instead of overwriting it.
  useEffect(() => {
    setOpenFolderIds((prev) => {
      // If first load (prev empty) just take initial set.
      if (prev.size === 0) return initialOpenFolderIds;
      // Merge: keep what was open, ensure path ids stay open, never close others.
      const merged = new Set(prev);
      initialOpenFolderIds.forEach((id) => {
        merged.add(id);
      });
      return merged;
    });
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

  const {
    createFolderOptimistic,
    deleteFolderOptimistic,
    renameFolderOptimistic,
    creatingFolderPending,
    moveFolderOptimistic,
  } = useFolderMutations({
    queryClient,
    rootFolder,
    user,
    setActiveParentId,
    setOpenFolderIds,
  });

  const {
    createNoteOptimistic,
    deleteNoteOptimistic,
    renameNoteOptimistic,
    copyNoteOptimistic,
    createNotePending,
    isNotePending,
    moveNoteOptimistic,
  } = useNoteMutations({
    queryClient,
    rootFolder,
    user,
    setActiveNoteParentId,
  });

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

  // Creation handlers
  const startFolderCreation = (parentId: string) => {
    openFolder(parentId);
    setActiveParentId(parentId);
  };
  const cancelFolderCreation = () => setActiveParentId(null);
  const startNoteCreation = (parentId: string) => {
    openFolder(parentId);
    setActiveNoteParentId(parentId);
  };
  const cancelNoteCreation = () => setActiveNoteParentId(null);

  // Folder creation submit wrapper
  const submitCreation = (name: string, parentId: string) => {
    createFolderOptimistic(name, parentId);
  };

  // Actions list
  const actions = [
    {
      title: "Create new note",
      icon: TbFilePlus,
      onClick: () => rootFolder && startNoteCreation(rootFolder.id),
    },
    {
      title: "Create new folder",
      icon: TbFolderPlus,
      onClick: () => rootFolder && startFolderCreation(rootFolder.id),
    },
  ];

  const dnd = useTreeDnD();

  // Handle drop
  const handleDrop = (targetFolderId: string) => {
    if (!dnd.draggedItem) return;

    const { id, type } = dnd.draggedItem;

    if (type === "note") {
      moveNoteOptimistic(id, targetFolderId);
    } else if (type === "folder") {
      // Prevent dropping folder into itself or its descendants
      if (id === targetFolderId) return;

      // Check if target is a descendant (simple check, you might want more robust)
      const isDescendant = (
        node: FolderWithItems,
        targetId: string,
      ): boolean => {
        if (node.id === targetId) return true;
        return node.folders.some((f) => isDescendant(f, targetId));
      };

      if (rootFolder) {
        const findFolder = (
          node: FolderWithItems,
          fId: string,
        ): FolderWithItems | null => {
          if (node.id === fId) return node;
          for (const f of node.folders) {
            const found = findFolder(f, fId);
            if (found) return found;
          }
          return null;
        };

        const draggedFolder = findFolder(rootFolder, id);
        if (draggedFolder && isDescendant(draggedFolder, targetFolderId)) {
          toast.error("Cannot move a folder into itself or its descendants");
          return;
        }
      }

      moveFolderOptimistic(id, targetFolderId);
    }

    dnd.endDrag();
  };

  return (
    <FolderCreationContext.Provider
      value={{
        activeParentId,
        startFolderCreation,
        cancelFolderCreation,
        activeNoteParentId,
        startNoteCreation,
        cancelNoteCreation,
        isOpen,
        openFolder,
        closeFolder,
        toggleFolder,
        createFolderOptimistic,
        deleteFolderOptimistic,
        renameFolderOptimistic,
        createNoteOptimistic,
        deleteNoteOptimistic,
        renameNoteOptimistic,
        copyNoteOptimistic,
        moveNoteOptimistic,
        moveFolderOptimistic,
        createNotePending,
        isNotePending,
        draggedItem: dnd.draggedItem,
        dropTarget: dnd.dropTarget,
        startDrag: dnd.startDrag,
        endDrag: dnd.endDrag,
        setDragOver: dnd.setDragOver,
        isDragging: dnd.isDragging,
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
                    creating={creatingFolderPending}
                    isCreating={activeParentId === rootFolder.id}
                    onCancel={cancelFolderCreation}
                    onDrop={handleDrop}
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
  onDrop,
}: {
  rootFolder: FolderWithItems;
  isCreating: boolean;
  creating: boolean;
  onSubmit: (name: string, parentId: string) => void;
  onCancel: () => void;
  onDrop: (targetFolderId: string) => void;
}) => {
  const { folders, notes } = sortFolderItems(rootFolder);
  const {
    activeNoteParentId,
    startNoteCreation,
    cancelNoteCreation,
    createNoteOptimistic,
    createNotePending,
    draggedItem,
    dropTarget,
    setDragOver,
    isDragging,
  } = useFolderCreation();
  const creatingNoteHere = activeNoteParentId === rootFolder.id;

  // Drag and drop handlers for root folder
  const isDropTarget = dropTarget === rootFolder.id;
  // Don't show visual indication if item is already in root folder
  const showDropIndicator =
    isDropTarget &&
    draggedItem &&
    (draggedItem.type === "note"
      ? !notes.some((n) => n.id === draggedItem.id)
      : !folders.some((f) => f.id === draggedItem.id));

  const canAcceptDrop =
    isDragging && draggedItem && draggedItem.id !== rootFolder.id;

  const handleDragOver = (e: React.DragEvent) => {
    if (!canAcceptDrop) return;
    e.preventDefault();
    e.stopPropagation();
    setDragOver(rootFolder.id);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if actually leaving the container
    const relatedTarget = e.relatedTarget as Node | null;
    const currentTarget = e.currentTarget as Node;
    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      setDragOver(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (canAcceptDrop) {
      onDrop(rootFolder.id);
    }
  };

  return (
    <>
      {folders.length === 0 && notes.length === 0 && (
        <div className="flex flex-col gap-4 px-2 py-2">
          <p className="text-muted-foreground text-xs">
            You have no notes or folders. Create one to get started.
          </p>
          <Button onClick={() => startNoteCreation(rootFolder.id)} size="xs">
            <TbFilePlus className="size-4" />
            <span className="text-xs">Create your first note</span>
          </Button>
        </div>
      )}

      {/* Wrap all root folder content in a droppable container */}
      <div
        className={`${showDropIndicator ? "rounded-md bg-accent/50" : ""}`}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {folders.map((f) => (
          <FolderNode
            folder={f}
            key={f.id}
            onDrop={onDrop}
            siblingNames={folders
              .filter((x) => x.id !== f.id)
              .map((x) => x.name)}
          />
        ))}

        {isCreating && (
          <FolderInputInline
            loading={creating}
            onCancel={onCancel}
            onCreate={onSubmit}
            parentId={rootFolder.id}
            parentOpen={true}
            siblingNames={folders.map((f) => f.name)}
          />
        )}

        {notes.map((n) => (
          <NoteItem
            key={n.id}
            note={n}
            siblingTitles={notes
              .filter((x) => x.id !== n.id)
              .map((x) => x.title)}
          />
        ))}

        {creatingNoteHere && (
          <NoteInputInline
            loading={createNotePending}
            onCancel={cancelNoteCreation}
            onCreate={(title) => createNoteOptimistic(title, rootFolder.id)}
            parentId={rootFolder.id}
            parentOpen={true}
            siblingTitles={notes.map((n) => n.title)}
          />
        )}
      </div>
    </>
  );
};

/* ---------- Folder Node ---------- */
const FolderNode = ({
  folder,
  siblingNames = [],
  onDrop,
}: {
  folder: FolderWithItems;
  siblingNames?: string[];
  onDrop: (targetFolderId: string) => void;
}) => {
  const {
    activeParentId,
    activeNoteParentId,
    startFolderCreation,
    cancelFolderCreation,
    cancelNoteCreation,
    isOpen,
    openFolder,
    closeFolder,
    toggleFolder,
    createFolderOptimistic,
    createNoteOptimistic,
    renameFolderOptimistic,
    createNotePending,
    draggedItem,
    dropTarget,
    startDrag,
    endDrag,
    setDragOver,
    isDragging,
  } = useFolderCreation();

  const [renaming, setRenaming] = useState(false);
  const [folderName, setFolderName] = useState(folder.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRef = useClickAway<HTMLLIElement>(() => setRenaming(false));
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  useHotkeys("esc", () => setRenaming(false), { enableOnFormTags: true });

  useEffect(() => {
    if (renaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [renaming]);

  // Clear hover timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  const { folders, notes } = sortFolderItems(folder);
  const open = isOpen(folder.id);
  const isCreatingChildFolder = activeParentId === folder.id;
  const isCreatingChildNote = activeNoteParentId === folder.id;

  const trimmedRename = folderName.trim();
  const isDuplicateRename =
    renaming &&
    trimmedRename.length > 0 &&
    siblingNames.includes(trimmedRename) &&
    trimmedRename !== folder.name;

  const startFolderRename = () => setRenaming(true);

  // Drag and drop handlers
  const isBeingDragged = draggedItem?.id === folder.id;
  const isDropTarget = dropTarget === folder.id;

  // Check if dragged item is already in this folder
  const isAlreadyInFolder =
    draggedItem &&
    ((draggedItem.type === "note" &&
      notes.some((n) => n.id === draggedItem.id)) ||
      (draggedItem.type === "folder" &&
        folders.some((f) => f.id === draggedItem.id)));

  // Don't show visual indication if item is already in this folder
  const showDropIndicator = isDropTarget && !isAlreadyInFolder;

  const canAcceptDrop =
    isDragging && draggedItem && draggedItem.id !== folder.id;

  const handleDragStart = (e: React.DragEvent) => {
    if (renaming) return;
    e.stopPropagation();
    startDrag({
      id: folder.id,
      type: "folder",
      name: folder.name,
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!canAcceptDrop) return;
    e.preventDefault();
    e.stopPropagation();
    setDragOver(folder.id);

    // Start timer to auto-open folder if closed
    if (!open && !hoverTimerRef.current) {
      hoverTimerRef.current = setTimeout(() => {
        openFolder(folder.id);
        hoverTimerRef.current = null;
      }, 800); // 800ms delay
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Clear auto-open timer
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

    // Only clear drop target if actually leaving the folder area
    const relatedTarget = e.relatedTarget as Node | null;
    const currentTarget = e.currentTarget as Node;
    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      setDragOver(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Clear auto-open timer
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

    if (canAcceptDrop) {
      onDrop(folder.id);
    }
  };

  return (
    <Collapsible
      className="collapsible-node"
      onOpenChange={(o) => (o ? openFolder(folder.id) : closeFolder(folder.id))}
      open={open}
    >
      <SidebarMenuItem
        className={`${showDropIndicator ? "rounded-md bg-accent/50" : ""} ${isBeingDragged ? "opacity-50" : ""}`}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        ref={itemRef}
      >
        <Popover open={isDuplicateRename}>
          <PopoverTrigger asChild>
            <CollapsibleTrigger
              asChild
              onClick={() => {
                if (!renaming) toggleFolder(folder.id);
              }}
            >
              <SidebarMenuButton
                draggable={!renaming}
                onClick={(e) => (renaming ? e.stopPropagation() : undefined)}
                onDragEnd={endDrag}
                onDragStart={handleDragStart}
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
                        e.preventDefault();
                        e.stopPropagation();
                        if (
                          !trimmedRename ||
                          isDuplicateRename ||
                          trimmedRename === folder.name
                        )
                          return;
                        renameFolderOptimistic(folder.id, trimmedRename);
                        setRenaming(false);
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
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-64 p-3"
            side="right"
            sideOffset={6}
          >
            <div className="space-y-2">
              <p className="font-medium text-sm">Name already exists</p>
              <p className="text-muted-foreground text-xs">
                Another folder here already has this name.
              </p>
            </div>
          </PopoverContent>
        </Popover>
        {!renaming && (
          <FolderNodeDropdown
            folderId={folder.id}
            startFolderRename={startFolderRename}
            startNewFolder={() => {
              openFolder(folder.id);
              startFolderCreation(folder.id);
            }}
          />
        )}
      </SidebarMenuItem>

      <CollapsibleContent className="ml-4 border-muted border-l pl-2">
        {/* Wrap content in droppable div that highlights parent folder */}
        <div
          className={`${showDropIndicator ? "bg-accent/20" : ""}`}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <SidebarMenu>
            {folders.map((f) => (
              <FolderNode
                folder={f}
                key={f.id}
                onDrop={onDrop}
                siblingNames={folders
                  .filter((x) => x.id !== f.id)
                  .map((x) => x.name)}
              />
            ))}

            {isCreatingChildFolder && (
              <FolderInputInline
                loading={false}
                onCancel={cancelFolderCreation}
                onCreate={(name) => createFolderOptimistic(name, folder.id)}
                parentId={folder.id}
                parentOpen={open}
                siblingNames={folders.map((f) => f.name)}
              />
            )}

            {isCreatingChildNote && (
              <NoteInputInline
                loading={createNotePending}
                onCancel={cancelNoteCreation}
                onCreate={(title) => createNoteOptimistic(title, folder.id)}
                parentId={folder.id}
                parentOpen={open}
                siblingTitles={notes.map((n) => n.title)}
              />
            )}

            {notes.map((n) => (
              <NoteItem
                key={n.id}
                note={n}
                siblingTitles={notes
                  .filter((x) => x.id !== n.id)
                  .map((x) => x.title)}
              />
            ))}
          </SidebarMenu>
        </div>
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
  siblingNames = [],
}: {
  parentId: string;
  onCreate: (name: string, parentId: string) => void;
  onCancel: () => void;
  loading: boolean;
  parentOpen?: boolean;
  siblingNames?: string[];
}) => {
  const [name, setName] = useState("Untitled");
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRef = useClickAway<HTMLLIElement>(() => onCancel());
  useHotkeys("esc", onCancel, { enableOnFormTags: true });

  const isMobileViewport = useIsMobile(768);
  const popoverSide = isMobileViewport ? "top" : "right";
  const popoverAlign: "start" | "center" = isMobileViewport
    ? "center"
    : "start";
  const popoverWidthClass = isMobileViewport
    ? "w-(--radix-popover-trigger-width)"
    : "w-64";

  const trimmed = name.trim();
  const isDuplicate = trimmed.length > 0 && siblingNames.includes(trimmed);

  usePersistentFocus(inputRef, {
    enabled: parentOpen && !loading,
    select: true,
  });

  return (
    <SidebarMenuItem ref={itemRef}>
      <Popover open={isDuplicate}>
        <PopoverTrigger asChild>
          <SidebarMenuButton
            className="disabled:opacity-50"
            disabled={loading}
            onClick={(e) => e.stopPropagation()}
            size={SIDEBAR_BTN_SIZE}
            variant="input"
          >
            <TbFile
              aria-hidden="true"
              className="pointer-events-none shrink-0 text-muted-foreground/60"
            />
            <input
              className="w-full bg-transparent focus-visible:outline-none"
              disabled={loading}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isDuplicate) return;
                  onCreate(trimmed, parentId);
                } else if (e.key === "Escape") {
                  e.stopPropagation();
                  onCancel();
                }
              }}
              ref={inputRef}
              value={name}
            />
          </SidebarMenuButton>
        </PopoverTrigger>
        <PopoverContent
          align={popoverAlign}
          className={`${popoverWidthClass} p-3`}
          side={popoverSide}
          sideOffset={6}
        >
          <div className="space-y-2">
            <p className="font-medium text-sm">Title already exists</p>
            <p className="text-muted-foreground text-xs">
              Another folder here already has this title. Enter a different one.
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </SidebarMenuItem>
  );
};

/* ---------- FolderNodeDropdown ---------- */
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
  const {
    activeParentId,
    activeNoteParentId,
    startNoteCreation,
    deleteFolderOptimistic,
  } = useFolderCreation();

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
          // Prevent focus from returning to trigger when spawning either folder or note input
          if (activeParentId === folderId || activeNoteParentId === folderId) {
            e.preventDefault();
          }
        }}
        side={isMobile ? "bottom" : "right"}
      >
        <DropdownMenuItem onSelect={() => startNoteCreation(folderId)}>
          <TbFilePlus className="text-muted-foreground" />
          <span>New note</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => startNewFolder()}>
          <TbFolderPlus className="text-muted-foreground" />
          <span>New folder</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem disabled>
          <TbFileArrowRight className="text-muted-foreground" />
          <span>Move folder to...</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={startFolderRename}>
          <TbEdit className="text-muted-foreground" />
          <span>Rename folder</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => deleteFolderOptimistic(folderId)}
          variant="destructive"
        >
          <TbTrash className="text-muted-foreground" />
          <span>Delete folder</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const NoteItem = ({
  note,
  siblingTitles = [],
}: {
  note: Note;
  siblingTitles?: string[];
}) => {
  const navigate = useNavigate();
  const matchRoute = useMatchRoute();

  const { setOpenMobile } = useSidebar();

  const {
    renameNoteOptimistic,
    isNotePending,
    draggedItem,
    startDrag,
    endDrag,
  } = useFolderCreation();
  const pending = isNotePending(note.id);

  const [renaming, setRenaming] = useState(false);
  const [noteTitle, setNoteTitle] = useState(note.title);

  // Keep local state in sync with latest server title when not renaming
  useEffect(() => {
    if (!renaming) {
      setNoteTitle(note.title);
    }
  }, [note.title, renaming]);

  const inputRef = useClickAway<HTMLInputElement>(() => {
    setRenaming(false);
    setNoteTitle(note.title);
  });
  useHotkeys(
    "esc",
    () => {
      setRenaming(false);
      setNoteTitle(note.title);
    },
    { enableOnFormTags: true },
  );

  useEffect(() => {
    if (renaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [renaming, inputRef]);

  const trimmed = noteTitle.trim();
  const isDuplicate =
    renaming &&
    trimmed.length > 0 &&
    siblingTitles.includes(trimmed) &&
    trimmed !== note.title;

  const isMobileViewport = useIsMobile(768);
  const popoverSide = isMobileViewport ? "top" : "right";
  const popoverAlign: "start" | "center" = isMobileViewport
    ? "center"
    : "start";
  const popoverWidthClass = isMobileViewport
    ? "w-(--radix-popover-trigger-width)"
    : "w-64";

  const startNoteRename = () => {
    // Ensure input starts with the latest title from props
    setNoteTitle(note.title);
    setRenaming(true);
  };

  const isBeingDragged = draggedItem?.id === note.id;

  const handleDragStart = (e: React.DragEvent) => {
    if (renaming || pending) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    startDrag({
      id: note.id,
      type: "note",
      name: note.title,
    });
  };

  return (
    <SidebarMenuItem
      className={`${isBeingDragged ? "opacity-50" : ""}`}
      onClick={() => {
        setOpenMobile(false);
      }}
    >
      <Popover open={isDuplicate}>
        <PopoverTrigger asChild>
          {renaming ? (
            <SidebarMenuButton
              onClick={(e) => e.stopPropagation()}
              size={SIDEBAR_BTN_SIZE}
              variant="input"
            >
              {pending ? <Spinner /> : <TbFile />}
              <input
                className="w-full bg-transparent focus-visible:outline-none"
                disabled={pending}
                onChange={(e) => setNoteTitle(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!trimmed || isDuplicate || trimmed === note.title)
                      return;
                    renameNoteOptimistic(note.id, trimmed);
                    setRenaming(false);
                  } else if (e.key === "Escape") {
                    setNoteTitle(note.title);
                    setRenaming(false);
                  }
                }}
                ref={inputRef}
                value={noteTitle}
              />
            </SidebarMenuButton>
          ) : (
            <SidebarMenuButton
              asChild
              className={`${pending ? "cursor-not-allowed opacity-50" : ""}`}
              draggable={!pending}
              isActive={
                !!matchRoute({
                  to: `/notes/$noteId`,
                  params: { noteId: note.id },
                })
              }
              onDragEnd={endDrag}
              onDragStart={handleDragStart}
              size={SIDEBAR_BTN_SIZE}
            >
              <div
                onClick={(e) => {
                  if (pending) e.preventDefault();
                  navigate({
                    to: `/notes/$noteId`,
                    params: { noteId: note.id },
                  });
                }}
                onKeyUp={(e) => {
                  if (pending) e.preventDefault();
                  navigate({
                    to: `/notes/$noteId`,
                    params: { noteId: note.id },
                  });
                }}
                // params={{ noteId: note.id }}
                // to="/notes/$noteId"
              >
                {pending ? <Spinner /> : <TbFile />}
                <span>{note.title}</span>
              </div>
            </SidebarMenuButton>
          )}
        </PopoverTrigger>
        <PopoverContent
          align={popoverAlign}
          className={`${popoverWidthClass} p-3`}
          side={popoverSide}
          sideOffset={6}
        >
          <div className="space-y-2">
            <p className="font-medium text-sm">Title already exists</p>
            <p className="text-muted-foreground text-xs">
              Another note here already has this title.
            </p>
          </div>
        </PopoverContent>
      </Popover>
      {renaming || pending ? null : (
        <NoteItemDropdown noteId={note.id} startNoteRename={startNoteRename} />
      )}
    </SidebarMenuItem>
  );
};

const NoteItemDropdown = ({
  startNoteRename,
  noteId,
}: {
  startNoteRename: () => void;
  noteId: string;
}) => {
  const navigate = useNavigate();

  const { isMobile, setOpenMobile } = useSidebar();
  const { deleteNoteOptimistic, copyNoteOptimistic, isNotePending } =
    useFolderCreation();
  const pending = isNotePending(noteId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuAction disabled={pending} showOnHover>
          <TbDotsVertical
            className={`size-4 text-muted-foreground ${
              pending ? "opacity-40" : ""
            }`}
          />
          <span className="sr-only">More</span>
        </SidebarMenuAction>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={isMobile ? "end" : "start"}
        className="w-56"
        onClick={(e) => e.stopPropagation()}
        side={isMobile ? "bottom" : "right"}
      >
        <DropdownMenuItem
          onSelect={() => {
            navigate({ to: `/notes/$noteId`, params: { noteId } });
            setOpenMobile(false);
          }}
        >
          <TbFile className="text-muted-foreground" />
          <span>Open</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          disabled={pending}
          onSelect={() => {
            copyNoteOptimistic(noteId);
          }}
        >
          <TbFiles className="text-muted-foreground" />
          <span>Make a copy</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled={pending || true}>
          <TbFileArrowRight className="text-muted-foreground" />
          <span>Move note to...</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled={pending} onSelect={startNoteRename}>
          <TbEdit className="text-muted-foreground" />
          <span>Rename note</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={pending}
          onSelect={() => deleteNoteOptimistic(noteId)}
          variant="destructive"
        >
          <TbTrash className="text-muted-foreground" />
          <span>Delete note</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// -------------------- NoteInputInline Component --------------------
const NoteInputInline = ({
  parentId,
  onCreate,
  onCancel,
  loading,
  parentOpen = true,
  siblingTitles = [],
}: {
  parentId: string;
  onCreate: (title: string, parentId: string) => void;
  onCancel: () => void;
  loading: boolean;
  parentOpen?: boolean;
  siblingTitles?: string[];
}) => {
  // Use a unique default title based on siblings
  const initialTitle = useMemo(
    () => suggestUniqueTitle("Untitled", siblingTitles),
    [siblingTitles],
  );
  const [title, setTitle] = useState(initialTitle);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRef = useClickAway<HTMLLIElement>(() => onCancel());
  useHotkeys("esc", onCancel, { enableOnFormTags: true });

  const isMobileViewport = useIsMobile(768);
  const popoverSide = isMobileViewport ? "top" : "right";
  const popoverAlign: "start" | "center" = isMobileViewport
    ? "center"
    : "start";
  const popoverWidthClass = isMobileViewport
    ? "w-(--radix-popover-trigger-width)"
    : "w-64";

  const trimmed = title.trim();
  const isDuplicate = trimmed.length > 0 && siblingTitles.includes(trimmed);

  usePersistentFocus(inputRef, {
    enabled: parentOpen && !loading,
    select: true,
  });

  return (
    <SidebarMenuItem ref={itemRef}>
      <Popover open={isDuplicate}>
        <PopoverTrigger asChild>
          <SidebarMenuButton
            className="disabled:opacity-50"
            disabled={loading}
            onClick={(e) => e.stopPropagation()}
            size={SIDEBAR_BTN_SIZE}
            variant="input"
          >
            <TbFile
              aria-hidden="true"
              className="pointer-events-none shrink-0 text-muted-foreground/60"
            />
            <input
              className="w-full bg-transparent focus-visible:outline-none"
              disabled={loading}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isDuplicate) return;
                  onCreate(trimmed, parentId);
                } else if (e.key === "Escape") {
                  e.stopPropagation();
                  onCancel();
                }
              }}
              ref={inputRef}
              value={title}
            />
          </SidebarMenuButton>
        </PopoverTrigger>
        <PopoverContent
          align={popoverAlign}
          className={`${popoverWidthClass} p-3`}
          side={popoverSide}
          sideOffset={6}
        >
          <div className="space-y-2">
            <p className="font-medium text-sm">Title already exists</p>
            <p className="text-muted-foreground text-xs">
              Another note here already has this title. Enter a different one.
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </SidebarMenuItem>
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
