import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "viewport",
    defaultPreloadStaleTime: 0,
    notFoundMode: "root",
  });
  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  });

  return router;
};
