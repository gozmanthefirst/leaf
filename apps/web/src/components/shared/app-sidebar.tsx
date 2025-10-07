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

import { useIsMobile } from "@/hooks/use-mobile";
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
  $deleteFolder,
  $getFolder,
  $renameFolder,
  folderQueryOptions,
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
  start: (parentId: string) => void;
  cancel: () => void;
  isOpen: (folderId: string) => boolean;
  openFolder: (folderId: string) => void;
  closeFolder: (folderId: string) => void;
  toggleFolder: (folderId: string) => void;
  createFolderOptimistic: (name: string, parentId: string) => void;
  deleteFolderOptimistic: (folderId: string) => void;
  renameFolderOptimistic: (
    folderId: string,
    parentId: string,
    name: string,
  ) => void; // NEW
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
  const deleteFolder = useServerFn($deleteFolder);
  const renameFolder = useServerFn($renameFolder); // NEW
  const navigate = useNavigate();

  const [activeParentId, setActiveParentId] = useState<string | null>(null);

  const { isMobile } = useSidebar();
  const { setTheme, theme } = useTheme();

  const folderQuery = useQuery({
    ...folderQueryOptions,
    queryFn: () => getFolder(),
  });

  const rootFolder = folderQuery.data;

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

  // FIX: Do NOT overwrite previously opened folders whenever rootFolder data changes.
  // Instead, only add any newly required ids (e.g. latest note path) once data refreshes.
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

  const createFolderMutation = useMutation({
    mutationKey: ["create-folder"],
    mutationFn: async (vars: { name: string; parentId?: string }) =>
      await createFolder({
        data: { name: vars.name, parentId: vars.parentId },
      }),
    // Optimistic update
    onMutate: async (vars) => {
      const parentId = vars.parentId ?? rootFolder?.id;
      if (!parentId || !rootFolder) {
        return { previous: null as FolderWithItems | null };
      }

      await queryClient.cancelQueries({
        queryKey: folderQueryOptions.queryKey,
      });

      const previous = queryClient.getQueryData<FolderWithItems | null>(
        folderQueryOptions.queryKey,
      );
      if (!previous) return { previous: null as FolderWithItems | null };

      const tempId = `temp-${Date.now()}`;

      // Deep clone preserving structure
      const clone = (node: FolderWithItems): FolderWithItems => ({
        ...node,
        folders: node.folders.map(clone),
        notes: [...node.notes],
      });

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
        for (const f of node.folders) {
          if (insert(f)) return true;
        }
        return false;
      };

      insert(draft);

      queryClient.setQueryData(folderQueryOptions.queryKey, draft);

      // hide input
      setActiveParentId(null);

      return { previous, tempId, parentId };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(folderQueryOptions.queryKey, context.previous);
      }
      const apiError = apiErrorHandler(error, {
        defaultMessage: "Failed to create folder.",
      });
      toast.error(apiError.details, cancelToastEl);
    },
    onSuccess: (data, _vars, context) => {
      if (!context?.tempId) return;
      const serverFolder = data.data;
      const current = queryClient.getQueryData<FolderWithItems | null>(
        folderQueryOptions.queryKey,
      );
      if (!current) return;

      const replace = (node: FolderWithItems): FolderWithItems => ({
        ...node,
        folders: node.folders.map((f) => {
          if (f.id === context.tempId) {
            return {
              ...f,
              id: serverFolder.id,
              name: serverFolder.name,
              createdAt: serverFolder.createdAt,
              updatedAt: serverFolder.updatedAt,
              parentFolderId: serverFolder.parentFolderId,
              isRoot: serverFolder.isRoot,
              userId: serverFolder.userId,
              folders: f.folders, // preserve (should be empty)
              notes: f.notes,
              // omit __optimistic
            };
          }
          return replace(f);
        }),
      });

      const patched = replace(current);
      queryClient.setQueryData(folderQueryOptions.queryKey, patched);
    },
    onSettled: () => {
      // light refetch to ensure deep consistency
      queryClient.invalidateQueries({ queryKey: folderQueryOptions.queryKey });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationKey: ["delete-folder"],
    mutationFn: async (vars: { folderId: string }) =>
      deleteFolder({ data: { folderId: vars.folderId } }),
    onMutate: async ({ folderId }) => {
      // Protect root folder
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

      // Deep clone
      const clone = (node: FolderWithItems): FolderWithItems => ({
        ...node,
        folders: node.folders.map(clone),
        notes: [...node.notes],
      });
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
        for (const f of node.folders) {
          if (remove(f)) return true;
        }
        return false;
      };

      remove(draft);

      // If nothing removed, bail (e.g. stale)
      if (!removedNode) return { previous };

      // Gather all folder ids in removed subtree to clean open state & active creation
      const removedIds: string[] = [];
      const gather = (n: FolderWithItems) => {
        removedIds.push(n.id);
        n.folders.forEach(gather);
      };
      gather(removedNode);

      // Update openFolderIds (remove any removed ids)
      setOpenFolderIds((prev) => {
        if (prev.size === 0) return prev;
        const next = new Set(prev);
        removedIds.forEach((id) => {
          next.delete(id);
        });
        return next;
      });

      // Cancel creation input if it was inside deleted subtree
      setActiveParentId((prev) =>
        prev && removedIds.includes(prev) ? null : prev,
      );

      // Optimistically set new tree
      queryClient.setQueryData(folderQueryOptions.queryKey, draft);

      return { previous, removedNode };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(folderQueryOptions.queryKey, context.previous);
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

  // RENAME mutation (optimistic)
  const renameFolderMutation = useMutation({
    mutationKey: ["rename-folder"],
    mutationFn: async (vars: {
      folderId: string;
      parentId: string;
      name: string;
    }) =>
      await renameFolder({
        data: {
          folderId: vars.folderId,
          parentId: vars.parentId,
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

      const clone = (node: FolderWithItems): FolderWithItems => ({
        ...node,
        folders: node.folders.map(clone),
        notes: [...node.notes],
      });
      const draft = clone(previous);

      const update = (node: FolderWithItems): boolean => {
        if (node.id === folderId) {
          node.name = name;
          node.updatedAt = new Date();
          return true;
        }
        for (const f of node.folders) {
          if (update(f)) return true;
        }
        return false;
      };
      update(draft);

      queryClient.setQueryData(folderQueryOptions.queryKey, draft);

      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(folderQueryOptions.queryKey, context.previous);
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

  const createFolderOptimistic = (name: string, parentId: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createFolderMutation.mutate({ name: trimmed, parentId });
  };

  const deleteFolderOptimistic = (folderId: string) => {
    deleteFolderMutation.mutate({ folderId });
  };

  const renameFolderOptimistic = (
    folderId: string,
    parentId: string,
    name: string,
  ) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    renameFolderMutation.mutate({ folderId, parentId, name: trimmed });
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
        createFolderOptimistic,
        deleteFolderOptimistic,
        renameFolderOptimistic, // NEW
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
        <FolderNode
          folder={f}
          key={f.id}
          siblingNames={folders.filter((x) => x.id !== f.id).map((x) => x.name)}
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
        <NoteItem key={n.id} note={n} />
      ))}
    </>
  );
};

/* ---------- Folder Node ---------- */
const FolderNode = ({
  folder,
  siblingNames = [],
}: {
  folder: FolderWithItems;
  siblingNames?: string[];
}) => {
  const {
    activeParentId,
    start,
    cancel,
    isOpen,
    openFolder,
    closeFolder,
    toggleFolder,
    createFolderOptimistic,
    renameFolderOptimistic, // NEW
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

  const trimmedRename = folderName.trim();
  const isDuplicateRename =
    renaming &&
    trimmedRename.length > 0 &&
    siblingNames.includes(trimmedRename) &&
    trimmedRename !== folder.name;

  const creating = false;

  const startFolderRename = () => setRenaming(true);

  return (
    <Collapsible
      className="collapsible-node"
      onOpenChange={(o) => (o ? openFolder(folder.id) : closeFolder(folder.id))}
      open={open}
    >
      <SidebarMenuItem ref={itemRef}>
        <Popover open={isDuplicateRename}>
          <PopoverTrigger asChild>
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
                        e.preventDefault();
                        e.stopPropagation();
                        if (
                          !trimmedRename ||
                          isDuplicateRename ||
                          trimmedRename === folder.name
                        )
                          return;
                        renameFolderOptimistic(
                          folder.id,
                          folder.parentFolderId,
                          trimmedRename,
                        );
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
              start(folder.id);
            }}
          />
        )}
      </SidebarMenuItem>

      <CollapsibleContent className="ml-4 border-muted border-l pl-2">
        <SidebarMenu>
          {folders.map((f) => (
            <FolderNode
              folder={f}
              key={f.id}
              siblingNames={folders
                .filter((x) => x.id !== f.id)
                .map((x) => x.name)}
            />
          ))}

          {isCreatingChild && (
            <FolderInputInline
              loading={creating}
              onCancel={cancel}
              onCreate={(name) => createFolderOptimistic(name, folder.id)}
              parentId={folder.id}
              parentOpen={open}
              siblingNames={folders.map((f) => f.name)}
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
            <TbChevronRight
              aria-hidden="true"
              className="pointer-events-none shrink-0 text-muted-foreground/60"
            />
            <input
              className="w-full bg-transparent focus-visible:outline-none"
              disabled={loading}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.stopPropagation(); // Prevent collapsing parent
                  e.preventDefault();
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
            <p className="font-medium text-sm">Name already exists</p>
            <p className="text-muted-foreground text-xs">
              Another folder here already has this name. Enter a different one.
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
  const { activeParentId, deleteFolderOptimistic } = useFolderCreation();

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
          if (activeParentId === folderId) e.preventDefault();
        }}
        side={isMobile ? "bottom" : "right"}
      >
        <DropdownMenuItem
          onSelect={() => {
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
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            deleteFolderOptimistic(folderId);
          }}
          variant="destructive"
        >
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
