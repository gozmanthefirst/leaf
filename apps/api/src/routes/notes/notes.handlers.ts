import type { AppRouteHandler } from "@/lib/types";
import type { ListNotesRoute } from "./notes.routes";

const listNotes: AppRouteHandler<ListNotesRoute> = (c) => {
  return c.json([
    {
      id: 1,
      title: "untitled",
      content: "This is a note.",
    },
  ]);
};

const notesHandlers = { listNotes };

export default notesHandlers;
