import { createRouter } from "@/lib/create-app";
import notesHandlers from "./notes.handlers";
import notesRoutes from "./notes.routes";

const notesRouter = createRouter().openapi(
  notesRoutes.listNotes,
  notesHandlers.listNotes,
);

export default notesRouter;
