import { randomUUID } from "node:crypto";

import { db } from "@repo/db";
import { folder } from "@repo/db/schemas/folder.schema";
import { createMiddleware } from "hono/factory";

import type { AppBindings } from "@/lib/types";

export const ensureRootFolder = createMiddleware<AppBindings>(
  async (c, next) => {
    const user = c.get("user");

    const existingRoot = await db.query.folder.findFirst({
      where: (folder, { and, eq }) =>
        and(eq(folder.userId, user.id), eq(folder.isRoot, true)),
    });

    // If no root folder exists, create a self-referencing root folder
    if (!existingRoot) {
      const newRootId = randomUUID();

      await db.insert(folder).values({
        id: newRootId,
        name: `${user.name}'s Root Folder`,
        parentFolderId: newRootId,
        isRoot: true,
        userId: user.id,
      });
    }

    return next();
  },
);
