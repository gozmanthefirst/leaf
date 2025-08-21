import { createRouter } from "@/lib/create-app";
import { ensureRootFolder } from "@/middleware/ensure-root-folder";
import * as notesHandlers from "./notes.handlers";
import * as notesRoutes from "./notes.routes";

const notesRouter = createRouter();
notesRouter.use(ensureRootFolder);
notesRouter
  .openapi(notesRoutes.getAllNotes, notesHandlers.getAllNotes)
  .openapi(notesRoutes.createNote, notesHandlers.createNote)
  .openapi(notesRoutes.getSingleNote, notesHandlers.getSingleNote)
  .openapi(notesRoutes.updateNote, notesHandlers.updateNote)
  .openapi(notesRoutes.deleteNote, notesHandlers.deleteNote);

export default notesRouter;
