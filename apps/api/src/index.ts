import createApp from "@/lib/create-app";
import configureOpenAPI from "@/lib/openapi";
import authRouter from "./routes/auth/auth.index";
import indexRouter from "./routes/index.route";
import notesRouter from "./routes/notes/notes.index";

const app = createApp();

const routers = [indexRouter, notesRouter, authRouter];

routers.forEach((router) => {
  app.route("/api", router);
});
configureOpenAPI(app);

export default app;
