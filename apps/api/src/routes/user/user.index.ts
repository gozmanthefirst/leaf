import { createRouter } from "@/lib/create-app";
import { authMiddleware } from "@/middleware/auth-middleware";
import { ensureRootFolder } from "@/middleware/ensure-root-folder";
import * as userHandlers from "@/routes/user/user.handlers";
import * as userRoutes from "@/routes/user/user.routes";

const userRouter = createRouter();
userRouter.use("/user/*", authMiddleware).use("/user/*", ensureRootFolder);

userRouter
  .openapi(userRoutes.getUser, userHandlers.getUser)
  .openapi(userRoutes.updateUser, userHandlers.updateUser);

export default userRouter;
