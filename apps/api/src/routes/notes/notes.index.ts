import { createRouter } from "@/lib/create-app";
import * as notesHandlers from "./notes.handlers";
import * as notesRoutes from "./notes.routes";

const notesRouter = createRouter()
  .openapi(notesRoutes.getAllNotes, notesHandlers.getAllNotes)
  .openapi(notesRoutes.createNote, notesHandlers.createNote)
  .openapi(notesRoutes.getSingleNote, notesHandlers.getSingleNote);

export default notesRouter;
