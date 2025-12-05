/** biome-ignore-all lint/a11y/noNoninteractiveElementInteractions: required */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: required */

import type { Note } from "@repo/db/schemas/note.schema";
import type { FolderWithItems } from "@repo/db/validators/folder.validator";
import { Link, useMatchRoute, useNavigate } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useClickAway } from "@uidotdev/usehooks";
import { useEffect, useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import {
  TbChevronRight,
  TbDotsVertical,
  TbEdit,
  TbFile,
  TbFilePlus,
  TbFiles,
  TbFolderPlus,
  TbTrash,
} from "react-icons/tb";

import { Spinner } from "@/components/ui/spinner";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePersistentFocus } from "@/hooks/use-persistent-focus";
import type { DraggedItem } from "@/hooks/use-tree-dnd";
import { sortFolderItems, suggestUniqueTitle } from "@/lib/utils";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../ui/sidebar";

/* ---------- Types ---------- */
type TreeNode =
  | {
      type: "folder";
      id: string;
      name: string;
      folder: FolderWithItems;
      depth: number;
      parentId: string | null;
      siblingNames: string[];
    }
  | {
      type: "note";
      id: string;
      title: string;
      note: Note;
      depth: number;
      parentId: string;
      siblingTitles: string[];
    }
  | {
      type: "folder-input";
      id: string;
      depth: number;
      parentId: string;
      siblingNames: string[];
    }
  | {
      type: "note-input";
      id: string;
      depth: number;
      parentId: string;
      siblingTitles: string[];
    };

export type VirtualizedTreeProps = {
  rootFolder: FolderWithItems;
  openFolderIds: Set<string>;
  onToggleFolder: (id: string) => void;
  onOpenFolder: (id: string) => void;
  onCloseFolder: (id: string) => void;
  // Creation state
  activeParentId: string | null;
  activeNoteParentId: string | null;
  onCancelFolderCreation: () => void;
  onCancelNoteCreation: () => void;
  // Mutations
  createFolderOptimistic: (name: string, parentId: string) => void;
  deleteFolderOptimistic: (folderId: string) => void;
  renameFolderOptimistic: (folderId: string, name: string) => void;
  moveFolderOptimistic: (folderId: string, parentFolderId: string) => void;
  createNoteOptimistic: (title: string, parentId: string) => void;
  deleteNoteOptimistic: (noteId: string) => void;
  renameNoteOptimistic: (noteId: string, title: string) => void;
  copyNoteOptimistic: (noteId: string) => void;
  moveNoteOptimistic: (noteId: string, folderId: string) => void;
  // Pending state
  createNotePending: boolean;
  creatingFolderPending: boolean;
  isNotePending: (noteId: string) => boolean;
  // DnD
  draggedItem: DraggedItem | null;
  dropTarget: string | null;
  startDrag: (item: DraggedItem) => void;
  endDrag: () => void;
  setDragOver: (targetId: string | null) => void;
  isDragging: boolean;
  onDrop: (targetFolderId: string) => void;
  // Actions
  startFolderCreation: (parentId: string) => void;
  startNoteCreation: (parentId: string) => void;
  // Estimated row height for virtualization
  estimatedRowHeight?: number;
};

const SIDEBAR_BTN_SIZE: "sm" | "default" | "lg" = "default";
const DEFAULT_ROW_HEIGHT = 32;

