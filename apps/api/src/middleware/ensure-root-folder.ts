import { randomUUID } from "node:crypto";

import db, { and, eq } from "@repo/database";
import { folders } from "@repo/database/schemas/folders-schema";
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
      const newRootId = randomUUID();

      await db
        .insert(folders)
        .values({
          id: newRootId,
          name: `${user.name}'s Root Folder`,
          parentFolderId: newRootId,
          isRoot: true,
          userId: user.id,
        })
        .returning();
    }

    return next();
  },
);
