/**
 * Normalize a token by decoding it repeatedly until it can no longer be decoded,
 * then encoding it back once. This ensures that tokens with multiple layers of
 * encoding are properly normalized.
 *
 * @param token - The token string to normalize.
 * @returns The normalized token string.
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