/* ---------- Flatten tree for virtualization ---------- */
function flattenTree(
  rootFolder: FolderWithItems,
  openFolderIds: Set<string>,
  activeParentId: string | null,
  activeNoteParentId: string | null,
): TreeNode[] {
  const nodes: TreeNode[] = [];

  const walk = (
    folder: FolderWithItems,
    depth: number,
    parentId: string | null,
  ) => {
    const { folders, notes } = sortFolderItems(folder);
    const isOpen = openFolderIds.has(folder.id);
    const isRootFolder = folder.isRoot;

    // For root folder, don't add the folder itself, just its children
    if (!isRootFolder) {
      nodes.push({
        type: "folder",
        id: folder.id,
        name: folder.name,
        folder,
        depth,
        parentId,
        siblingNames: [], // Will be filled by parent
      });
    }

    // Only add children if folder is open (or it's root)
    if (isOpen || isRootFolder) {
      const childDepth = isRootFolder ? depth : depth + 1;

      // Add child folders
      for (const childFolder of folders) {
        // Update sibling names for this folder
        const siblingNames = folders
          .filter((f) => f.id !== childFolder.id)
          .map((f) => f.name);

        // Temporarily set siblingNames on the node we're about to add
        walk(childFolder, childDepth, folder.id);

        // Find the node we just added and update its siblingNames
        const lastNode = nodes[nodes.length - 1];
        if (
          lastNode &&
          lastNode.type === "folder" &&
          lastNode.id === childFolder.id
        ) {
          lastNode.siblingNames = siblingNames;
        }
      }

      // Add folder creation input if active
      if (activeParentId === folder.id) {
        nodes.push({
          type: "folder-input",
          id: `folder-input-${folder.id}`,
          depth: childDepth,
          parentId: folder.id,
          siblingNames: folders.map((f) => f.name),
        });
      }

      // Add notes
      for (const note of notes) {
        const siblingTitles = notes
          .filter((n) => n.id !== note.id)
          .map((n) => n.title);
        nodes.push({
          type: "note",
          id: note.id,
          title: note.title,
          note,
          depth: childDepth,
          parentId: folder.id,
          siblingTitles,
        });
      }

      // Add note creation input if active
      if (activeNoteParentId === folder.id) {
        nodes.push({
          type: "note-input",
          id: `note-input-${folder.id}`,
          depth: childDepth,
          parentId: folder.id,
          siblingTitles: notes.map((n) => n.title),
        });
      }
    }
  };

  walk(rootFolder, 0, null);
  return nodes;
}

