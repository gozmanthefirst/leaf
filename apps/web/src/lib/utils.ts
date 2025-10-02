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
