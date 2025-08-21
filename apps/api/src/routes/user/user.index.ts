import { createRouter } from "@/lib/create-app";
import { authMiddleware } from "@/middleware/auth-middleware";
import * as userHandlers from "@/routes/user/user.handlers";
import * as userRoutes from "@/routes/user/user.routes";

const userRouter = createRouter();
userRouter.use("/user/*", authMiddleware);

userRouter.openapi(userRoutes.getUser, userHandlers.getUser);

export default userRouter;
