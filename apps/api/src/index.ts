import createApp from "@/lib/create-app";
import configureOpenAPI from "@/lib/openapi";
import authRouter from "./routes/auth/auth.index";
import notesRouter from "./routes/notes/notes.index";

const app = createApp();

const routers = [notesRouter, authRouter];

routers.forEach((router) => {
  app.route("/api", router);
});
configureOpenAPI(app);

export default app;
