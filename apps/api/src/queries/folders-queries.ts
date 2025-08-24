/** biome-ignore-all lint/suspicious/noExplicitAny: needed for accessing the DB using raw SQL */

import { randomUUID } from "node:crypto";

import db, { and, eq } from "@repo/database";
import { folders } from "@repo/database/schemas/folders-schema";
import { notes } from "@repo/database/schemas/notes-schema";
import type {
  Folder,
  FolderWithItems,
} from "@repo/database/validators/folders-validators";
import type { Note } from "@repo/database/validators/notes-validators";

import { getUserById } from "./user-queries";

export const createRootFolder = async (userId: string) => {
  const user = await getUserById(userId);

  // Check if root folder exists
  const [existingRoot] = await db
    .select()
    .from(folders)
    .where(and(eq(folders.userId, user.id), eq(folders.isRoot, true)))
    .limit(1);

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
    .where(and(eq(folders.userId, userId), eq(folders.isArchived, false)));

  // Check if the requested folder exists
  if (!allFolders.some((folder) => folder.id === folderId)) {
    return null;
  }

  // 2. Get ALL notes for the user
  const allNotes = await db
    .select()
    .from(notes)
    .where(and(eq(notes.userId, userId), eq(notes.isArchived, false)));

  // 3. Build the hierarchy starting from the requested folder
  return buildFolderHierarchy(allFolders, allNotes, folderId);
};
