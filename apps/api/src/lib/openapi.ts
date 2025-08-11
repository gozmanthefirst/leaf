import { Scalar } from "@scalar/hono-api-reference";

import type { AppOpenAPI } from "@/lib/types";
import packageJSON from "../../package.json";

const configureOpenAPI = (app: AppOpenAPI) => {
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
      theme: "saturn",
      // layout: "classic",
      defaultHttpClient: {
        targetKey: "js",
        clientKey: "axios",
      },
    }),
  );
};

export default configureOpenAPI;