/* ---------- Main Component ---------- */
export const VirtualizedTree = ({
  rootFolder,
  openFolderIds,
  onToggleFolder,
  onOpenFolder,
  onCloseFolder,
  activeParentId,
  activeNoteParentId,
  onCancelFolderCreation,
  onCancelNoteCreation,
  createFolderOptimistic,
  deleteFolderOptimistic,
  renameFolderOptimistic,
  // moveFolderOptimistic is handled via onDrop in parent
  createNoteOptimistic,
  deleteNoteOptimistic,
  renameNoteOptimistic,
  copyNoteOptimistic,
  // moveNoteOptimistic is handled via onDrop in parent
  createNotePending,
  creatingFolderPending,
  isNotePending,
  draggedItem,
  dropTarget,
  startDrag,
  endDrag,
  setDragOver,
  isDragging,
  onDrop,
  startFolderCreation,
  startNoteCreation,
  estimatedRowHeight = DEFAULT_ROW_HEIGHT,
}: VirtualizedTreeProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  // Flatten the tree for virtualization
  const flatNodes = useMemo(
    () =>
      flattenTree(
        rootFolder,
        openFolderIds,
        activeParentId,
        activeNoteParentId,
      ),
    [rootFolder, openFolderIds, activeParentId, activeNoteParentId],
  );

  // Setup virtualizer
  const virtualizer = useVirtualizer({
    count: flatNodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan: 10, // Render 10 extra items above/below viewport
  });

  const { folders, notes } = sortFolderItems(rootFolder);
  const hasNoItems = folders.length === 0 && notes.length === 0;
  // Show empty state only if there are no items AND no active creation inputs
  const isEmpty =
    hasNoItems && activeParentId === null && activeNoteParentId === null;

  // Root folder drop handling
  const isRootDropTarget = dropTarget === rootFolder.id;
  const showRootDropIndicator =
    isRootDropTarget &&
    draggedItem &&
    (draggedItem.type === "note"
      ? !notes.some((n) => n.id === draggedItem.id)
      : !folders.some((f) => f.id === draggedItem.id));
  const canAcceptDrop =
    isDragging && draggedItem && draggedItem.id !== rootFolder.id;

  const handleRootDragOver = (e: React.DragEvent) => {
    if (!canAcceptDrop) return;
    e.preventDefault();
    e.stopPropagation();
    setDragOver(rootFolder.id);
  };

  const handleRootDragLeave = (e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as Node | null;
    const currentTarget = e.currentTarget as Node;
    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      setDragOver(null);
    }
  };

  const handleRootDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (canAcceptDrop) {
      onDrop(rootFolder.id);
    }
  };

  if (isEmpty) {
    return (
      <div className="flex flex-col gap-4 px-2 py-2">
        <p className="text-muted-foreground text-xs">
          You have no notes or folders. Create one to get started.
        </p>
        <Button
          disabled={createNotePending}
          onClick={() => createNoteOptimistic("Untitled", rootFolder.id)}
          size="xs"
        >
          <TbFilePlus className="size-4" />
          <span className="text-xs">Create your first note</span>
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`h-full overflow-auto p-0.5 ${showRootDropIndicator ? "rounded-md bg-accent/50" : ""}`}
      onDragLeave={handleRootDragLeave}
      onDragOver={handleRootDragOver}
      onDrop={handleRootDrop}
      ref={parentRef}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        <SidebarMenu>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const node = flatNodes[virtualRow.index];
            return (
              <div
                data-index={virtualRow.index}
                key={node.id}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <TreeNodeRow
                  copyNoteOptimistic={copyNoteOptimistic}
                  createFolderOptimistic={createFolderOptimistic}
                  createNoteOptimistic={createNoteOptimistic}
                  createNotePending={createNotePending}
                  creatingFolderPending={creatingFolderPending}
                  deleteFolderOptimistic={deleteFolderOptimistic}
                  deleteNoteOptimistic={deleteNoteOptimistic}
                  draggedItem={draggedItem}
                  dropTarget={dropTarget}
                  endDrag={endDrag}
                  isDragging={isDragging}
                  isNotePending={isNotePending}
                  node={node}
                  onCancelFolderCreation={onCancelFolderCreation}
                  onCancelNoteCreation={onCancelNoteCreation}
                  onCloseFolder={onCloseFolder}
                  onDrop={onDrop}
                  onOpenFolder={onOpenFolder}
                  onToggleFolder={onToggleFolder}
                  openFolderIds={openFolderIds}
                  renameFolderOptimistic={renameFolderOptimistic}
                  renameNoteOptimistic={renameNoteOptimistic}
                  setDragOver={setDragOver}
                  startDrag={startDrag}
                  startFolderCreation={startFolderCreation}
                  startNoteCreation={startNoteCreation}
                />
              </div>
            );
          })}
        </SidebarMenu>
      </div>
    </div>
  );
};

/* ---------- Tree Node Row ---------- */
type TreeNodeRowProps = {
  node: TreeNode;
  openFolderIds: Set<string>;
  onToggleFolder: (id: string) => void;
  onOpenFolder: (id: string) => void;
  onCloseFolder: (id: string) => void;
  onCancelFolderCreation: () => void;
  onCancelNoteCreation: () => void;
  createFolderOptimistic: (name: string, parentId: string) => void;
  deleteFolderOptimistic: (folderId: string) => void;
  renameFolderOptimistic: (folderId: string, name: string) => void;
  createNoteOptimistic: (title: string, parentId: string) => void;
  deleteNoteOptimistic: (noteId: string) => void;
  renameNoteOptimistic: (noteId: string, title: string) => void;
  copyNoteOptimistic: (noteId: string) => void;
  createNotePending: boolean;
  creatingFolderPending: boolean;
  isNotePending: (noteId: string) => boolean;
  draggedItem: DraggedItem | null;
  dropTarget: string | null;
  startDrag: (item: DraggedItem) => void;
  endDrag: () => void;
  setDragOver: (targetId: string | null) => void;
  isDragging: boolean;
  onDrop: (targetFolderId: string) => void;
  startFolderCreation: (parentId: string) => void;
  startNoteCreation: (parentId: string) => void;
};

