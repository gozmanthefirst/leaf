import { createRouter } from "@/lib/create-app";
import * as authHandlers from "@/routes/auth/auth.handlers";
import * as authRoutes from "@/routes/auth/auth.routes";

const authRouter = createRouter()
  .openapi(authRoutes.signUpUser, authHandlers.signUpUser)
  .openapi(authRoutes.verifyEmail, authHandlers.verifyEmail);

export default authRouter;
