import type { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";

import packageJSON from "../../../../package.json";

const configureOpenAPI = (app: OpenAPIHono) => {
  app.doc("/doc", {
    openapi: "3.0.0",
    info: {
      title: "Notes API",
      description: "The API for a note-taking app.",
      version: packageJSON.version,
    },
  });

  app.get(
    "/reference",
    Scalar({
      url: "/doc",
      pageTitle: "Notes API",
      theme: "deepSpace",
      defaultHttpClient: {
        targetKey: "js",
        clientKey: "axios",
      },
    }),
  );
};

export default configureOpenAPI;
