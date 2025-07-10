import app from "./app";

const port = process.env.PORT || 8000;

export default {
  port,
  fetch: app.fetch,
};
