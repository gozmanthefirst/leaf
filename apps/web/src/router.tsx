import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";

import { routeTree } from "./routeTree.gen";

export const createRouter = () => {
  const queryClient = new QueryClient();

  const router = routerWithQueryClient(
    createTanStackRouter({
      routeTree,
      context: { queryClient },
      defaultPreload: "viewport",
      defaultPreloadStaleTime: 0,
      scrollRestoration: true,
      notFoundMode: "root",
      // defaultErrorComponent: ErrorBoundary,
      // defaultNotFoundComponent: () => <NotFound />,
    }),
    queryClient,
  );

  return router;
};

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
