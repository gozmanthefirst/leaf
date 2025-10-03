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
