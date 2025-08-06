import app from ".";
import env from "./env";

const port = env.PORT;

export default {
  port,
  fetch: app.fetch,
};
