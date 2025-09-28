import { Scalar } from "@scalar/hono-api-reference";

import type { AppOpenAPI } from "@/lib/types";
import packageJSON from "../../package.json";

const configureOpenAPI = (app: AppOpenAPI) => {
  app.doc("/api/doc", {
    openapi: "3.0.0",
    info: {
      title: "Leaf API",
      description: "The API for a note-taking app.",
      version: packageJSON.version,
    },
  });

  app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
    type: "http",
    scheme: "bearer",
  });

  app.get(
    "/api/reference",
    Scalar({
      url: "/api/doc",
      authentication: {
        preferredSecurityScheme: "Bearer",
        securitySchemes: {
          Bearer: {
            token: "",
          },
        },
      },
      persistAuth: true,
      pageTitle: "Leaf API",
      theme: "saturn",
      hideModels: true,
      defaultHttpClient: {
        targetKey: "js",
        clientKey: "axios",
      },
    }),
  );
};

export default configureOpenAPI;
