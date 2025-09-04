import { randomUUID } from "node:crypto";

import db from "@repo/database";
import { folders } from "@repo/database/schemas/folders-schema";
import { createMiddleware } from "hono/factory";

import type { AppBindings } from "@/lib/types";

export const ensureRootFolder = createMiddleware<AppBindings>(
  async (c, next) => {
    const user = c.get("user");

    const existingRoot = await db.query.folders.findFirst({
      where: (folder, { eq, and }) =>
        and(eq(folder.userId, user.id), eq(folder.isRoot, true)),
    });

    // If no root folder exists, create a self-referencing root folder
    if (!existingRoot) {
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
