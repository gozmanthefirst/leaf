import { createRouter } from "@/lib/create-app";
import { authMiddleware } from "@/middleware/auth-middleware";
import { ensureRootFolder } from "@/middleware/ensure-root-folder";
import * as notesHandlers from "@/routes/notes/notes.handlers";
import * as notesRoutes from "@/routes/notes/notes.routes";

const notesRouter = createRouter();
notesRouter.use("/notes/*", authMiddleware).use("/notes/*", ensureRootFolder);

notesRouter
  .openapi(notesRoutes.getAllNotes, notesHandlers.getAllNotes)
  .openapi(notesRoutes.createNote, notesHandlers.createNote);

export default notesRouter;
