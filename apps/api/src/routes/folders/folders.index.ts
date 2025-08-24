import { createRouter } from "@/lib/create-app";
import { authMiddleware } from "@/middleware/auth-middleware";
import { ensureRootFolder } from "@/middleware/ensure-root-folder";
import * as foldersHandlers from "@/routes/folders/folders.handlers";
import * as foldersRoutes from "@/routes/folders/folders.routes";

const foldersRouter = createRouter();
foldersRouter
  .use("/folders/*", authMiddleware)
  .use("/folders/*", ensureRootFolder);

foldersRouter.openapi(
  foldersRoutes.getFolderWithItems,
  foldersHandlers.getFolderWithItems,
);

export default foldersRouter;
