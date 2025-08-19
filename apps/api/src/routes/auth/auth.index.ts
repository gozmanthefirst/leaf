import { createRouter } from "@/lib/create-app";
import * as authHandlers from "@/routes/auth/auth.handlers";
import * as authRoutes from "@/routes/auth/auth.routes";

const authRouter = createRouter()
  .openapi(authRoutes.signUpUser, authHandlers.signUpUser)
  .openapi(authRoutes.verifyEmail, authHandlers.verifyEmail)
  .openapi(authRoutes.signInUser, authHandlers.signInUser)
  .openapi(authRoutes.sendVerificationEmail, authHandlers.sendVerificationEmail)
  .openapi(authRoutes.reqPwdResetEmail, authHandlers.reqPwdResetEmail)
  .openapi(authRoutes.resetPwd, authHandlers.resetPwd)
  .openapi(authRoutes.signOut, authHandlers.signOut);

export default authRouter;
