import type { FolderWithItems } from "@repo/db/validators/folder-validators";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names using clsx and resolves Tailwind conflicts with twMerge.
 * @param inputs - Class values (strings, arrays, objects) accepted by clsx.
 * @returns A deduplicated, Tailwind-merged className string.
 */
export const cn = (...inputs: ClassValue[]): string => {
  return twMerge(clsx(inputs));
};

/**
 * URLs to variable font files used by the app (WOFF2). Useful for preloading.
 */
export const fontsHref = [
  "https://cdn.jsdelivr.net/fontsource/fonts/inter:vf@latest/latin-wght-normal.woff2",
  "https://cdn.jsdelivr.net/fontsource/fonts/roboto-condensed:vf@latest/latin-wght-normal.woff2",
];

/**
 * Normalizes a possibly multi-encoded token by decoding repeatedly, then encoding once.
 * @param token - The token that may contain nested URI encodings.
 * @returns A single-layer URI-encoded token.
 */
export const normalizeTokenEncoding = (token: string): string => {
  let decoded = token;
  let previousDecoded = "";

  // Decode until we can't decode anymore
  while (decoded !== previousDecoded) {
    previousDecoded = decoded;
    try {
      const attemptDecode = decodeURIComponent(decoded);
      if (attemptDecode !== decoded) {
        decoded = attemptDecode;
      } else {
        break;
      }
    } catch {
      break;
    }
  }

  // Now encode it back one step
  return encodeURIComponent(decoded);
};

/**
 * Returns initials for a given full name.
 * - 1 name: first two letters, first uppercase (e.g., "chris" -> "Ch")
 * - 2 names: initials of both (e.g., "chris smith" -> "CS")
 * - >2 names: initials of first and last (e.g., "jean luc picard" -> "JP")
 */
export const initialsFromName = (fullName: string): string => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";

  if (parts.length === 1) {
    const word = parts[0];
    const two = word.slice(0, 2);
    if (two.length === 0) return "";
    if (two.length === 1) return two[0].toUpperCase();
    return two[0].toUpperCase() + two[1].toLowerCase();
  }

  const firstInitial = parts[0][0]?.toUpperCase() ?? "";
  const lastInitial =
    (parts.length === 2
      ? parts[1][0]
      : parts[parts.length - 1][0]
    )?.toUpperCase() ?? "";
  return firstInitial + lastInitial;
};

/**
 * Masks an email address by truncating the local part and adding asterisks.
 * - If not an email: return as-is
 */
export const maskEmail = (input: string): string => {
  const atIndex = input.indexOf("@");
  if (atIndex === -1 || atIndex === 0) {
    // Not an email or empty local part
    return input;
  }

  const localPart = input.slice(0, atIndex);
  const domain = input.slice(atIndex);

  if (localPart.length > 3) {
    return `${localPart.slice(0, 3)}*****${domain}`;
  } else {
    return `${localPart.slice(0, 1)}***${domain}`;
  }
};

/**
 * Recursively counts all descendant folders (excluding the root itself)
 * and notes contained within the provided folder.
 * @param folder Root folder to start counting from.
 * @returns Object with total counts { folders, notes }.
 */
export const countFolderStats = (
  folder: FolderWithItems,
): { folders: number; notes: number } => {
  let folders = 0;
  let notes = folder.notes?.length || 0;
  if (folder.folders) {
    folders += folder.folders.length;
    for (const f of folder.folders) {
      const c = countFolderStats(f);
      folders += c.folders;
      notes += c.notes;
    }
  }
  return { folders, notes };
};

/**
 * Returns shallow, alphabetically (case-insensitive) sorted copies
 * of a folder's immediate child folders and notes.
 * @param folder Folder whose direct children to sort.
 * @returns { folders, notes } arrays.
 */
export const sortFolderItems = (folder: FolderWithItems) => {
  const folders = [...(folder.folders ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
  const notes = [...(folder.notes ?? [])].sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
  );
  return { folders, notes };
};

/**
 * Returns the chain of folder IDs (excluding the root itself) leading to the
 * folder that contains the most recently updated note anywhere in the tree.
 * Used to auto-open only that branch on initial render.
 */
export function findLatestNoteFolderPath(root: FolderWithItems): string[] {
  let bestTime = -Infinity;
  let bestPath: string[] = [];

  const dfs = (folder: FolderWithItems, path: string[]) => {
    for (const note of folder.notes ?? []) {
      const raw = note.updatedAt;
      const t = raw ? new Date(raw).getTime() : NaN;
      if (!Number.isNaN(t) && t > bestTime) {
        bestTime = t;
        bestPath = path.slice();
      }
    }
    for (const sub of folder.folders ?? []) {
      dfs(sub, [...path, sub.id]);
    }
  };

  dfs(root, []);
  return bestPath;
}