const TreeNodeRow = (props: TreeNodeRowProps) => {
  const { node } = props;
  const paddingLeft = node.depth * 16; // 16px per level

  const style = {
    paddingLeft: `${paddingLeft}px`,
  };

  switch (node.type) {
    case "folder":
      return <FolderRow {...props} node={node} style={style} />;
    case "note":
      return <NoteRow {...props} node={node} style={style} />;
    case "folder-input":
      return <FolderInputRow {...props} node={node} style={style} />;
    case "note-input":
      return <NoteInputRow {...props} node={node} style={style} />;
  }
};

/* ---------- Folder Row ---------- */
type FolderRowProps = TreeNodeRowProps & {
  node: Extract<TreeNode, { type: "folder" }>;
  style: React.CSSProperties;
};

const FolderRow = ({
  node,
  style,
  openFolderIds,
  onToggleFolder,
  onOpenFolder,
  renameFolderOptimistic,
  deleteFolderOptimistic,
  draggedItem,
  dropTarget,
  startDrag,
  endDrag,
  setDragOver,
  isDragging,
  onDrop,
  startFolderCreation,
  startNoteCreation,
}: FolderRowProps) => {
  const [renaming, setRenaming] = useState(false);
  const [folderName, setFolderName] = useState(node.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRef = useClickAway<HTMLLIElement>(() => setRenaming(false));
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { isMobile } = useSidebar();

  useHotkeys("esc", () => setRenaming(false), { enableOnFormTags: true });

  useEffect(() => {
    if (renaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [renaming]);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  const open = openFolderIds.has(node.id);
  const trimmedRename = folderName.trim();
  const isDuplicateRename =
    renaming &&
    trimmedRename.length > 0 &&
    node.siblingNames.includes(trimmedRename) &&
    trimmedRename !== node.name;

  const isBeingDragged = draggedItem?.id === node.id;
  const isDropTarget = dropTarget === node.id;

  const { folders: childFolders, notes: childNotes } = sortFolderItems(
    node.folder,
  );
  const isAlreadyInFolder =
    draggedItem &&
    ((draggedItem.type === "note" &&
      childNotes.some((n) => n.id === draggedItem.id)) ||
      (draggedItem.type === "folder" &&
        childFolders.some((f) => f.id === draggedItem.id)));

  const showDropIndicator = isDropTarget && !isAlreadyInFolder;
  const canAcceptDrop = isDragging && draggedItem && draggedItem.id !== node.id;

  const handleDragStart = (e: React.DragEvent) => {
    if (renaming) return;
    e.stopPropagation();
    startDrag({
      id: node.id,
      type: "folder",
      name: node.name,
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!canAcceptDrop) return;
    e.preventDefault();
    e.stopPropagation();
    setDragOver(node.id);

    if (!open && !hoverTimerRef.current) {
      hoverTimerRef.current = setTimeout(() => {
        onOpenFolder(node.id);
        hoverTimerRef.current = null;
      }, 800);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    const relatedTarget = e.relatedTarget as Node | null;
    const currentTarget = e.currentTarget as Node;
    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      setDragOver(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (canAcceptDrop) {
      onDrop(node.id);
    }
  };

  return (
    <div style={style}>
      <SidebarMenuItem
        className={`${showDropIndicator ? "rounded-md bg-accent/50" : ""} ${isBeingDragged ? "opacity-50" : ""}`}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        ref={itemRef}
      >
        <Popover open={isDuplicateRename}>
          <PopoverTrigger asChild>
            <SidebarMenuButton
              draggable={!renaming}
              onClick={(e) => {
                if (renaming) {
                  e.stopPropagation();
                } else {
                  onToggleFolder(node.id);
                }
              }}
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
                        trimmedRename === node.name
                      )
                        return;
                      renameFolderOptimistic(node.id, trimmedRename);
                      setRenaming(false);
                    } else if (e.key === "Escape") {
                      setFolderName(node.name);
                      setRenaming(false);
                    }
                  }}
                  ref={inputRef}
                  value={folderName}
                />
              ) : (
                <span>{node.name}</span>
              )}
            </SidebarMenuButton>
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
              <DropdownMenuItem
                onSelect={() => {
                  onOpenFolder(node.id);
                  startNoteCreation(node.id);
                }}
              >
                <TbFilePlus className="text-muted-foreground" />
                <span>New note</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  onOpenFolder(node.id);
                  startFolderCreation(node.id);
                }}
              >
                <TbFolderPlus className="text-muted-foreground" />
                <span>New folder</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setRenaming(true)}>
                <TbEdit className="text-muted-foreground" />
                <span>Rename folder</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => deleteFolderOptimistic(node.id)}
                variant="destructive"
              >
                <TbTrash className="text-muted-foreground" />
                <span>Delete folder</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarMenuItem>
    </div>
  );
};

