import createApp from "@/lib/create-app";
import configureOpenAPI from "@/lib/openapi";
import { authMiddleware } from "./middleware/auth-middleware";
import authRouter from "./routes/auth/auth.index";
import notesRouter from "./routes/notes/notes.index";
import userRouter from "./routes/user/user.index";

const app = createApp();

const publicRouters = [authRouter];
const protectedRouters = [notesRouter, userRouter];

configureOpenAPI(app);

// Public routes
publicRouters.forEach((router) => {
  app.route("/api", router);
});

// Auth middleware for protected routes
app.use(authMiddleware);

// Protected routes
protectedRouters.forEach((router) => {
  app.route("/api", router);
});

export default app;
