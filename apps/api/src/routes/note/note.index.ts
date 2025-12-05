import { createRouter } from "@/lib/create-app";
import { authMiddleware } from "@/middleware/auth-middleware";
import * as notesHandlers from "@/routes/note/note.handlers";
import * as notesRoutes from "@/routes/note/note.routes";

const notesRouter = createRouter();
notesRouter.use("/notes/*", authMiddleware);

notesRouter
  .openapi(notesRoutes.getAllNotes, notesHandlers.getAllNotes)
  .openapi(notesRoutes.createNote, notesHandlers.createNote)
  .openapi(notesRoutes.getSingleNote, notesHandlers.getSingleNote)
  .openapi(notesRoutes.copyNote, notesHandlers.copyNote)
  .openapi(notesRoutes.toggleNoteFavorite, notesHandlers.toggleNoteFavorite)
  .openapi(notesRoutes.moveNote, notesHandlers.moveNote)
  .openapi(notesRoutes.updateNote, notesHandlers.updateNote)
  .openapi(notesRoutes.deleteNote, notesHandlers.deleteNote);

export default notesRouter;
