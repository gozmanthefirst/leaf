import { createRouter } from "@/lib/create-app";
import * as userHandlers from "@/routes/user/user.handlers";
import * as userRoutes from "@/routes/user/user.routes";

const userRouter = createRouter().openapi(
  userRoutes.getUser,
  userHandlers.getUser,
);

export default userRouter;