/* ---------- Note Row ---------- */
type NoteRowProps = TreeNodeRowProps & {
  node: Extract<TreeNode, { type: "note" }>;
  style: React.CSSProperties;
};

const NoteRow = ({
  node,
  style,
  renameNoteOptimistic,
  deleteNoteOptimistic,
  copyNoteOptimistic,
  isNotePending,
  draggedItem,
  startDrag,
  endDrag,
}: NoteRowProps) => {
  const navigate = useNavigate();
  const matchRoute = useMatchRoute();
  const { isMobile, setOpenMobile } = useSidebar();

  const pending = isNotePending(node.id);
  const [renaming, setRenaming] = useState(false);
  const [noteTitle, setNoteTitle] = useState(node.title);

  useEffect(() => {
    if (!renaming) {
      setNoteTitle(node.title);
    }
  }, [node.title, renaming]);

  const inputRef = useClickAway<HTMLInputElement>(() => {
    setRenaming(false);
    setNoteTitle(node.title);
  });

  useHotkeys(
    "esc",
    () => {
      setRenaming(false);
      setNoteTitle(node.title);
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
    node.siblingTitles.includes(trimmed) &&
    trimmed !== node.title;

  const isMobileViewport = useIsMobile(768);
  const popoverSide = isMobileViewport ? "top" : "right";
  const popoverAlign: "start" | "center" = isMobileViewport
    ? "center"
    : "start";
  const popoverWidthClass = isMobileViewport
    ? "w-(--radix-popover-trigger-width)"
    : "w-64";

  const isBeingDragged = draggedItem?.id === node.id;

  const handleDragStart = (e: React.DragEvent) => {
    if (renaming || pending) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    startDrag({
      id: node.id,
      type: "note",
      name: node.title,
    });
  };

  return (
    <div style={style}>
      <SidebarMenuItem
        className={isBeingDragged ? "opacity-50" : ""}
        onClick={() => setOpenMobile(false)}
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
                      if (!trimmed || isDuplicate || trimmed === node.title)
                        return;
                      renameNoteOptimistic(node.id, trimmed);
                      setRenaming(false);
                    } else if (e.key === "Escape") {
                      setNoteTitle(node.title);
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
                className={pending ? "cursor-not-allowed opacity-50" : ""}
                draggable={!pending}
                isActive={
                  !!matchRoute({
                    to: "/notes/$noteId",
                    params: { noteId: node.id },
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
                      to: "/notes/$noteId",
                      params: { noteId: node.id },
                    });
                  }}
                  onKeyUp={(e) => {
                    if (pending) e.preventDefault();
                    navigate({
                      to: "/notes/$noteId",
                      params: { noteId: node.id },
                    });
                  }}
                >
                  {pending ? (
                    <Spinner />
                  ) : (
                    <Link
                      onClick={(e) => {
                        if (pending) e.preventDefault();
                      }}
                      params={{ noteId: node.id }}
                      to="/notes/$noteId"
                    >
                      <TbFile />
                    </Link>
                  )}
                  <span>{node.title}</span>
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
        {!renaming && !pending && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuAction disabled={pending} showOnHover>
                <TbDotsVertical
                  className={`size-4 text-muted-foreground ${pending ? "opacity-40" : ""}`}
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
                  navigate({
                    to: "/notes/$noteId",
                    params: { noteId: node.id },
                  });
                  setOpenMobile(false);
                }}
              >
                <TbFile className="text-muted-foreground" />
                <span>Open</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={pending}
                onSelect={() => copyNoteOptimistic(node.id)}
              >
                <TbFiles className="text-muted-foreground" />
                <span>Make a copy</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={pending}
                onSelect={() => {
                  setNoteTitle(node.title);
                  setRenaming(true);
                }}
              >
                <TbEdit className="text-muted-foreground" />
                <span>Rename note</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={pending}
                onSelect={() => deleteNoteOptimistic(node.id)}
                variant="destructive"
              >
                <TbTrash className="text-muted-foreground" />
                <span>Delete note</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarMenuItem>
    </div>
  );
};

