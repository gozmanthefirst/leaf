import { randomUUID } from "node:crypto";

import { db, sql } from "@repo/db";
import type { Folder } from "@repo/db/schemas/folder.schema";
import { folder } from "@repo/db/schemas/folder.schema";
import type { Note } from "@repo/db/schemas/note.schema";
import type { FolderWithItems } from "@repo/db/validators/folder.validator";

import { getUserById } from "./user-queries";

/**
 * Ensures that a root folder exists for the given user, creating one if necessary.
 * Returns the root folder.
 */
export const createRootFolder = async (userId: string) => {
  const user = await getUserById(userId);

  if (user) {
    const existingRoot = await db.query.folder.findFirst({
      where: (folder, { and, eq }) =>
        and(eq(folder.userId, user.id), eq(folder.isRoot, true)),
    });

    if (existingRoot) {
      return existingRoot;
    }

    // Create a new root folder
    const newRootId = randomUUID();

    const [newRoot] = await db
      .insert(folder)
      .values({
        id: newRootId,
        name: `${user.name}'s Root Folder`,
        parentFolderId: newRootId,
        isRoot: true,
        userId: user.id,
      })
      .returning();

    return newRoot;
  }
};

/**
 * Fetches the folder with the given ID belonging to the specified user, or null if not found.
 * Only returns non-deleted folders.
 */
export const getFolderForUser = async (
  folderId: string,
  userId: string,
): Promise<Folder | undefined> => {
  const foundFolder = await db.query.folder.findFirst({
    where: (folder, { and, eq, isNull }) =>
      and(
        eq(folder.id, folderId),
        eq(folder.userId, userId),
        isNull(folder.deletedAt),
      ),
  });

  return foundFolder;
};

/**
 * Generates a unique folder name using incrementing numbers within the same parent folder.
 * Only considers non-deleted folders.
 */
export const generateUniqueFolderName = async (
  intendedName: string,
  userId: string,
  parentFolderId: string,
): Promise<string> => {
  // Get all existing folders with names that start with the intended name
  // BUT only within the same parent folder, excluding soft-deleted folders
  const existingFolders = await db.query.folder.findMany({
    columns: {
      name: true,
    },
    where: (folder, { and, eq, like, isNull }) =>
      and(
        eq(folder.userId, userId),
        eq(folder.parentFolderId, parentFolderId),
        like(folder.name, `${intendedName}%`),
        isNull(folder.deletedAt),
      ),
  });

  const existingNames = new Set(existingFolders.map((folder) => folder.name));

  // If the original name doesn't exist, use it
  if (!existingNames.has(intendedName)) {
    return intendedName;
  }

  // Find the highest number suffix and increment
  let maxSuffix = 0;

  for (const name of existingNames) {
    if (name === intendedName) {
      maxSuffix = Math.max(maxSuffix, 0);
    } else if (name.startsWith(`${intendedName} `)) {
      const suffix = name.substring(intendedName.length + 1);
      const num = parseInt(suffix, 10);
      if (!Number.isNaN(num)) {
        maxSuffix = Math.max(maxSuffix, num);
      }
    }
  }

  return `${intendedName} ${maxSuffix + 1}`;
};

/**
 * Builds a nested folder structure from folders and notes
 */
const buildFolderHierarchy = (
  allFolders: Folder[],
  allNotes: Note[],
  rootFolderId: string,
): FolderWithItems | null => {
  // Create a map of folders by ID
  const folderMap = new Map<string, FolderWithItems>();

  // Initialize all folders with empty notes and folders arrays
  for (const folder of allFolders) {
    folderMap.set(folder.id, {
      ...folder,
      notes: [],
      folders: [],
    });
  }

  // Group notes by folderId and assign to folders
  for (const note of allNotes) {
    const folder = folderMap.get(note.folderId);
    if (folder) {
      folder.notes.push(note);
    }
  }

  // Build the hierarchy by linking child folders to parents
  for (const folder of folderMap.values()) {
    if (
      folder.parentFolderId &&
      folderMap.has(folder.parentFolderId) &&
      folder.parentFolderId !== folder.id
    ) {
      const parent = folderMap.get(folder.parentFolderId);
      if (parent) {
        parent.folders.push(folder);
      }
    }
  }

  return folderMap.get(rootFolderId) || null;
};

/**
 * Gets a folder with all its nested folders and notes in a hierarchical structure
 * Simple approach: gets ALL user folders and notes, then builds hierarchy
 * Only returns non-deleted folders and notes.
 */
export const getFolderWithNestedItems = async (
  folderId: string,
  userId: string,
): Promise<FolderWithItems | null> => {
  // Get ALL non-deleted folders for the user
  const allFolders = await db.query.folder.findMany({
    where: (folder, { and, eq, isNull }) =>
      and(eq(folder.userId, userId), isNull(folder.deletedAt)),
  });

  // Check if the requested folder exists
  if (!allFolders.some((folder) => folder.id === folderId)) {
    return null;
  }

  // Get ALL non-deleted notes for the user
  const allNotes = await db.query.note.findMany({
    where: (note, { and, eq, isNull }) =>
      and(eq(note.userId, userId), isNull(note.deletedAt)),
  });

  // Build the hierarchy starting from the requested folder
  return buildFolderHierarchy(allFolders, allNotes, folderId);
};

/**
 * Gets the root folder (isRoot: true) for a user, with all its nested folders and notes.
 */
export const getRootFolderWithNestedItems = async (
  userId: string,
): Promise<FolderWithItems | null> => {
  // Find the root folder for the user
  const rootFolder = await db.query.folder.findFirst({
    where: (folder, { and, eq }) =>
      and(eq(folder.userId, userId), eq(folder.isRoot, true)),
  });

  if (!rootFolder) {
    return null;
  }

  // Use the existing function to get nested items
  return getFolderWithNestedItems(rootFolder.id, userId);
};

