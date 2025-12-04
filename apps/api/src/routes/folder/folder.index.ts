import { createRouter } from "@/lib/create-app";
import { authMiddleware } from "@/middleware/auth-middleware";
import * as foldersHandlers from "@/routes/folder/folder.handlers";
import * as foldersRoutes from "@/routes/folder/folder.routes";

const foldersRouter = createRouter();
foldersRouter.use("/folders/*", authMiddleware);

foldersRouter
  .openapi(foldersRoutes.getFolderWithItems, foldersHandlers.getFolderWithItems)
  .openapi(foldersRoutes.getFolderChildren, foldersHandlers.getFolderChildren)
  .openapi(foldersRoutes.createFolder, foldersHandlers.createFolder)
  .openapi(foldersRoutes.createRootFolder, foldersHandlers.createRootFolder)
  .openapi(foldersRoutes.moveFolder, foldersHandlers.moveFolder)
  .openapi(foldersRoutes.updateFolder, foldersHandlers.updateFolder)
  .openapi(foldersRoutes.deleteFolder, foldersHandlers.deleteFolder);

export default foldersRouter;
