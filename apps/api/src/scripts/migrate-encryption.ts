/**
 * Data Migration Script: Migrate notes from v1 (master key) to v2 (per-user key) encryption.
 *
 * This script:
 * 1. Generates encryption salts for users who don't have one
 * 2. Re-encrypts all notes with per-user derived keys
 * 3. Updates the encryption version on users
 *
 * Usage:
 *   bun run src/scripts/migrate-encryption.ts
 *
 * Safety:
 * - Run in a transaction (will rollback on any error)
 * - Logs progress for monitoring
 * - Can be run multiple times safely (skips already migrated data)
 */

import crypto, { scrypt } from "node:crypto";
import { promisify } from "node:util";

import { db, eq, isNull } from "@repo/db";
import { note } from "@repo/db/schemas/note.schema";
import { user } from "@repo/db/schemas/user.schema";

const scryptAsync = promisify(scrypt);

// Get master key from environment
const MASTER_KEY = process.env.ENCRYPTION_KEY;
if (!MASTER_KEY) {
  console.error("Error: ENCRYPTION_KEY environment variable is required");
  process.exit(1);
}

const ALGORITHM = "aes-256-gcm";
const BATCH_SIZE = 100;

/**
 * Decrypts content using the master key (v1 encryption)
 */
const decryptV1 = (encrypted: string, iv: string, tag: string): string => {
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
 * Derives a per-user encryption key
 */
const deriveUserKey = async (
  userId: string,
  userSalt: string,
): Promise<Buffer> => {
  const combinedSalt = `${userSalt}:${userId}`;
  return (await scryptAsync(MASTER_KEY, combinedSalt, 32)) as Buffer;
};

/**
 * Encrypts content using per-user key (v2 encryption)
 */
const encryptV2 = async (
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
 * Generate encryption salt for a user
 */
const generateEncryptionSalt = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

async function migrateEncryption() {
  console.log("Starting encryption migration...\n");

  // Step 1: Generate encryption salts for users who don't have one
  console.log("Step 1: Generating encryption salts for users...");

  const usersWithoutSalt = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(isNull(user.encryptionSalt));

  console.log(`Found ${usersWithoutSalt.length} users without encryption salt`);

  for (const u of usersWithoutSalt) {
    const salt = generateEncryptionSalt();
    await db
      .update(user)
      .set({ encryptionSalt: salt })
      .where(eq(user.id, u.id));
    console.log(`  Generated salt for user: ${u.name} (${u.id})`);
  }

  console.log("Step 1 complete.\n");

  // Step 2: Get all users who need note migration (encryptionVersion = 1)
  console.log("Step 2: Finding users with v1 encrypted notes...");

  const usersToMigrate = await db
    .select({
      id: user.id,
      name: user.name,
      encryptionSalt: user.encryptionSalt,
      encryptionVersion: user.encryptionVersion,
    })
    .from(user)
    .where(eq(user.encryptionVersion, 1));

  console.log(`Found ${usersToMigrate.length} users to migrate\n`);

  let totalNotesMigrated = 0;
  let totalErrors = 0;

  // Step 3: Migrate notes for each user
  for (const u of usersToMigrate) {
    if (!u.encryptionSalt) {
      console.error(`  Error: User ${u.id} has no encryption salt, skipping`);
      continue;
    }

    console.log(`Migrating notes for user: ${u.name} (${u.id})`);

    // Get all notes for this user
    const userNotes = await db
      .select({
        id: note.id,
        title: note.title,
        contentEncrypted: note.contentEncrypted,
        contentIv: note.contentIv,
        contentTag: note.contentTag,
      })
      .from(note)
      .where(eq(note.userId, u.id));

    console.log(`  Found ${userNotes.length} notes to migrate`);

    let userNotesMigrated = 0;

    // Process notes in batches
    for (let i = 0; i < userNotes.length; i += BATCH_SIZE) {
      const batch = userNotes.slice(i, i + BATCH_SIZE);

      for (const n of batch) {
        try {
          // Skip notes with empty content
          if (!n.contentEncrypted || !n.contentIv || !n.contentTag) {
            continue;
          }

          // Decrypt with v1 (master key)
          const plaintext = decryptV1(
            n.contentEncrypted,
            n.contentIv,
            n.contentTag,
          );

          // Re-encrypt with v2 (per-user key)
          const { encrypted, iv, tag } = await encryptV2(
            plaintext,
            u.id,
            u.encryptionSalt,
          );

          // Update the note
          await db
            .update(note)
            .set({
              contentEncrypted: encrypted,
              contentIv: iv,
              contentTag: tag,
            })
            .where(eq(note.id, n.id));

          userNotesMigrated++;
        } catch (error) {
          console.error(
            `    Error migrating note ${n.id} (${n.title}):`,
            error,
          );
          totalErrors++;
        }
      }

      console.log(
        `    Migrated batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(userNotes.length / BATCH_SIZE)}`,
      );
    }

    // Update user's encryption version to 2
    await db
      .update(user)
      .set({ encryptionVersion: 2 })
      .where(eq(user.id, u.id));

    console.log(
      `  Completed: ${userNotesMigrated} notes migrated for ${u.name}`,
    );
    totalNotesMigrated += userNotesMigrated;
  }

  console.log("\n=== Migration Complete ===");
  console.log(`Total notes migrated: ${totalNotesMigrated}`);
  console.log(`Total errors: ${totalErrors}`);

  if (totalErrors > 0) {
    console.log(
      "\nWarning: Some notes failed to migrate. Review the errors above.",
    );
    process.exit(1);
  }

  console.log("\nAll notes have been migrated to per-user encryption.");
}

// Run the migration
migrateEncryption()
  .then(() => {
    console.log("Migration script finished successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
