import createApp from "@/lib/create-app";
import configureOpenAPI from "@/lib/openapi";
import authRouter from "./routes/auth/auth.index";
import notesRouter from "./routes/notes/notes.index";
import userRouter from "./routes/user/user.index";

const app = createApp();

const routers = [authRouter, notesRouter, userRouter];

configureOpenAPI(app);

routers.forEach((router) => {
  app.route("/api", router);
});

export default app;
