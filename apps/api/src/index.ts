import createApp from "@/lib/create-app";
import configureOpenAPI from "@/lib/openapi";
import authRouter from "./routes/auth/auth.index";
import foldersRouter from "./routes/folder/folder.index";
import notesRouter from "./routes/note/note.index";
import userRouter from "./routes/user/user.index";

const app = createApp();

const routers = [authRouter, notesRouter, userRouter, foldersRouter];

configureOpenAPI(app);

routers.forEach((router) => {
  app.route("/api", router);
});

export default app;