/* ---------- Folder Input Row ---------- */
type FolderInputRowProps = TreeNodeRowProps & {
  node: Extract<TreeNode, { type: "folder-input" }>;
  style: React.CSSProperties;
};

const FolderInputRow = ({
  node,
  style,
  onCancelFolderCreation,
  createFolderOptimistic,
  creatingFolderPending,
}: FolderInputRowProps) => {
  const [name, setName] = useState("Untitled");
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRef = useClickAway<HTMLLIElement>(() => onCancelFolderCreation());
  useHotkeys("esc", onCancelFolderCreation, { enableOnFormTags: true });

  const isMobileViewport = useIsMobile(768);
  const popoverSide = isMobileViewport ? "top" : "right";
  const popoverAlign: "start" | "center" = isMobileViewport
    ? "center"
    : "start";
  const popoverWidthClass = isMobileViewport
    ? "w-(--radix-popover-trigger-width)"
    : "w-64";

  const trimmed = name.trim();
  const isDuplicate = trimmed.length > 0 && node.siblingNames.includes(trimmed);

  usePersistentFocus(inputRef, {
    enabled: !creatingFolderPending,
    select: true,
  });

  return (
    <div style={style}>
      <SidebarMenuItem ref={itemRef}>
        <Popover open={isDuplicate}>
          <PopoverTrigger asChild>
            <SidebarMenuButton
              className="disabled:opacity-50"
              disabled={creatingFolderPending}
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
                disabled={creatingFolderPending}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isDuplicate) return;
                    createFolderOptimistic(trimmed, node.parentId);
                  } else if (e.key === "Escape") {
                    e.stopPropagation();
                    onCancelFolderCreation();
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
                Another folder here already has this title. Enter a different
                one.
              </p>
            </div>
          </PopoverContent>
        </Popover>
      </SidebarMenuItem>
    </div>
  );
};

/* ---------- Note Input Row ---------- */
type NoteInputRowProps = TreeNodeRowProps & {
  node: Extract<TreeNode, { type: "note-input" }>;
  style: React.CSSProperties;
};

const NoteInputRow = ({
  node,
  style,
  onCancelNoteCreation,
  createNoteOptimistic,
  createNotePending,
}: NoteInputRowProps) => {
  const initialTitle = useMemo(
    () => suggestUniqueTitle("Untitled", node.siblingTitles),
    [node.siblingTitles],
  );
  const [title, setTitle] = useState(initialTitle);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRef = useClickAway<HTMLLIElement>(() => onCancelNoteCreation());
  useHotkeys("esc", onCancelNoteCreation, { enableOnFormTags: true });

  const isMobileViewport = useIsMobile(768);
  const popoverSide = isMobileViewport ? "top" : "right";
  const popoverAlign: "start" | "center" = isMobileViewport
    ? "center"
    : "start";
  const popoverWidthClass = isMobileViewport
    ? "w-(--radix-popover-trigger-width)"
    : "w-64";

  const trimmed = title.trim();
  const isDuplicate =
    trimmed.length > 0 && node.siblingTitles.includes(trimmed);

  usePersistentFocus(inputRef, {
    enabled: !createNotePending,
    select: true,
  });

  return (
    <div style={style}>
      <SidebarMenuItem ref={itemRef}>
        <Popover open={isDuplicate}>
          <PopoverTrigger asChild>
            <SidebarMenuButton
              className="disabled:opacity-50"
              disabled={createNotePending}
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
                disabled={createNotePending}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isDuplicate) return;
                    createNoteOptimistic(trimmed, node.parentId);
                  } else if (e.key === "Escape") {
                    e.stopPropagation();
                    onCancelNoteCreation();
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
    </div>
  );
};
