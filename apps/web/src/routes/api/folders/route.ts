import type { FolderWithItems } from "@repo/db/validators/folder-validators";
import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";

import { axiosClient } from "@/lib/axios";
import type { ApiSuccessResponse } from "@/lib/types";
import { sessionMiddleware } from "@/middleware/auth-middleware";

export const Route = createFileRoute("/api/folders")({
  server: {
    middleware: [sessionMiddleware],
    handlers: {
      GET: async ({ context }) => {
        try {
          const response = await axiosClient.get<
            ApiSuccessResponse<FolderWithItems>
          >("/folders", {
            headers: {
              Authorization: `Bearer ${context.session.token}`,
            },
          });

          return json(response.data);
        } catch (_error) {
          setResponseStatus(500);
          return json({
            status: "error",
            error: {
              code: "ROOT_FOLDER_FETCH_FAILED",
              details: "Failed to fetch root folder",
              fields: {},
            },
          });
        }
      },
    },
  },
});