/**
 * Folder child item for lazy loading (folder with hasChildren hint)
 */
export type FolderChildItem = Folder & {
  hasChildren: boolean;
};

/**
 * Response type for folder children endpoint (for lazy loading)
 */
export type FolderChildrenResponse = {
  folders: FolderChildItem[];
  notes: Note[];
};

/**
 * Gets direct children of a folder (one level deep) with hasChildren hints.
 * Used for lazy loading the folder tree.
 */
export const getFolderChildren = async (
  folderId: string,
  userId: string,
): Promise<FolderChildrenResponse | null> => {
  // Verify the folder exists and belongs to the user
  const parentFolder = await db.query.folder.findFirst({
    where: (folder, { and, eq, isNull }) =>
      and(
        eq(folder.id, folderId),
        eq(folder.userId, userId),
        isNull(folder.deletedAt),
      ),
  });

  if (!parentFolder) {
    return null;
  }

  // Get direct child folders (not soft-deleted)
  const childFolders = await db.query.folder.findMany({
    where: (folder, { and, eq, isNull }) =>
      and(
        eq(folder.userId, userId),
        eq(folder.parentFolderId, folderId),
        isNull(folder.deletedAt),
      ),
    orderBy: (folder, { asc }) => [asc(folder.name)],
  });

  // Get direct notes in this folder (not soft-deleted)
  const notes = await db.query.note.findMany({
    where: (note, { and, eq, isNull }) =>
      and(
        eq(note.userId, userId),
        eq(note.folderId, folderId),
        isNull(note.deletedAt),
      ),
    columns: {
      id: true,
      title: true,
      folderId: true,
      userId: true,
      isFavorite: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true,
      // Exclude content fields for performance - they're loaded separately
      contentEncrypted: false,
      contentIv: false,
      contentTag: false,
    },
    orderBy: (note, { asc }) => [asc(note.title)],
  });

  // Check which folders have children (folders or notes)
  const foldersWithHints: FolderChildItem[] = await Promise.all(
    childFolders.map(async (f) => ({
      ...f,
      hasChildren: await hasDescendants(f.id, userId),
    })),
  );

  return { folders: foldersWithHints, notes: notes as Note[] };
};

/**
 * Checks if a folder has any direct children (folders or notes).
 * Used to determine if the expand arrow should be shown.
 */
const hasDescendants = async (
  folderId: string,
  userId: string,
): Promise<boolean> => {
  // Check for child folders first (more likely)
  const childFolder = await db.query.folder.findFirst({
    where: (folder, { and, eq, isNull }) =>
      and(
        eq(folder.parentFolderId, folderId),
        eq(folder.userId, userId),
        isNull(folder.deletedAt),
      ),
    columns: { id: true },
  });

  if (childFolder) return true;

  // Check for notes
  const childNote = await db.query.note.findFirst({
    where: (note, { and, eq, isNull }) =>
      and(
        eq(note.folderId, folderId),
        eq(note.userId, userId),
        isNull(note.deletedAt),
      ),
    columns: { id: true },
  });

  return !!childNote;
};

/**
 * Checks if a folder is a descendant of another folder or itself.
 * Uses a recursive CTE to avoid N+1 queries.
 */
export const isDescendant = async (
  folderId: string,
  targetParentId: string,
  userId: string,
): Promise<boolean> => {
  if (folderId === targetParentId) return true;

  // Use a recursive CTE to walk up the tree in a single query
  const result = await db.execute(sql`
    WITH RECURSIVE ancestors AS (
      -- Start with the target folder
      SELECT id, parent_folder_id, is_root
      FROM folder
      WHERE id = ${targetParentId} AND user_id = ${userId}
      
      UNION ALL
      
      -- Walk up the tree
      SELECT f.id, f.parent_folder_id, f.is_root
      FROM folder f
      INNER JOIN ancestors a ON f.id = a.parent_folder_id
      WHERE f.id != a.id  -- Prevent infinite loop on root (self-referential)
        AND a.is_root = false
    )
    SELECT EXISTS (
      SELECT 1 FROM ancestors WHERE parent_folder_id = ${folderId}
    ) as is_descendant
  `);

  return (result.rows[0] as { is_descendant: boolean })?.is_descendant ?? false;
};

/**
 * Soft deletes a folder and all its descendants (child folders and notes).
 * Uses a recursive CTE to find all descendant folders efficiently.
 */
export const softDeleteFolderWithDescendants = async (
  folderId: string,
  userId: string,
): Promise<void> => {
  const now = new Date();

  // Use a recursive CTE to find all descendant folder IDs and soft delete in one query
  // This avoids the array parameter issue by doing everything in a single CTE
  await db.execute(sql`
    WITH RECURSIVE descendants AS (
      -- Start with the target folder
      SELECT id
      FROM folder
      WHERE id = ${folderId} AND user_id = ${userId}
      
      UNION ALL
      
      -- Find all child folders recursively
      SELECT f.id
      FROM folder f
      INNER JOIN descendants d ON f.parent_folder_id = d.id
      WHERE f.id != d.id  -- Prevent self-reference
        AND f.user_id = ${userId}
    ),
    update_notes AS (
      UPDATE note
      SET deleted_at = ${now}
      WHERE folder_id IN (SELECT id FROM descendants)
        AND user_id = ${userId}
        AND deleted_at IS NULL
      RETURNING id
    )
    UPDATE folder
    SET deleted_at = ${now}
    WHERE id IN (SELECT id FROM descendants)
      AND user_id = ${userId}
      AND deleted_at IS NULL
  `);
};
