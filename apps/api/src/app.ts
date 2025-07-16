import createApp from "@/lib/create-app";
import configureOpenAPI from "@/lib/openapi";
import indexRouter from "@/routes/index.route";

const app = createApp();

const routes = [indexRouter];

configureOpenAPI(app);

routes.forEach((route) => {
  app.route("/", route);
});

export default app;
