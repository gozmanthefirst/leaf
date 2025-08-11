import createApp from "@/lib/create-app";
import configureOpenAPI from "@/lib/openapi";
import index from "@/routes/index.route";

const app = createApp();

const routes = [index];

routes.forEach((route) => {
  app.route("/", route);
});
configureOpenAPI(app);

export default app;
