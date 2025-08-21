import { createRouter } from "@/lib/create-app";
import { authMiddleware } from "@/middleware/auth-middleware";
import * as authHandlers from "@/routes/auth/auth.handlers";
import * as authRoutes from "@/routes/auth/auth.routes";

const publicAuthRouter = createRouter()
  .openapi(authRoutes.signUpUser, authHandlers.signUpUser)
  .openapi(authRoutes.verifyEmail, authHandlers.verifyEmail)
  .openapi(authRoutes.signInEmail, authHandlers.signInEmail)
  .openapi(authRoutes.sendVerificationEmail, authHandlers.sendVerificationEmail)
  .openapi(authRoutes.reqPwdResetEmail, authHandlers.reqPwdResetEmail)
  .openapi(authRoutes.resetPwd, authHandlers.resetPwd);

const protectedAuthRouter = createRouter();
protectedAuthRouter.use(authMiddleware);
protectedAuthRouter.openapi(authRoutes.signOut, authHandlers.signOut);

// Combine the public and protected auth routes
const authRouter = createRouter();
authRouter.route("/", publicAuthRouter).route("/", protectedAuthRouter);

export default authRouter;
