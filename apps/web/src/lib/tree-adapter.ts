import type { Note } from "@repo/db";
import type { FolderWithItems } from "@repo/db/validators/folder-validators";

export type TreeNode = {
  id: string;
  type: "folder" | "note";
  name: string;
  children?: TreeNode[];
  data: FolderWithItems | Note;
  parentId?: string;
};

// Convert your folder structure to tree nodes
export function folderToTreeNodes(
  folder: FolderWithItems,
  parentId?: string,
): TreeNode {
  return {
    id: folder.id,
    type: "folder",
    name: folder.name,
    data: folder,
    parentId,
    children: [
      ...folder.folders.map((f) => folderToTreeNodes(f, folder.id)),
      ...folder.notes.map((note) => ({
        id: note.id,
        type: "note" as const,
        name: note.title,
        data: note,
        parentId: folder.id,
      })),
    ],
  };
}

// Flatten tree for @headless-tree
export function flattenTree(
  node: TreeNode,
  parentId?: string,
): Array<{
  id: string;
  parentId: string | undefined;
  data: TreeNode;
}> {
  const items = [{ id: node.id, parentId, data: node }];

  if (node.children) {
    for (const child of node.children) {
      items.push(...flattenTree(child, node.id));
    }
  }

  return items;
}

// Check if a node can be dropped into a target
export function canDrop(draggedNode: TreeNode, targetNode: TreeNode): boolean {
  // Can't drop into a note
  if (targetNode.type === "note") return false;

  // Can't drop a folder into itself
  if (draggedNode.id === targetNode.id) return false;

  // Can't drop a folder into its own descendants
  if (draggedNode.type === "folder" && targetNode.parentId) {
    const isDescendant = (nodeId: string, ancestorId: string): boolean => {
      if (nodeId === ancestorId) return true;
      // This would need the full tree structure to traverse properly
      // We'll handle this in the mutation logic instead
      return false;
    };
    return !isDescendant(targetNode.id, draggedNode.id);
  }

  return true;
}
