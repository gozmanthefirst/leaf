import type { Note, User } from "@repo/db";
import type { FolderWithItems } from "@repo/db/validators/folder-validators";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useClickAway } from "@uidotdev/usehooks";
import { Image } from "@unpic/react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
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

const SIDEBAR_BTN_SIZE: "sm" | "default" | "lg" = "sm";

export const AppSidebar = ({ user }: { user: User }) => {
  const mainRoute = getRouteApi("/_main");
  const { queryClient } = mainRoute.useRouteContext();
  const signOut = useServerFn($signOut);
  const getFolder = useServerFn($getFolder);
  const navigate = useNavigate();

  const { isMobile } = useSidebar();
  const { setTheme, theme } = useTheme();

  const folderQuery = useQuery({
    ...folderQueryOptions,
    queryFn: () => getFolder(),
  });

  const rootFolder = folderQuery.data;

  const folderStats = rootFolder ? countFolderStats(rootFolder) : null;

  // This is for opening the recently updated note's folder path by default on initial render.
  // We use useMemo to avoid re-computing on every render.
  const openFolderIds = useMemo(
    () =>
      rootFolder
        ? new Set(findLatestNoteFolderPath(rootFolder))
        : new Set<string>(),
    [rootFolder],
  );

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
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton size={SIDEBAR_BTN_SIZE}>
                    <item.icon />
                    <span>{item.title}</span>
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
              <FolderTree folder={rootFolder} openFolderIds={openFolderIds} />
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

const FolderTree = ({
  folder,
  openFolderIds,
}: {
  folder: FolderWithItems | null | undefined;
  openFolderIds?: Set<string>;
}) => {
  if (!folder) return null;

  if (folder.folders.length === 0 && folder.notes.length === 0) {
    return (
      <div className="flex flex-col gap-4 px-2 py-2">
        <p className="text-muted-foreground text-xs">
          You have no notes or folders. Create one to get started.
        </p>
        <Button size={"xs"}>
          <TbFilePlus className="size-4" />
          <span className="text-xs">Create your first note</span>
        </Button>
      </div>
    );
  }

  const { folders, notes } = sortFolderItems(folder);

  if (folder.isRoot) {
    return (
      <>
        {folders.map((f) => (
          <FolderNode folder={f} key={f.id} openFolderIds={openFolderIds} />
        ))}
        {notes.map((n) => (
          <NoteItem key={n.id} note={n} />
        ))}
      </>
    );
  }

  return <FolderNode folder={folder} openFolderIds={openFolderIds} />;
};

const FolderNode = ({
  folder,
  openFolderIds,
}: {
  folder: FolderWithItems;
  openFolderIds?: Set<string>;
}) => {
  const [renaming, setRenaming] = useState(false);
  const [folderName, setFolderName] = useState(folder.name);

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

  const { folders, notes } = sortFolderItems(folder);
  const isOpen = openFolderIds?.has(folder.id) ?? false;

  const startFolderRename = () => {
    setRenaming(true);
  };

  return (
    <Collapsible className="group/collapsible" defaultOpen={isOpen}>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            onClick={(e) => (renaming ? e.stopPropagation() : undefined)}
            size={SIDEBAR_BTN_SIZE}
            variant={renaming ? "input" : "default"}
          >
            <TbChevronRight className="transition-transform group-data-[state=open]/collapsible:rotate-90" />
            {renaming ? (
              <input
                className="w-full bg-transparent focus-visible:outline-none"
                onChange={(e) => setFolderName(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setRenaming(false);
                    // TODO: trigger rename mutation here.
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
        {renaming ? null : (
          <FolderNodeDropdown startFolderRename={startFolderRename} />
        )}
      </SidebarMenuItem>
      <CollapsibleContent className="ml-4 border-muted border-l pl-2">
        <SidebarMenu>
          {folders.map((f) => (
            <FolderNode folder={f} key={f.id} openFolderIds={openFolderIds} />
          ))}
          {notes.map((n) => (
            <NoteItem key={n.id} note={n} />
          ))}
        </SidebarMenu>
      </CollapsibleContent>
    </Collapsible>
  );
};

const FolderNodeDropdown = ({
  startFolderRename,
}: {
  startFolderRename: () => void;
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
          <TbFilePlus className="text-muted-foreground" />
          <span>New note</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <TbFolderPlus className="text-muted-foreground" />
          <span>New folder</span>
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

// Actions
const items = [
  {
    title: "Create new folder",
    url: "#",
    icon: TbFolderPlus,
  },
  {
    title: "Create new note",
    url: "#",
    icon: TbFilePlus,
  },
];

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
