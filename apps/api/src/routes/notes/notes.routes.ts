import { createRoute, z } from "@hono/zod-openapi";

import HttpStatusCodes from "@/utils/http-status-codes";
import { jsonContent } from "@/utils/openapi-helpers";

const tags = ["Notes"];

const listNotes = createRoute({
  path: "/notes",
  method: "get",
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z
        .array(
          z.object({
            id: z.number().min(1),
            title: z.string().min(1).max(100),
            content: z.string(),
          }),
        )
        .openapi({
          type: "array",
          example: [{ id: 1, title: "untitled", content: "This is a note." }],
        }),
      "Get list of notes",
    ),
  },
});
export type ListNotesRoute = typeof listNotes;

const notesRoutes = { listNotes };

export default notesRoutes;
