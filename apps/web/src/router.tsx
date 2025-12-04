import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Cache data for 5 minutes by default
        staleTime: 5 * 60 * 1000,
        // Keep unused data in cache for 30 minutes
        gcTime: 30 * 60 * 1000,
        // Retry failed requests up to 2 times
        retry: 2,
        // Don't refetch on window focus for better UX
        refetchOnWindowFocus: false,
        // Don't refetch on reconnect immediately
        refetchOnReconnect: "always",
      },
      mutations: {
        // Retry mutations once on failure
        retry: 1,
      },
    },
  });

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
