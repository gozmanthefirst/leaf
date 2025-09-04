/** biome-ignore-all lint/suspicious/noExplicitAny: needed for accessing the DB using raw SQL */

import { randomUUID } from "node:crypto";

import db, { and, eq, sql } from "@repo/database";
import { folders } from "@repo/database/schemas/folders-schema";
import { notes } from "@repo/database/schemas/notes-schema";
import type {
  Folder,
  FolderWithItems,
} from "@repo/database/validators/folders-validators";
import type { Note } from "@repo/database/validators/notes-validators";

import { getUserById } from "./user-queries";

/**
 * Ensures that a root folder exists for the given user, creating one if necessary.
 * Returns the root folder.
 */
export const createRootFolder = async (userId: string) => {
  const user = await getUserById(userId);

  if (user) {
    const existingRoot = await db.query.folders.findFirst({
      where: (folder, { eq, and }) =>
        and(eq(folder.userId, user.id), eq(folder.isRoot, true)),
    });

    if (existingRoot) {
      return existingRoot;
    }

    // Create a new root folder
    const newRootId = randomUUID();

    const [newRoot] = await db
      .insert(folders)
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
 * Returns true if a folder with the given ID exists and belongs to the specified user.
 */
export const folderBelongsToUser = async (
  folderId: string,
  userId: string,
): Promise<boolean> => {
  const rows = await db
    .select()
    .from(folders)
    .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
    .limit(1);

  return rows.length === 1;
};

/**
 * Fetches the folder with the given ID belonging to the specified user, or null if not found.
 */
export const getFolderForUser = async (
  folderId: string,
  userId: string,
): Promise<Folder | null> => {
  const [foundFolder] = await db
    .select()
    .from(folders)
    .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
    .limit(1);

  return foundFolder || null;
};

/**
 * Generates a unique folder name using incrementing numbers within the same parent folder.
 */
export const generateUniqueFolderName = async (
  intendedName: string,
  userId: string,
  parentFolderId: string,
): Promise<string> => {
  // Get all existing folders with names that start with the intended name
  // BUT only within the same parent folder
  const existingFolders = await db
    .select({ name: folders.name })
    .from(folders)
    .where(
      and(
        eq(folders.userId, userId),
        eq(folders.parentFolderId, parentFolderId), // Filter by parent folder
        sql`${folders.name} LIKE ${`${intendedName}%`}`,
      ),
    );

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
 */
export const getFolderWithNestedItems = async (
  folderId: string,
  userId: string,
): Promise<FolderWithItems | null> => {
  // 1. Get ALL folders for the user
  const allFolders = await db
    .select()
    .from(folders)
    .where(and(eq(folders.userId, userId)));

  // Check if the requested folder exists
  if (!allFolders.some((folder) => folder.id === folderId)) {
    return null;
  }

  // 2. Get ALL notes for the user
  const allNotes = await db
    .select()
    .from(notes)
    .where(and(eq(notes.userId, userId)));

  // 3. Build the hierarchy starting from the requested folder
  return buildFolderHierarchy(allFolders, allNotes, folderId);
};

/**
 * Gets the root folder (isRoot: true) for a user, with all its nested folders and notes.
 */
export const getRootFolderWithNestedItems = async (
  userId: string,
): Promise<FolderWithItems | null> => {
  // Find the root folder for the user
  const [rootFolder] = await db
    .select()
    .from(folders)
    .where(and(eq(folders.userId, userId), eq(folders.isRoot, true)))
    .limit(1);

  if (!rootFolder) {
    return null;
  }

  // Use the existing function to get nested items
  return getFolderWithNestedItems(rootFolder.id, userId);
};

/**
 * Checks if a folder is a descendant of another folder or itself
 */
export const isDescendant = async (
  folderId: string,
  targetParentId: string,
  userId: string,
): Promise<boolean> => {
  if (folderId === targetParentId) return true;

  let currentId = targetParentId;
  while (true) {
    const folder = await getFolderForUser(currentId, userId);

    if (!folder || folder.isRoot) break;
    if (folder.parentFolderId === folderId) return true;
    if (folder.parentFolderId === currentId) break;

    currentId = folder.parentFolderId;
  }

  return false;
};
