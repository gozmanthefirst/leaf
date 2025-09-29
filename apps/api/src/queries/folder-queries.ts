import { randomUUID } from "node:crypto";

import { db, type Folder, type Note } from "@repo/db";
import type { FolderWithItems } from "@repo/db/validators/folder-validators";

import { getUserById } from "./user-queries";

/**
 * Ensures that a root folder exists for the given user, creating one if necessary.
 * Returns the root folder.
 */
export const createRootFolder = async (userId: string) => {
  const user = await getUserById(userId);

  if (user) {
    const existingRoot = await db.folder.findFirst({
      where: { userId: user.id, isRoot: true },
    });

    if (existingRoot) {
      return existingRoot;
    }

    // Create a new root folder
    const newRootId = randomUUID();

    const newRoot = await db.folder.create({
      data: {
        id: newRootId,
        name: `${user.name}'s Root Folder`,
        parentFolderId: newRootId,
        isRoot: true,
        userId: user.id,
      },
    });

    return newRoot;
  }
};

/**
 * Fetches the folder with the given ID belonging to the specified user, or null if not found.
 */
export const getFolderForUser = async (
  folderId: string,
  userId: string,
): Promise<Folder | null> => {
  const foundFolder = await db.folder.findUnique({
    where: { id: folderId, userId },
  });

  return foundFolder;
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
  const existingFolders = await db.folder.findMany({
    select: {
      name: true,
    },
    where: {
      userId,
      parentFolderId,
      name: {
        startsWith: intendedName,
      },
    },
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
 */
export const getFolderWithNestedItems = async (
  folderId: string,
  userId: string,
): Promise<FolderWithItems | null> => {
  // Get ALL folders for the user
  const allFolders = await db.folder.findMany({
    where: {
      userId,
    },
  });

  // Check if the requested folder exists
  if (!allFolders.some((folder) => folder.id === folderId)) {
    return null;
  }

  // Get ALL notes for the user
  const allNotes = await db.note.findMany({
    where: {
      userId,
    },
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
  const rootFolder = await db.folder.findFirst({
    where: {
      userId,
      isRoot: true,
    },
  });

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
