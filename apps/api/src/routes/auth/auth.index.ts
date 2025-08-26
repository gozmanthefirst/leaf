import { createRouter } from "@/lib/create-app";
import { authMiddleware } from "@/middleware/auth-middleware";
import * as authHandlers from "@/routes/auth/auth.handlers";
import * as authRoutes from "@/routes/auth/auth.routes";

const authRouter = createRouter();

authRouter
  .openapi(authRoutes.signUp, authHandlers.signUp)
  .openapi(authRoutes.verifyEmail, authHandlers.verifyEmail)
  .openapi(authRoutes.signIn, authHandlers.signIn)
  .openapi(authRoutes.sendVerificationEmail, authHandlers.sendVerificationEmail)
  .openapi(authRoutes.reqPwdResetEmail, authHandlers.reqPwdResetEmail)
  .openapi(authRoutes.resetPwd, authHandlers.resetPwd);

authRouter.use("/auth/change-password", authMiddleware);
authRouter.use("/auth/sign-out", authMiddleware);

// Protected routes
authRouter
  .openapi(authRoutes.changePwd, authHandlers.changePwd)
  .openapi(authRoutes.signOut, authHandlers.signOut);

export default authRouter;
