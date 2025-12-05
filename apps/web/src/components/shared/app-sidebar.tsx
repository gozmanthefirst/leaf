import type { User } from "@repo/db/schemas/user.schema";
import type { FolderWithItems } from "@repo/db/validators/folder.validator";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Image } from "@unpic/react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import {
  TbDeviceDesktop,
  TbDotsVertical,
  TbFilePlus,
  TbFolderPlus,
  TbLogout,
  TbMoon,
  TbPaint,
  TbSettings,
  TbSun,
} from "react-icons/tb";
import { toast } from "sonner";

import { useFolderMutations } from "@/hooks/use-folder-mutations";
import { useNoteMutations } from "@/hooks/use-note-mutations";
import { useTreeDnD } from "@/hooks/use-tree-dnd";
import { authClient } from "@/lib/better-auth-client";
import { queryKeys } from "@/lib/query";
import type { Theme } from "@/lib/types";
import {
  countFolderStats,
  findLatestNoteFolderPath,
  initialsFromName,
  maskEmail,
} from "@/lib/utils";
import { $getFolder, folderQueryOptions } from "@/server/folder";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
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
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../ui/sidebar";
import { cancelToastEl } from "../ui/toaster";
import { VirtualizedTree } from "./virtualized-tree";

const SIDEBAR_BTN_SIZE: "sm" | "default" | "lg" = "default";

export const AppSidebar = ({ user }: { user: User }) => {
  const mainRoute = getRouteApi("/_main");
  const { queryClient } = mainRoute.useRouteContext();
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

  // useEffect to update openFolderIds when rootFolder changes
  useEffect(() => {
    setOpenFolderIds((prev) => {
      if (prev.size === 0) return initialOpenFolderIds;
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
    toast.promise(
      authClient.signOut().then(() => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.user(),
        });
        navigate({ to: "/auth/sign-in" });
      }),
      {
        loading: "Signing out...",
        success: "Signed out successfully",
        error: "Failed to sign out. Please try again.",
        ...cancelToastEl,
      },
    );
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
      if (id === targetFolderId) return;

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

        <SidebarGroup className="flex-1 overflow-hidden">
          <SidebarGroupLabel>Notes</SidebarGroupLabel>
          <SidebarGroupContent className="h-full">
            {rootFolder && (
              <VirtualizedTree
                activeNoteParentId={activeNoteParentId}
                activeParentId={activeParentId}
                copyNoteOptimistic={copyNoteOptimistic}
                createFolderOptimistic={createFolderOptimistic}
                createNoteOptimistic={createNoteOptimistic}
                createNotePending={createNotePending}
                creatingFolderPending={creatingFolderPending}
                deleteFolderOptimistic={deleteFolderOptimistic}
                deleteNoteOptimistic={deleteNoteOptimistic}
                draggedItem={dnd.draggedItem}
                dropTarget={dnd.dropTarget}
                endDrag={dnd.endDrag}
                isDragging={dnd.isDragging}
                isNotePending={isNotePending}
                moveFolderOptimistic={moveFolderOptimistic}
                moveNoteOptimistic={moveNoteOptimistic}
                onCancelFolderCreation={cancelFolderCreation}
                onCancelNoteCreation={cancelNoteCreation}
                onCloseFolder={closeFolder}
                onDrop={handleDrop}
                onOpenFolder={openFolder}
                onToggleFolder={toggleFolder}
                openFolderIds={openFolderIds}
                renameFolderOptimistic={renameFolderOptimistic}
                renameNoteOptimistic={renameNoteOptimistic}
                rootFolder={rootFolder}
                setDragOver={dnd.setDragOver}
                startDrag={dnd.startDrag}
                startFolderCreation={startFolderCreation}
                startNoteCreation={startNoteCreation}
              />
            )}
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
                    <span className="truncate font-semibold">{user.name}</span>
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
