import { serve } from "@hono/node-server";

import app from "@/index";
import env from "./lib/env";

serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);

if (env.NODE_ENV === "development") {
  console.log(`mode: ${env.NODE_ENV}`);
}
