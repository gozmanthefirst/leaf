import db from "@repo/database";
import { folders } from "@repo/database/schemas/notes-schema";
import { and, eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";

import type { AppBindings } from "@/lib/types";

export const ensureRootFolder = createMiddleware<AppBindings>(
  async (c, next) => {
    const user = c.get("user");

    // Check if root folder exists
    const existingRoot = await db
      .select()
      .from(folders)
      .where(and(eq(folders.userId, user.id), eq(folders.isRoot, true)))
      .limit(1);

    // If no root folder exists, create a self-referencing root folder
    if (existingRoot.length === 0) {
      await db.transaction(async (tx) => {
        const [newRootFolder] = await tx
          .insert(folders)
          .values({
            name: `${user.name}'s Root Folder`,
            // Temporary placeholder
            parentFolderId: "00000000-0000-0000-0000-000000000000",
            isRoot: true,
            userId: user.id,
          })
          .returning();

        // Then update to self-reference
        await tx
          .update(folders)
          .set({ parentFolderId: newRootFolder.id })
          .where(eq(folders.id, newRootFolder.id));
      });
    }

    return next();
  },
);
