import { randomUUID } from "node:crypto";

import { createMiddleware } from "hono/factory";

import { db } from "@/lib/db";
import type { AppBindings } from "@/lib/types";

export const ensureRootFolder = createMiddleware<AppBindings>(
  async (c, next) => {
    const user = c.get("user");

    const existingRoot = await db.folder.findFirst({
      where: { userId: user.id, isRoot: true },
    });

    // If no root folder exists, create a self-referencing root folder
    if (!existingRoot) {
      const newRootId = randomUUID();

      await db.folder.create({
        data: {
          id: newRootId,
          name: `${user.name}'s Root Folder`,
          parentFolderId: newRootId,
          isRoot: true,
          userId: user.id,
        },
      });
    }

    return next();
  },
);
