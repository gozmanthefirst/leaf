import createApp from "@/lib/create-app";
import configureOpenAPI from "@/lib/openapi";
import index from "@/routes/index.route";
import notes from "@/routes/notes/notes.index";

const app = createApp();

const routes = [index, notes];

routes.forEach((route) => {
  app.route("/api", route);
});
configureOpenAPI(app);

export default app;
