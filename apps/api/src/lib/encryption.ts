import crypto, { scrypt } from "node:crypto";
import { promisify } from "node:util";

import env from "./env";

const scryptAsync = promisify(scrypt);

const MASTER_KEY = env.ENCRYPTION_KEY;
const ALGORITHM = "aes-256-gcm";

// Cache for derived user keys to avoid re-deriving on every request
const userKeyCache = new Map<string, { key: Buffer; expiresAt: number }>();
const KEY_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Generates a random encryption salt for a new user.
 * Should be called once during user creation.
 */
export const generateEncryptionSalt = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Derives a per-user encryption key from the master key and user's salt.
 * Uses scrypt for secure key derivation.
 */
export const deriveUserKey = async (
  userId: string,
  userSalt: string,
): Promise<Buffer> => {
  const cacheKey = `${userId}:${userSalt}`;

  // Check cache first
  const cached = userKeyCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.key;
  }

  // Derive key using scrypt
  // Combine user salt with userId to ensure uniqueness
  const combinedSalt = `${userSalt}:${userId}`;
  const derivedKey = (await scryptAsync(
    MASTER_KEY,
    combinedSalt,
    32, // 256 bits for AES-256
  )) as Buffer;

  // Cache the derived key
  userKeyCache.set(cacheKey, {
    key: derivedKey,
    expiresAt: Date.now() + KEY_CACHE_TTL_MS,
  });

  return derivedKey;
};

/**
 * Encrypts content using the master key (legacy v1 encryption).
 * Used for backward compatibility with existing notes.
 */
export const encryptContent = (
  content: string,
): { encrypted: string; iv: string; tag: string } => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(MASTER_KEY, "hex"),
    iv,
  );

  let encrypted = cipher.update(content, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");

  return {
    encrypted,
    iv: iv.toString("hex"),
    tag,
  };
};

/**
 * Decrypts content using the master key (legacy v1 encryption).
 * Used for backward compatibility with existing notes.
 */
export const decryptContent = (
  encrypted: string,
  iv: string,
  tag: string,
): string => {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(MASTER_KEY, "hex"),
    Buffer.from(iv, "hex"),
  );
  decipher.setAuthTag(Buffer.from(tag, "hex"));

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};

/**
 * Encrypts content using per-user key (v2 encryption).
 */
export const encryptContentV2 = async (
  content: string,
  userId: string,
  userSalt: string,
): Promise<{ encrypted: string; iv: string; tag: string }> => {
  const userKey = await deriveUserKey(userId, userSalt);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, userKey, iv);

  let encrypted = cipher.update(content, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");

  return {
    encrypted,
    iv: iv.toString("hex"),
    tag,
  };
};

/**
 * Decrypts content using per-user key (v2 encryption).
 */
export const decryptContentV2 = async (
  encrypted: string,
  iv: string,
  tag: string,
  userId: string,
  userSalt: string,
): Promise<string> => {
  const userKey = await deriveUserKey(userId, userSalt);
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    userKey,
    Buffer.from(iv, "hex"),
  );
  decipher.setAuthTag(Buffer.from(tag, "hex"));

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};

// Export for testing/clearing cache
export const clearKeyCache = () => userKeyCache.clear();
